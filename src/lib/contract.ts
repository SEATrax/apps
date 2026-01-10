import { appConfig } from '@/config';
import SEATRAX_ABI_JSON from './seatrax-abi.json';

// ============== SINGLE CONTRACT CONFIGURATION ==============
// Migrated from multiple contracts to unified SEATrax contract

export const SEATRAX_CONTRACT = {
  address: appConfig.contracts.seatrax.address,
  abi: SEATRAX_ABI_JSON,
};

// Export ABI separately for convenience
export const SEATRAX_ABI = SEATRAX_ABI_JSON;

// ============== CONTRACT ADDRESS ==============
export const CONTRACT_ADDRESS = appConfig.contracts.seatrax.address;

// ============== ROLE CONSTANTS ==============
// OpenZeppelin AccessControl role hashes
export const ROLES = {
  // ADMIN_ROLE = keccak256("ADMIN_ROLE") = 0xa49807...
  ADMIN: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  // Note: Exporter and Investor roles are now simple mappings, not AccessControl roles
  // registeredExporters[address] => bool
  // registeredInvestors[address] => bool
} as const;

// ============== STATUS ENUMS ==============

// Invoice Status (from SEATrax.sol)
export const INVOICE_STATUS = {
  PENDING: 0,      // Created, awaiting admin approval
  APPROVED: 1,     // Approved by admin, can be added to pool
  IN_POOL: 2,      // Added to pool, accepting investments
  FUNDED: 3,       // Received funds from pool (≥70%)
  WITHDRAWN: 4,    // Exporter withdrew funds, awaiting payment
  PAID: 5,         // Importer paid, ready for profit distribution
  COMPLETED: 6,    // Profits distributed
  REJECTED: 7,     // Rejected by admin
} as const;

// Pool Status (from SEATrax.sol)
export const POOL_STATUS = {
  OPEN: 0,         // Accepting investments
  FUNDED: 1,       // 100% funded, auto-distributed
  COMPLETED: 2,    // All profits distributed
  CANCELLED: 3,    // Cancelled by admin
} as const;

// ============== PLATFORM CONSTANTS ==============
// Business logic constants (basis points: 10000 = 100%)
export const INVESTOR_YIELD_BPS = 400;     // 4%
export const PLATFORM_FEE_BPS = 100;       // 1%
export const FUNDING_THRESHOLD_BPS = 7000; // 70%

// ============== TYPESCRIPT TYPES ==============

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];
export type PoolStatus = (typeof POOL_STATUS)[keyof typeof POOL_STATUS];

export interface Invoice {
  tokenId: bigint;
  exporter: string;
  exporterCompany: string;
  importerCompany: string;
  importerEmail: string;
  shippingDate: bigint;
  shippingAmount: bigint;
  loanAmount: bigint;
  amountInvested: bigint;
  amountWithdrawn: bigint;
  status: InvoiceStatus;
  poolId: bigint;
  ipfsHash: string;
  createdAt: bigint;
}

export interface Pool {
  poolId: bigint;
  name: string;
  startDate: bigint;
  endDate: bigint;
  invoiceIds: bigint[];
  totalLoanAmount: bigint;
  totalShippingAmount: bigint;
  amountInvested: bigint;
  amountDistributed: bigint;
  feePaid: bigint;
  status: PoolStatus;
  createdAt: bigint;
}

export interface Investment {
  investor: string;
  poolId: bigint;
  amount: bigint;
  percentage: bigint;
  timestamp: bigint;
  returnsClaimed: boolean;
}

// ============== LEGACY SUPPORT (for rollback) ==============
// Keep old contract addresses commented for reference

/*
export const LEGACY_CONTRACTS = {
  ACCESS_CONTROL: '0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F',
  INVOICE_NFT: '0x8Da2dF6050158ae8B058b90B37851323eFd69E16',
  POOL_NFT: '0x317Ce254731655E19932b9EFEAf7eeA31F0775ad',
  POOL_FUNDING_MANAGER: '0xbD5f292F75D22996E7A4DD277083c75aB29ff45C',
  PAYMENT_ORACLE: '0x7894728174E53Df9Fec402De07d80652659296a8',
  PLATFORM_ANALYTICS: '0xb77C5C42b93ec46A323137B64586F0F8dED987A9',
} as const;
*/
