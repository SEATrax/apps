/**
 * useSEATrax Hook
 * 
 * Unified hook for interacting with the SEATrax smart contract.
 * Consolidates functionality from 6 specialized hooks into one.
 * 
 * Uses Thirdweb SDK (via Panna) for transaction handling.
 * 
 * Replaces:
 * - useAccessControl
 * - useInvoiceNFT
 * - usePoolNFT
 * - usePoolFunding
 * - usePaymentOracle
 * - usePlatformAnalytics (moved to off-chain)
 */

import { useCallback, useState } from 'react';
import { usePanna } from './usePanna';
import { CONTRACT_ADDRESS, SEATRAX_ABI, ROLES, type Invoice, type Pool, type Investment, type PoolStatus, type InvoiceStatus } from '@/lib/contract';
import { liskSepolia } from 'panna-sdk';
import { prepareContractCall, sendTransaction, readContract, waitForReceipt, prepareEvent, getContractEvents } from 'thirdweb';
import { getContract } from 'thirdweb';
import { toWei } from 'thirdweb/utils';

export function useSEATrax() {
  const { address, account, client } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============== HELPER FUNCTIONS ==============

  // Helper to check if wallet and network are ready
  const checkWalletReady = () => {
    if (!account) {
      throw new Error('❌ Wallet not connected. Please connect your wallet first.');
    }
    if (!client) {
      throw new Error('❌ Wallet client not initialized. Please reconnect your wallet.');
    }
    if (!address) {
      throw new Error('❌ Wallet address not found. Please reconnect your wallet.');
    }
    return true;
  };

  // Helper to extract error message from various error types
  const extractErrorMessage = (err: any, defaultMsg: string): string => {
    // Check for various error message locations
    if (typeof err === 'string') return err;
    if (err?.reason) return err.reason;
    if (err?.message) return err.message;
    if (err?.error?.message) return err.error.message;
    if (err?.data?.message) return err.data.message;
    
    // Try to stringify if it's an object
    try {
      const errStr = JSON.stringify(err);
      if (errStr !== '{}' && errStr !== 'null') {
        return `${defaultMsg}: ${errStr}`;
      }
    } catch {}
    
    // Last resort
    return defaultMsg;
  };

  // ============== CONTRACT INSTANCE ==============
  
  const getContractInstance = useCallback(() => {
    if (!client) {
      throw new Error('Client not initialized');
    }
    
    return getContract({
      client,
      chain: liskSepolia,
      address: CONTRACT_ADDRESS,
    });
  }, [client]);

  // ============== REGISTRATION FUNCTIONS (Self-Service) ==============

  /**
   * Register current user as exporter (self-registration)
   * Replaces: useAccessControl.grantExporterRole (admin-granted)
   */
  const registerExporter = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Pre-flight checks
      checkWalletReady();
      
      console.log('🚀 Starting exporter registration...');
      console.log('📍 Wallet address:', address);
      console.log('🔗 Contract address:', CONTRACT_ADDRESS);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function registerExporter()',
        params: [],
      });
      
      console.log('📤 Sending transaction...');
      const result = await sendTransaction({
        account: account!,
        transaction: tx,
      });
      
      console.log('⏳ Waiting for confirmation...');
      console.log('📝 Transaction hash:', result.transactionHash);
      await waitForReceipt(result);
      
      console.log('✅ Registration successful!');
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      console.error('Error type:', typeof err);
      console.error('Error details:', {
        message: err?.message,
        reason: err?.reason,
        code: err?.code,
        data: err?.data
      });
      
      const errorMsg = extractErrorMessage(err, 'Failed to register as exporter on blockchain');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, address, getContractInstance]);

  /**
   * Register current user as investor (self-registration)
   * Replaces: useAccessControl.grantInvestorRole (admin-granted)
   */
  const registerInvestor = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Pre-flight checks
      checkWalletReady();
      
      console.log('🚀 Starting investor registration...');
      console.log('📍 Wallet address:', address);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function registerInvestor()',
        params: [],
      });
      
      console.log('📤 Sending transaction...');
      const result = await sendTransaction({
        account: account!,
        transaction: tx,
      });
      
      console.log('⏳ Waiting for confirmation...');
      console.log('📝 Transaction hash:', result.transactionHash);
      await waitForReceipt(result);
      
      console.log('✅ Registration successful!');
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      const errorMsg = extractErrorMessage(err, 'Failed to register as investor on blockchain');
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, address, getContractInstance]);

  // ============== INVOICE FUNCTIONS (Exporter) ==============

  /**
   * Create a new invoice NFT
   * Replaces: useInvoiceNFT.mintInvoice
   * Breaking Change: Adds importerEmail and ipfsHash parameters
   */
  const createInvoice = useCallback(async (
    exporterCompany: string,
    importerCompany: string,
    importerEmail: string,
    shippingDate: number,
    shippingAmount: bigint,
    loanAmount: bigint,
    ipfsHash: string
  ): Promise<{ success: true; txHash: string; invoiceId: bigint | null } | { success: false; error: string }> => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function createInvoice(string exporterCompany, string importerCompany, string importerEmail, uint256 shippingDate, uint256 shippingAmount, uint256 loanAmount, string ipfsHash) returns (uint256)',
        params: [exporterCompany, importerCompany, importerEmail, BigInt(shippingDate), shippingAmount, loanAmount, ipfsHash],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      const receipt = await waitForReceipt(result);
      
      // Parse InvoiceCreated event to get tokenId with retry logic
      let invoiceId: bigint | null = null;
      
      const invoiceCreatedEvent = prepareEvent({
        signature: 'event InvoiceCreated(uint256 indexed tokenId, address indexed exporter, uint256 loanAmount)'
      });
      
      // Retry logic: Try 3 times with 1-second delay
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const events = await getContractEvents({
            contract: getContractInstance(),
            events: [invoiceCreatedEvent],
            fromBlock: receipt.blockNumber > 0n ? receipt.blockNumber - 1n : receipt.blockNumber,
            toBlock: receipt.blockNumber,
          });
          
          if (events.length > 0 && events[0].args) {
            invoiceId = events[0].args.tokenId;
            console.log(`✅ Invoice created with ID: ${invoiceId.toString()} (attempt ${attempt})`);
            break; // Success - exit retry loop
          }
          
          if (attempt < 3) {
            console.log(`⏳ Attempt ${attempt}: No event yet, retrying in 1s...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (eventErr) {
          console.warn(`⚠️ Attempt ${attempt} failed:`, eventErr);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Fallback: Query exporter's invoices to get the last one
      if (!invoiceId) {
        try {
          console.log('🔍 Fallback: Querying exporter invoices...');
          const exporterInvoices = await readContract({
            contract: getContractInstance(),
            method: 'function getExporterInvoices(address exporter) view returns (uint256[])',
            params: [account.address],
          });
          
          if (exporterInvoices && exporterInvoices.length > 0) {
            invoiceId = exporterInvoices[exporterInvoices.length - 1];
            console.log(`✅ Fallback success: Found invoice ID ${invoiceId.toString()}`);
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback query failed:', fallbackErr);
        }
      }
      
      return { success: true, txHash: result.transactionHash, invoiceId };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to create invoice';
      setError(errorMsg);
      console.error('Create invoice error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Withdraw funds from invoice (ALL available funds)
   * Replaces: useInvoiceNFT.withdrawFunds
   * Breaking Change: No amount parameter - withdraws ALL available
   */
  const withdrawFunds = useCallback(async (invoiceId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function withdrawFunds(uint256 invoiceId)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to withdraw funds';
      setError(errorMsg);
      console.error('Withdraw error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Get invoice details by ID
   * Replaces: useInvoiceNFT.getInvoice
   */
  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice | null> => {
    if (!client) return null;
    
    try {
      const contract = getContractInstance();
      
      // Use struct format with explicit component names
      const result: any = await readContract({
        contract,
        method: {
          name: 'getInvoice',
          type: 'function',
          stateMutability: 'view',
          inputs: [
            {
              name: '_invoiceId',
              type: 'uint256',
            }
          ],
          outputs: [
            {
              name: '',
              type: 'tuple',
              components: [
                { name: 'tokenId', type: 'uint256' },
                { name: 'exporter', type: 'address' },
                { name: 'exporterCompany', type: 'string' },
                { name: 'importerCompany', type: 'string' },
                { name: 'importerEmail', type: 'string' },
                { name: 'shippingDate', type: 'uint256' },
                { name: 'shippingAmount', type: 'uint256' },
                { name: 'loanAmount', type: 'uint256' },
                { name: 'amountInvested', type: 'uint256' },
                { name: 'amountWithdrawn', type: 'uint256' },
                { name: 'status', type: 'uint8' },
                { name: 'poolId', type: 'uint256' },
                { name: 'ipfsHash', type: 'string' },
                { name: 'createdAt', type: 'uint256' },
              ]
            }
          ]
        },
        params: [invoiceId],
      });
      
      console.log('🔍 getInvoice result type:', typeof result, 'isArray:', Array.isArray(result));
      
      // Access properties with proper undefined checks (don't use || for BigInt as 0n is falsy)
      const invoice = {
        tokenId: result.tokenId ?? result[0],
        exporter: result.exporter ?? result[1],
        exporterCompany: result.exporterCompany ?? result[2],
        importerCompany: result.importerCompany ?? result[3],
        importerEmail: result.importerEmail ?? result[4],
        shippingDate: result.shippingDate ?? result[5],
        shippingAmount: result.shippingAmount ?? result[6],
        loanAmount: result.loanAmount ?? result[7],
        amountInvested: result.amountInvested ?? result[8],
        amountWithdrawn: result.amountWithdrawn ?? result[9],
        status: (result.status ?? result[10]) as InvoiceStatus,
        poolId: result.poolId ?? result[11],
        ipfsHash: result.ipfsHash ?? result[12],
        createdAt: result.createdAt ?? result[13],
      };
      
      console.log('✅ Parsed invoice:', {
        tokenId: invoice.tokenId?.toString(),
        amountInvested: invoice.amountInvested?.toString(),
        amountWithdrawn: invoice.amountWithdrawn?.toString(),
      });
      
      return invoice;
    } catch (err: any) {
      console.error('Failed to get invoice:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        invoiceId: invoiceId.toString(),
      });
      return null;
    }
  }, [client, getContractInstance]);

  /**
   * Get all invoices for an exporter
   * Replaces: useInvoiceNFT.getInvoicesByExporter (name change only)
   */
  const getExporterInvoices = useCallback(async (exporter: string): Promise<bigint[]> => {
    if (!client) return [];
    
    try {
      const contract = getContractInstance();
      const invoiceIds = await readContract({
        contract,
        method: 'function getExporterInvoices(address exporter) view returns (uint256[])',
        params: [exporter],
      });
      return invoiceIds as bigint[];
    } catch (err: any) {
      console.error('Failed to get exporter invoices:', err);
      return [];
    }
  }, [client, getContractInstance]);

  /**
   * Check if invoice can be withdrawn and get withdrawable amount
   * Replaces: useInvoiceNFT.getAvailableWithdrawal (name change only)
   */
  const canWithdraw = useCallback(async (invoiceId: bigint): Promise<{ canWithdraw: boolean; amount: bigint }> => {
    if (!client) return { canWithdraw: false, amount: 0n };
    
    try {
      const contract = getContractInstance();
      const result = await readContract({
        contract,
        method: 'function canWithdraw(uint256 invoiceId) view returns (bool, uint256)',
        params: [invoiceId],
      });
      return { canWithdraw: result[0] as boolean, amount: result[1] as bigint };
    } catch (err: any) {
      console.error('Failed to check withdrawal:', err);
      return { canWithdraw: false, amount: 0n };
    }
  }, [client, getContractInstance]);

  // ============== POOL FUNCTIONS (Admin) ==============

  /**
   * Create a new funding pool
   * Replaces: usePoolNFT.createPool
   * Breaking Change: Added startDate and endDate parameters
   */
  const createPool = useCallback(async (
    name: string,
    invoiceIds: bigint[],
    startDate: number,
    endDate: number
  ) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function createPool(string,uint256[],uint256,uint256)',
        params: [name, invoiceIds, BigInt(startDate), BigInt(endDate)],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      const receipt = await waitForReceipt(result);
      
      // Extract poolId from event logs if needed
      let poolId = null;
      // Note: Event extraction would need additional logic with Thirdweb
      // For now, UI can fetch latest pool or use getAllOpenPools
      
      return { success: true, txHash: result.transactionHash, poolId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create pool';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Get pool details by ID
   * Replaces: usePoolNFT.getPool
   */
  const getPool = useCallback(async (poolId: bigint): Promise<Pool | null> => {
    if (!client) return null;

    try {
      const contract = getContractInstance();
      const result: any = await readContract({
        contract,
        method: 'function getPool(uint256) view returns (uint256,string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint8,uint256[],uint256)',
        params: [poolId],
      });
      
      const isArray = Array.isArray(result);
      
      return {
        poolId: isArray ? result[0] : (result.poolId ?? result[0]),
        name: isArray ? result[1] : (result.name ?? result[1]),
        startDate: isArray ? result[2] : (result.startDate ?? result[2]),
        endDate: isArray ? result[3] : (result.endDate ?? result[3]),
        totalLoanAmount: isArray ? result[4] : (result.totalLoanAmount ?? result[4]),
        totalShippingAmount: isArray ? result[5] : (result.totalShippingAmount ?? result[5]),
        amountInvested: isArray ? result[6] : (result.amountInvested ?? result[6]),
        amountDistributed: isArray ? result[7] : (result.amountDistributed ?? result[7]),
        feePaid: isArray ? result[8] : (result.feePaid ?? result[8]),
        status: (isArray ? result[9] : (result.status ?? result[9])) as PoolStatus,
        invoiceIds: isArray ? [...result[10]] : (result.invoiceIds ?? result[10]),
        createdAt: isArray ? result[11] : (result.createdAt ?? result[11]),
      };
    } catch (err: any) {
      console.error('Failed to get pool:', err);
      return null;
    }
  }, [client, getContractInstance]);

  /**
   * Get all open pools
   * Replaces: usePoolNFT.getPoolsByStatus (OPEN)
   * Breaking Change: Only returns OPEN pools, not arbitrary status
   */
  const getAllOpenPools = useCallback(async (): Promise<bigint[]> => {
    if (!client) return [];

    try {
      const contract = getContractInstance();
      const poolIds = await readContract({
        contract,
        method: 'function getAllOpenPools() view returns (uint256[])',
        params: [],
      });
      return poolIds as bigint[];
    } catch (err: any) {
      console.error('Failed to get open pools:', err);
      return [];
    }
  }, [client, getContractInstance]);

  /**
   * Get all pending invoices (awaiting approval)
   */
  const getAllPendingInvoices = useCallback(async (): Promise<bigint[]> => {
    if (!client) return [];

    try {
      const contract = getContractInstance();
      const invoiceIds = await readContract({
        contract,
        method: 'function getAllPendingInvoices() view returns (uint256[])',
        params: [],
      });
      return invoiceIds as bigint[];
    } catch (err: any) {
      console.error('Failed to get pending invoices:', err);
      return [];
    }
  }, [client, getContractInstance]);

  /**
   * Get all approved invoices (ready for pool)
   */
  const getAllApprovedInvoices = useCallback(async (): Promise<bigint[]> => {
    if (!client) return [];

    try {
      const contract = getContractInstance();
      const invoiceIds = await readContract({
        contract,
        method: 'function getAllApprovedInvoices() view returns (uint256[])',
        params: [],
      });
      return invoiceIds as bigint[];
    } catch (err: any) {
      console.error('Failed to get approved invoices:', err);
      return [];
    }
  }, [client, getContractInstance]);

  /**
   * Get pool funding percentage
   * Replaces: usePoolFunding.getPoolFundingPercentage
   */
  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    if (!client) return 0;

    try {
      const contract = getContractInstance();
      const percentage = await readContract({
        contract,
        method: 'function getPoolFundingPercentage(uint256) view returns (uint256)',
        params: [poolId],
      });
      return Number(percentage);
    } catch (err: any) {
      console.error('Failed to get pool funding percentage:', err);
      return 0;
    }
  }, [client, getContractInstance]);

  /**
   * Get all investors in a pool
   */
  const getPoolInvestors = useCallback(async (poolId: bigint): Promise<string[]> => {
    if (!client) return [];

    try {
      const contract = getContractInstance();
      const investors = await readContract({
        contract,
        method: 'function getPoolInvestors(uint256) view returns (address[])',
        params: [poolId],
      });
      return investors as string[];
    } catch (err: any) {
      console.error('Failed to get pool investors:', err);
      return [];
    }
  }, [client, getContractInstance]);

  // ============== INVESTMENT FUNCTIONS (Investor) ==============

  /**
   * Invest in a pool
   * Replaces: usePoolFunding.investInPool
   * Breaking Change: Amount passed via transaction value, not parameter
   */
  const invest = useCallback(async (poolId: bigint, amount: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function invest(uint256)',
        params: [poolId],
        value: amount, // ETH amount to send
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to invest';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Claim returns from a completed pool
   * Replaces: usePoolFunding.claimInvestorReturns (name change only)
   */
  const claimReturns = useCallback(async (poolId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function claimReturns(uint256)',
        params: [poolId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to claim returns';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Get investment details for a pool and investor
   * Replaces: usePoolFunding.getInvestorPoolInfo
   */
  const getInvestment = useCallback(async (poolId: bigint, investor: string): Promise<Investment | null> => {
    if (!client) return null;

    try {
      const contract = getContractInstance();
      const result: any = await readContract({
        contract,
        method: 'function getInvestment(uint256,address) view returns (address,uint256,uint256,uint256,uint256,bool)',
        params: [poolId, investor],
      });
      
      const isArray = Array.isArray(result);
      
      return {
        investor: isArray ? result[0] : (result.investor ?? result[0]),
        poolId: isArray ? result[1] : (result.poolId ?? result[1]),
        amount: isArray ? result[2] : (result.amount ?? result[2]),
        percentage: isArray ? result[3] : (result.percentage ?? result[3]),
        timestamp: isArray ? result[4] : (result.timestamp ?? result[4]),
        returnsClaimed: isArray ? result[5] : (result.returnsClaimed ?? result[5]),
      };
    } catch (err: any) {
      console.error('Failed to get investment:', err);
      return null;
    }
  }, [client, getContractInstance]);

  /**
   * Get all pools an investor has invested in
   */
  const getInvestorPools = useCallback(async (investor: string): Promise<bigint[]> => {
    if (!client) return [];

    try {
      const contract = getContractInstance();
      const poolIds = await readContract({
        contract,
        method: 'function getInvestorPools(address) view returns (uint256[])',
        params: [investor],
      });
      return poolIds as bigint[];
    } catch (err: any) {
      console.error('Failed to get investor pools:', err);
      return [];
    }
  }, [client, getContractInstance]);

  // ============== ADMIN FUNCTIONS ==============

  /**
   * Verify an exporter (admin only)
   * Replaces: useAccessControl.grantExporterRole functionality
   */
  const verifyExporter = useCallback(async (exporter: string) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function verifyExporter(address)',
        params: [exporter],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to verify exporter';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Approve an invoice (admin only)
   * Replaces: useInvoiceNFT.finalizeInvoice
   * Breaking Change: Admin approves directly, no separate finalize step
   */
  const approveInvoice = useCallback(async (invoiceId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function approveInvoice(uint256)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to approve invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Reject an invoice (admin only)
   */
  const rejectInvoice = useCallback(async (invoiceId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function rejectInvoice(uint256)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to reject invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Mark invoice as paid (admin only)
   * Replaces: usePaymentOracle.markInvoicePaid
   * Breaking Change: No payment timestamp tracking
   */
  const markInvoicePaid = useCallback(async (invoiceId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function markInvoicePaid(uint256)',
        params: [invoiceId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to mark invoice paid';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Distribute profits to investors (admin only)
   * Replaces: usePoolFunding.distributeProfits
   * Note: Called after all invoices in pool are PAID
   */
  const distributeProfits = useCallback(async (poolId: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function distributeProfits(uint256)',
        params: [poolId],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to distribute profits';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Manually distribute funds to a specific invoice (admin only)
   * Note: Normally happens automatically at 100% funding
   */
  const distributeToInvoice = useCallback(async (poolId: bigint, invoiceId: bigint, amount: bigint) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function distributeToInvoice(uint256,uint256,uint256)',
        params: [poolId, invoiceId, amount],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to distribute to invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  /**
   * Grant admin role to an address (admin only)
   * Uses OpenZeppelin AccessControl
   */
  const grantAdminRole = useCallback(async (targetAddress: string) => {
    if (!account || !client) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const contract = getContractInstance();
      const tx = prepareContractCall({
        contract,
        method: 'function grantRole(bytes32,address)',
        params: [ROLES.ADMIN, targetAddress],
      });
      
      const result = await sendTransaction({
        account,
        transaction: tx,
      });
      
      await waitForReceipt(result);
      
      return { success: true, txHash: result.transactionHash };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to grant admin role';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [account, client, getContractInstance]);

  // ============== ROLE CHECKING ==============

  /**
   * Check user roles
   * Replaces: useAccessControl.getUserRoles
   * Breaking Change: Checks 3 separate sources instead of one function
   */
  const checkUserRoles = useCallback(async (accountAddress: string) => {
    if (!client) {
      return {
        isAdmin: false,
        isExporter: false,
        isInvestor: false,
      };
    }

    try {
      const contract = getContractInstance();
      
      // Check all three role types
      const [isAdmin, isExporter, isInvestor] = await Promise.all([
        readContract({
          contract,
          method: 'function hasRole(bytes32,address) view returns (bool)',
          params: [ROLES.ADMIN, accountAddress],
        }),
        readContract({
          contract,
          method: 'function registeredExporters(address) view returns (bool)',
          params: [accountAddress],
        }),
        readContract({
          contract,
          method: 'function registeredInvestors(address) view returns (bool)',
          params: [accountAddress],
        }),
      ]);
      
      return {
        isAdmin: isAdmin as boolean,
        isExporter: isExporter as boolean,
        isInvestor: isInvestor as boolean,
      };
    } catch (err: any) {
      console.error('Failed to check user roles:', err);
      return {
        isAdmin: false,
        isExporter: false,
        isInvestor: false,
      };
    }
  }, [client, getContractInstance]);

  // ============== RETURN ALL FUNCTIONS ==============

  return {
    // State
    isLoading,
    error,
    address,
    
    // Registration (self-service)
    registerExporter,
    registerInvestor,
    
    // Invoice functions
    createInvoice,
    withdrawFunds,
    getInvoice,
    getExporterInvoices,
    canWithdraw,
    
    // Pool functions
    createPool,
    getPool,
    getAllOpenPools,
    getAllPendingInvoices,
    getAllApprovedInvoices,
    getPoolFundingPercentage,
    getPoolInvestors,
    
    // Investment functions
    invest,
    claimReturns,
    getInvestment,
    getInvestorPools,
    
    // Admin functions
    verifyExporter,
    approveInvoice,
    rejectInvoice,
    markInvoicePaid,
    distributeProfits,
    distributeToInvoice,
    grantAdminRole,
    
    // Role checking
    checkUserRoles,
  };
}

// ============== EXPORTS ==============

export { ROLES, INVOICE_STATUS, POOL_STATUS, type Invoice, type Pool, type Investment } from '@/lib/contract';
