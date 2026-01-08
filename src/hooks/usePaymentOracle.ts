'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import { liskSepolia } from 'panna-sdk';
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction';
import { getContract } from 'thirdweb/contract';

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
  const { address, isConnected, client, account } = usePanna();
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
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePaymentOracle - Submitting payment confirmation:', invoiceId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function submitPaymentConfirmation(uint256 invoiceId)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Payment confirmation submitted:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const markInvoicePaid = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      console.log('🔧 usePaymentOracle - Marking invoice as paid:', invoiceId);
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function markInvoicePaid(uint256 invoiceId)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Invoice marked as paid:', result.transactionHash);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const isInvoicePaid = useCallback(async (invoiceId: bigint): Promise<boolean> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePaymentOracle - Checking if invoice is paid:', invoiceId);
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const isPaid = await readContract({
          contract,
          method: 'function isInvoicePaid(uint256 invoiceId) view returns (bool)',
          params: [invoiceId],
        });
        
        console.log('✅ Invoice paid status:', isPaid);
        return Boolean(isPaid);
        
      } catch (error) {
        console.error('❌ Error checking payment status, returning false');
        return false;
      }
    });
  }, [client, contractAddress, handleContractCall]);

  const getPaymentTimestamp = useCallback(async (invoiceId: bigint): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      console.log('🔧 usePaymentOracle - Getting payment timestamp:', invoiceId);
      
      try {
        const contract = getContract({
          client,
          chain: liskSepolia,
          address: contractAddress as `0x${string}`,
        });
        
        const timestamp = await readContract({
          contract,
          method: 'function getPaymentTimestamp(uint256 invoiceId) view returns (uint256)',
          params: [invoiceId],
        });
        
        const result = BigInt(timestamp);
        console.log('✅ Payment timestamp:', result.toString());
        return result;
        
      } catch (error) {
        console.error('❌ Error fetching payment timestamp, returning 0');
        return 0n;
      }
    });
  }, [client, contractAddress, handleContractCall]);

  return {
    submitPaymentConfirmation,
    markInvoicePaid,
    isInvoicePaid,
    getPaymentTimestamp,
    isLoading,
    error,
  };
}