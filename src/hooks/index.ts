// Main hooks
export { usePanna } from './usePanna';
export { useWalletSession } from './useWalletSession';
export { useAuthFlow } from './useAuthFlow';

// Profile hooks
export { useExporterProfile } from './useExporterProfile';
export { useInvestorProfile } from './useInvestorProfile';

// Utility hooks
export { useRoleBasedNavigation } from './useRoleBasedNavigation';
export { useInvestmentStats } from './useInvestmentStats';

// ============== SINGLE CONTRACT HOOK (Current) ==============
export { useSEATrax, ROLES } from './useSEATrax';
export type { Invoice, Pool, Investment } from './useSEATrax';

// ============== LEGACY HOOKS (for backward compatibility during migration) ==============
// These will be removed in Phase 8
export { useContract } from './useContract';
export { useAccessControl } from './useAccessControl';
export { useInvoiceNFT, INVOICE_STATUS } from './useInvoiceNFT';
export { usePoolNFT, POOL_STATUS } from './usePoolNFT';
export { usePoolFunding } from './usePoolFunding';
export { usePaymentOracle } from './usePaymentOracle';
export { usePlatformAnalytics } from './usePlatformAnalytics';


