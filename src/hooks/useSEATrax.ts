/**
 * useSEATrax Hook
 * 
 * Unified hook for interacting with the SEATrax smart contract.
 * Consolidates functionality from 6 specialized hooks into one.
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
import { CONTRACT_ADDRESS, SEATRAX_ABI, ROLES, type Invoice, type Pool, type Investment } from '@/lib/contract';
import { ethers } from 'ethers';
import { appConfig } from '@/config';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useSEATrax() {
  const { address, account, client } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============== CONTRACT INSTANCE ==============
  
  const getContract = useCallback(async () => {
    if (!account) {
      throw new Error('Wallet not connected');
    }
    
    // Get provider from account
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    
    return new ethers.Contract(CONTRACT_ADDRESS, SEATRAX_ABI, signer);
  }, [account]);

  const getReadOnlyContract = useCallback(() => {
    const provider = new ethers.JsonRpcProvider(appConfig.chain.rpcUrl);
    return new ethers.Contract(CONTRACT_ADDRESS, SEATRAX_ABI, provider);
  }, []);

  // ============== REGISTRATION FUNCTIONS (Self-Service) ==============

  /**
   * Register current user as exporter (self-registration)
   * Replaces: useAccessControl.grantExporterRole (admin-granted)
   */
  const registerExporter = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.registerExporter();
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to register as exporter';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Register current user as investor (self-registration)
   * Replaces: useAccessControl.grantInvestorRole (admin-granted)
   */
  const registerInvestor = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.registerInvestor();
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to register as investor';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

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
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.createInvoice(
        exporterCompany,
        importerCompany,
        importerEmail,
        shippingDate,
        shippingAmount,
        loanAmount,
        ipfsHash
      );
      const receipt = await tx.wait();
      
      // Find InvoiceCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'InvoiceCreated';
        } catch {
          return false;
        }
      });
      
      let invoiceId = null;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        if (parsed) {
          invoiceId = parsed.args.invoiceId;
        }
      }
      
      return { success: true, txHash: tx.hash, invoiceId };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to create invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Withdraw funds from invoice (ALL available funds)
   * Replaces: useInvoiceNFT.withdrawFunds
   * Breaking Change: No amount parameter - withdraws ALL available
   */
  const withdrawFunds = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.withdrawFunds(invoiceId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to withdraw funds';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Get invoice details by ID
   * Replaces: useInvoiceNFT.getInvoice
   */
  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice | null> => {
    try {
      const contract = getReadOnlyContract();
      const invoice = await contract.getInvoice(invoiceId);
      return invoice as Invoice;
    } catch (err: any) {
      console.error('Failed to get invoice:', err);
      return null;
    }
  }, [getReadOnlyContract]);

  /**
   * Get all invoices for an exporter
   * Replaces: useInvoiceNFT.getInvoicesByExporter (name change only)
   */
  const getExporterInvoices = useCallback(async (exporter: string): Promise<bigint[]> => {
    try {
      const contract = getReadOnlyContract();
      const invoiceIds = await contract.getExporterInvoices(exporter);
      return invoiceIds;
    } catch (err: any) {
      console.error('Failed to get exporter invoices:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  /**
   * Check if invoice can be withdrawn and get withdrawable amount
   * Replaces: useInvoiceNFT.getAvailableWithdrawal (name change only)
   */
  const canWithdraw = useCallback(async (invoiceId: bigint): Promise<{ canWithdraw: boolean; amount: bigint }> => {
    try {
      const contract = getReadOnlyContract();
      const [can, amount] = await contract.canWithdraw(invoiceId);
      return { canWithdraw: can, amount };
    } catch (err: any) {
      console.error('Failed to check withdrawal:', err);
      return { canWithdraw: false, amount: 0n };
    }
  }, [getReadOnlyContract]);

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
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.createPool(name, invoiceIds, startDate, endDate);
      const receipt = await tx.wait();
      
      // Find PoolCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'PoolCreated';
        } catch {
          return false;
        }
      });
      
      let poolId = null;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        if (parsed) {
          poolId = parsed.args.poolId;
        }
      }
      
      return { success: true, txHash: tx.hash, poolId };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to create pool';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Get pool details by ID
   * Replaces: usePoolNFT.getPool
   */
  const getPool = useCallback(async (poolId: bigint): Promise<Pool | null> => {
    try {
      const contract = getReadOnlyContract();
      const pool = await contract.getPool(poolId);
      return pool as Pool;
    } catch (err: any) {
      console.error('Failed to get pool:', err);
      return null;
    }
  }, [getReadOnlyContract]);

  /**
   * Get all open pools
   * Replaces: usePoolNFT.getPoolsByStatus (OPEN)
   * Breaking Change: Only returns OPEN pools, not arbitrary status
   */
  const getAllOpenPools = useCallback(async (): Promise<bigint[]> => {
    try {
      const contract = getReadOnlyContract();
      const poolIds = await contract.getAllOpenPools();
      return poolIds;
    } catch (err: any) {
      console.error('Failed to get open pools:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  /**
   * Get all pending invoices (awaiting approval)
   */
  const getAllPendingInvoices = useCallback(async (): Promise<bigint[]> => {
    try {
      const contract = getReadOnlyContract();
      const invoiceIds = await contract.getAllPendingInvoices();
      return invoiceIds;
    } catch (err: any) {
      console.error('Failed to get pending invoices:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  /**
   * Get all approved invoices (ready for pool)
   */
  const getAllApprovedInvoices = useCallback(async (): Promise<bigint[]> => {
    try {
      const contract = getReadOnlyContract();
      const invoiceIds = await contract.getAllApprovedInvoices();
      return invoiceIds;
    } catch (err: any) {
      console.error('Failed to get approved invoices:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  /**
   * Get pool funding percentage
   * Replaces: usePoolFunding.getPoolFundingPercentage
   */
  const getPoolFundingPercentage = useCallback(async (poolId: bigint): Promise<number> => {
    try {
      const contract = getReadOnlyContract();
      const percentage = await contract.getPoolFundingPercentage(poolId);
      return Number(percentage);
    } catch (err: any) {
      console.error('Failed to get pool funding percentage:', err);
      return 0;
    }
  }, [getReadOnlyContract]);

  /**
   * Get all investors in a pool
   */
  const getPoolInvestors = useCallback(async (poolId: bigint): Promise<string[]> => {
    try {
      const contract = getReadOnlyContract();
      const investors = await contract.getPoolInvestors(poolId);
      return investors;
    } catch (err: any) {
      console.error('Failed to get pool investors:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  // ============== INVESTMENT FUNCTIONS (Investor) ==============

  /**
   * Invest in a pool
   * Replaces: usePoolFunding.investInPool
   * Breaking Change: Amount passed via transaction value, not parameter
   */
  const invest = useCallback(async (poolId: bigint, amount: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.invest(poolId, { value: amount });
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to invest';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Claim returns from a completed pool
   * Replaces: usePoolFunding.claimInvestorReturns (name change only)
   */
  const claimReturns = useCallback(async (poolId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.claimReturns(poolId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to claim returns';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Get investment details for a pool and investor
   * Replaces: usePoolFunding.getInvestorPoolInfo
   */
  const getInvestment = useCallback(async (poolId: bigint, investor: string): Promise<Investment | null> => {
    try {
      const contract = getReadOnlyContract();
      const investment = await contract.getInvestment(poolId, investor);
      return investment as Investment;
    } catch (err: any) {
      console.error('Failed to get investment:', err);
      return null;
    }
  }, [getReadOnlyContract]);

  /**
   * Get all pools an investor has invested in
   */
  const getInvestorPools = useCallback(async (investor: string): Promise<bigint[]> => {
    try {
      const contract = getReadOnlyContract();
      const poolIds = await contract.getInvestorPools(investor);
      return poolIds;
    } catch (err: any) {
      console.error('Failed to get investor pools:', err);
      return [];
    }
  }, [getReadOnlyContract]);

  // ============== ADMIN FUNCTIONS ==============

  /**
   * Verify an exporter (admin only)
   * Replaces: useAccessControl.grantExporterRole functionality
   */
  const verifyExporter = useCallback(async (exporter: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.verifyExporter(exporter);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to verify exporter';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Approve an invoice (admin only)
   * Replaces: useInvoiceNFT.finalizeInvoice
   * Breaking Change: Admin approves directly, no separate finalize step
   */
  const approveInvoice = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.approveInvoice(invoiceId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to approve invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Reject an invoice (admin only)
   */
  const rejectInvoice = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.rejectInvoice(invoiceId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to reject invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Mark invoice as paid (admin only)
   * Replaces: usePaymentOracle.markInvoicePaid
   * Breaking Change: No payment timestamp tracking
   */
  const markInvoicePaid = useCallback(async (invoiceId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.markInvoicePaid(invoiceId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to mark invoice paid';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Distribute profits to investors (admin only)
   * Replaces: usePoolFunding.distributeProfits
   * Note: Called after all invoices in pool are PAID
   */
  const distributeProfits = useCallback(async (poolId: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.distributeProfits(poolId);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to distribute profits';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Manually distribute funds to a specific invoice (admin only)
   * Note: Normally happens automatically at 100% funding
   */
  const distributeToInvoice = useCallback(async (poolId: bigint, invoiceId: bigint, amount: bigint) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.distributeToInvoice(poolId, invoiceId, amount);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to distribute to invoice';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  /**
   * Grant admin role to an address (admin only)
   * Uses OpenZeppelin AccessControl
   */
  const grantAdminRole = useCallback(async (account: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const contract = await getContract();
      const tx = await contract.grantRole(ROLES.ADMIN, account);
      await tx.wait();
      
      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      const errorMsg = err.reason || err.message || 'Failed to grant admin role';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  // ============== ROLE CHECKING ==============

  /**
   * Check user roles
   * Replaces: useAccessControl.getUserRoles
   * Breaking Change: Checks 3 separate sources instead of one function
   */
  const checkUserRoles = useCallback(async (account: string) => {
    try {
      const contract = getReadOnlyContract();
      
      // Check all three role types
      const [isAdmin, isExporter, isInvestor] = await Promise.all([
        contract.hasRole(ROLES.ADMIN, account),
        contract.registeredExporters(account),
        contract.registeredInvestors(account),
      ]);
      
      return {
        isAdmin,
        isExporter,
        isInvestor,
      };
    } catch (err: any) {
      console.error('Failed to check user roles:', err);
      return {
        isAdmin: false,
        isExporter: false,
        isInvestor: false,
      };
    }
  }, [getReadOnlyContract]);

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
