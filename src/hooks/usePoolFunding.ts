'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';

// PoolFundingManager ABI
const POOL_FUNDING_MANAGER_ABI = [
  {
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'investInPool',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'allocateFundsToInvoices',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'distributeProfits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'claimInvestorReturns',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolFundingPercentage',
    outputs: [{ name: 'percentage', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'investor', type: 'address' },
    ],
    name: 'getInvestorReturns',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'investor', type: 'address' },
    ],
    name: 'getInvestorAmount',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolInvestors',
    outputs: [{ name: 'investors', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface Investment {
  investor: string;
  poolId: bigint;
  amount: bigint;
  timestamp: number;
  expectedReturn: bigint;
  claimed: boolean;
}

interface UsePoolFundingReturn {
  // Investment functions
  investInPool: (poolId: bigint, amount: bigint) => Promise<void>;
  claimInvestorReturns: (poolId: bigint) => Promise<void>;
  
  // Admin functions
  allocateFundsToInvoices: (poolId: bigint) => Promise<void>;
  distributeProfits: (poolId: bigint) => Promise<void>;
  
  // View functions
  getPoolFundingPercentage: (poolId: bigint) => Promise<number>;
  getInvestorReturns: (poolId: bigint, investor: string) => Promise<bigint>;
  getInvestorAmount: (poolId: bigint, investor: string) => Promise<bigint>;
  getPoolInvestors: (poolId: bigint) => Promise<string[]>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function usePoolFunding(): UsePoolFundingReturn {
  const { address, isConnected, client, mockUser } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.poolFundingManager;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('PoolFunding operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const investInPool = useCallback(async (poolId: bigint, amount: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Investing in pool', { poolId, amount: amount.toString() });
      
      // Simulate successful investment
      return;
    });
  }, [handleContractCall]);

  const claimInvestorReturns = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Claiming investor returns from pool', poolId);
      
      // Simulate successful claim
      return;
    });
  }, [handleContractCall]);

  const allocateFundsToInvoices = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Allocating funds to invoices for pool', poolId);
      
      // Simulate successful allocation
      return;
    });
  }, [handleContractCall]);

  const distributeProfits = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Distributing profits for pool', poolId);
      
      // Simulate successful distribution
      return;
    });
  }, [handleContractCall]);

  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting funding percentage for pool', poolId);
      return 65; // 65% funded
    });
  }, [handleContractCall]);

  const getInvestorReturns = useCallback(async (poolId: bigint, investor: string): Promise<bigint> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting investor returns', { poolId, investor });
      return 2000n; // Mock returns
    });
  }, [handleContractCall]);

  const getInvestorAmount = useCallback(async (poolId: bigint, investor: string): Promise<bigint> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting investor amount', { poolId, investor });
      return 50000n; // Mock investment amount
    });
  }, [handleContractCall]);

  const getPoolInvestors = useCallback(async (poolId: bigint): Promise<string[]> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting pool investors', poolId);
      return ['0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321']; // Mock investors
    });
  }, [handleContractCall]);

  return {
    investInPool,
    claimInvestorReturns,
    allocateFundsToInvoices,
    distributeProfits,
    getPoolFundingPercentage,
    getInvestorReturns,
    getInvestorAmount,
    getPoolInvestors,
    isLoading,
    error,
  };
}