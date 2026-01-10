import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkSystemHealth } from '@/lib/compensation';

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
  dataSource: 'contract' | 'database' | 'hybrid' | 'mock'; // Track data source
  error?: string;
  warnings?: string[];
}

// Helper function to fetch invoice from smart contract
async function fetchInvoiceFromContract(invoiceId: string): Promise<any | null> {
  try {
    // Dynamic import to avoid server-side issues with client-only SDK
    const { createThirdwebClient } = await import('thirdweb');
    const { getContract } = await import('thirdweb');
    const { readContract } = await import('thirdweb');
    const { liskSepolia } = await import('panna-sdk');
    
    const client = createThirdwebClient({
      clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'demo',
    });

    const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT || '0x8Da2dF6050158ae8B058b90B37851323eFd69E16';
    
    const contract = getContract({
      client,
      chain: liskSepolia,
      address: invoiceNFTAddress as `0x${string}`,
    });

    const invoiceData = await readContract({
      contract,
      method: 'function getInvoice(uint256 invoiceId) view returns (string exporterCompany, address exporterWallet, string importerCompany, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, uint256 amountInvested, uint256 amountWithdrawn, uint8 status)',
      params: [BigInt(invoiceId)],
    });

    return invoiceData;
  } catch (error) {
    console.error('Failed to fetch invoice from contract:', error);
    return null;
  }
}

// GET - Fetch invoice and payment details with smart contract priority
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ invoiceId: string }> }
): Promise<NextResponse<PaymentAPIResponse>> {
  try {
    const { invoiceId } = await context.params;
    const warnings: string[] = [];
    let dataSource: 'contract' | 'database' | 'hybrid' | 'mock' = 'mock';

    if (!invoiceId) {
      return NextResponse.json({
        success: false,
        error: 'Invoice ID is required',
        dataSource: 'mock',
        invoice: {} as any,
        payment: {} as any,
      }, { status: 400 });
    }

    // Check system health
    const health = await checkSystemHealth();
    console.log(`🏥 Payment API - System Health:`, {
      contract: health.contractConnection,
      database: health.supabaseConnection,
      status: health.consensusStatus
    });

    // === PHASE 1: TRY SMART CONTRACT (PRIMARY SOURCE) ===
    let contractData: any = null;
    let contractAvailable = false;

    try {
      console.log(`🔗 Attempting to fetch invoice ${invoiceId} from smart contract...`);
      contractData = await fetchInvoiceFromContract(invoiceId);
      
      if (contractData) {
        contractAvailable = true;
        dataSource = 'contract';
        console.log('✅ Contract data fetched successfully');
      } else {
        warnings.push('Smart contract data unavailable, using database fallback');
      }
    } catch (error) {
      console.warn('⚠️ Smart contract fetch failed:', error);
      warnings.push('Smart contract temporarily unavailable');
    }

    // === PHASE 2: FETCH DATABASE DATA (METADATA & FALLBACK) ===
    let paymentRecord: any = null;
    let invoiceMetadata: any = null;

    if (isSupabaseConfigured && health.supabaseConnection) {
      try {
        // Fetch payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('token_id', parseInt(invoiceId))
          .single();

        if (!paymentError) {
          paymentRecord = payment;
        } else if (paymentError.code !== 'PGRST116') {
          console.error('Payment fetch error:', paymentError);
          warnings.push('Payment record fetch failed');
        }

        // Fetch invoice metadata
        const { data: metadata, error: metadataError } = await supabase
          .from('invoice_metadata')
          .select('*')
          .eq('token_id', parseInt(invoiceId))
          .single();

        if (!metadataError) {
          invoiceMetadata = metadata;
        } else if (metadataError.code !== 'PGRST116') {
          console.error('Invoice metadata fetch error:', metadataError);
          warnings.push('Invoice metadata fetch failed');
        }

        // Update data source based on what we have
        if (contractAvailable && (paymentRecord || invoiceMetadata)) {
          dataSource = 'hybrid'; // Contract + Database
        } else if (!contractAvailable && (paymentRecord || invoiceMetadata)) {
          dataSource = 'database'; // Database only
        }
      } catch (error) {
        console.error('Database fetch error:', error);
        warnings.push('Database temporarily unavailable');
      }
    }

    // === PHASE 3: CONSTRUCT RESPONSE WITH PRIORITY LOGIC ===
    
    // If neither contract nor database available, return mock data
    if (!contractAvailable && !paymentRecord && !invoiceMetadata) {
      console.warn('⚠️ Both contract and database unavailable, using mock data');
      dataSource = 'mock';
      
      return NextResponse.json({
        success: true,
        dataSource,
        warnings: [...warnings, 'Using mock data - system temporarily unavailable'],
        invoice: {
          id: invoiceId,
          amount: 1000000,
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

    // Map invoice status from contract
    const statusMap: Record<number, string> = {
      0: 'PENDING',
      1: 'FINALIZED',
      2: 'FUNDRAISING',
      3: 'FUNDED',
      4: 'PAID',
      5: 'CANCELLED',
    };

    // Construct invoice data (prioritize contract, fallback to database)
    const invoice = {
      id: invoiceId,
      amount: contractData ? Number(contractData[4]) : (paymentRecord?.amount_usd || 1000000), // shippingAmount from contract
      amountFormatted: contractData 
        ? `$${(Number(contractData[4]) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `$${((paymentRecord?.amount_usd || 1000000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      exporter: contractData ? contractData[0] : 'Exporter Company', // exporterCompany from contract
      importer: contractData ? contractData[2] : (invoiceMetadata?.importer_name || 'Importer Company'), // importerCompany from contract
      invoiceNumber: invoiceMetadata?.invoice_number || `INV-${invoiceId}`,
      goodsDescription: invoiceMetadata?.goods_description || 'Shipping goods',
      shippingDate: contractData ? Number(contractData[3]) * 1000 : Date.now(), // shippingDate from contract (convert to ms)
      status: contractData ? statusMap[Number(contractData[8])] || 'UNKNOWN' : 'FUNDED', // status from contract
    };

    // Construct payment data (from database)
    const payment = {
      status: paymentRecord?.status || 'pending',
      dueDate: paymentRecord?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentLink: paymentRecord?.payment_link || `/pay/${invoiceId}`,
      isPaid: paymentRecord?.status === 'paid',
    };

    console.log(`✅ Payment API response constructed from ${dataSource} source(s)`);

    return NextResponse.json({
      success: true,
      dataSource,
      warnings: warnings.length > 0 ? warnings : undefined,
      invoice,
      payment,
    });

  } catch (error: any) {
    console.error('❌ Payment API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      dataSource: 'mock',
      invoice: {} as any,
      payment: {} as any,
    }, { status: 500 });
  }
}

// POST - Process dummy payment submission with validation
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

    // Check system health before processing
    const health = await checkSystemHealth();
    
    if (health.consensusStatus === 'critical') {
      return NextResponse.json({
        success: false,
        error: 'System temporarily unavailable. Please try again later.',
        retryAfter: 60 // seconds
      }, { status: 503 });
    }

    // === VERIFY INVOICE EXISTS (Contract or Database) ===
    let invoiceExists = false;
    
    // Try contract first
    try {
      const contractData = await fetchInvoiceFromContract(invoiceId);
      if (contractData) {
        invoiceExists = true;
        console.log('✅ Invoice verified from smart contract');
      }
    } catch (error) {
      console.warn('Contract verification failed, trying database...');
    }

    // Fallback to database if contract unavailable
    if (!invoiceExists && isSupabaseConfigured && health.supabaseConnection) {
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('token_id', parseInt(invoiceId))
        .single();
      
      if (payment) {
        invoiceExists = true;
        console.log('✅ Invoice verified from database');
      }
    }

    if (!invoiceExists && !isSupabaseConfigured) {
      // Mock mode - always accept
      invoiceExists = true;
      console.log('⚠️ Mock mode - accepting payment without verification');
    }

    if (!invoiceExists) {
      return NextResponse.json({
        success: false,
        error: 'Invoice not found'
      }, { status: 404 });
    }

    // === PROCESS PAYMENT ===
    if (!isSupabaseConfigured) {
      // Mock response for testing
      return NextResponse.json({
        success: true,
        message: 'Payment submitted for confirmation (mock mode)',
        paymentId: `payment-${invoiceId}-${Date.now()}`,
        dataSource: 'mock',
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
      
      // If update failed but invoice exists, it might be a new payment without record
      // Try to create a new payment record
      if (error.code === 'PGRST116') { // Not found
        console.log('Creating new payment record...');
        
        const { data: newPayment, error: insertError } = await supabase
          .from('payments')
          .insert({
            token_id: parseInt(invoiceId),
            invoice_id: parseInt(invoiceId),
            amount_usd: 0, // Will be updated from contract
            status: 'pending_confirmation',
            payment_reference: body.paymentReference || `PAY-${Date.now()}`,
            payment_link: `/pay/${invoiceId}`,
          })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to process payment'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Payment submitted for admin confirmation',
          paymentId: newPayment.id,
          dataSource: 'database',
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to process payment'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for admin confirmation',
      paymentId: data.id,
      dataSource: 'database',
    });

  } catch (error: any) {
    console.error('❌ Payment POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}