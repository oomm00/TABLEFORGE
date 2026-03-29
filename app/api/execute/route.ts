import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';
import { KnowledgeService } from '@/lib/db/KnowledgeService';
import { pool } from '@/lib/db/pool';

const dbService = DatabaseService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sql, embedding, nlIntent, author } = body;

    if (!sessionId || !sql) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows, fields } = await dbService.execute(sessionId, sql);
    const rowCount = rows.length;

    // Store in knowledge base
    const client = await pool.connect();
    try {
      const knowledgeService = new KnowledgeService(client);
      await knowledgeService.init();
      await knowledgeService.store({
        nlIntent,
        sql,
        author,
        timestamp: new Date(),
        rowCount,
        embedding
      });
    } finally {
      client.release();
    }

    return NextResponse.json({
      rows,
      fields,
      rowCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}