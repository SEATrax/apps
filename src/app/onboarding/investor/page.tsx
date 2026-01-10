'use client';

import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useEffect } from 'react';
import InvestorOnboarding from '@/components/InvestorOnboarding';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';

export default function InvestorOnboardingPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { profile, loading } = useInvestorProfile();

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    if (!loading && profile) {
      router.push('/investor');
      return;
    }
  }, [activeAccount, profile, loading, router]);

  const handleComplete = () => {
    router.push('/investor');
  };

  const handleBack = () => {
    router.push('/select-role');
  };

  if (!activeAccount) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingHeader 
        role="investor" 
        step={1} 
        totalSteps={2}
        onBack={handleBack}
      />
      <div style={{ paddingTop: '0' }}>
        <InvestorOnboarding onComplete={handleComplete} onBack={handleBack} />
      </div>
    </>
  );
}