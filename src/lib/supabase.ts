import { createClient } from '@supabase/supabase-js';
import { appConfig } from '@/config';

const supabaseUrl = appConfig.supabase.url;
const supabaseAnonKey = appConfig.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.');
}

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  }
);

export { isSupabaseConfigured };

// ============== DATABASE TYPES ==============

export interface Database {
  public: {
    Tables: {
      exporters: {
        Row: {
          id: string;
          wallet_address: string;
          company_name: string;
          tax_id: string;
          country: string;
          export_license: string;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          company_name: string;
          tax_id: string;
          country: string;
          export_license: string;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          company_name?: string;
          tax_id?: string;
          country?: string;
          export_license?: string;
          is_verified?: boolean;
          created_at?: string;
        };
      };
      investors: {
        Row: {
          id: string;
          wallet_address: string;
          name: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          name: string;
          address: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          name?: string;
          address?: string;
          created_at?: string;
        };
      };
      invoice_metadata: {
        Row: {
          id: string;
          token_id: number;
          invoice_number: string;
          goods_description: string | null;
          importer_name: string;
          importer_license: string | null;
          documents: Record<string, string> | null;

          // Blockchain Cache
          status: string | null;
          pool_id: number | null;
          shipping_amount: number | null;
          loan_amount: number | null;
          amount_invested: number | null;
          amount_withdrawn: number | null;
          shipping_date: number | null;

          // Provenance
          contract_address: string | null;
          block_number: number | null;
          transaction_hash: string | null;

          created_at: string;
        };
        Insert: {
          id?: string;
          token_id: number;
          invoice_number: string;
          goods_description?: string | null;
          importer_name: string;
          importer_license?: string | null;
          documents?: Record<string, string> | null;

          // Blockchain Cache
          status?: string | null;
          pool_id?: number | null;
          shipping_amount?: number | null;
          loan_amount?: number | null;
          amount_invested?: number | null;
          amount_withdrawn?: number | null;
          shipping_date?: number | null;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;

          created_at?: string;
        };
        Update: {
          id?: string;
          token_id?: number;
          invoice_number?: string;
          goods_description?: string | null;
          importer_name?: string;
          importer_license?: string | null;
          documents?: Record<string, string> | null;

          // Blockchain Cache
          status?: string | null;
          pool_id?: number | null;
          shipping_amount?: number | null;
          loan_amount?: number | null;
          amount_invested?: number | null;
          amount_withdrawn?: number | null;
          shipping_date?: number | null;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;

          created_at?: string;
        };
      };
      pool_metadata: {
        Row: {
          id: string;
          pool_id: number;
          name: string | null;  // Added name field
          description: string | null;
          risk_category: string | null;
          created_at: string;

          // Blockchain Cache
          status: string | null;
          start_date: number | null;
          end_date: number | null;
          total_loan_amount: number | null;
          total_shipping_amount: number | null;
          amount_invested: number | null;
          amount_distributed: number | null;

          // Provenance
          contract_address: string | null;
          block_number: number | null;
          transaction_hash: string | null;
        };
        Insert: {
          id?: string;
          pool_id: number;
          name?: string | null;
          description?: string | null;
          risk_category?: string | null;
          created_at?: string;

          // Blockchain Cache
          status?: string | null;
          start_date?: number | null;
          end_date?: number | null;
          total_loan_amount?: number | null;
          total_shipping_amount?: number | null;
          amount_invested?: number | null;
          amount_distributed?: number | null;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;
        };
        Update: {
          id?: string;
          pool_id?: number;
          name?: string | null;
          description?: string | null;
          risk_category?: string | null;
          created_at?: string;

          // Blockchain Cache
          status?: string | null;
          start_date?: number | null;
          end_date?: number | null;
          total_loan_amount?: number | null;
          total_shipping_amount?: number | null;
          amount_invested?: number | null;
          amount_distributed?: number | null;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;
        };
      };
      investments: {
        Row: {
          id: string;
          pool_id: number;
          investor_address: string;
          amount: number;
          percentage: number;
          timestamp: number;

          // Provenance
          contract_address: string | null;
          block_number: number | null;
          transaction_hash: string | null;

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pool_id: number;
          investor_address: string;
          amount: number | string;
          percentage: number;
          timestamp: number;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;

          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: number;
          investor_address?: string;
          amount?: number;
          percentage?: number;
          timestamp?: number;

          // Provenance
          contract_address?: string | null;
          block_number?: number | null;
          transaction_hash?: string | null;

          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: number;
          amount_usd: number;
          payment_link: string | null;
          status: string;
          sent_at: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: number;
          amount_usd: number;
          payment_link?: string | null;
          status?: string;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: number;
          amount_usd?: number;
          payment_link?: string | null;
          status?: string;
          sent_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// ============== HELPER FUNCTIONS ==============

export async function getExporterByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('exporters')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createExporter(exporter: Database['public']['Tables']['exporters']['Insert']) {
  const { data, error } = await supabase
    .from('exporters')
    .insert({
      ...exporter,
      wallet_address: exporter.wallet_address.toLowerCase(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInvestorByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createInvestor(investor: Database['public']['Tables']['investors']['Insert']) {
  const { data, error } = await supabase
    .from('investors')
    .insert({
      ...investor,
      wallet_address: investor.wallet_address.toLowerCase(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserRole(walletAddress: string): Promise<'admin' | 'exporter' | 'investor' | null> {
  const address = walletAddress.toLowerCase();

  const adminAddresses = (process.env.ADMIN_ADDRESSES || '').toLowerCase().split(',');
  if (adminAddresses.includes(address)) {
    return 'admin';
  }

  try {
    const exporter = await getExporterByWallet(address);
    if (exporter) return 'exporter';

    const investor = await getInvestorByWallet(address);
    if (investor) return 'investor';
  } catch (err: any) {
    console.warn('Supabase tables not found or not accessible:', err.message);
  }

  return null;
}

// ============== USER WALLETS (HYBRID AUTH) ==============

export async function getUserWallet(userId: string) {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('primary_wallet', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertUserWallet(userId: string, walletAddress: string) {
  // Ensure lowercase address
  const address = walletAddress.toLowerCase();
  // Check existing primary wallet
  const existing = await getUserWallet(userId);
  if (existing && existing.wallet_address === address) return existing;
  // Insert new (will fail if unique constraint clashes; allow conflict handling)
  const { data, error } = await supabase
    .from('user_wallets')
    .upsert({ user_id: userId, wallet_address: address, primary_wallet: true }, { onConflict: 'wallet_address' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============== BLOCKCHAIN CACHING FUNCTIONS ==============

export async function upsertInvoiceCache(
  tokenId: number,
  data: Database['public']['Tables']['invoice_metadata']['Update']
) {
  const { data: result, error } = await supabase
    .from('invoice_metadata')
    .upsert({
      token_id: tokenId,
      ...data
    }, {
      onConflict: 'token_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to cache invoice ${tokenId}:`, error);
    // Silent fail for cache - don't block UI
    return null;
  }
  return result;
}

export async function upsertPoolCache(
  poolId: number,
  data: Database['public']['Tables']['pool_metadata']['Update']
) {
  const { data: result, error } = await supabase
    .from('pool_metadata')
    .upsert({
      pool_id: poolId,
      ...data
    }, {
      onConflict: 'pool_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error(`Failed to cache pool ${poolId}:`, error);
    return null;
  }
  return result;
}

export async function createInvestment(
  investment: Database['public']['Tables']['investments']['Insert']
) {
  const { data, error } = await supabase
    .from('investments')
    .insert({
      ...investment,
      investor_address: investment.investor_address.toLowerCase()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to record investment:', error);
    return null;
  }
  return data;
}

export async function upsertInvestmentCache(
  poolId: number,
  investorAddress: string,
  data: Partial<Database['public']['Tables']['investments']['Update']>
) {
  // First find the ID - composite key update
  const { data: existing } = await supabase
    .from('investments')
    .select('id')
    .eq('pool_id', poolId)
    .eq('investor_address', investorAddress.toLowerCase())
    .single();

  if (existing) {
    const { data: result, error } = await supabase
      .from('investments')
      .update(data)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update investment cache:', error);
      return null;
    }
    return result;
  }
  return null;
}

export async function getInvestorPortfolio(investorAddress: string) {
  // 1. Fetch investments
  const { data: investments, error: investError } = await supabase
    .from('investments')
    .select('*')
    .eq('investor_address', investorAddress.toLowerCase())
    .order('timestamp', { ascending: false });

  if (investError) {
    console.error('Failed to fetch investor portfolio:', investError);
    return [];
  }

  if (!investments || investments.length === 0) return [];

  // 2. Fetch related pool metadata
  const poolIds = [...new Set(investments.map(i => i.pool_id))];

  const { data: pools, error: poolError } = await supabase
    .from('pool_metadata')
    .select('pool_id, name, status, end_date, total_loan_amount, amount_invested, target_yield')
    .in('pool_id', poolIds);

  if (poolError) {
    console.error('Failed to fetch pool metadata for portfolio:', poolError);
    // Return investments without pool data if pool fetch fails (graceful degradation)
    return investments.map(inv => ({ ...inv, pool_metadata: null }));
  }

  // 3. Merge data
  const poolMap = new Map(pools?.map(p => [p.pool_id, p]));

  return investments.map(inv => ({
    ...inv,
    pool_metadata: poolMap.get(inv.pool_id) || null
  }));
}

export async function getMarketplacePools() {
  // 1. Fetch all pools
  const { data: pools, error: poolError } = await supabase
    .from('pool_metadata')
    .select('*')
    .order('created_at', { ascending: false });

  if (poolError) {
    console.error('Failed to fetch marketplace pools:', poolError);
    return [];
  }

  if (!pools || pools.length === 0) return [];

  // 2. Fetch related invoices map manually (to avoid FK issues)
  const poolIds = pools.map(p => p.pool_id);
  const { data: invoices, error: invError } = await supabase
    .from('invoice_metadata')
    .select('id, pool_id, amount_invested, loan_amount')
    .in('pool_id', poolIds);

  if (invError) {
    console.warn('Failed to fetch invoices for pools (non-critical):', invError);
  }

  // 3. Attach invoices to pools
  return pools.map(pool => {
    const poolInvoices = invoices?.filter(inv => Number(inv.pool_id) === Number(pool.pool_id)) || [];
    return {
      ...pool,
      invoice_metadata: poolInvoices
    };
  });
}
