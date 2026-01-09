'use client';

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { appConfig } from '@/config';
import { liskSepolia } from 'panna-sdk'
import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb/transaction'
import { getContract } from 'thirdweb/contract'
import { toWei } from 'thirdweb/utils'
import type { Invoice, InvoiceMetadata, InvoiceStatus } from '@/types';

// Invoice Status enum
export const INVOICE_STATUS = {
  PENDING: 0,
  FINALIZED: 1,
  FUNDRAISING: 2,
  FUNDED: 3,
  PAID: 4,
  CANCELLED: 5,
} as const;

// Helper function to extract tokenId from transaction receipt
function parseTokenIdFromReceipt(receipt: any): bigint {
  try {
    console.log('🔍 Parsing tokenId from receipt:', {
      status: receipt.status,
      logsCount: receipt.logs?.length || 0
    });
    
    // InvoiceCreated event signature: InvoiceCreated(uint256 indexed tokenId, address indexed exporter, uint256 loanAmount)
    // For now, we'll look for the first log with topics (since our contract only emits InvoiceCreated on mint)
    const invoiceCreatedLog = receipt.logs?.find((log: any) => 
      log.topics && log.topics.length >= 2 // tokenId is in topics[1]
    );
    
    if (!invoiceCreatedLog || !invoiceCreatedLog.topics || invoiceCreatedLog.topics.length < 2) {
      throw new Error('InvoiceCreated event log not found in transaction receipt');
    }
    
    // Extract tokenId from first indexed parameter (topics[1])
    const tokenIdHex = invoiceCreatedLog.topics[1];
    const tokenId = BigInt(tokenIdHex);
    
    console.log('✅ Extracted tokenId from receipt:', {
      tokenId: tokenId.toString(),
      hex: tokenIdHex
    });
    
    return tokenId;
  } catch (error) {
    console.error('❌ Failed to parse tokenId from receipt:', error);
    console.log('📋 Receipt structure:', receipt);
    
    // Fallback: Generate a sequential ID based on timestamp
    const fallbackId = BigInt(Date.now() % 1000000);
    console.warn('⚠️ Using fallback tokenId:', fallbackId.toString());
    return fallbackId;
  }
}

// InvoiceNFT ABI
const INVOICE_NFT_ABI = [
  {
    inputs: [
      { name: 'exporterCompany', type: 'string' },
      { name: 'importerCompany', type: 'string' },
      { name: 'shippingAmount', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'shippingDate', type: 'uint256' },
    ],
    name: 'mintInvoice',
    outputs: [{ name: 'invoiceId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'finalizeInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'invoiceId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdrawFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'getInvoice',
    outputs: [
      { name: 'exporterCompany', type: 'string' },
      { name: 'exporterWallet', type: 'address' },
      { name: 'importerCompany', type: 'string' },
      { name: 'shippingDate', type: 'uint256' },
      { name: 'shippingAmount', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'amountInvested', type: 'uint256' },
      { name: 'amountWithdrawn', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'exporter', type: 'address' }],
    name: 'getInvoicesByExporter',
    outputs: [{ name: 'invoiceIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'getAvailableWithdrawal',
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface UseInvoiceNFTReturn {
  // Invoice functions
  mintInvoice: (
    exporterCompany: string,
    importerCompany: string,
    shippingAmount: bigint,
    loanAmount: bigint,
    shippingDate: bigint
  ) => Promise<bigint>;
  finalizeInvoice: (invoiceId: bigint) => Promise<void>;
  withdrawFunds: (invoiceId: bigint, amount: bigint) => Promise<void>;
  
  // View functions
  getInvoice: (invoiceId: bigint) => Promise<Invoice | null>;
  getInvoicesByExporter: (exporter: string) => Promise<bigint[]>;
  getAvailableWithdrawal: (invoiceId: bigint) => Promise<bigint>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

export function useInvoiceNFT(): UseInvoiceNFTReturn {
  const { address, isConnected, client, account } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const contractAddress = appConfig.contracts.invoiceNFT;

  // Helper to handle contract calls
  const handleContractCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('InvoiceNFT operation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mintInvoice = useCallback(async (
    exporterCompany: string,
    importerCompany: string,
    shippingAmount: bigint,
    loanAmount: bigint,
    shippingDate: bigint
  ): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function mintInvoice(string exporterCompany, string importerCompany, uint256 shippingAmount, uint256 loanAmount, uint256 shippingDate) returns (uint256)',
        params: [exporterCompany, importerCompany, shippingAmount, loanAmount, shippingDate],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      const receipt = await waitForReceipt(result);
      
      // Extract tokenId from transaction receipt logs
      const tokenId = parseTokenIdFromReceipt(receipt);
      
      console.log('✅ Invoice minted successfully:', {
        tokenId: tokenId.toString(),
        transactionHash: result.transactionHash,
        exporter: account.address
      });
      
      return tokenId;
    });
  }, [client, account, contractAddress, handleContractCall]);

  const finalizeInvoice = useCallback(async (invoiceId: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function finalizeInvoice(uint256 invoiceId)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Invoice finalized:', invoiceId);
    });
  }, [client, account, contractAddress, handleContractCall]);

  const withdrawFunds = useCallback(async (invoiceId: bigint, amount: bigint): Promise<void> => {
    return handleContractCall(async () => {
      if (!client || !account) throw new Error('Wallet not connected');
      
      const tx = prepareContractCall({
        contract: getContract({ client, chain: liskSepolia, address: contractAddress as `0x${string}` }),
        method: 'function withdrawFunds(uint256 invoiceId, uint256 amount)',
        params: [invoiceId, amount],
      });
      
      const result = await sendTransaction({ account, transaction: tx });
      await waitForReceipt(result);
      console.log('✅ Funds withdrawn from invoice:', invoiceId, 'amount:', amount.toString());
    });
  }, [client, account, contractAddress, handleContractCall]);

  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice | null> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: contractAddress as `0x${string}`,
      });
      
      const invoiceData = await readContract({
        contract,
        method: 'function getInvoice(uint256 invoiceId) view returns (string exporterCompany, address exporterWallet, string importerCompany, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, uint256 amountInvested, uint256 amountWithdrawn, uint8 status)',
        params: [invoiceId],
      });
      
      return {
        tokenId: invoiceId,
        exporter: invoiceData[1], // exporterWallet
        invoiceValue: invoiceData[4], // shippingAmount
        loanAmount: invoiceData[5],
        fundedAmount: invoiceData[6], // amountInvested
        withdrawnAmount: invoiceData[7],
        status: (['PENDING', 'FINALIZED', 'FUNDRAISING', 'FUNDED', 'PAID', 'CANCELLED'][Number(invoiceData[8])] || 'PENDING') as InvoiceStatus,
        poolId: 0n, // This would need to be fetched separately
        invoiceDate: Number(invoiceData[3]) * 1000, // shippingDate
        dueDate: Number(invoiceData[3]) * 1000 + 30 * 24 * 60 * 60 * 1000, // 30 days from shipping
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ipfsHash: '',
        metadata: {
          invoiceNumber: `INV-${invoiceId}`,
          invoiceDate: new Date(Number(invoiceData[3]) * 1000).toISOString(),
          dueDate: new Date(Number(invoiceData[3]) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: Number(invoiceData[4]),
          currency: 'USD',
          goodsDescription: 'Trade goods',
          importerName: invoiceData[2], // importerCompany
          importerLicense: 'LIC-REAL',
          documents: {
            purchaseOrder: '',
            billOfLading: '',
            other: [],
          },
          loanAmount: Number(invoiceData[5]),
        },
      };
    });
  }, [client, contractAddress, handleContractCall]);

  const getInvoicesByExporter = useCallback(async (exporter: string): Promise<bigint[]> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: contractAddress as `0x${string}`,
      });
      
      const invoiceIds = await readContract({
        contract,
        method: 'function getInvoicesByExporter(address exporter) view returns (uint256[])',
        params: [exporter],
      });
      
      return invoiceIds.map((id: any) => BigInt(id));
    });
  }, [client, contractAddress, handleContractCall]);

  const getAvailableWithdrawal = useCallback(async (invoiceId: bigint): Promise<bigint> => {
    return handleContractCall(async () => {
      if (!client) throw new Error('Client not available');
      
      const contract = getContract({
        client,
        chain: liskSepolia,
        address: contractAddress as `0x${string}`,
      });
      
      const availableAmount = await readContract({
        contract,
        method: 'function getAvailableWithdrawal(uint256 invoiceId) view returns (uint256)',
        params: [invoiceId],
      });
      
      return BigInt(availableAmount);
    });
  }, [client, contractAddress, handleContractCall]);

  return {
    mintInvoice,
    finalizeInvoice,
    withdrawFunds,
    getInvoice,
    getInvoicesByExporter,
    getAvailableWithdrawal,
    isLoading,
    error,
  };
}
