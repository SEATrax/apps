'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { supabase } from '@/lib/supabase';

export interface InvestorProfile {
  id: string;
  wallet_address: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  investment_amount_total: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvestorData {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
}

export const useInvestorProfile = () => {
  const activeAccount = useActiveAccount();
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = activeAccount?.address;

  // Fetch investor profile by wallet address
  const fetchProfile = async () => {
    if (!walletAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('investors')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching investor profile:', err);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new investor profile
  const createProfile = async (data: CreateInvestorData): Promise<InvestorProfile> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const { data: newProfile, error: createError } = await supabase
        .from('investors')
        .insert([{
          wallet_address: walletAddress,
          ...data,
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('Error creating investor profile:', err);
      throw err;
    }
  };

  // Update investor profile
  const updateProfile = async (data: Partial<CreateInvestorData>): Promise<InvestorProfile> => {
    if (!walletAddress || !profile) {
      throw new Error('No profile to update');
    }

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('investors')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error('Error updating investor profile:', err);
      throw err;
    }
  };

  // Check if investor exists
  const exists = profile !== null;

  useEffect(() => {
    fetchProfile();
  }, [walletAddress]);

  return {
    profile,
    loading,
    error,
    exists,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
};