'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import RoleSelection from '@/components/RoleSelection';

export default function HomePage() {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const router = useRouter();

  const handleGetStarted = () => {
    setShowRoleSelection(true);
  };

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  if (showRoleSelection) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
}
