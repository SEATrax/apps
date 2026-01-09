import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';

export interface UseAuthFlowOptions {
  requireRole?: boolean; // If true, redirect to /select-role when no profile found
  allowRoleSelection?: boolean; // If true, allow access to /select-role even without profile
}

export function useAuthFlow(options: UseAuthFlowOptions = {}) {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();

  const hasProfile = !!(exporterProfile || investorProfile);
  const isLoading = exporterLoading || investorLoading;

  useEffect(() => {
    // If wallet not connected, redirect to home
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Wait for profile loading to complete
    if (isLoading) {
      return;
    }

    // If user has profile but accessing role selection, redirect to dashboard
    if (hasProfile && options.allowRoleSelection === false) {
      if (exporterProfile) {
        router.push('/exporter');
        return;
      }
      if (investorProfile) {
        router.push('/investor');
        return;
      }
    }

    // If requireRole is true and no profile found, redirect to role selection
    if (options.requireRole && !hasProfile) {
      router.push('/select-role');
      return;
    }
  }, [isConnected, hasProfile, isLoading, exporterProfile, investorProfile, router, options]);

  return {
    isConnected,
    hasProfile,
    isLoading,
    exporterProfile,
    investorProfile,
    shouldShowContent: isConnected && (options.allowRoleSelection || hasProfile || !options.requireRole)
  };
}