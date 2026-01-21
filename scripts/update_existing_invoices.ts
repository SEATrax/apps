
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExistingInvoices() {
    console.log('Updating existing invoices...');

    // User provided 9 invoices. We will distribute them.
    // Pool 1: Funded
    // Pool 2: Fundraising
    // Pool 3: Open

    const updates = [
        // Pool 1
        { id: '7ff331a1-a19b-4fb1-aec6-181ccd23e09e', pool_id: 1, status: 'funded', amount: 10000 },
        { id: 'e89124b2-aa56-4bb5-82b3-76df98741386', pool_id: 1, status: 'funded', amount: 15000 },
        { id: '761838a4-e042-4d04-b20f-f9a2a05f08fe', pool_id: 1, status: 'funded', amount: 5000 },

        // Pool 2
        { id: 'cbd0b163-4906-4b3e-a1c8-c3060c645b50', pool_id: 2, status: 'approved', amount: 20000 },
        { id: 'f0e6b0a6-b0f2-4c8e-afdf-ae92676ffcfb', pool_id: 2, status: 'approved', amount: 20000 },
        { id: '004af9ee-44d3-490c-b450-fa109430f061', pool_id: 2, status: 'approved', amount: 20000 },

        // Pool 3
        { id: '442ab7c6-692e-4077-a59a-c7eee01cfaf4', pool_id: 3, status: 'pending_funding', amount: 25000 },
        { id: '9ca486e1-35f9-4403-b65b-7bee7d8a457b', pool_id: 3, status: 'pending_funding', amount: 25000 },
        { id: 'c6917c4b-e838-43d2-8bb1-4e60091535cc', pool_id: 3, status: 'pending_funding', amount: 10000 }
    ];

    for (const update of updates) {
        const { error } = await supabase
            .from('invoice_metadata')
            .update({
                pool_id: update.pool_id,
                status: update.status,
                shipping_amount: update.amount * 100, // Cents
                loan_amount: update.amount * 100 * 0.8, // 80% LTV

                // Ensure other fields are not null if needed
                token_id: Math.floor(Math.random() * 1000000000),
                amount_invested: update.status === 'funded' ? update.amount * 1e18 : 0, // Mock ETH amount if funded
                contract_address: '0x3023a1b0faf10dee06a0aa5197ee00882b401152',
                transaction_hash: '0xmockhash...'
            })
            .eq('id', update.id);

        if (error) {
            console.error(`Error updating invoice ${update.id}:`, error.message);
        } else {
            console.log(`Updated invoice ${update.id} -> Pool ${update.pool_id}`);
        }
    }
}

updateExistingInvoices();
