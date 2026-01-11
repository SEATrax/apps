'use client';

import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from './useSEATrax';
import { useExporterProfile } from './useExporterProfile';
import { useInvestorProfile } from './useInvestorProfile';
import { getDefaultRouteForRole } from '@/config/routes';

export const useRoleBasedNavigation = () => {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { checkUserRoles } = useSEATrax();
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();

  const isConnected = !!activeAccount;
  const isLoading = exporterLoading || investorLoading;

  const navigateToDefaultRoute = async () => {
    if (!isConnected || isLoading) return;

    try {
      // Get user roles from smart contract
      const roles = await checkUserRoles(activeAccount.address);
      
      if (!roles) {
        // No roles assigned - redirect to role selection
        router.push('/');
        return;
      }

      const { isAdmin, isExporter, isInvestor } = roles;

      // If user has exporter role but no profile, redirect to onboarding
      if (isExporter && !exporterProfile) {
        router.push('/onboarding/exporter');
        return;
      }

      // If user has investor role but no profile, redirect to onboarding
      if (isInvestor && !investorProfile) {
        router.push('/onboarding/investor');
        return;
      }

      // Navigate to default route for role
      const defaultRoute = getDefaultRouteForRole(isAdmin, isExporter, isInvestor);
      router.push(defaultRoute);

    } catch (error) {
      console.error('Failed to get user roles:', error);
      router.push('/');
    }
  };

  const checkRoleAccess = async (requiredRole: 'admin' | 'exporter' | 'investor') => {
    if (!isConnected) return false;

    try {
      const roles = await checkUserRoles(activeAccount.address);
      if (!roles) return false;

      const { isAdmin, isExporter, isInvestor } = roles;

      switch (requiredRole) {
        case 'admin':
          return isAdmin;
        case 'exporter':
          return isExporter && !!exporterProfile;
        case 'investor':
          return isInvestor && !!investorProfile;
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to check role access:', error);
      return false;
    }
  };

  const getUserProfile = () => {
    if (exporterProfile) {
      return {
        type: 'exporter' as const,
        profile: exporterProfile
      };
    }
    
    if (investorProfile) {
      return {
        type: 'investor' as const,
        profile: investorProfile
      };
    }

    return null;
  };

  return {
    isConnected,
    isLoading,
    navigateToDefaultRoute,
    checkRoleAccess,
    getUserProfile,
    exporterProfile,
    investorProfile
  };
};