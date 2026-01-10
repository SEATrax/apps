'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import LandingPage from '@/components/LandingPage';
import RoleSelection from '@/components/RoleSelection';

export default function HomePage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const router = useRouter();
  
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();

  // Reset role selection when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setShowRoleSelection(false);
    }
  }, [isConnected]);

  // Auto-redirect authenticated users with existing profiles
  useEffect(() => {
    if (!isConnected || exporterLoading || investorLoading) {
      return;
    }
    
    // Redirect to respective dashboard if profile exists
    if (exporterProfile) {
      router.push('/exporter');
      return;
    }
    
    if (investorProfile) {
      router.push('/investor');
      return;
    }
    
    // Connected but no profile - show role selection
    if (isConnected && !showRoleSelection) {
      setShowRoleSelection(true);
    }
  }, [isConnected, exporterProfile, investorProfile, exporterLoading, investorLoading, router, showRoleSelection]);

  const handleGetStarted = () => {
    if (isConnected) {
      // Already connected, show role selection
      setShowRoleSelection(true);
    } else {
      // Will trigger wallet connection via Panna SDK
      // useEffect will handle redirect after connection
    }
  };

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  // Show loading during profile checks
  if (isConnected && (exporterLoading || investorLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (showRoleSelection) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}
