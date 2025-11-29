'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import LandingPage from '@/components/LandingPage';
import RoleSelection from '@/components/RoleSelection';

export default function LoginPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  const handleGetStarted = () => {
    // This will be called after wallet connection
    // For now, just show role selection
  };

  // If not connected, show landing page with wallet connection
  // If connected, show role selection
  if (!isConnected) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return <RoleSelection onRoleSelect={handleRoleSelect} />;
}