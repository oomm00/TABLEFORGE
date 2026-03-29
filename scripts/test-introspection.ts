import { config } from "dotenv";
config();

import { Pool } from "pg";
import { DatabaseService } from '../src/lib/db/DatabaseService';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('Testing database introspection...');

  const client = await pool.connect();

  try {
    const dbService = DatabaseService.getInstance();
    const schema = await dbService.introspect(client);

    // Verify schema structure
    console.log('Schema structure verification:');
    console.log(`- Tables count: ${schema.tables.length}`);

    if (schema.tables.length === 0) {
      console.log('⚠️  Warning: No tables found in schema');
    } else {
      console.log('✅ Schema contains tables');

      // Check first table structure
      const firstTable = schema.tables[0];
      console.log(`- First table: ${firstTable.name}`);
      console.log(`- Columns count: ${firstTable.columns.length}`);

      if (firstTable.columns.length > 0) {
        const firstColumn = firstTable.columns[0];
        console.log(`- First column: ${firstColumn.name} (${firstColumn.type})`);
        console.log(`- Constraints: ${firstColumn.constraints.join(', ') || 'none'}`);
        if (firstColumn.fkRef) {
          console.log(`- Foreign key: ${firstColumn.fkRef.table}.${firstColumn.fkRef.column}`);
        }
      }
    }

    // Print full schema JSON
    console.log('\nFull schema JSON:');
    console.log(JSON.stringify(schema, null, 2));

  } catch (error) {
    console.error('Error during introspection:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();