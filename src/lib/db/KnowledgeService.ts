import { PoolClient } from 'pg';
import { randomUUID } from 'crypto';

interface QueryEntry {
  nlIntent: string;
  sql: string;
  author: string;
  timestamp: Date;
  rowCount: number;
  embedding: number[];
}

export class KnowledgeService {
  constructor(private client: PoolClient) {}

  async init(): Promise<void> {
    await this.client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS query_history (
        id uuid PRIMARY KEY,
        nl_intent text,
        sql text,
        author text,
        timestamp timestamptz,
        row_count int,
        embedding vector(1536)
      )
    `);
  }

  async store(entry: QueryEntry): Promise<void> {
    const id = randomUUID();
    const embeddingStr = `[${entry.embedding.join(',')}]`;
    await this.client.query(
      'INSERT INTO query_history (id, nl_intent, sql, author, timestamp, row_count, embedding) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, entry.nlIntent, entry.sql, entry.author, entry.timestamp, entry.rowCount, embeddingStr]
    );
  }

  async retrieve(queryEmbedding: number[], topK = 3): Promise<{ nlIntent: string; sql: string }[]> {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    const result = await this.client.query(
      'SELECT nl_intent, sql FROM query_history ORDER BY embedding <-> $1 LIMIT $2',
      [embeddingStr, topK]
    );
    return result.rows;
  }
}