'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import LandingPage from '@/components/LandingPage';
import RoleSelection from '@/components/RoleSelection';

export default function LoginPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();
  
  const [checking, setChecking] = useState(false);

  // Check if user has existing profile and redirect
  useEffect(() => {
    if (!isConnected || exporterLoading || investorLoading) {
      return;
    }

    setChecking(true);
    
    // If user has exporter profile (verified or not), go to exporter dashboard
    if (exporterProfile) {
      router.push('/exporter');
      return;
    }
    
    // If user has investor profile, go to investor dashboard
    if (investorProfile) {
      router.push('/investor');
      return;
    }
    
    // No profile found, show role selection
    setChecking(false);
  }, [isConnected, exporterProfile, investorProfile, exporterLoading, investorLoading, router]);

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  const handleGetStarted = () => {
    // After wallet connection, check for profiles again
    // The useEffect will handle the redirect
  };

  // If not connected, show landing page with wallet connection
  if (!isConnected) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }
  
  // If checking for existing profiles, show loading
  if (checking || exporterLoading || investorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // Show role selection for new users
  return <RoleSelection onRoleSelect={handleRoleSelect} />;
}