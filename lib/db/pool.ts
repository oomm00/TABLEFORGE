// Stub: Database connection pool for backend API routes
// Replace with real pg Pool when backend is implemented
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/tableforge',
});
