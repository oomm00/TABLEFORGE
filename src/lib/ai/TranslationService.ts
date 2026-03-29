import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "./client";

export type QueryPreview = {
  sql: string;
  explanation: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL";
  risk: "low" | "medium" | "high";
  riskReason: string;
};

type TranslationError = {
  error: string;
};

type SessionItem = {
  nl: string;
  sql: string;
};

export class TranslationService {
  private client: Anthropic;
  private readonly model = "claude-sonnet-4-20250514";
  private readonly embeddingModel = "claude-embedding-1";
  private readonly maxTokens = 1000;

  constructor(client: Anthropic = getAnthropicClient()) {
    this.client = client;
  }

  async translate(params: {
    nlInput: string;
    schemaSnapshot: unknown;
    ragContext?: SessionItem[];
    sessionHistory?: SessionItem[];
  }): Promise<QueryPreview | TranslationError> {
    const { nlInput, schemaSnapshot, ragContext = [], sessionHistory = [] } = params;

    const system = this.buildSystemPrompt();
    const user = this.buildUserPrompt({
      nlInput,
      schemaSnapshot,
      ragContext,
      sessionHistory,
    });

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages: [
          {
            role: "user",
            content: user,
          },
        ],
      });

      const textContent = this.extractTextContent(response);
      const parsed = await this.safeParse(textContent);
      const withSelectSafety = this.applySelectSafetyFallback(parsed);
      const validated = this.validateResponse(withSelectSafety);

      if (!validated.ok) {
        const retry = await this.retryOnce(system, user);
        return retry;
      }

      return validated.value;
    } catch (err) {
      console.error("TranslationService.translate error", err);
      return { error: "AI unavailable" };
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const client = this.client as any;
      if (!client.embeddings || typeof client.embeddings.create !== "function") {
        console.warn("Anthropic embeddings API not available on this SDK client.");
        return [];
      }

      const res = await client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      const vector =
        res?.data?.[0]?.embedding ??
        (Array.isArray((res as any).embedding) ? (res as any).embedding : null);

      if (!Array.isArray(vector) || !vector.every((v) => typeof v === "number")) {
        console.warn("Unexpected embeddings response shape");
        return [];
      }

      return vector as number[];
    } catch (err) {
      console.error("TranslationService.embed error", err);
      return [];
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert PostgreSQL query generator.

STRICT RULES:

* Respond ONLY with a valid JSON object
* No markdown, no backticks
* Use ONLY provided schema
* Never hallucinate tables or columns

OUTPUT FORMAT:
{
"sql": string,
"explanation": string,
"operation": "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL",
"risk": "low" | "medium" | "high",
"riskReason": string
}

RISK RULES:

* SELECT = low
* INSERT/UPDATE = medium
* DELETE/DDL = high

EXPLANATION:

* One short sentence only`;
  }

  private buildUserPrompt(input: {
    nlInput: string;
    schemaSnapshot: unknown;
    ragContext: SessionItem[];
    sessionHistory: SessionItem[];
  }): string {
    const { nlInput, schemaSnapshot, ragContext, sessionHistory } = input;

    const schemaBlock = `BLOCK 2 - Schema Snapshot (JSON):\n${JSON.stringify(
      schemaSnapshot,
      null,
      2
    )}`;

    const ragLines = ragContext.map(
      (item) => `Past query: ${item.nl} → ${item.sql}`
    );
    const ragBlock =
      ragLines.length > 0
        ? `BLOCK 3 - RAG Context:\n${ragLines.join("\n")}`
        : "BLOCK 3 - RAG Context:\n(none)";

    const recentSession = sessionHistory.slice(-3);
    const sessionLines = recentSession.map(
      (item, idx) => `Session ${idx + 1}: ${item.nl} → ${item.sql}`
    );
    const sessionBlock =
      sessionLines.length > 0
        ? `BLOCK 4 - Last 3 Session Queries:\n${sessionLines.join("\n")}`
        : "BLOCK 4 - Last 3 Session Queries:\n(none)";

    const userBlock = `USER NL Input:\n${nlInput}`;

    return [schemaBlock, ragBlock, sessionBlock, userBlock].join("\n\n");
  }

  private validateResponse(payload: unknown): { ok: true; value: QueryPreview } | { ok: false } {
    if (!payload || typeof payload !== "object") {
      return { ok: false };
    }

    const obj = payload as Partial<QueryPreview>;

    if (
      typeof obj.sql !== "string" ||
      typeof obj.explanation !== "string" ||
      typeof obj.operation !== "string" ||
      typeof obj.risk !== "string" ||
      typeof obj.riskReason !== "string"
    ) {
      return { ok: false };
    }

    const validOperations: QueryPreview["operation"][] = [
      "SELECT",
      "INSERT",
      "UPDATE",
      "DELETE",
      "DDL",
    ];
    const validRisks: QueryPreview["risk"][] = ["low", "medium", "high"];

    if (!validOperations.includes(obj.operation as QueryPreview["operation"])) {
      return { ok: false };
    }

    if (!validRisks.includes(obj.risk as QueryPreview["risk"])) {
      return { ok: false };
    }

    return {
      ok: true,
      value: {
        sql: obj.sql,
        explanation: obj.explanation,
        operation: obj.operation as QueryPreview["operation"],
        risk: obj.risk as QueryPreview["risk"],
        riskReason: obj.riskReason,
      },
    };
  }

  private async retryOnce(system: string, user: string): Promise<QueryPreview | TranslationError> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages: [
          {
            role: "user",
            content:
              user +
              "\n\nThe previous response was invalid. Return ONLY valid JSON matching the specified schema.",
          },
        ],
      });

      const textContent = this.extractTextContent(response);
      const parsed = await this.safeParse(textContent);
      const withSelectSafety = this.applySelectSafetyFallback(parsed);
      const validated = this.validateResponse(withSelectSafety);

      if (!validated.ok) {
        return { error: "AI unavailable" };
      }

      return validated.value;
    } catch (err) {
      console.error("TranslationService.retryOnce error", err);
      return { error: "AI unavailable" };
    }
  }

  private extractTextContent(response: any): string {
    const contents = response?.content;
    if (Array.isArray(contents)) {
      const textPart = contents.find((c: any) => c.type === "text");
      if (textPart && typeof textPart.text === "string") {
        return textPart.text;
      }
      if (textPart && typeof textPart.content === "string") {
        return textPart.content;
      }
    }
    if (typeof response?.content === "string") {
      return response.content;
    }
    return "";
  }

  private async safeParse(raw: string): Promise<unknown> {
    const trimmed = raw.trim();
    if (!trimmed) return {};

    const tryParse = (s: string): unknown | null => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };

    const direct = tryParse(trimmed);
    if (direct !== null) return direct;

    // Handle responses like:
    // ```json
    // { ... }
    // ```
    // or `json { ... }`
    let cleaned = trimmed;

    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/```$/g, "");

    cleaned = cleaned.replace(/^`(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/`$/g, "");

    cleaned = cleaned.trim();

    const fenced = tryParse(cleaned);
    if (fenced !== null) return fenced;

    // Last-resort: extract the first top-level JSON object substring
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1).trim();
      const extracted = tryParse(slice);
      if (extracted !== null) return extracted;
    }

    return {};
  }

  private applySelectSafetyFallback(payload: unknown): unknown {
    if (!payload || typeof payload !== "object") return payload;

    const obj = payload as any;
    if (typeof obj.sql !== "string") return payload;

    const sql = obj.sql.trim();
    if (/^select\b/i.test(sql)) {
      return {
        ...obj,
        operation: "SELECT",
        risk: "low",
      };
    }

    return payload;
  }
}

