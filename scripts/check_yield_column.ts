
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkColumn() {
    const { data, error } = await supabase
        .from('pool_metadata')
        .select('target_yield')
        .limit(1);

    if (error) {
        console.log('Error selecting target_yield (likely missing):', error.message);
    } else {
        console.log('Column target_yield exists.');
    }
}

checkColumn();
