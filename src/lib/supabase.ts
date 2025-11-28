import { createClient } from '@supabase/supabase-js';
import { appConfig } from '@/config';

const supabaseUrl = appConfig.supabase.url;
const supabaseAnonKey = appConfig.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features will be disabled.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Database types (adjust based on your Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          role: 'admin' | 'exporter' | 'investor';
          company_name: string | null;
          email: string | null;
          kyc_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          role: 'admin' | 'exporter' | 'investor';
          company_name?: string | null;
          email?: string | null;
          kyc_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          role?: 'admin' | 'exporter' | 'investor';
          company_name?: string | null;
          email?: string | null;
          kyc_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          token_id: string;
          owner_address: string;
          ipfs_hash: string;
          status: string;
          funding_amount: string;
          current_funding: string;
          created_at: string;
          due_date: string;
        };
        Insert: {
          id?: string;
          token_id: string;
          owner_address: string;
          ipfs_hash: string;
          status?: string;
          funding_amount: string;
          current_funding?: string;
          created_at?: string;
          due_date: string;
        };
        Update: {
          id?: string;
          token_id?: string;
          owner_address?: string;
          ipfs_hash?: string;
          status?: string;
          funding_amount?: string;
          current_funding?: string;
          created_at?: string;
          due_date?: string;
        };
      };
      pools: {
        Row: {
          id: string;
          pool_id: string;
          name: string;
          description: string | null;
          admin_address: string;
          status: string;
          total_value: string;
          total_invested: string;
          created_at: string;
          maturity_date: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          name: string;
          description?: string | null;
          admin_address: string;
          status?: string;
          total_value?: string;
          total_invested?: string;
          created_at?: string;
          maturity_date: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          name?: string;
          description?: string | null;
          admin_address?: string;
          status?: string;
          total_value?: string;
          total_invested?: string;
          created_at?: string;
          maturity_date?: string;
        };
      };
      investments: {
        Row: {
          id: string;
          investor_address: string;
          pool_id: string;
          amount: string;
          expected_return: string;
          claimed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          investor_address: string;
          pool_id: string;
          amount: string;
          expected_return: string;
          claimed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          investor_address?: string;
          pool_id?: string;
          amount?: string;
          expected_return?: string;
          claimed?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
