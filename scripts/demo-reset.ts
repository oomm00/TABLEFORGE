import { Pool } from 'pg';
import { seed } from './seed';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function demoReset() {
  console.log('Starting demo reset...');

  // Truncate all tables in dependency order with CASCADE
  const tables = [
    'reviews',
    'order_items',
    'orders',
    'products',
    'users',
    'legacy_users',
    'query_history'
  ];

  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    console.log(`Truncated ${table}`);
  }

  console.log('All tables truncated. Starting seeding...');

  // Re-run seed script
  await seed();

  console.log('Demo reset completed successfully!');
}

demoReset()
  .catch(console.error)
  .finally(() => pool.end());