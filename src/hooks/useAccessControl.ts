'use client';

import { useState, useCallback } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import { liskSepolia } from 'panna-sdk'
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction'
import { getContract } from 'thirdweb/contract'

// Role constants (keccak256 hashes)
export const ROLES = {
  ADMIN: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  EXPORTER: '0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357',
  INVESTOR: '0x2d41a8a8a5c8e7c8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8',
} as const;

// Contract ABI for AccessControl
const ACCESS_CONTROL_ABI = [
  // Admin functions
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'grantExporterRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'grantInvestorRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'getUserRoles',
    outputs: [
      { name: 'hasAdminRole', type: 'bool' },
      { name: 'hasExporterRole', type: 'bool' },
      { name: 'hasInvestorRole', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface UserRoles {
  hasAdminRole: boolean;
  hasExporterRole: boolean;
  hasInvestorRole: boolean;
}

interface UseAccessControlReturn {
  // Role management
  grantExporterRole: (account: string) => Promise<void>;
  grantInvestorRole: (account: string) => Promise<void>;
  
  // Role checking
  getUserRoles: (account: string) => Promise<UserRoles>;
  hasRole: (role: string, account: string) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function useAccessControl(): UseAccessControlReturn {
  const { address, isConnected, client, account } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.accessControl;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!client || !contractAddress) {
      throw new Error('Client not available or contract address not configured');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('AccessControl operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, contractAddress]);

  const grantExporterRole = useCallback(async (accountAddress: string): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function grantRole(bytes32 role, address account)',
        params: [ROLES.EXPORTER as `0x${string}`, accountAddress],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Exporter role granted to:', accountAddress);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const grantInvestorRole = useCallback(async (accountAddress: string): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function grantRole(bytes32 role, address account)',
        params: [ROLES.INVESTOR as `0x${string}`, accountAddress],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Investor role granted to:', accountAddress);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const getUserRoles = useCallback(async (account: string): Promise<UserRoles> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: contractAddress as `0x${string}`,
      });
      
      const [hasAdminRole, hasExporterRole, hasInvestorRole] = await Promise.all([
        readContract({ contract, method: 'function hasRole(bytes32 role, address account) view returns (bool)', params: [ROLES.ADMIN as `0x${string}`, account] }),
        readContract({ contract, method: 'function hasRole(bytes32 role, address account) view returns (bool)', params: [ROLES.EXPORTER as `0x${string}`, account] }),
        readContract({ contract, method: 'function hasRole(bytes32 role, address account) view returns (bool)', params: [ROLES.INVESTOR as `0x${string}`, account] })
      ]);
      
      return {
        hasAdminRole: Boolean(hasAdminRole),
        hasExporterRole: Boolean(hasExporterRole),
        hasInvestorRole: Boolean(hasInvestorRole)
      };
    });
  }, [client, contractAddress, handleContractCall]);

  const hasRole = useCallback(async (role: string, account: string): Promise<boolean> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: contractAddress as `0x${string}`,
      });
      
      const result = await readContract({
        contract,
        method: 'function hasRole(bytes32 role, address account) view returns (bool)',
        params: [role as `0x${string}`, account]
      });
      
      return Boolean(result);
    });
  }, [client, contractAddress, handleContractCall]);

  return {
    grantExporterRole,
    grantInvestorRole,
    getUserRoles,
    hasRole,
    isLoading,
    error,
  };
}