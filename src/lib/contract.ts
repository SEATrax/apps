import { appConfig } from '@/config';

// ============== CONTRACT ABI ==============
// This is a placeholder ABI for the SEATrax MVP contract
// Replace with actual ABI after deploying the smart contract

export const SEATRAX_ABI = [
  // ============== EXPORTER FUNCTIONS ==============
  {
    inputs: [],
    name: 'registerExporter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'invoiceValue', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'invoiceDate', type: 'uint256' },
      { name: 'dueDate', type: 'uint256' },
      { name: 'ipfsHash', type: 'string' },
    ],
    name: 'createInvoice',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'withdrawFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ============== INVESTOR FUNCTIONS ==============
  {
    inputs: [],
    name: 'registerInvestor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'claimReturns',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ============== ADMIN FUNCTIONS ==============
  {
    inputs: [{ name: 'exporter', type: 'address' }],
    name: 'verifyExporter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'approveInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'rejectInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'invoiceIds', type: 'uint256[]' },
      { name: 'startDate', type: 'uint256' },
      { name: 'endDate', type: 'uint256' },
    ],
    name: 'createPool',
    outputs: [{ name: 'poolId', type: 'uint256' }],
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
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'distributeProfits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ============== VIEW FUNCTIONS ==============
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'getInvoice',
    outputs: [
      {
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'exporter', type: 'address' },
          { name: 'invoiceValue', type: 'uint256' },
          { name: 'loanAmount', type: 'uint256' },
          { name: 'fundedAmount', type: 'uint256' },
          { name: 'withdrawnAmount', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'poolId', type: 'uint256' },
          { name: 'invoiceDate', type: 'uint256' },
          { name: 'dueDate', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'ipfsHash', type: 'string' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPool',
    outputs: [
      {
        components: [
          { name: 'poolId', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'startDate', type: 'uint256' },
          { name: 'endDate', type: 'uint256' },
          { name: 'totalLoanAmount', type: 'uint256' },
          { name: 'totalInvested', type: 'uint256' },
          { name: 'totalDistributed', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'invoiceIds', type: 'uint256[]' },
          { name: 'createdAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'investor', type: 'address' },
    ],
    name: 'getInvestment',
    outputs: [
      {
        components: [
          { name: 'investor', type: 'address' },
          { name: 'poolId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'percentage', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'returnsClaimed', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolInvestors',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'exporter', type: 'address' }],
    name: 'getExporterInvoices',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'getInvestorPools',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'invoiceId', type: 'uint256' }],
    name: 'canWithdraw',
    outputs: [
      { name: 'canWithdraw', type: 'bool' },
      { name: 'withdrawableAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPoolFundingPercentage',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllOpenPools',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllPendingInvoices',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllApprovedInvoices',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },

  // ============== EVENTS ==============
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'exporter', type: 'address' },
      { indexed: false, name: 'loanAmount', type: 'uint256' },
    ],
    name: 'InvoiceCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'admin', type: 'address' },
    ],
    name: 'InvoiceApproved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'admin', type: 'address' },
    ],
    name: 'InvoiceRejected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'poolId', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'totalLoanAmount', type: 'uint256' },
    ],
    name: 'PoolCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'poolId', type: 'uint256' },
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'InvestmentMade',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'InvoiceFunded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
      { indexed: true, name: 'exporter', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'FundsWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'invoiceId', type: 'uint256' },
    ],
    name: 'InvoicePaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'poolId', type: 'uint256' },
      { indexed: false, name: 'investorShare', type: 'uint256' },
      { indexed: false, name: 'platformFee', type: 'uint256' },
    ],
    name: 'ProfitsDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'poolId', type: 'uint256' },
      { indexed: true, name: 'investor', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'ReturnsClaimed',
    type: 'event',
  },
] as const;

export const CONTRACT_ADDRESS = appConfig.contract.address;

// Status enums matching smart contract
export const INVOICE_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  IN_POOL: 2,
  FUNDED: 3,
  WITHDRAWN: 4,
  PAID: 5,
  COMPLETED: 6,
  REJECTED: 7,
} as const;

export const POOL_STATUS = {
  OPEN: 0,
  FUNDED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

// Platform constants (basis points: 10000 = 100%)
export const INVESTOR_YIELD_BPS = 400;     // 4%
export const PLATFORM_FEE_BPS = 100;       // 1%
export const FUNDING_THRESHOLD_BPS = 7000; // 70%
