import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const schemaSnapshot = dbService.getSchemaSnapshot(sessionId);

    if (!schemaSnapshot) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ schemaSnapshot });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}