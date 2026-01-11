'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useSEATrax } from '@/hooks/useSEATrax';
import LandingPage from '@/components/LandingPage';
import RoleSelection from '@/components/RoleSelection';

export default function LoginPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();
  const { checkUserRoles, isLoading: rolesLoading } = useSEATrax();
  
  const [checking, setChecking] = useState(false);
  const [adminCheck, setAdminCheck] = useState(false);

  // Check if user has existing profile and redirect
  useEffect(() => {
    if (!isConnected || exporterLoading || investorLoading || rolesLoading) {
      return;
    }

    if (!adminCheck && activeAccount?.address) {
      setAdminCheck(true);
      checkUserRoles(activeAccount.address).then((roles) => {
        // If user has admin role, redirect to admin dashboard
        if (roles?.isAdmin) {
          router.push('/admin');
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
        
        // No profile found, go to role selection page
        router.push('/select-role');
      }).catch((error) => {
        console.error('Error checking admin role:', error);
        // Continue with regular flow if admin check fails
        setChecking(true);
        
        if (exporterProfile) {
          router.push('/exporter');
          return;
        }
        
        if (investorProfile) {
          router.push('/investor');
          return;
        }
        
        router.push('/select-role');
      });
    }
  }, [isConnected, exporterProfile, investorProfile, exporterLoading, investorLoading, rolesLoading, activeAccount, adminCheck, checkUserRoles, router]);

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
  if (checking || exporterLoading || investorLoading || rolesLoading || !adminCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  // This should never be reached as user will be redirected
  return null;
}