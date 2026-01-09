import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface PaymentAPIResponse {
  invoice: {
    id: string;
    amount: number; // Amount in USD cents
    amountFormatted: string; // Amount in USD formatted
    exporter: string;
    importer: string;
    invoiceNumber?: string;
    goodsDescription?: string;
    shippingDate: number;
    status: string;
  };
  payment: {
    status: string;
    dueDate: string;
    paymentLink: string;
    isPaid: boolean;
  };
  success: boolean;
  error?: string;
}

// GET - Fetch invoice and payment details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ invoiceId: string }> }
): Promise<NextResponse<PaymentAPIResponse>> {
  try {
    const { invoiceId } = await context.params;

    if (!invoiceId) {
      return NextResponse.json({
        success: false,
        error: 'Invoice ID is required',
        invoice: {} as any,
        payment: {} as any,
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      // Mock data for testing when Supabase is not configured
      return NextResponse.json({
        success: true,
        invoice: {
          id: invoiceId,
          amount: 1000000, // $10,000 in cents
          amountFormatted: '$10,000.00',
          exporter: 'Demo Exporter Company',
          importer: 'Demo Importer Company',
          invoiceNumber: `INV-${invoiceId}`,
          goodsDescription: 'Sample shipping goods',
          shippingDate: Date.now(),
          status: 'FUNDED',
        },
        payment: {
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paymentLink: `/pay/${invoiceId}`,
          isPaid: false,
        }
      });
    }

    // Fetch payment record from Supabase
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('token_id', parseInt(invoiceId))
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') { // Not found is ok
      console.error('Payment fetch error:', paymentError);
    }

    // Fetch invoice metadata from Supabase
    const { data: invoiceMetadata, error: metadataError } = await supabase
      .from('invoice_metadata')
      .select('*')
      .eq('token_id', parseInt(invoiceId))
      .single();

    if (metadataError && metadataError.code !== 'PGRST116') {
      console.error('Invoice metadata fetch error:', metadataError);
    }

    // Prepare response data
    const invoice = {
      id: invoiceId,
      amount: paymentRecord?.amount_usd || 1000000, // Default to $10,000 in cents
      amountFormatted: `$${((paymentRecord?.amount_usd || 1000000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      exporter: 'Exporter Company', // Would come from smart contract in real implementation
      importer: invoiceMetadata?.importer_name || 'Importer Company',
      invoiceNumber: invoiceMetadata?.invoice_number || `INV-${invoiceId}`,
      goodsDescription: invoiceMetadata?.goods_description || 'Shipping goods',
      shippingDate: Date.now(), // Would come from smart contract
      status: 'FUNDED', // Would come from smart contract
    };

    const payment = {
      status: paymentRecord?.status || 'pending',
      dueDate: paymentRecord?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentLink: paymentRecord?.payment_link || `/pay/${invoiceId}`,
      isPaid: paymentRecord?.status === 'paid',
    };

    return NextResponse.json({
      success: true,
      invoice,
      payment,
    });

  } catch (error: any) {
    console.error('Payment API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      invoice: {} as any,
      payment: {} as any,
    }, { status: 500 });
  }
}

// POST - Process dummy payment submission
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ invoiceId: string }> }
): Promise<NextResponse> {
  try {
    const { invoiceId } = await context.params;
    const body = await request.json();

    if (!invoiceId) {
      return NextResponse.json({
        success: false,
        error: 'Invoice ID is required'
      }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      // Mock response for testing
      return NextResponse.json({
        success: true,
        message: 'Payment submitted for confirmation (mock mode)',
        paymentId: `payment-${invoiceId}-${Date.now()}`,
      });
    }

    // Update payment status to pending confirmation
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'pending_confirmation',
        payment_reference: body.paymentReference || `PAY-${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('token_id', parseInt(invoiceId))
      .select()
      .single();

    if (error) {
      console.error('Payment update error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process payment'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for admin confirmation',
      paymentId: data.id,
    });

  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}