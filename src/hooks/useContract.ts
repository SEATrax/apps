'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import type { InvoiceNFT, PoolNFT, Investment, InvoiceMetadata } from '@/types';
import { INVOICE_STATUS, POOL_STATUS } from '@/lib/contract';

interface UseContractReturn {
  // Invoice Functions
  createInvoice: (ipfsHash: string, fundingAmount: bigint, dueDate: number) => Promise<bigint>;
  getInvoice: (tokenId: bigint) => Promise<InvoiceNFT | null>;
  getInvoicesByOwner: (owner: string) => Promise<bigint[]>;
  approveInvoice: (tokenId: bigint) => Promise<void>;
  rejectInvoice: (tokenId: bigint, reason: string) => Promise<void>;
  withdrawFunding: (tokenId: bigint) => Promise<void>;
  repayInvoice: (tokenId: bigint, amount: bigint) => Promise<void>;
  
  // Pool Functions
  createPool: (name: string, invoiceTokenIds: bigint[], maturityDate: number) => Promise<bigint>;
  getPool: (poolId: bigint) => Promise<PoolNFT | null>;
  invest: (poolId: bigint, amount: bigint) => Promise<void>;
  claimReturns: (poolId: bigint) => Promise<void>;
  getInvestmentsByInvestor: (investor: string) => Promise<Investment[]>;
  
  // Utility Functions
  getFundingPercentage: (tokenId: bigint) => Promise<number>;
  hasRole: (role: string, account: string) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function useContract(): UseContractReturn {
  const { readContract, writeContract, address } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Contract operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============== INVOICE FUNCTIONS ==============

  const createInvoice = useCallback(async (
    ipfsHash: string,
    fundingAmount: bigint,
    dueDate: number
  ): Promise<bigint> => {
    return handleContractCall(async () => {
      const txHash = await writeContract('createInvoice', [ipfsHash, fundingAmount, dueDate]);
      console.log('Invoice created, tx:', txHash);
      // In production, parse the event logs to get the tokenId
      return 0n; // Placeholder
    });
  }, [writeContract, handleContractCall]);

  const getInvoice = useCallback(async (tokenId: bigint): Promise<InvoiceNFT | null> => {
    return handleContractCall(async () => {
      const result = await readContract<[string, string, bigint, bigint, number, bigint, bigint]>(
        'getInvoice',
        [tokenId]
      );
      
      const [owner, ipfsHash, fundingAmount, currentFunding, status, createdAt, dueDate] = result;
      
      const statusMap: Record<number, InvoiceNFT['status']> = {
        [INVOICE_STATUS.PENDING]: 'pending',
        [INVOICE_STATUS.APPROVED]: 'approved',
        [INVOICE_STATUS.FUNDING]: 'funding',
        [INVOICE_STATUS.FUNDED]: 'funded',
        [INVOICE_STATUS.COMPLETED]: 'completed',
        [INVOICE_STATUS.DEFAULTED]: 'defaulted',
        [INVOICE_STATUS.REJECTED]: 'rejected',
      };

      return {
        tokenId,
        owner,
        ipfsHash,
        metadata: {} as InvoiceMetadata, // Fetch from IPFS separately
        status: statusMap[status] || 'pending',
        fundingAmount,
        currentFunding,
        fundingPercentage: fundingAmount > 0n 
          ? Number((currentFunding * 100n) / fundingAmount) 
          : 0,
        createdAt: Number(createdAt),
        dueDate: Number(dueDate),
      };
    });
  }, [readContract, handleContractCall]);

  const getInvoicesByOwner = useCallback(async (owner: string): Promise<bigint[]> => {
    return handleContractCall(async () => {
      return await readContract<bigint[]>('getInvoicesByOwner', [owner]);
    });
  }, [readContract, handleContractCall]);

  const approveInvoice = useCallback(async (tokenId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('approveInvoice', [tokenId]);
    });
  }, [writeContract, handleContractCall]);

  const rejectInvoice = useCallback(async (tokenId: bigint, reason: string): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('rejectInvoice', [tokenId, reason]);
    });
  }, [writeContract, handleContractCall]);

  const withdrawFunding = useCallback(async (tokenId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('withdrawFunding', [tokenId]);
    });
  }, [writeContract, handleContractCall]);

  const repayInvoice = useCallback(async (tokenId: bigint, amount: bigint): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('repayInvoice', [tokenId], amount);
    });
  }, [writeContract, handleContractCall]);

  // ============== POOL FUNCTIONS ==============

  const createPool = useCallback(async (
    name: string,
    invoiceTokenIds: bigint[],
    maturityDate: number
  ): Promise<bigint> => {
    return handleContractCall(async () => {
      const txHash = await writeContract('createPool', [name, invoiceTokenIds, maturityDate]);
      console.log('Pool created, tx:', txHash);
      return 0n; // Placeholder - parse event logs for actual poolId
    });
  }, [writeContract, handleContractCall]);

  const getPool = useCallback(async (poolId: bigint): Promise<PoolNFT | null> => {
    return handleContractCall(async () => {
      const result = await readContract<[string, string, bigint, bigint, number, bigint]>(
        'getPool',
        [poolId]
      );
      
      const [admin, name, totalValue, totalInvested, status, maturityDate] = result;
      
      const statusMap: Record<number, PoolNFT['status']> = {
        [POOL_STATUS.OPEN]: 'open',
        [POOL_STATUS.CLOSED]: 'closed',
        [POOL_STATUS.MATURED]: 'matured',
        [POOL_STATUS.LIQUIDATING]: 'liquidating',
      };

      return {
        poolId,
        name,
        description: '',
        admin,
        invoiceTokenIds: [],
        totalValue,
        totalInvested,
        investorCount: 0,
        status: statusMap[status] || 'open',
        targetYield: 4,
        platformFee: 1,
        createdAt: 0,
        maturityDate: Number(maturityDate),
      };
    });
  }, [readContract, handleContractCall]);

  const invest = useCallback(async (poolId: bigint, amount: bigint): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('invest', [poolId], amount);
    });
  }, [writeContract, handleContractCall]);

  const claimReturns = useCallback(async (poolId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      await writeContract('claimReturns', [poolId]);
    });
  }, [writeContract, handleContractCall]);

  const getInvestmentsByInvestor = useCallback(async (investor: string): Promise<Investment[]> => {
    return handleContractCall(async () => {
      const poolIds = await readContract<bigint[]>('getInvestmentsByInvestor', [investor]);
      // In production, fetch full investment details for each poolId
      return poolIds.map((poolId) => ({
        investor,
        poolId,
        amount: 0n,
        timestamp: 0,
        expectedReturn: 0n,
        claimed: false,
      }));
    });
  }, [readContract, handleContractCall]);

  // ============== UTILITY FUNCTIONS ==============

  const getFundingPercentage = useCallback(async (tokenId: bigint): Promise<number> => {
    return handleContractCall(async () => {
      const percentage = await readContract<bigint>('getFundingPercentage', [tokenId]);
      return Number(percentage);
    });
  }, [readContract, handleContractCall]);

  const hasRole = useCallback(async (role: string, account: string): Promise<boolean> => {
    return handleContractCall(async () => {
      return await readContract<boolean>('hasRole', [role, account]);
    });
  }, [readContract, handleContractCall]);

  return {
    // Invoice Functions
    createInvoice,
    getInvoice,
    getInvoicesByOwner,
    approveInvoice,
    rejectInvoice,
    withdrawFunding,
    repayInvoice,
    
    // Pool Functions
    createPool,
    getPool,
    invest,
    claimReturns,
    getInvestmentsByInvestor,
    
    // Utility Functions
    getFundingPercentage,
    hasRole,
    
    // State
    isLoading,
    error,
  };
}
