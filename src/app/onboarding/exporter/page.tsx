'use client';

import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useEffect } from 'react';
import ExporterOnboarding from '@/components/ExporterOnboarding';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';

export default function ExporterOnboardingPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { profile, loading } = useExporterProfile();

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    if (!loading && profile) {
      router.push('/exporter');
      return;
    }
  }, [activeAccount, profile, loading, router]);

  const handleComplete = () => {
    router.push('/exporter');
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
        role="exporter" 
        step={1} 
        totalSteps={3}
        onBack={handleBack}
      />
      <div style={{ paddingTop: '0' }}>
        <ExporterOnboarding onComplete={handleComplete} onBack={handleBack} />
      </div>
    </>
  );
}
