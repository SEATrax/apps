'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from './useSEATrax';
import { useDevMode } from '@/contexts/DevModeContext';
import { appConfig } from '@/config';

interface RoleCheckResult {
  isAdmin: boolean;
  isExporter: boolean;
  isInvestor: boolean;
  hasAnyRole: boolean;
  loading: boolean;
}

/**
 * Hook to check user roles with dev mode support
 * In dev mode, roles are determined by devRole setting
 * In production mode, roles are fetched from smart contract
 */
export function useRoleCheck(): RoleCheckResult {
  const activeAccount = useActiveAccount();
  const { checkUserRoles } = useSEATrax();
  const { isDevMode, devRole } = useDevMode();
  
  const [roles, setRoles] = useState({
    isAdmin: false,
    isExporter: false,
    isInvestor: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRoles() {
      console.log('🔍 useRoleCheck - Starting check:', {
        hasActiveAccount: !!activeAccount,
        address: activeAccount?.address,
        isDevMode,
        devRole,
      });

      // CHECK DEV MODE FIRST (before checking activeAccount)
      if (isDevMode) {
        console.log('🔧 Dev Mode Active - Using dev role:', devRole);
        setRoles({
          isAdmin: devRole === 'admin',
          isExporter: devRole === 'exporter',
          isInvestor: devRole === 'investor',
        });
        setLoading(false);
        return;
      }

      // Now check if we have an active account for production mode
      if (!activeAccount?.address) {
        console.log('⚠️ useRoleCheck - No active account (and not in dev mode)');
        setRoles({ isAdmin: false, isExporter: false, isInvestor: false });
        setLoading(false);
        return;
      }

      // Production mode: check smart contract and env
      try {
        setLoading(true);

        // Check if address is in ADMIN_ADDRESSES env
        const adminAddresses = appConfig.platform?.adminAddresses || [];
        const isEnvAdmin = adminAddresses.some(
          (addr) => addr.toLowerCase() === activeAccount.address.toLowerCase()
        );

        console.log('🔍 Checking admin access:', {
          userAddress: activeAccount.address,
          adminAddresses,
          isEnvAdmin,
        });

        if (isEnvAdmin) {
          console.log('✅ Admin access granted via .env');
          setRoles({ isAdmin: true, isExporter: false, isInvestor: false });
          setLoading(false);
          return;
        }

        // Fetch roles from smart contract
        console.log('📡 Fetching roles from smart contract...');
        const contractRoles = await checkUserRoles(activeAccount.address);
        console.log('📋 Contract roles:', contractRoles);
        
        setRoles({
          isAdmin: contractRoles.isAdmin,
          isExporter: contractRoles.isExporter,
          isInvestor: contractRoles.isInvestor,
        });
      } catch (error) {
        console.error('❌ Error checking roles:', error);
        setRoles({ isAdmin: false, isExporter: false, isInvestor: false });
      } finally {
        setLoading(false);
      }
    }

    checkRoles();
  }, [activeAccount?.address, checkUserRoles, isDevMode, devRole]);

  return {
    ...roles,
    hasAnyRole: roles.isAdmin || roles.isExporter || roles.isInvestor,
    loading,
  };
}
