'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleSelection from '@/components/RoleSelection';

export default function LoginPage() {
  const router = useRouter();

  const handleRoleSelect = (role: 'exporter' | 'investor') => {
    router.push(`/onboarding/${role}`);
  };

  return <RoleSelection onRoleSelect={handleRoleSelect} />;
}