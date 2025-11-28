// User Roles
export type UserRole = 'admin' | 'exporter' | 'investor';

// Invoice Status
export type InvoiceStatus = 
  | 'pending'      // Waiting for approval
  | 'approved'     // Approved, ready for funding
  | 'funding'      // Currently being funded
  | 'funded'       // Reached 70% threshold
  | 'completed'    // Invoice paid, profits distributed
  | 'defaulted'    // Invoice defaulted
  | 'rejected';    // Rejected by admin

// Pool Status
export type PoolStatus = 
  | 'open'         // Accepting investments
  | 'closed'       // No longer accepting investments
  | 'matured'      // All invoices completed
  | 'liquidating'; // Processing returns

// Invoice NFT
export interface InvoiceNFT {
  tokenId: bigint;
  owner: string;
  ipfsHash: string;
  metadata: InvoiceMetadata;
  status: InvoiceStatus;
  fundingAmount: bigint;
  currentFunding: bigint;
  fundingPercentage: number;
  createdAt: number;
  dueDate: number;
}

// Invoice Metadata (stored on IPFS)
export interface InvoiceMetadata {
  invoiceNumber: string;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerCountry: string;
  shippingDetails: ShippingDetails;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  description: string;
  documents: DocumentReference[];
}

export interface ShippingDetails {
  portOfLoading: string;
  portOfDischarge: string;
  vesselName?: string;
  containerNumber?: string;
  billOfLadingNumber?: string;
  estimatedArrival?: string;
}

export interface DocumentReference {
  name: string;
  ipfsHash: string;
  type: 'bill_of_lading' | 'commercial_invoice' | 'packing_list' | 'certificate_of_origin' | 'other';
}

// Pool NFT
export interface PoolNFT {
  poolId: bigint;
  name: string;
  description: string;
  admin: string;
  invoiceTokenIds: bigint[];
  totalValue: bigint;
  totalInvested: bigint;
  investorCount: number;
  status: PoolStatus;
  targetYield: number; // 4% for investors
  platformFee: number; // 1% platform fee
  createdAt: number;
  maturityDate: number;
}

// Investment
export interface Investment {
  investor: string;
  poolId: bigint;
  amount: bigint;
  timestamp: number;
  expectedReturn: bigint;
  claimed: boolean;
}

// User Profile (Supabase)
export interface UserProfile {
  id: string;
  walletAddress: string;
  role: UserRole;
  companyName?: string;
  email?: string;
  kycVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transaction Event
export interface TransactionEvent {
  txHash: string;
  event: string;
  args: Record<string, unknown>;
  blockNumber: number;
  timestamp: number;
}

// Contract Configuration
export interface ContractConfig {
  address: string;
  chainId: number;
  rpcUrl: string;
}

// Wallet State
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint;
}

// App Statistics
export interface AppStatistics {
  totalInvoicesCreated: number;
  totalInvoicesFunded: number;
  totalValueLocked: bigint;
  totalInvestors: number;
  totalExporters: number;
  averageYield: number;
}
