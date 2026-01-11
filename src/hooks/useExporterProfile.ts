'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { supabase } from '@/lib/supabase';

export interface ExporterProfile {
  id: string;
  wallet_address: string;
  company_name: string;
  tax_id?: string;
  country?: string;
  export_license?: string;
  phone?: string;
  address?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExporterData {
  company_name: string;
  tax_id?: string;
  country?: string;
  export_license?: string;
  phone?: string;
  address?: string;
}

export const useExporterProfile = () => {
  const activeAccount = useActiveAccount();
  const [profile, setProfile] = useState<ExporterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = activeAccount?.address;

  // Fetch exporter profile by wallet address
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
        .from('exporters')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching exporter profile:', err);
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Create new exporter profile
  const createProfile = async (data: CreateExporterData): Promise<ExporterProfile> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const { data: newProfile, error: createError } = await supabase
        .from('exporters')
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
    } catch (err: any) {
      console.error('Error creating exporter profile:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      console.error('Error details:', err?.details);
      console.error('Error hint:', err?.hint);
      throw err;
    }
  };

  // Update exporter profile
  const updateProfile = async (data: Partial<CreateExporterData>): Promise<ExporterProfile> => {
    if (!walletAddress || !profile) {
      throw new Error('No profile to update');
    }

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('exporters')
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
      console.error('Error updating exporter profile:', err);
      throw err;
    }
  };

  // Check if exporter exists
  const exists = profile !== null;

  // Check if exporter is verified
  const isVerified = profile?.is_verified || false;

  useEffect(() => {
    fetchProfile();
  }, [walletAddress]);

  return {
    profile,
    loading,
    error,
    exists,
    isVerified,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
};