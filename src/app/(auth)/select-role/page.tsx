'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import RoleSelection from '@/components/RoleSelection';

export default function SelectRolePage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();
  
  const [checking, setChecking] = useState(false);

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  // Check if user has existing profile and redirect
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    
    if (exporterLoading || investorLoading) {
      return;
    }

    setChecking(true);
    
    // If user has exporter profile, go to exporter dashboard
    if (exporterProfile) {
      router.push('/exporter');
      return;
    }
    
    // If user has investor profile, go to investor dashboard  
    if (investorProfile) {
      router.push('/investor');
      return;
    }
    
    // No profile found, user can select role
    setChecking(false);
  }, [isConnected, exporterProfile, investorProfile, exporterLoading, investorLoading, router]);

  // Show loading while checking connection or profiles
  if (!isConnected || checking || exporterLoading || investorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Show role selection for new users
  return <RoleSelection onRoleSelect={handleRoleSelect} />;
}