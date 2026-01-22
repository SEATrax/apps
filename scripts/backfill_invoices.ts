
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

async function backfillInvoices() {
    console.log('Backfilling invoices for pools...');

    // Mock Invoices
    // Pool 1: 3 Invoices
    // Pool 2: 5 Invoices
    // Pool 3: 2 Invoices

    const invoices = [
        // Pool 1 (Funded)
        { pool_id: 1, exporter_id: null, invoice_id: 'INV-001', amount: '10000', status: 'funded' },
        { pool_id: 1, exporter_id: null, invoice_id: 'INV-002', amount: '15000', status: 'funded' },
        { pool_id: 1, exporter_id: null, invoice_id: 'INV-003', amount: '5000', status: 'funded' },

        // Pool 2 (Fundraising)
        { pool_id: 2, exporter_id: null, invoice_id: 'INV-004', amount: '20000', status: 'approved' },
        { pool_id: 2, exporter_id: null, invoice_id: 'INV-005', amount: '20000', status: 'approved' },
        { pool_id: 2, exporter_id: null, invoice_id: 'INV-006', amount: '20000', status: 'approved' },
        { pool_id: 2, exporter_id: null, invoice_id: 'INV-007', amount: '10000', status: 'approved' },
        { pool_id: 2, exporter_id: null, invoice_id: 'INV-008', amount: '10000', status: 'approved' },

        // Pool 3 (Open)
        { pool_id: 3, exporter_id: null, invoice_id: 'INV-009', amount: '25000', status: 'pending_funding' },
        { pool_id: 3, exporter_id: null, invoice_id: 'INV-010', amount: '25000', status: 'pending_funding' },
    ];

    for (const inv of invoices) {
        const { error } = await supabase
            .from('invoice_metadata')
            .insert({
                pool_id: inv.pool_id,
                status: inv.status,
                token_id: Math.floor(Math.random() * 1000000000), // Random ID
                shipping_amount: Number(inv.amount) * 100, // Cents
                loan_amount: Number(inv.amount) * 100 * 0.8, // 80% LTV
                contract_address: '0xMock...',
                transaction_hash: '0xMock...'
            });

        if (error) {
            console.error(`Error inserting invoice ${inv.invoice_id}:`, error.message);
        } else {
            console.log(`Inserted invoice ${inv.invoice_id} for Pool ${inv.pool_id}`);
        }
    }
}

backfillInvoices();
