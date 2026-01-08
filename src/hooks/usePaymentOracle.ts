'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';

// PaymentOracle ABI
const PAYMENT_ORACLE_ABI = [
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'submitPaymentConfirmation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'markInvoicePaid',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'isInvoicePaid',
    outputs: [{ name: 'isPaid', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'getPaymentTimestamp',
    outputs: [{ name: 'timestamp', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface UsePaymentOracleReturn {
  // Payment functions
  submitPaymentConfirmation: (invoiceId: bigint) => Promise<void>;
  markInvoicePaid: (invoiceId: bigint) => Promise<void>;
  
  // View functions
  isInvoicePaid: (invoiceId: bigint) => Promise<boolean>;
  getPaymentTimestamp: (invoiceId: bigint) => Promise<bigint>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function usePaymentOracle(): UsePaymentOracleReturn {
  const { address, isConnected, client, mockUser } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.paymentOracle;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('PaymentOracle operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitPaymentConfirmation = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Submitting payment confirmation for invoice', invoiceId);
      return;
    });
  }, [handleContractCall]);

  const markInvoicePaid = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Marking invoice as paid', invoiceId);
      return;
    });
  }, [handleContractCall]);

  const isInvoicePaid = useCallback(async (invoiceId: bigint): Promise<boolean> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Checking if invoice is paid', invoiceId);
      return false; // Mock: invoice not paid
    });
  }, [handleContractCall]);

  const getPaymentTimestamp = useCallback(async (invoiceId: bigint): Promise<bigint> => {
    return handleContractCall(async () => {
      // Mock implementation
      console.log('Mock: Getting payment timestamp for invoice', invoiceId);
      return BigInt(Date.now()); // Mock timestamp
    });
  }, [handleContractCall]);

  return {
    submitPaymentConfirmation,
    markInvoicePaid,
    isInvoicePaid,
    getPaymentTimestamp,
    isLoading,
    error,
  };
}