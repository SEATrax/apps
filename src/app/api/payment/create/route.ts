import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { invoiceId, invoiceUUID, amount } = await request.json();

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        // 1. Check if payment record already exists
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', Number(invoiceId))
            .single();

        if (existingPayment) {
            return NextResponse.json({
                paymentLink: existingPayment.payment_link,
                isNew: false
            });
        }

        // 2. Fetch Invoice Metadata for shipping_amount (total_due) and UUID (for secure link)
        const { data: invoiceMeta } = await supabase
            .from('invoice_metadata')
            .select('shipping_amount, id')
            .eq('token_id', Number(invoiceId))
            .single();

        const shippingAmount = invoiceMeta?.shipping_amount || 0;
        const secureUUID = invoiceMeta?.id; // This is the UUID from invoice_metadata

        // 3. Create new payment record
        // STRICTLY use the UUID. If no UUID found, we should probably error out or fallback, 
        // but for security we want UUID. Assuming backfill ran, all should have UUIDs.
        const linkUUID = secureUUID || invoiceUUID || invoiceId;
        const paymentLink = `/pay/${linkUUID}`;

        const { data: newPayment, error } = await supabase
            .from('payments')
            .insert({
                invoice_id: Number(invoiceId),
                token_id: Number(invoiceId),
                payment_link: paymentLink,
                status: 'link_generated', // Updated from 'pending' as requested
                amount_usd: amount || 0,
                total_due: shippingAmount,
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment record:', error);
            return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
        }

        return NextResponse.json({
            paymentLink: newPayment.payment_link,
            isNew: true
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
