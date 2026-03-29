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

// ─── Mock fallback bank ───────────────────────────────────────────
const MOCK_RESPONSES: QueryResponse[] = [
  {
    sql: `SELECT u.id, u.name, u.email, u.status,\n       u.created_at, SUM(o.amount) AS total_revenue\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE u.status = 'Active'\nGROUP BY u.id\nORDER BY total_revenue DESC\nLIMIT 50;`,
    explanation: "Fetches all active users joined with their order totals, sorted by highest revenue first. Safe read-only query.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "name", "email", "status", "created_at", "total_revenue"],
    rows: [
      { id: "usr_9kx2", name: "Alice Freeman",  email: "alice@acme.co",      status: "Active", created_at: "2024-03-15T08:22:00Z", total_revenue: 15400 },
      { id: "usr_7x1z", name: "Carol Davis",    email: "carol@initrode.io",  status: "Active", created_at: "2024-01-10T14:05:00Z", total_revenue: 8900  },
      { id: "usr_1a8c", name: "Eve Xu",         email: "eve@soylent.corp",   status: "Active", created_at: "2024-06-30T09:40:00Z", total_revenue: 4500  },
      { id: "usr_3f2t", name: "Grace Hopper",   email: "grace@compute.io",   status: "Active", created_at: "2024-02-18T11:00:00Z", total_revenue: 3200  },
      { id: "usr_5p8m", name: "Henry Walsh",    email: "henry@devco.net",    status: "Active", created_at: "2023-12-05T07:15:00Z", total_revenue: 1100  },
    ],
    rowCount: 5,
  },
  {
    sql: `SELECT id, user_id, amount, status, created_at\nFROM orders\nWHERE created_at >= CURRENT_DATE - INTERVAL '30 days'\n  AND status = 'pending'\nORDER BY created_at DESC;`,
    explanation: "Returns all pending orders from the last 30 days. Useful for monitoring payment pipeline health.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "user_id", "amount", "status", "created_at"],
    rows: [
      { id: "ord_aa12", user_id: "usr_9kx2", amount: 299,  status: "pending", created_at: "2025-01-28T16:10:00Z" },
      { id: "ord_bb34", user_id: "usr_1a8c", amount: 149,  status: "pending", created_at: "2025-01-27T12:45:00Z" },
      { id: "ord_cc56", user_id: "usr_3f2t", amount: 499,  status: "pending", created_at: "2025-01-26T09:30:00Z" },
    ],
    rowCount: 3,
  },
  {
    sql: `UPDATE users\nSET status = 'Churned'\nWHERE last_login < CURRENT_DATE - INTERVAL '90 days'\n  AND status = 'Active';`,
    explanation: "Marks users as Churned if they haven't logged in for 90+ days. This is a write operation affecting potentially many rows.",
    risk: "high",
    operation: "UPDATE",
    columns: ["affected_rows"],
    rows: [{ affected_rows: 247 }],
    rowCount: 1,
  },
  {
    sql: `SELECT product_id, name, category, price,\n       COUNT(o.id) AS order_count\nFROM products p\nLEFT JOIN orders o ON o.product_id = p.id\nGROUP BY p.id\nORDER BY order_count DESC\nLIMIT 20;`,
    explanation: "Shows the top 20 most ordered products with their total order counts. Good for inventory insight.",
    risk: "low",
    operation: "SELECT",
    columns: ["product_id", "name", "category", "price", "order_count"],
    rows: [
      { product_id: "prd_001", name: "Pro Plan Monthly",  category: "subscription", price: 49.00,  order_count: 1820 },
      { product_id: "prd_002", name: "Team Plan Annual",  category: "subscription", price: 399.00, order_count: 941  },
      { product_id: "prd_003", name: "Starter Pack",      category: "one-time",     price: 19.00,  order_count: 630  },
      { product_id: "prd_004", name: "Enterprise Suite",  category: "subscription", price: 999.00, order_count: 88   },
    ],
    rowCount: 4,
  },
  {
    sql: `SELECT id, name, email, last_login\nFROM users\nWHERE last_login < NOW() - INTERVAL '30 days'\nORDER BY last_login ASC\nLIMIT 50;`,
    explanation: "Finds users who have not logged in for 30+ days, sorted by least recent activity.",
    risk: "low",
    operation: "SELECT",
    columns: ["id", "name", "email", "last_login"],
    rows: [
      { id: "usr_3f2t", name: "Dave Wilson",  email: "dwilson@initech.com", last_login: "2024-10-01T08:00:00Z" },
      { id: "usr_6t3r", name: "Frank Miller", email: "frank@massive.com",   last_login: "2024-09-15T10:20:00Z" },
      { id: "usr_2m5p", name: "Bob Smith",    email: "bsmith@globex.inc",   last_login: "2024-08-03T09:11:00Z" },
      { id: "usr_8w4q", name: "Hannah Lee",   email: "hlee@acmecorp.co",    last_login: "2024-07-22T14:45:00Z" },
    ],
    rowCount: 4,
  },
];

function pickMockResponse(query: string): QueryResponse {
  const q = query.toLowerCase();
  // Write operations checked FIRST (must beat "inactive" in compound phrases like "mark inactive users as churned")
  if (q.includes("update ") || q.includes("churn") || q.includes("delete") || q.includes("remove") || q.startsWith("mark") || q.includes(" mark ")) return MOCK_RESPONSES[2];
  // Inactivity / last login
  if (q.includes("inactive") || q.includes("last login") || q.includes("not logged") || q.includes("last seen")) return MOCK_RESPONSES[4];
  // Orders / payments
  if (q.includes("order") || q.includes("pending") || q.includes("purchase") || q.includes("payment")) return MOCK_RESPONSES[1];
  // Products
  if (q.includes("product") || q.includes("catalog") || q.includes("popular") || q.includes("revenue") || q.includes("top")) return MOCK_RESPONSES[3];
  // Default: users
  return MOCK_RESPONSES[0];
}

// ─── Gemini API call ──────────────────────────────────────────────
async function callGemini(query: string): Promise<QueryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const prompt = `You are a precise PostgreSQL SQL generator. Your ONLY job is to write SQL that exactly matches the user's intent — nothing more, nothing less.

SCHEMA (use ONLY these tables and columns):
- users        (id uuid PK, name varchar, email varchar, status varchar, plan varchar, created_at timestamp, last_login timestamp)
- orders       (id uuid PK, user_id uuid FK→users.id, product_id uuid FK→products.id, amount numeric, status varchar, created_at timestamp)
- products     (id uuid PK, name varchar, category varchar, price numeric, created_at timestamp)
- subscriptions(id uuid PK, user_id uuid FK→users.id, plan varchar, status varchar, expires_at timestamp, created_at timestamp)
- events       (id bigint PK, user_id uuid FK→users.id, event_type varchar, payload jsonb, created_at timestamp)
- legacy_users (id serial PK, username varchar, email varchar, last_login timestamp)

STRICT RULES:
1. Match the user's intent EXACTLY. Do not add logic they didn't ask for.
2. Use only the columns listed above. Never invent columns.
3. For inactivity / "last seen" / "not logged in" queries → use users.last_login
4. For signup / account age queries → use users.created_at
5. Only JOIN tables if the query explicitly involves data from multiple tables.
6. Only GROUP BY / aggregate if the query asks for counts, sums, or averages.
7. Always add a LIMIT (default 50) to SELECT queries on large tables (events, orders).
8. Risk: SELECT = "low", UPDATE/DELETE with WHERE = "medium", UPDATE/DELETE without WHERE or DDL = "high"

EXAMPLES:
User: "users inactive for 30 days"
SQL: SELECT id, name, email, last_login FROM users WHERE last_login < NOW() - INTERVAL '30 days' ORDER BY last_login ASC LIMIT 50;

User: "show all pending orders"
SQL: SELECT id, user_id, amount, status, created_at FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50;

User: "how many users signed up this month"
SQL: SELECT COUNT(*) AS signups FROM users WHERE created_at >= DATE_TRUNC('month', NOW());

User: "top 10 products by revenue"
SQL: SELECT p.id, p.name, SUM(o.amount) AS revenue FROM products p JOIN orders o ON o.product_id = p.id GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10;

---

User request: "${query}"

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation outside the JSON:
{
  "sql": "the exact SQL — no markdown, just the query",
  "explanation": "one sentence: what this query does and why",
  "risk": "low" | "medium" | "high",
  "operation": "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "DDL",
  "columns": ["col1", "col2"],
  "rows": [{"col1": "val", "col2": "val"}],
  "rowCount": number
}

For "rows": generate 3–5 realistic mock rows that match exactly the columns your SQL SELECTs. Use plausible names, email addresses, UUIDs, and timestamps.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response");

  return JSON.parse(jsonMatch[0]) as QueryResponse;
}

// ─── Route handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json() as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    let result: QueryResponse;
    try {
      result = await callGemini(query);
    } catch {
      // Silent fallback to mock data
      result = pickMockResponse(query);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(pickMockResponse("users"), { status: 200 });
  }
}
