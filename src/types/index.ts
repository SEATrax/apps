// ============== USER TYPES ==============

export type UserRole = 'admin' | 'exporter' | 'investor';

// Exporter Profile (Supabase)
export interface ExporterProfile {
  id: string;
  walletAddress: string;
  companyName: string;
  taxId: string;
  country: string;
  exportLicense: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Investor Profile (Supabase)
export interface InvestorProfile {
  id: string;
  walletAddress: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt?: string;
}

// ============== INVOICE TYPES ==============

export type InvoiceStatus =
  | 'PENDING'      // Submitted, waiting review
  | 'APPROVED'     // Approved by admin
  | 'IN_POOL'      // Added to pool
  | 'FUNDED'       // Received funds (>=70%)
  | 'WITHDRAWN'    // Exporter withdrew
  | 'PAID'         // Importer paid
  | 'COMPLETED'    // Profits distributed
  | 'REJECTED';    // Rejected by admin

// Invoice On-chain Data
export interface Invoice {
  tokenId: bigint;
  exporter: string;
  
  // Financial (USD cents on-chain, display as USD)
  invoiceValue: bigint;
  loanAmount: bigint;
  fundedAmount: bigint;      // ETH wei
  withdrawnAmount: bigint;   // ETH wei
  
  // Status
  status: InvoiceStatus;
  poolId: bigint;
  
  // Timestamps
  invoiceDate: number;
  dueDate: number;
  createdAt: number;
  
  // IPFS
  ipfsHash: string;
}

// Invoice Metadata (IPFS)
export interface InvoiceMetadata {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;       // Invoice value in USD
  currency: string;
  goodsDescription: string;
  
  // Importer info
  importerName: string;
  importerLicense: string;
  
  // Documents
  documents: {
    purchaseOrder?: string;
    billOfLading?: string;
    other?: string[];
  };
  
  // Loan request
  loanAmount: number;
}

// Invoice with full data (combined)
export interface InvoiceFull extends Invoice {
  metadata: InvoiceMetadata;
}

// ============== POOL TYPES ==============

export type PoolStatus =
  | 'OPEN'         // Accepting investments
  | 'FUNDED'       // 100% funded, distributing
  | 'COMPLETED'    // All done
  | 'CANCELLED';

// Pool On-chain Data
export interface Pool {
  poolId: bigint;
  name: string;
  
  // Timeline
  startDate: number;
  endDate: number;
  
  // Financial
  totalLoanAmount: bigint;    // USD cents (sum of invoice loans)
  totalInvested: bigint;      // ETH wei
  totalDistributed: bigint;   // ETH wei
  
  // Status
  status: PoolStatus;
  
  // Invoices
  invoiceIds: bigint[];
  
  createdAt: number;
}

// Pool with calculated fields
export interface PoolWithStats extends Pool {
  fundingPercentage: number;
  investorCount: number;
  targetAmountEth: bigint;
}

// ============== INVESTMENT TYPES ==============

export interface Investment {
  investor: string;
  poolId: bigint;
  amount: bigint;           // ETH wei
  percentage: number;       // Basis points (10000 = 100%)
  timestamp: number;
  returnsClaimed: boolean;
}

// Investment with calculated returns
export interface InvestmentWithReturns extends Investment {
  expectedReturns: bigint;  // Principal + 4% yield
  poolName: string;
  poolStatus: PoolStatus;
}

// ============== PAYMENT TYPES ==============

export interface Payment {
  id: string;
  invoiceId: number;
  amountUsd: number;
  paymentLink: string;
  status: 'pending' | 'sent' | 'paid';
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
}

// ============== API TYPES ==============

export interface CurrencyRate {
  usd: number;
  eth: number;
  timestamp: number;
}

export interface PaymentLinkResponse {
  invoiceId: number;
  invoiceNumber: string;
  importerName: string;
  amountDue: number;
  currency: string;
  paymentLink: string;
}

// ============== FORM TYPES ==============

export interface ExporterOnboardingForm {
  companyName: string;
  taxId: string;
  country: string;
  exportLicense: string;
}

export interface InvestorOnboardingForm {
  name: string;
  address: string;
}

export interface CreateInvoiceForm {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  goodsDescription: string;
  importerName: string;
  importerLicense: string;
  loanAmount: number;
  purchaseOrder?: File;
  billOfLading?: File;
}

export interface CreatePoolForm {
  name: string;
  startDate: string;
  endDate: string;
  invoiceIds: number[];
  description?: string;
  riskCategory?: 'low' | 'medium' | 'high';
}

export interface InvestForm {
  poolId: number;
  amountUsd: number;
  amountEth: number;
}

// ============== DASHBOARD STATS ==============

export interface ExporterStats {
  totalInvoices: number;
  pendingInvoices: number;
  totalLoanRequested: number;
  totalFunded: number;
  totalWithdrawn: number;
}

export interface InvestorStats {
  totalInvested: number;
  activeInvestments: number;
  pendingReturns: number;
  claimedReturns: number;
}

export interface AdminStats {
  totalExporters: number;
  pendingExporters: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalPools: number;
  activePools: number;
  totalInvested: number;
}

// ============== WALLET TYPES ==============

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint;
  role: UserRole | null;
}

// ============== CONTRACT CONSTANTS ==============

export const INVOICE_STATUS_MAP: Record<number, InvoiceStatus> = {
  0: 'PENDING',
  1: 'APPROVED',
  2: 'IN_POOL',
  3: 'FUNDED',
  4: 'WITHDRAWN',
  5: 'PAID',
  6: 'COMPLETED',
  7: 'REJECTED',
};

export const POOL_STATUS_MAP: Record<number, PoolStatus> = {
  0: 'OPEN',
  1: 'FUNDED',
  2: 'COMPLETED',
  3: 'CANCELLED',
};

// Platform constants
export const INVESTOR_YIELD_BPS = 400;   // 4% = 400 basis points
export const PLATFORM_FEE_BPS = 100;     // 1% = 100 basis points
export const FUNDING_THRESHOLD_BPS = 7000; // 70% = 7000 basis points
