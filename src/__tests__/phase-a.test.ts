import { renderHook } from '@testing-library/react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { usePoolNFT } from '@/hooks/usePoolNFT';
import { usePoolFunding } from '@/hooks/usePoolFunding';
import { usePaymentOracle } from '@/hooks/usePaymentOracle';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';

// Mock Panna SDK
jest.mock('@/hooks/usePanna', () => ({
  usePanna: () => ({
    address: '0x742d35Cc6C4165CC3201B3fd5b4cd5F2C3c72e87',
    isConnected: true,
    readContract: jest.fn(),
    writeContract: jest.fn(),
    walletClient: {},
    publicClient: {},
  }),
}));

describe('Phase A: Multiple Contract Integration Tests', () => {
  describe('useAccessControl Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useAccessControl());
      
      expect(result.current.hasRole).toBeDefined();
      expect(result.current.getUserRoles).toBeDefined();
      expect(result.current.grantExporterRole).toBeDefined();
      expect(result.current.grantInvestorRole).toBeDefined();
    });
  });

  describe('useInvoiceNFT Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useInvoiceNFT());
      
      expect(result.current.mintInvoice).toBeDefined();
      expect(result.current.getInvoice).toBeDefined();
      expect(result.current.getInvoicesByExporter).toBeDefined();
      expect(result.current.withdrawFunds).toBeDefined();
      expect(result.current.finalizeInvoice).toBeDefined();
    });
  });

  describe('usePoolNFT Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => usePoolNFT());
      
      expect(result.current.createPool).toBeDefined();
      expect(result.current.getPool).toBeDefined();
      expect(result.current.getAllOpenPools).toBeDefined();
      expect(result.current.finalizePool).toBeDefined();
    });
  });

  describe('usePoolFunding Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => usePoolFunding());
      
      expect(result.current.investInPool).toBeDefined();
      expect(result.current.claimInvestorReturns).toBeDefined();
      expect(result.current.getPoolFundingPercentage).toBeDefined();
      expect(result.current.allocateFundsToInvoices).toBeDefined();
    });
  });

  describe('usePaymentOracle Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => usePaymentOracle());
      
      expect(result.current.submitPaymentConfirmation).toBeDefined();
      expect(result.current.markInvoicePaid).toBeDefined();
      expect(result.current.isInvoicePaid).toBeDefined();
    });
  });

  describe('usePlatformAnalytics Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => usePlatformAnalytics());
      
      expect(result.current.updatePlatformMetrics).toBeDefined();
      expect(result.current.getPlatformStats).toBeDefined();
      expect(result.current.getInvestorStats).toBeDefined();
      expect(result.current.updatePoolPerformance).toBeDefined();
    });
  });

  describe('Contract Integration', () => {
    it('should have all contract addresses configured', () => {
      expect(process.env.NEXT_PUBLIC_ACCESS_CONTROL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_INVOICE_NFT).toBeDefined();
      expect(process.env.NEXT_PUBLIC_POOL_NFT).toBeDefined();
      expect(process.env.NEXT_PUBLIC_POOL_FUNDING_MANAGER).toBeDefined();
      expect(process.env.NEXT_PUBLIC_PAYMENT_ORACLE).toBeDefined();
      expect(process.env.NEXT_PUBLIC_PLATFORM_ANALYTICS).toBeDefined();
    });

    it('should use correct contract addresses format', () => {
      const contracts = [
        process.env.NEXT_PUBLIC_ACCESS_CONTROL,
        process.env.NEXT_PUBLIC_INVOICE_NFT,
        process.env.NEXT_PUBLIC_POOL_NFT,
        process.env.NEXT_PUBLIC_POOL_FUNDING_MANAGER,
        process.env.NEXT_PUBLIC_PAYMENT_ORACLE,
        process.env.NEXT_PUBLIC_PLATFORM_ANALYTICS,
      ];

      contracts.forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });
  });
});