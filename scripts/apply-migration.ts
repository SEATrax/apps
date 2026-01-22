import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD!;

if (!SUPABASE_URL || !DB_PASSWORD) {
    console.error('❌ Missing configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD');
    process.exit(1);
}

// Extract Project Ref from URL
// URL format: https://[ref].supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// Construct Connection String
// Using Direct connection (port 5432) or Pooler (6543)?
// Supabase usually provides `postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres` (Direct)
// or `postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` (Pooler)
// Let's try the direct connection format which is standard for migrations.
const connectionString = `postgres://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

console.log(`🔌 Connecting to database: db.${projectRef}.supabase.co ...`);

const sql = postgres(connectionString);

async function main() {
    try {
        const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260120000001_add_blockchain_caching.sql');
        console.log(`📄 Reading migration file: ${migrationPath}`);

        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Executing migration...');

        // Simple split by semicolon might be fragile for complex PL/pgSQL, but typically fine for Schema DDL.
        // Actually, `postgres` library can handle multi-statement strings usually.
        await sql.unsafe(migrationSql);

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
