'use client';

import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useEffect } from 'react';

export default function OnboardingIndexPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    if (exporterLoading || investorLoading) {
      return;
    }

    // If user has exporter profile, go to exporter dashboard
    if (exporterProfile) {
      router.push('/exporter');
      return;
    }

    // If user has investor profile, go to investor dashboard
    if (investorProfile) {
      router.push('/investor');
      return;
    }

    // No profile found, redirect to role selection
    router.push('/select-role');
  }, [activeAccount, exporterProfile, investorProfile, exporterLoading, investorLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
        <p className="mt-4 text-gray-300">Redirecting you to the right place...</p>
      </div>
    </div>
  );
}