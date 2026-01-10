'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import { liskSepolia } from 'panna-sdk';
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction';
import { getContract } from 'thirdweb/contract';

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
  const { address, isConnected, client, account } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.legacyContracts.poolFundingManager;

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
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePoolFunding - Investing in pool:', { poolId, amount: amount.toString() });
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function investInPool(uint256 poolId, uint256 amount)',
        params: [poolId, amount],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Investment completed:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const claimInvestorReturns = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePoolFunding - Claiming investor returns:', poolId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function claimInvestorReturns(uint256 poolId)',
        params: [poolId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Returns claimed:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const allocateFundsToInvoices = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePoolFunding - Allocating funds to invoices:', poolId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function allocateFundsToInvoices(uint256 poolId)',
        params: [poolId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Funds allocated:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const distributeProfits = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePoolFunding - Distributing profits:', poolId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function distributeProfits(uint256 poolId)',
        params: [poolId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Profits distributed:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePoolFunding - Getting funding percentage:', poolId);
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const percentage = await readContract({
          contract,
          method: 'function getPoolFundingPercentage(uint256 poolId) view returns (uint256)',
          params: [poolId],
        });
        
        const result = Number(percentage);
        console.log('✅ Funding percentage fetched:', result + '%');
        return result;
        
      } catch (error) {
        console.error('❌ Error fetching funding percentage, returning 0');
        return 0;
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getInvestorReturns = useCallback(async (poolId: bigint, investor: string): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePoolFunding - Getting investor returns:', { poolId, investor });
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const returns = await readContract({
          contract,
          method: 'function getInvestorReturns(uint256 poolId, address investor) view returns (uint256)',
          params: [poolId, investor],
        });
        
        const result = BigInt(returns);
        console.log('✅ Investor returns fetched:', result.toString());
        return result;
        
      } catch (error) {
        console.error('❌ Error fetching investor returns, returning 0');
        return 0n;
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getInvestorAmount = useCallback(async (poolId: bigint, investor: string): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePoolFunding - Getting investor amount:', { poolId, investor });
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const amount = await readContract({
          contract,
          method: 'function getInvestorAmount(uint256 poolId, address investor) view returns (uint256)',
          params: [poolId, investor],
        });
        
        const result = BigInt(amount);
        console.log('✅ Investor amount fetched:', result.toString());
        return result;
        
      } catch (error) {
        console.error('❌ Error fetching investor amount, returning 0');
        return 0n;
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getPoolInvestors = useCallback(async (poolId: bigint): Promise<string[]> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePoolFunding - Getting pool investors:', poolId);
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const investors = await readContract({
          contract,
          method: 'function getPoolInvestors(uint256 poolId) view returns (address[])',
          params: [poolId],
        });
        
        const result = Array.isArray(investors) ? investors : [];
        console.log('✅ Pool investors fetched:', result.length, 'investors');
        return result;
        
      } catch (error) {
        console.error('❌ Error fetching pool investors, returning empty array');
        return [];
      }
    });
  }, [client, contractAddress, handleContractCall]);

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