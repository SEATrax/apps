const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  const tables = [
    'payments',
    'pool_metadata',
    'invoice_metadata',
    'investors',
    'exporters'
  ];

  let totalDeleted = 0;

  for (const table of tables) {
    try {
      // Count existing rows
      const { count: beforeCount, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      console.log(`📋 ${table}: ${beforeCount || 0} rows found`);

      // Delete all rows
      if (beforeCount && beforeCount > 0) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible condition)

        if (deleteError) throw deleteError;

        console.log(`   ✅ Deleted ${beforeCount} rows from ${table}`);
        totalDeleted += beforeCount;
      } else {
        console.log(`   ⏭️  Already empty`);
      }
    } catch (error) {
      console.error(`   ❌ Error cleaning ${table}:`, error.message);
    }
  }

  console.log(`\n✅ Database cleanup completed!`);
  console.log(`📊 Total rows deleted: ${totalDeleted}`);
  console.log('\n🎯 Database is now clean and ready for fresh testing!');
}

cleanupDatabase().catch(console.error);
