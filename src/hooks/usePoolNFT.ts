'use client';

import { useState, useCallback } from 'react';
import { usePanna } from './usePanna';

export interface Pool {
  poolId: bigint;
  name: string;
  startDate: number;
  endDate: number;
  totalLoanAmount: bigint;
  totalShippingAmount: bigint;
  amountInvested: bigint;
  amountDistributed: bigint;
  feePaid: bigint;
  status: number;
  invoiceIds: bigint[];
  createdAt: number;
}

export interface Investment {
  investor: string;
  poolId: bigint;
  amount: bigint;
  percentage: number;
  timestamp: number;
  returnsClaimed: boolean;
}

export function usePoolNFT() {
  const { client, account } = usePanna();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPool = useCallback(async (
    name: string,
    invoiceIds: bigint[],
    endDate: number
  ): Promise<bigint> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating pool with data:', { name, invoiceIds, endDate });
      
      // Simulate contract call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock poolId
      const poolId = BigInt(Date.now());
      
      return poolId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pool';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const getPool = useCallback(async (poolId: bigint): Promise<Pool> => {
    setLoading(true);
    setError(null);

    try {
      // Mock pool data - in real implementation, this would read from contract
      const pool: Pool = {
        poolId,
        name: 'Asia Pacific Trade Pool',
        startDate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
        endDate: Math.floor(Date.now() / 1000) + 23 * 24 * 60 * 60,
        totalLoanAmount: 50000n * 10n ** 18n, // 50,000 ETH equivalent
        totalShippingAmount: 70000n * 10n ** 18n, // 70,000 ETH equivalent
        amountInvested: 35000n * 10n ** 18n, // 35,000 ETH (70% funded)
        amountDistributed: 30000n * 10n ** 18n,
        feePaid: 0n,
        status: 1, // FUNDRAISING
        invoiceIds: [1n, 2n, 3n],
        createdAt: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      return pool;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pool';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPoolsByStatus = useCallback(async (status: number): Promise<bigint[]> => {
    setLoading(true);
    setError(null);

    try {
      // Mock pool IDs - in real implementation, this would read from contract
      const poolIds = status === 0 ? [1n, 2n] : [3n, 4n]; // OPEN pools vs others
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return poolIds;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pools by status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllPools = useCallback(async (): Promise<Pool[]> => {
    setLoading(true);
    setError(null);

    try {
      // Mock pools data
      const pools: Pool[] = [
        {
          poolId: 1n,
          name: 'Asia Pacific Trade Pool',
          startDate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
          endDate: Math.floor(Date.now() / 1000) + 23 * 24 * 60 * 60,
          totalLoanAmount: 50000n * 10n ** 18n,
          totalShippingAmount: 70000n * 10n ** 18n,
          amountInvested: 35000n * 10n ** 18n,
          amountDistributed: 30000n * 10n ** 18n,
          feePaid: 0n,
          status: 1, // FUNDRAISING
          invoiceIds: [1n, 2n, 3n],
          createdAt: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
        },
        {
          poolId: 2n,
          name: 'European Export Fund',
          startDate: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
          endDate: Math.floor(Date.now() / 1000) + 16 * 24 * 60 * 60,
          totalLoanAmount: 75000n * 10n ** 18n,
          totalShippingAmount: 100000n * 10n ** 18n,
          amountInvested: 75000n * 10n ** 18n, // 100% funded
          amountDistributed: 75000n * 10n ** 18n,
          feePaid: 750n * 10n ** 18n, // 1% platform fee
          status: 2, // FUNDED
          invoiceIds: [4n, 5n, 6n, 7n],
          createdAt: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000));
      return pools;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get all pools';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPool,
    getPool,
    getPoolsByStatus,
    getAllPools,
    loading,
    error,
  };
}