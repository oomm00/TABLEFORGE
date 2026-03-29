// Stub: DatabaseService for backend API routes
// Replace with real implementation when backend is built

export class DatabaseService {
  private static instance: DatabaseService;
  private sessions: Map<string, any> = new Map();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(config: { host: string; port: number; database: string; user: string; password: string }): Promise<{ sessionId: string; schemaSnapshot: any }> {
    const sessionId = crypto.randomUUID();
    const schemaSnapshot = { tables: [] };
    this.sessions.set(sessionId, { id: sessionId, config, schemaSnapshot });
    return { sessionId, schemaSnapshot };
  }

  getSchemaSnapshot(sessionId: string): any | null {
    const session = this.sessions.get(sessionId);
    return session?.schemaSnapshot ?? null;
  }

  async execute(sessionId: string, sql: string): Promise<{ rows: any[]; fields: any[] }> {
    return { rows: [], fields: [] };
  }

  disconnect(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
