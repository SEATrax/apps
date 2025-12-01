'use client';

import { useState, useCallback } from 'react';
import { usePanna } from './usePanna';

export interface InvestmentRecord {
  investor: string;
  poolId: bigint;
  amount: bigint;
  percentage: number;
  timestamp: number;
  returnsClaimed: boolean;
}

export function usePoolFunding() {
  const { client, account } = usePanna();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const investInPool = useCallback(async (
    poolId: bigint,
    amountETH: bigint
  ): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Investing in pool:', { poolId: poolId.toString(), amountETH: amountETH.toString() });
      
      // Validate minimum investment (1000 tokens as per business rules)
      const minInvestment = 1000n * 10n ** 18n;
      if (amountETH < minInvestment) {
        throw new Error('Minimum investment is 1000 ETH equivalent');
      }
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Return mock transaction hash
      return '0x' + Math.random().toString(16).substring(2, 66);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invest in pool';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const getInvestment = useCallback(async (
    poolId: bigint,
    investor: string
  ): Promise<InvestmentRecord | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Getting investment for:', { poolId: poolId.toString(), investor });
      
      // Mock investment record
      const investment: InvestmentRecord = {
        investor,
        poolId,
        amount: 5000n * 10n ** 18n, // 5,000 ETH
        percentage: 1000, // 10% (in basis points)
        timestamp: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60,
        returnsClaimed: false,
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      return investment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get investment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPoolInvestors = useCallback(async (poolId: bigint): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      // Mock investor addresses
      const investors = [
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      ];

      await new Promise(resolve => setTimeout(resolve, 1000));
      return investors;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pool investors';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvestorPools = useCallback(async (investor: string): Promise<bigint[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Getting pools for investor:', investor);
      
      // Mock pool IDs where investor has investments
      const poolIds = [1n, 2n];

      await new Promise(resolve => setTimeout(resolve, 1000));
      return poolIds;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get investor pools';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    setLoading(true);
    setError(null);

    try {
      // Mock funding percentage calculation
      // In real implementation, this would calculate (amountInvested / totalLoanAmount) * 100
      const mockPercentages: { [key: number]: number } = {
        1: 70, // 70% funded
        2: 100, // 100% funded
        3: 45, // 45% funded
      };

      const percentage = mockPercentages[Number(poolId)] || 0;

      await new Promise(resolve => setTimeout(resolve, 500));
      return percentage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get funding percentage';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const allocateFundsToInvoices = useCallback(async (poolId: bigint): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Allocating funds to invoices for pool:', poolId.toString());
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock transaction hash
      return '0x' + Math.random().toString(16).substring(2, 66);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to allocate funds';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const distributeProfits = useCallback(async (poolId: bigint): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Distributing profits for pool:', poolId.toString());
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Return mock transaction hash
      return '0x' + Math.random().toString(16).substring(2, 66);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute profits';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const claimInvestorReturns = useCallback(async (poolId: bigint): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Claiming returns for pool:', poolId.toString());
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return mock transaction hash
      return '0x' + Math.random().toString(16).substring(2, 66);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim returns';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const getInvestorReturns = useCallback(async (
    poolId: bigint,
    investor: string
  ): Promise<bigint> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Getting returns for:', { poolId: poolId.toString(), investor });
      
      // Mock returns calculation
      // In real implementation: investment + (4% yield * investment percentage)
      const mockReturns = 5200n * 10n ** 18n; // 5,200 ETH (original 5,000 + 4% yield)

      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockReturns;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get investor returns';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    investInPool,
    getInvestment,
    getPoolInvestors,
    getInvestorPools,
    getPoolFundingPercentage,
    allocateFundsToInvoices,
    distributeProfits,
    claimInvestorReturns,
    getInvestorReturns,
    loading,
    error,
  };
}