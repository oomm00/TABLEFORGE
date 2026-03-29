import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, database, user, password } = body;

    if (!host || !port || !database || !user || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = { host, port: Number(port), database, user, password };
    const { sessionId, schemaSnapshot } = await dbService.connect(config);

    // Fire-and-forget async tasks for schema story and anomaly detection
    // TODO: Implement schemaStory generation and anomaly detection

    return NextResponse.json({
      sessionId,
      schemaSnapshot,
      schemaStory: null,
      anomalies: []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}