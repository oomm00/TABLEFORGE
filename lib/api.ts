/**
 * API Client Integration Layer for TableForge AI
 *
 * Implements the API contract defined in docs/api-contract.md
 */

// Types based on the API contract
export interface ColumnDef {
  name: string;
  type: string;
  constraints: string[];
  fkRef?: {
    table: string;
    column: string;
  };
}

export interface TableDef {
  name: string;
  columns: ColumnDef[];
}

export interface SchemaSnapshot {
  tables: TableDef[];
}

export interface ConnectRequest {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}

export interface ConnectResponse {
  sessionId: string;
  schemaSnapshot: SchemaSnapshot;
  schemaStory?: string;
  anomalies?: string[];
  error?: string;
}

export interface ExecuteRequest {
  sessionId: string;
  sql: string;
  embedding?: number[];
  nlIntent?: string;
  author?: string;
}

export interface ExecuteResponse {
  rows: any[];
  fields: { name: string; dataTypeID: number }[];
  rowCount: number;
  error?: string;
}

class ApiClient {
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || `API request failed with status ${res.status}`);
    }
    return data;
  }

  /**
   * 1. POST /api/connect
   * Establishes a connection to a database and returns a session ID along with the initial schema snapshot.
   */
  async connect(credentials: ConnectRequest): Promise<ConnectResponse> {
    return this.fetch<ConnectResponse>('/connect', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * 2. GET /api/schema
   * Retrieves the current schema snapshot for an active session.
   */
  async getSchema(sessionId: string): Promise<{ schemaSnapshot: SchemaSnapshot }> {
    return this.fetch<{ schemaSnapshot: SchemaSnapshot }>('/schema', {
      method: 'GET',
      headers: {
        'x-session-id': sessionId,
      },
    });
  }

  /**
   * 3. POST /api/execute
   * Executes a SQL query and returns the results.
   */
  async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    return this.fetch<ExecuteResponse>('/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 4. POST /api/disconnect
   * Disconnects an active session.
   */
  async disconnect(sessionId: string): Promise<{ success: boolean }> {
    return this.fetch<{ success: boolean }>('/disconnect', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }
}

export const api = new ApiClient();
