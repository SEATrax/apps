'use client';

import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, SEATRAX_ABI } from '@/lib/contract';

/**
 * Hook for admin contract interactions using MetaMask
 * This is needed because admin pages use MetaMask while useSEATrax uses Panna SDK
 */
export function useAdminContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, SEATRAX_ABI, signer);
    
    return contract;
  }, []);

  const approveInvoice = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.approveInvoice(invoiceId);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to approve invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const rejectInvoice = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.rejectInvoice(invoiceId);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to reject invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const verifyExporter = useCallback(async (exporterAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.verifyExporter(exporterAddress);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to verify exporter';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const createPool = useCallback(async (
    name: string,
    invoiceIds: bigint[],
    startDate: bigint,
    endDate: bigint
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.createPool(name, invoiceIds, startDate, endDate);
      const receipt = await tx.wait();

      // Extract poolId from PoolCreated event
      let poolId: bigint | null = null;
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
            if (parsed && parsed.name === 'PoolCreated') {
              poolId = parsed.args[0]; // First arg is poolId
              break;
            }
          } catch (e) {
            // Skip logs that don't match our interface
            continue;
          }
        }
      }

      return { success: true, txHash: tx.hash, receipt, poolId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create pool';
      setError(errorMsg);
      return { success: false, error: errorMsg, poolId: null };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const markInvoicePaid = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.markInvoicePaid(invoiceId);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to mark invoice as paid';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const distributeProfits = useCallback(async (poolId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.distributeProfits(poolId);
      await tx.wait();

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to distribute profits';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    approveInvoice,
    rejectInvoice,
    verifyExporter,
    createPool,
    markInvoicePaid,
    distributeProfits,
    isLoading,
    error,
  };
}
