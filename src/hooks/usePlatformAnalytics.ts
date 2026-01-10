'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import { liskSepolia } from 'panna-sdk';
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction';
import { getContract } from 'thirdweb/contract';

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
  const { address, isConnected, client, account } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.legacyContracts.platformAnalytics;

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
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePlatformAnalytics - Updating platform metrics');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function updatePlatformMetrics()',
        params: [],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Platform metrics updated:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const updateInvestorPortfolio = useCallback(async (investor: string): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePlatformAnalytics - Updating investor portfolio:', investor);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function updateInvestorPortfolio(address investor)',
        params: [investor],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Investor portfolio updated:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const updatePoolPerformance = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePlatformAnalytics - Updating pool performance:', poolId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function updatePoolPerformance(uint256 poolId)',
        params: [poolId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Pool performance updated:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const getTotalValueLocked = useCallback(async (): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not initialized');
      
      try {
        console.log('🔍 usePlatformAnalytics - Getting total value locked');
        
        const result = await readContract({
          contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
          method: 'function getTotalValueLocked() view returns (uint256)',
          params: [],
        });
        
        console.log('✅ Total value locked:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ getTotalValueLocked failed, returning 0:', error);
        return BigInt(0);
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getInvestorStats = useCallback(async (investor: string): Promise<InvestorStats> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not initialized');
      
      try {
        console.log('🔍 usePlatformAnalytics - Getting investor stats:', investor);
        
        const result = await readContract({
          contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
          method: 'function getInvestorStats(address investor) view returns (uint256 totalInvested, uint256 totalReturns, uint256 activeInvestments)',
          params: [investor],
        });
        
        console.log('✅ Investor stats:', result);
        return {
          totalInvested: result[0],
          totalReturns: result[1],
          activeInvestments: result[2],
        };
      } catch (error) {
        console.warn('⚠️ getInvestorStats failed, returning zeros:', error);
        return {
          totalInvested: BigInt(0),
          totalReturns: BigInt(0),
          activeInvestments: BigInt(0),
        };
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getPlatformStats = useCallback(async (): Promise<PlatformStats> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not initialized');
      
      try {
        console.log('🔍 usePlatformAnalytics - Getting platform stats');
        
        const result = await readContract({
          contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
          method: 'function getPlatformStats() view returns (uint256 totalInvoices, uint256 totalPools, uint256 totalInvestors, uint256 totalVolume)',
          params: [],
        });
        
        console.log('✅ Platform stats:', result);
        return {
          totalInvoices: result[0],
          totalPools: result[1],
          totalInvestors: result[2],
          totalVolume: result[3],
        };
      } catch (error) {
        console.warn('⚠️ getPlatformStats failed, returning zeros:', error);
        return {
          totalInvoices: BigInt(0),
          totalPools: BigInt(0),
          totalInvestors: BigInt(0),
          totalVolume: BigInt(0),
        };
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getPoolPerformance = useCallback(async (poolId: bigint): Promise<PoolPerformance> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not initialized');
      
      try {
        console.log('🔍 usePlatformAnalytics - Getting pool performance:', poolId);
        
        const result = await readContract({
          contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
          method: 'function getPoolPerformance(uint256 poolId) view returns (uint256 totalInvested, uint256 totalReturned, uint256 yieldPercentage, uint256 investorCount)',
          params: [poolId],
        });
        
        console.log('✅ Pool performance:', result);
        return {
          totalInvested: result[0],
          totalReturned: result[1],
          yieldPercentage: result[2],
          investorCount: result[3],
        };
      } catch (error) {
        console.warn('⚠️ getPoolPerformance failed, returning zeros:', error);
        return {
          totalInvested: BigInt(0),
          totalReturned: BigInt(0),
          yieldPercentage: BigInt(0),
          investorCount: BigInt(0),
        };
      }
    });
  }, [client, contractAddress, handleContractCall]);

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