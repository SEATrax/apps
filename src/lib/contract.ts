import { appConfig } from '@/config';

// Placeholder ABI - Replace with actual SEATrax smart contract ABI
// Get the actual ABI from: https://github.com/SEATrax/smart-contract branch dev
export const SEATRAX_ABI = [
  // ============== READ FUNCTIONS ==============
  
  // Get invoice details
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getInvoice',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'ipfsHash', type: 'string' },
      { name: 'fundingAmount', type: 'uint256' },
      { name: 'currentFunding', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'dueDate', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Get pool details
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'getPool',
    outputs: [
      { name: 'admin', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'totalValue', type: 'uint256' },
      { name: 'totalInvested', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'maturityDate', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Get user's invoices
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getInvoicesByOwner',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Get user's investments
  {
    inputs: [{ name: 'investor', type: 'address' }],
    name: 'getInvestmentsByInvestor',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Get funding percentage
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getFundingPercentage',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Check if user has role
  {
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // ============== WRITE FUNCTIONS ==============
  
  // Create invoice NFT (Exporter)
  {
    inputs: [
      { name: 'ipfsHash', type: 'string' },
      { name: 'fundingAmount', type: 'uint256' },
      { name: 'dueDate', type: 'uint256' },
    ],
    name: 'createInvoice',
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Approve invoice (Admin)
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'approveInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Reject invoice (Admin)
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'reason', type: 'string' },
    ],
    name: 'rejectInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Create pool (Admin)
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'invoiceTokenIds', type: 'uint256[]' },
      { name: 'maturityDate', type: 'uint256' },
    ],
    name: 'createPool',
    outputs: [{ name: 'poolId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Invest in pool (Investor)
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'invest',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  
  // Withdraw funds (Exporter - when 70% funded)
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'withdrawFunding',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Repay invoice (Exporter)
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'repayInvoice',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  
  // Claim returns (Investor)
  {
    inputs: [{ name: 'poolId', type: 'uint256' }],
    name: 'claimReturns',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // ============== EVENTS ==============
  
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'ipfsHash', type: 'string' },
      { indexed: false, name: 'fundingAmount', type: 'uint256' },
    ],
    name: 'InvoiceCreated',
    type: 'event',
  },
  
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'approver', type: 'address' },
    ],
    name: 'InvoiceApproved',
    type: 'event',
  },
  
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'poolId', type: 'uint256' },
      { indexed: true, name: 'admin', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
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
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'exporter', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'FundingWithdrawn',
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

// Role constants (keccak256 hashes)
export const ROLES = {
  ADMIN: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
  EXPORTER: '0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357',
  INVESTOR: '0x2d41a8a8a5c8e7c8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8f8e8',
} as const;

// Invoice status enum
export const INVOICE_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  FUNDING: 2,
  FUNDED: 3,
  COMPLETED: 4,
  DEFAULTED: 5,
  REJECTED: 6,
} as const;

// Pool status enum
export const POOL_STATUS = {
  OPEN: 0,
  CLOSED: 1,
  MATURED: 2,
  LIQUIDATING: 3,
} as const;
