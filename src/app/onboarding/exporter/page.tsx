'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ExporterOnboarding from '@/components/ExporterOnboarding';

export default function ExporterOnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    // After successful registration, redirect to exporter dashboard
    router.push('/exporter');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ExporterOnboarding 
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
