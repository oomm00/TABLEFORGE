import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────
interface QueryResponse {
  sql: string;
  explanation: string;
  risk: "low" | "medium" | "high";
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL";
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
}

// ─── Mock response bank ───────────────────────────────────────────
// [0] Active users (default)
// [1] Pending orders
// [2] High-risk write (UPDATE/DELETE/churn)
// [3] Products by revenue
// [4] Inactive users (last_login)
// [5] Orders by amount threshold

const MOCK_RESPONSES: QueryResponse[] = [
  // [0] Active users
  {
    sql: `SELECT id, name, email, status, created_at\nFROM users\nWHERE status = 'Active';`,
    explanation: "Fetches all active user accounts.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "name", "email", "status", "created_at"],
    rows: [
      { id: "usr_9kx2", name: "Alice Freeman", email: "alice@acme.co", status: "Active", created_at: "2024-03-15T08:22:00Z" },
      { id: "usr_7x1z", name: "Carol Davis", email: "carol@initrode.io", status: "Active", created_at: "2024-01-10T14:05:00Z" },
      { id: "usr_1a8c", name: "Eve Xu", email: "eve@soylent.corp", status: "Active", created_at: "2024-06-30T09:40:00Z" },
      { id: "usr_3f2t", name: "Grace Hopper", email: "grace@compute.io", status: "Active", created_at: "2024-02-18T11:00:00Z" },
    ],
    rowCount: 4,
  },

  // [1] Pending orders
  {
    sql: `SELECT id, user_id, amount, status, created_at\nFROM orders\nWHERE status = 'pending';`,
    explanation: "Returns all orders currently in pending state.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "user_id", "amount", "status", "created_at"],
    rows: [
      { id: "ord_aa12", user_id: "usr_9kx2", amount: 299, status: "pending", created_at: "2025-01-28T16:10:00Z" },
      { id: "ord_bb34", user_id: "usr_1a8c", amount: 149, status: "pending", created_at: "2025-01-27T12:45:00Z" },
      { id: "ord_cc56", user_id: "usr_3f2t", amount: 499, status: "pending", created_at: "2025-01-26T09:30:00Z" },
    ],
    rowCount: 3,
  },

  // [2] High-risk write
  {
    sql: `UPDATE users\nSET status = 'Churned'\nWHERE last_login < CURRENT_DATE - INTERVAL '90 days'\n  AND status = 'Active';`,
    explanation: "Marks users as Churned if they haven't logged in for 90+ days. This is a write operation.",
    risk: "high",
    operation: "UPDATE",
    columns: ["affected_rows"],
    rows: [{ affected_rows: 247 }],
    rowCount: 1,
  },

  // [3] Products by revenue
  {
    sql: `SELECT p.id, p.name, p.category, SUM(o.amount) AS revenue\nFROM products p\nJOIN orders o ON o.product_id = p.id\nGROUP BY p.id, p.name, p.category\nORDER BY revenue DESC\nLIMIT 10;`,
    explanation: "Shows the top 10 products ranked by total order revenue.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "name", "category", "revenue"],
    rows: [
      { id: "prd_001", name: "Pro Plan Monthly", category: "subscription", revenue: 89180 },
      { id: "prd_002", name: "Team Plan Annual", category: "subscription", revenue: 37599 },
      { id: "prd_003", name: "Starter Pack", category: "one-time", revenue: 11970 },
      { id: "prd_004", name: "Enterprise Suite", category: "subscription", revenue: 87912 },
    ],
    rowCount: 4,
  },

  // [4] Inactive users (last_login)
  {
    sql: `SELECT id, name, email, last_login\nFROM users\nWHERE last_login < NOW() - INTERVAL '30 days';`,
    explanation: "Finds users who have not logged in for 30+ days.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "name", "email", "last_login"],
    rows: [
      { id: "usr_3f2t", name: "Dave Wilson", email: "dwilson@initech.com", last_login: "2024-10-01T08:00:00Z" },
      { id: "usr_6t3r", name: "Frank Miller", email: "frank@massive.com", last_login: "2024-09-15T10:20:00Z" },
      { id: "usr_2m5p", name: "Bob Smith", email: "bsmith@globex.inc", last_login: "2024-08-03T09:11:00Z" },
      { id: "usr_8w4q", name: "Hannah Lee", email: "hlee@acmecorp.co", last_login: "2024-07-22T14:45:00Z" },
    ],
    rowCount: 4,
  },

  // [5] Orders by amount threshold
  {
    sql: `SELECT id, user_id, amount, status, created_at\nFROM orders\nWHERE amount > 500;`,
    explanation: "Finds all orders with an amount above the specified threshold.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "user_id", "amount", "status", "created_at"],
    rows: [
      { id: "ord_dd78", user_id: "usr_9kx2", amount: 899, status: "completed", created_at: "2025-01-20T11:10:00Z" },
      { id: "ord_ee90", user_id: "usr_7x1z", amount: 1250, status: "completed", created_at: "2025-01-18T09:00:00Z" },
      { id: "ord_ff11", user_id: "usr_1a8c", amount: 650, status: "pending", created_at: "2025-01-15T14:30:00Z" },
      { id: "ord_gg22", user_id: "usr_3f2t", amount: 3200, status: "completed", created_at: "2025-01-10T08:45:00Z" },
    ],
    rowCount: 4,
  },
];

// ─── Keyword classifier ───────────────────────────────────────────
function pickMockResponse(query: string): QueryResponse {
  const q = query.toLowerCase().trim();

  // 1. Write operations — checked first, win over all other keywords
  const isWrite =
    /\b(update|delete|drop|truncate|insert|remove|mark.*churn|churn.*mark|set status)\b/.test(q);
  if (isWrite) return MOCK_RESPONSES[2];

  // 2. Amount / price threshold — must beat generic "order" match
  const isAmount = /\bamount\b|\bprice\b/.test(q);
  if (isAmount) return MOCK_RESPONSES[5];

  // 3. Pending orders (status filter)
  const isPending = /\bpending\b/.test(q);
  if (isPending) return MOCK_RESPONSES[1];

  // 4. Inactivity / last login
  const isInactive = /\binactive\b|\blast.?login\b|\bnot.?logged\b|\blast.?seen\b/.test(q);
  if (isInactive) return MOCK_RESPONSES[4];

  // 5. Revenue / products (requires join)
  const isRevenue = /\brevenue\b|\btop\s+\d+\b|\bbest.?sell\b/.test(q);
  if (isRevenue) return MOCK_RESPONSES[3];

  // 6. Generic orders (no specific filter asked for)
  const isOrders = /\border\b/.test(q);
  if (isOrders) return MOCK_RESPONSES[1];

  // 7. Products (no revenue)
  const isProducts = /\bproduct\b|\bcatalog\b|\bitem\b/.test(q);
  if (isProducts) return MOCK_RESPONSES[3];

  // Default: active users
  return MOCK_RESPONSES[0];
}

// ─── Post-generation validation ───────────────────────────────────
function validateAndMaybeFallback(query: string, result: QueryResponse): QueryResponse {
  const q = query.toLowerCase();
  const sql = result.sql.toLowerCase();

  // If user asked about amount but SQL doesn't filter on amount → fallback
  if (/\bamount\b/.test(q) && !/\bamount\b/.test(sql)) {
    return MOCK_RESPONSES[5];
  }

  // If user asked about inactive/last_login but SQL doesn't use last_login → fallback
  if (/\binactive\b|\blast.?login\b/.test(q) && !/last_login/.test(sql)) {
    return MOCK_RESPONSES[4];
  }

  // If write op expected but SQL is SELECT → fallback to write mock
  const isWriteQuery = /\b(update|delete|drop|truncate|mark.*churn|churn)\b/.test(q);
  if (isWriteQuery && sql.startsWith("select")) {
    return MOCK_RESPONSES[2];
  }

  return result;
}

// ─── Gemini API call ──────────────────────────────────────────────
async function callGemini(query: string): Promise<QueryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  // ── Stage 1: Generate SQL only ────────────────────────────────
  const sqlPrompt = `You are a strict PostgreSQL SQL generator.
Your job is to convert the user request into the simplest correct SQL.

SCHEMA:
- users         (id uuid PK, name varchar, email varchar, status varchar, plan varchar, created_at timestamp, last_login timestamp)
- orders        (id uuid PK, user_id uuid FK, product_id uuid FK, amount numeric, status varchar, created_at timestamp)
- products      (id uuid PK, name varchar, category varchar, price numeric, created_at timestamp)
- subscriptions (id uuid PK, user_id uuid FK, plan varchar, status varchar, expires_at timestamp)
- events        (id bigint PK, user_id uuid FK, event_type varchar, payload jsonb, created_at timestamp)
- legacy_users  (id serial PK, username varchar, email varchar, last_login timestamp)

RULES (follow them strictly):
1. Match the user intent EXACTLY — do not add extra filters, joins, or assumptions.
2. Use ONLY the columns that are relevant to what the user asked for.
3. If the query mentions "amount", filter on orders.amount.
4. If the query mentions "inactive", "last login", or "not logged in", use users.last_login.
5. If the query mentions "pending", filter on status = 'pending'.
6. Only JOIN when the user explicitly needs data from multiple tables.
7. Only add ORDER BY if the user asks for sorting (e.g. "top", "highest", "ranked").
8. Only add LIMIT if the user asks for a count limit (e.g. "top 10", "first 5").
9. Only aggregate (COUNT, SUM, AVG) if the user asks for counts or totals.
10. Output ONLY the raw SQL. No markdown. No explanation. No code fences.

EXAMPLES:
User: orders with amount greater than 500
SQL: SELECT id, user_id, amount, status, created_at FROM orders WHERE amount > 500;

User: users inactive for 30 days
SQL: SELECT id, name, email, last_login FROM users WHERE last_login < NOW() - INTERVAL '30 days';

User: show all pending orders
SQL: SELECT id, user_id, amount, status, created_at FROM orders WHERE status = 'pending';

User: mark inactive users as churned
SQL: UPDATE users SET status = 'Churned' WHERE last_login < NOW() - INTERVAL '90 days' AND status = 'Active';

User: top 10 products by revenue
SQL: SELECT p.id, p.name, SUM(o.amount) AS revenue FROM products p JOIN orders o ON o.product_id = p.id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10;

User: how many users signed up this month
SQL: SELECT COUNT(*) AS signups FROM users WHERE created_at >= DATE_TRUNC('month', NOW());

---
User: ${query}
SQL:`;

  const sqlRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: sqlPrompt }] }] }),
    }
  );

  if (!sqlRes.ok) throw new Error(`Gemini SQL error: ${sqlRes.status}`);

  const sqlData = await sqlRes.json();
  const rawSql = (sqlData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
    .trim()
    .replace(/^```sql\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();

  if (!rawSql) throw new Error("Empty SQL from Gemini");

  // ── Stage 2: Generate metadata (explanation, risk, rows) ──────
  const metaPrompt = `Given this SQL query:
${rawSql}

Respond with ONLY a valid JSON object — no markdown, no code fences:
{
  "explanation": "one sentence: what this SQL does",
  "risk": "low" | "medium" | "high",
  "operation": "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL",
  "columns": ["col1", "col2"],
  "rows": [{"col1": "val"}],
  "rowCount": number
}

Risk rules: SELECT = "low", UPDATE/DELETE with WHERE = "medium", UPDATE/DELETE without WHERE or DDL = "high".
For "columns": list only the columns the SQL selects.
For "rows": generate 3-4 realistic mock rows matching EXACTLY the selected columns. Use plausible values.`;

  const metaRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: metaPrompt }] }] }),
    }
  );

  if (!metaRes.ok) throw new Error(`Gemini meta error: ${metaRes.status}`);

  const metaData = await metaRes.json();
  const metaText: string = metaData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const metaJson = metaText.match(/\{[\s\S]*\}/);
  if (!metaJson) throw new Error("No JSON in Gemini meta response");

  const meta = JSON.parse(metaJson[0]);

  return {
    sql: rawSql,
    explanation: meta.explanation ?? "Query executed successfully.",
    risk: meta.risk ?? "low",
    operation: meta.operation ?? "SELECT",
    columns: meta.columns ?? [],
    rows: meta.rows ?? [],
    rowCount: meta.rowCount ?? meta.rows?.length ?? 0,
  };
}

// ─── Route handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    let result: QueryResponse;

    try {
      const geminiResult = await callGemini(query);
      // Post-generation validation: ensure SQL matches intent
      result = validateAndMaybeFallback(query, geminiResult);
    } catch {
      // Gemini failed → use classified mock
      result = pickMockResponse(query);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(pickMockResponse("users"), { status: 200 });
  }
}
