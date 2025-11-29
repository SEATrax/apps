'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvestorOnboarding from '@/components/InvestorOnboarding';

export default function InvestorOnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // After successful registration, redirect to investor dashboard
    router.push('/investor');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <InvestorOnboarding 
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}