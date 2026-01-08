'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';

// PlatformAnalytics ABI
const PLATFORM_ANALYTICS_ABI = [
  {
    inputs: [],
    name: 'updatePlatformMetrics',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'updateInvestorPortfolio',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'updatePoolPerformance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalValueLocked',
    outputs: [{ name: 'tvl', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'getInvestorStats',
    outputs: [
      { name: 'totalInvested', type: 'uint256' },
      { name: 'totalReturns', type: 'uint256' },
      { name: 'activeInvestments', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPlatformStats',
    outputs: [
      { name: 'totalInvoices', type: 'uint256' },
      { name: 'totalPools', type: 'uint256' },
      { name: 'totalInvestors', type: 'uint256' },
      { name: 'totalVolume', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolPerformance',
    outputs: [
      { name: 'totalInvested', type: 'uint256' },
      { name: 'totalReturned', type: 'uint256' },
      { name: 'yieldPercentage', type: 'uint256' },
      { name: 'investorCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface InvestorStats {
  totalInvested: bigint;
  totalReturns: bigint;
  activeInvestments: bigint;
}

interface PlatformStats {
  totalInvoices: bigint;
  totalPools: bigint;
  totalInvestors: bigint;
  totalVolume: bigint;
}

interface PoolPerformance {
  totalInvested: bigint;
  totalReturned: bigint;
  yieldPercentage: bigint;
  investorCount: bigint;
}

interface UsePlatformAnalyticsReturn {
  // Update functions
  updatePlatformMetrics: () => Promise<void>;
  updateInvestorPortfolio: (investor: string) => Promise<void>;
  updatePoolPerformance: (poolId: bigint) => Promise<void>;
  
  // View functions
  getTotalValueLocked: () => Promise<bigint>;
  getInvestorStats: (investor: string) => Promise<InvestorStats>;
  getPlatformStats: () => Promise<PlatformStats>;
  getPoolPerformance: (poolId: bigint) => Promise<PoolPerformance>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function usePlatformAnalytics(): UsePlatformAnalyticsReturn {
  const { address, isConnected, client, mockUser } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.platformAnalytics;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('PlatformAnalytics operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlatformMetrics = useCallback(async (): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Updating platform metrics');
      return;
    });
  }, [handleContractCall]);

  const updateInvestorPortfolio = useCallback(async (investor: string): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Updating investor portfolio for', investor);
      return;
    });
  }, [handleContractCall]);

  const updatePoolPerformance = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Updating pool performance for', poolId);
      return;
    });
  }, [handleContractCall]);

  const getTotalValueLocked = useCallback(async (): Promise<bigint> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting total value locked');
      return 1000000n; // Mock TVL
    });
  }, [handleContractCall]);

  const getInvestorStats = useCallback(async (investor: string): Promise<InvestorStats> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting investor stats for', investor);
      return {
        totalInvested: 50000n,
        totalReturns: 2000n,
        activeInvestments: 3n,
      };
    });
  }, [handleContractCall]);

  const getPlatformStats = useCallback(async (): Promise<PlatformStats> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting platform stats');
      return {
        totalInvoices: 50n,
        totalPools: 10n,
        totalInvestors: 25n,
        totalVolume: 1000000n,
      };
    });
  }, [handleContractCall]);

  const getPoolPerformance = useCallback(async (poolId: bigint): Promise<PoolPerformance> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting pool performance for', poolId);
      return {
        totalInvested: 1000000n,
        totalReturned: 1040000n,
        yieldPercentage: 400n, // 4.00%
        investorCount: 15n,
      };
    });
  }, [handleContractCall]);

  return {
    updatePlatformMetrics,
    updateInvestorPortfolio,
    updatePoolPerformance,
    getTotalValueLocked,
    getInvestorStats,
    getPlatformStats,
    getPoolPerformance,
    isLoading,
    error,
  };
}