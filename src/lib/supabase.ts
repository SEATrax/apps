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
  supabaseAnonKey || 'placeholder-key'
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
          created_at?: string;
        };
      };
      pool_metadata: {
        Row: {
          id: string;
          pool_id: number;
          description: string | null;
          risk_category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: number;
          description?: string | null;
          risk_category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: number;
          description?: string | null;
          risk_category?: string | null;
          created_at?: string;
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
