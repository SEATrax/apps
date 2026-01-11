import { renderHook } from '@testing-library/react';
import { useSEATrax } from '@/hooks/useSEATrax';

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

describe('Phase A: Single Contract Integration Tests', () => {
  describe('useSEATrax Hook', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useSEATrax());
      
      // Registration functions
      expect(result.current.registerExporter).toBeDefined();
      expect(result.current.registerInvestor).toBeDefined();
      
      // Role checking
      expect(result.current.checkUserRoles).toBeDefined();
      
      // Invoice functions
      expect(result.current.createInvoice).toBeDefined();
      expect(result.current.getInvoice).toBeDefined();
      expect(result.current.getExporterInvoices).toBeDefined();
      expect(result.current.withdrawFunds).toBeDefined();
      
      // Pool functions
      expect(result.current.createPool).toBeDefined();
      expect(result.current.getPool).toBeDefined();
      expect(result.current.getAllOpenPools).toBeDefined();
      expect(result.current.getPoolFundingPercentage).toBeDefined();
      expect(result.current.getAllPendingInvoices).toBeDefined();
      expect(result.current.getAllApprovedInvoices).toBeDefined();
      
      // Investment functions
      expect(result.current.invest).toBeDefined();
      expect(result.current.claimReturns).toBeDefined();
      expect(result.current.getInvestment).toBeDefined();
      expect(result.current.getInvestorPools).toBeDefined();
      
      // Admin functions
      expect(result.current.verifyExporter).toBeDefined();
      expect(result.current.approveInvoice).toBeDefined();
      expect(result.current.rejectInvoice).toBeDefined();
      expect(result.current.markInvoicePaid).toBeDefined();
      expect(result.current.distributeProfits).toBeDefined();
    });
  });

  describe('Contract Integration', () => {
    it('should have contract address configured', () => {
      expect(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS).toBeDefined();
    });

    it('should use correct contract address format', () => {
      const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});