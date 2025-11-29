'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import type { Invoice, Pool, Investment, InvoiceStatus, PoolStatus } from '@/types';

interface UseContractReturn {
  // Exporter Functions
  registerExporter: () => Promise<void>;
  createInvoice: (
    invoiceValue: bigint,
    loanAmount: bigint,
    invoiceDate: number,
    dueDate: number,
    ipfsHash: string
  ) => Promise<bigint>;
  withdrawFunds: (invoiceId: bigint) => Promise<void>;
  getExporterInvoices: (exporter: string) => Promise<bigint[]>;
  
  // Investor Functions
  registerInvestor: () => Promise<void>;
  invest: (poolId: bigint, amount: bigint) => Promise<void>;
  claimReturns: (poolId: bigint) => Promise<void>;
  getInvestorPools: (investor: string) => Promise<bigint[]>;
  
  // Admin Functions
  verifyExporter: (exporter: string) => Promise<void>;
  approveInvoice: (invoiceId: bigint) => Promise<void>;
  rejectInvoice: (invoiceId: bigint) => Promise<void>;
  createPool: (
    name: string,
    invoiceIds: bigint[],
    startDate: number,
    endDate: number
  ) => Promise<bigint>;
  markInvoicePaid: (invoiceId: bigint) => Promise<void>;
  distributeProfits: (poolId: bigint) => Promise<void>;
  
  // View Functions
  getInvoice: (invoiceId: bigint) => Promise<Invoice | null>;
  getPool: (poolId: bigint) => Promise<Pool | null>;
  getInvestment: (poolId: bigint, investor: string) => Promise<Investment | null>;
  canWithdraw: (invoiceId: bigint) => Promise<{ canWithdraw: boolean; amount: bigint }>;
  getPoolFundingPercentage: (poolId: bigint) => Promise<number>;
  getAllOpenPools: () => Promise<bigint[]>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

const INVOICE_STATUS_MAP: Record<number, InvoiceStatus> = {
  0: 'PENDING',
  1: 'APPROVED',
  2: 'IN_POOL',
  3: 'FUNDED',
  4: 'WITHDRAWN',
  5: 'PAID',
  6: 'COMPLETED',
  7: 'REJECTED',
};

const POOL_STATUS_MAP: Record<number, PoolStatus> = {
  0: 'OPEN',
  1: 'FUNDED',
  2: 'COMPLETED',
  3: 'CANCELLED',
};

export function useContract(): UseContractReturn {
  const { readContract, writeContract } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCall = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Contract operation failed');
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============== EXPORTER ==============
  const registerExporter = useCallback(async (): Promise<void> => {
    return handleCall(async () => {
      await writeContract('registerExporter', []);
    });
  }, [writeContract, handleCall]);

  const createInvoice = useCallback(async (
    invoiceValue: bigint,
    loanAmount: bigint,
    invoiceDate: number,
    dueDate: number,
    ipfsHash: string
  ): Promise<bigint> => {
    return handleCall(async () => {
      await writeContract('createInvoice', [invoiceValue, loanAmount, invoiceDate, dueDate, ipfsHash]);
      return 0n;
    });
  }, [writeContract, handleCall]);

  const withdrawFunds = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('withdrawFunds', [invoiceId]);
    });
  }, [writeContract, handleCall]);

  const getExporterInvoices = useCallback(async (exporter: string): Promise<bigint[]> => {
    return handleCall(() => readContract<bigint[]>('getExporterInvoices', [exporter]));
  }, [readContract, handleCall]);

  // ============== INVESTOR ==============
  const registerInvestor = useCallback(async (): Promise<void> => {
    return handleCall(async () => {
      await writeContract('registerInvestor', []);
    });
  }, [writeContract, handleCall]);

  const invest = useCallback(async (poolId: bigint, amount: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('invest', [poolId], amount);
    });
  }, [writeContract, handleCall]);

  const claimReturns = useCallback(async (poolId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('claimReturns', [poolId]);
    });
  }, [writeContract, handleCall]);

  const getInvestorPools = useCallback(async (investor: string): Promise<bigint[]> => {
    return handleCall(() => readContract<bigint[]>('getInvestorPools', [investor]));
  }, [readContract, handleCall]);

  // ============== ADMIN ==============
  const verifyExporter = useCallback(async (exporter: string): Promise<void> => {
    return handleCall(async () => {
      await writeContract('verifyExporter', [exporter]);
    });
  }, [writeContract, handleCall]);

  const approveInvoice = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('approveInvoice', [invoiceId]);
    });
  }, [writeContract, handleCall]);

  const rejectInvoice = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('rejectInvoice', [invoiceId]);
    });
  }, [writeContract, handleCall]);

  const createPool = useCallback(async (
    name: string,
    invoiceIds: bigint[],
    startDate: number,
    endDate: number
  ): Promise<bigint> => {
    return handleCall(async () => {
      await writeContract('createPool', [name, invoiceIds, startDate, endDate]);
      return 0n;
    });
  }, [writeContract, handleCall]);

  const markInvoicePaid = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('markInvoicePaid', [invoiceId]);
    });
  }, [writeContract, handleCall]);

  const distributeProfits = useCallback(async (poolId: bigint): Promise<void> => {
    return handleCall(async () => {
      await writeContract('distributeProfits', [poolId]);
    });
  }, [writeContract, handleCall]);

  // ============== VIEW ==============
  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice | null> => {
    return handleCall(async () => {
      const r = await readContract<{
        tokenId: bigint; exporter: string; invoiceValue: bigint; loanAmount: bigint;
        fundedAmount: bigint; withdrawnAmount: bigint; status: number; poolId: bigint;
        invoiceDate: bigint; dueDate: bigint; createdAt: bigint; ipfsHash: string;
      }>('getInvoice', [invoiceId]);
      return {
        tokenId: r.tokenId, exporter: r.exporter, invoiceValue: r.invoiceValue,
        loanAmount: r.loanAmount, fundedAmount: r.fundedAmount, withdrawnAmount: r.withdrawnAmount,
        status: INVOICE_STATUS_MAP[r.status] || 'PENDING', poolId: r.poolId,
        invoiceDate: Number(r.invoiceDate), dueDate: Number(r.dueDate),
        createdAt: Number(r.createdAt), ipfsHash: r.ipfsHash,
      };
    });
  }, [readContract, handleCall]);

  const getPool = useCallback(async (poolId: bigint): Promise<Pool | null> => {
    return handleCall(async () => {
      const r = await readContract<{
        poolId: bigint; name: string; startDate: bigint; endDate: bigint;
        totalLoanAmount: bigint; totalInvested: bigint; totalDistributed: bigint;
        status: number; invoiceIds: bigint[]; createdAt: bigint;
      }>('getPool', [poolId]);
      return {
        poolId: r.poolId, name: r.name, startDate: Number(r.startDate), endDate: Number(r.endDate),
        totalLoanAmount: r.totalLoanAmount, totalInvested: r.totalInvested,
        totalDistributed: r.totalDistributed, status: POOL_STATUS_MAP[r.status] || 'OPEN',
        invoiceIds: r.invoiceIds, createdAt: Number(r.createdAt),
      };
    });
  }, [readContract, handleCall]);

  const getInvestment = useCallback(async (poolId: bigint, investor: string): Promise<Investment | null> => {
    return handleCall(async () => {
      const r = await readContract<{
        investor: string; poolId: bigint; amount: bigint; percentage: bigint;
        timestamp: bigint; returnsClaimed: boolean;
      }>('getInvestment', [poolId, investor]);
      return {
        investor: r.investor, poolId: r.poolId, amount: r.amount,
        percentage: Number(r.percentage), timestamp: Number(r.timestamp),
        returnsClaimed: r.returnsClaimed,
      };
    });
  }, [readContract, handleCall]);

  const canWithdraw = useCallback(async (invoiceId: bigint) => {
    return handleCall(async () => {
      const [can, amount] = await readContract<[boolean, bigint]>('canWithdraw', [invoiceId]);
      return { canWithdraw: can, amount };
    });
  }, [readContract, handleCall]);

  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    return handleCall(async () => {
      const p = await readContract<bigint>('getPoolFundingPercentage', [poolId]);
      return Number(p);
    });
  }, [readContract, handleCall]);

  const getAllOpenPools = useCallback(async (): Promise<bigint[]> => {
    return handleCall(() => readContract<bigint[]>('getAllOpenPools', []));
  }, [readContract, handleCall]);

  return {
    registerExporter, createInvoice, withdrawFunds, getExporterInvoices,
    registerInvestor, invest, claimReturns, getInvestorPools,
    verifyExporter, approveInvoice, rejectInvoice, createPool, markInvoicePaid, distributeProfits,
    getInvoice, getPool, getInvestment, canWithdraw, getPoolFundingPercentage, getAllOpenPools,
    isLoading, error,
  };
}
