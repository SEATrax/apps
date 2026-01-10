'use client';

import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useAccessControl } from './useAccessControl';
import { useExporterProfile } from './useExporterProfile';
import { useInvestorProfile } from './useInvestorProfile';
import { getDefaultRouteForRole } from '@/config/routes';

export const useRoleBasedNavigation = () => {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { getUserRoles } = useAccessControl();
  const { profile: exporterProfile, loading: exporterLoading } = useExporterProfile();
  const { profile: investorProfile, loading: investorLoading } = useInvestorProfile();

  const isConnected = !!activeAccount;
  const isLoading = exporterLoading || investorLoading;

  const navigateToDefaultRoute = async () => {
    if (!isConnected || isLoading) return;

    try {
      // Get user roles from smart contract
      const roles = await getUserRoles(activeAccount.address);
      
      if (!roles) {
        // No roles assigned - redirect to role selection
        router.push('/');
        return;
      }

      const { hasAdminRole, hasExporterRole, hasInvestorRole } = roles;

      // If user has exporter role but no profile, redirect to onboarding
      if (hasExporterRole && !exporterProfile) {
        router.push('/onboarding/exporter');
        return;
      }

      // If user has investor role but no profile, redirect to onboarding
      if (hasInvestorRole && !investorProfile) {
        router.push('/onboarding/investor');
        return;
      }

      // Navigate to default route for role
      const defaultRoute = getDefaultRouteForRole(hasAdminRole, hasExporterRole, hasInvestorRole);
      router.push(defaultRoute);

    } catch (error) {
      console.error('Failed to get user roles:', error);
      router.push('/');
    }
  };

  const checkRoleAccess = async (requiredRole: 'admin' | 'exporter' | 'investor') => {
    if (!isConnected) return false;

    try {
      const roles = await getUserRoles(activeAccount.address);
      if (!roles) return false;

      const { hasAdminRole, hasExporterRole, hasInvestorRole } = roles;

      switch (requiredRole) {
        case 'admin':
          return hasAdminRole;
        case 'exporter':
          return hasExporterRole && !!exporterProfile;
        case 'investor':
          return hasInvestorRole && !!investorProfile;
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