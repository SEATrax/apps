
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillPoolData() {
    const now = Math.floor(Date.now() / 1000);
    const day = 24 * 60 * 60;

    const updates = [
        {
            pool_id: 3,
            data: {
                start_date: now,
                end_date: now + 30 * day,
                status: '0', // Open
                total_loan_amount: '50000000000000000000', // 50 ETH ~ $150k
                total_shipping_amount: '50000000000000000000',
                amount_invested: '10000000000000000000', // 10 ETH ~ $30k
                amount_distributed: '0',
                risk_category: 'Low',
                target_yield: 12.5,
                contract_address: '0x3023a1b0faf10dee06a0aa5197ee00882b401152',
            }
        },
        {
            pool_id: 2,
            data: {
                start_date: now - 5 * day,
                end_date: now + 25 * day,
                status: '1', // Fundraising
                total_loan_amount: '80000000000000000000', // 80 ETH ~ $240k
                total_shipping_amount: '80000000000000000000',
                amount_invested: '40000000000000000000', // 40 ETH (50%)
                amount_distributed: '0',
                risk_category: 'Low',
                target_yield: 10.0,
                contract_address: '0x3023a1b0faf10dee06a0aa5197ee00882b401152',
            }
        },
        {
            pool_id: 1,
            data: {
                start_date: now - 30 * day,
                end_date: now - 1 * day,
                status: '3', // Funded
                total_loan_amount: '30000000000000000000', // 30 ETH ~ $90k
                total_shipping_amount: '30000000000000000000',
                amount_invested: '30000000000000000000', // 30 ETH (100%)
                amount_distributed: '0',
                risk_category: 'Medium',
                target_yield: 8.5,
                contract_address: '0x3023a1b0faf10dee06a0aa5197ee00882b401152',
            }
        }
    ];

    console.log('Starting backfill for multiple pools...');

    for (const update of updates) {
        console.log(`Backfilling Pool ID: ${update.pool_id}...`);
        const { error } = await supabase
            .from('pool_metadata')
            .update(update.data)
            .eq('pool_id', update.pool_id);

        if (error) {
            console.error(`Error updating pool ${update.pool_id}:`, error);
        } else {
            console.log(`Successfully updated pool ${update.pool_id} with mock data.`);
        }
    }
}

backfillPoolData();
