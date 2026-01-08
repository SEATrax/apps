'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import type { Pool } from '@/types';

// Pool Status enum
export const POOL_STATUS = {
  OPEN: 0,
  FUNDRAISING: 1,
  PARTIALLY_FUNDED: 2,
  FUNDED: 3,
  SETTLING: 4,
  COMPLETED: 5,
} as const;

// PoolNFT ABI
const POOL_NFT_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'startDate', type: 'uint256' },
      { name: 'endDate', type: 'uint256' },
      { name: 'invoiceIds', type: 'uint256[]' },
    ],
    name: 'createPool',
    outputs: [{ name: 'poolId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'finalizePool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPool',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'startDate', type: 'uint256' },
      { name: 'endDate', type: 'uint256' },
      { name: 'invoiceIds', type: 'uint256[]' },
      { name: 'totalLoanAmount', type: 'uint256' },
      { name: 'totalShippingAmount', type: 'uint256' },
      { name: 'amountInvested', type: 'uint256' },
      { name: 'amountDistributed', type: 'uint256' },
      { name: 'feePaid', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'status', type: 'uint8' }],
    name: 'getPoolsByStatus',
    outputs: [{ name: 'poolIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllOpenPools',
    outputs: [{ name: 'poolIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface UsePoolNFTReturn {
  // Pool management
  createPool: (
    name: string,
    startDate: bigint,
    endDate: bigint,
    invoiceIds: bigint[]
  ) => Promise<bigint>;
  finalizePool: (poolId: bigint) => Promise<void>;
  
  // View functions
  getPool: (poolId: bigint) => Promise<Pool | null>;
  getPoolsByStatus: (status: number) => Promise<bigint[]>;
  getAllOpenPools: () => Promise<bigint[]>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function usePoolNFT(): UsePoolNFTReturn {
  const { address, isConnected, client, mockUser } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.poolNFT;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('PoolNFT operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPool = useCallback(async (
    name: string,
    startDate: bigint,
    endDate: bigint,
    invoiceIds: bigint[]
  ): Promise<bigint> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Creating pool', { name, startDate, endDate, invoiceIds });
      
      // Return mock pool ID
      return BigInt(Math.floor(Math.random() * 1000) + 1);
    });
  }, [handleContractCall]);

  const finalizePool = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Finalizing pool', poolId);
      
      // Simulate successful operation
      return;
    });
  }, [handleContractCall]);

  const getPool = useCallback(async (poolId: bigint): Promise<Pool | null> => {
    return handleContractCall(async () => {
      // Mock implementation since Panna SDK client doesn't have readContract
      console.log('Mock: Getting pool', poolId);
      
      return {
        poolId,
        name: `Mock Pool ${poolId}`,
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        totalLoanAmount: 1000000n,
        totalInvested: 650000n,
        totalDistributed: 0n,
        status: 'OPEN' as Pool['status'],
        invoiceIds: [1n, 2n, 3n],
        createdAt: Date.now(),
      };
    });
  }, [handleContractCall]);

  const getPoolsByStatus = useCallback(async (status: number): Promise<bigint[]> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting pools by status:', status);
      if (status === 0) return [1n, 2n]; // Open pools
      if (status === 1) return [3n]; // Fundraising pools
      if (status === 2) return [4n]; // Partially funded pools
      return []; // Other statuses
    });
  }, [handleContractCall]);

  const getAllOpenPools = useCallback(async (): Promise<bigint[]> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting all open pools');
      return [1n, 2n];
    });
  }, [handleContractCall]);

  return {
    createPool,
    finalizePool,
    getPool,
    getPoolsByStatus,
    getAllOpenPools,
    isLoading,
    error,
  };
}