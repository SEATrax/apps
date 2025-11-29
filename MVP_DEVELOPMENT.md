# SEATrax MVP Development Document

## Overview

MVP untuk Shipping Invoice Funding Platform dengan flow sederhana:
- **Exporter**: Submit invoice → Dapat dana saat pool 70%+ funded
- **Investor**: Invest di pool → Dapat 4% yield setelah invoice dibayar
- **Admin**: Kurasi invoice → Buat pool → Manage distribution

---

## Simulasi dari Spreadsheet

### Exporters & Invoices
| Exporter | Invoice Value | Loan Request | Loan + Interest (104%) |
|----------|---------------|--------------|------------------------|
| A | $8,000 | $3,000 | $3,120 |
| B | $4,000 | $1,000 | $1,040 |
| C | $2,000 | $800 | $832 |
| D | $1,000 | $300 | $312 |
| E | $5,000 | $2,000 | $2,080 |

### Pools
| Pool | Active Period | Invoices | Total Target |
|------|---------------|----------|--------------|
| X | 1 Nov - 5 Nov | A, B, D | $4,300 |
| Y | 7 Nov - 13 Nov | C, E | $2,800 |

### Investors
| Investor | Pool | Percentage | Amount Invested | Returns (104%) | Profit (4%) |
|----------|------|------------|-----------------|----------------|-------------|
| Jono | X | 70% | $3,010 | $3,130 | $120 |
| Ucup | X | 20% | $860 | $894 | $34 |
| Yudi | X | 10% | $430 | $447 | $17 |
| Denis | Y | 60% | $1,680 | $1,747 | $67 |
| Adit | Y | 40% | $1,120 | $1,165 | $45 |

---

## Data Structures

### 1. Exporter Profile (Supabase + On-chain)

```typescript
// Supabase - Off-chain profile
interface ExporterProfile {
  id: string;
  walletAddress: string;
  companyName: string;
  taxId: string;           // KYC & AML
  country: string;         // Origin country
  exportLicense: string;   // Export permit number
  createdAt: Date;
  updatedAt: Date;
}

// On-chain - minimal data
struct Exporter {
    address wallet;
    bool isRegistered;
    bool isVerified;       // Admin verified
}
```

### 2. Investor Profile (Supabase + On-chain)

```typescript
// Supabase - Off-chain profile
interface InvestorProfile {
  id: string;
  walletAddress: string;
  name: string;
  address: string;         // Physical address
  createdAt: Date;
  updatedAt: Date;
}

// On-chain - minimal data
struct Investor {
    address wallet;
    bool isRegistered;
}
```

### 3. Invoice NFT (On-chain + IPFS)

```solidity
// On-chain data
struct Invoice {
    uint256 tokenId;
    address exporter;
    
    // Financial
    uint256 invoiceValue;      // Total nominal (in USD cents)
    uint256 loanAmount;        // Permintaan pendanaan (in USD cents)
    uint256 fundedAmount;      // Amount received from pool (in ETH wei)
    uint256 withdrawnAmount;   // Amount withdrawn by exporter
    
    // Status
    InvoiceStatus status;
    uint256 poolId;            // 0 if not in pool
    
    // Timestamps
    uint256 invoiceDate;
    uint256 dueDate;
    uint256 createdAt;
    
    // IPFS hash for metadata
    string ipfsHash;
}

enum InvoiceStatus {
    PENDING,       // Submitted, waiting review
    APPROVED,      // Approved by admin
    IN_POOL,       // Added to pool
    FUNDED,        // Received funds (>=70%)
    WITHDRAWN,     // Exporter withdrew
    PAID,          // Importer paid
    COMPLETED,     // Profits distributed
    REJECTED
}
```

```typescript
// IPFS Metadata
interface InvoiceMetadata {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;       // Invoice value
  currency: string;          // USD
  goodsDescription: string;
  
  // Importer info
  importerName: string;
  importerLicense: string;
  
  // Documents (IPFS hashes)
  documents: {
    purchaseOrder?: string;
    billOfLading?: string;
    other?: string[];
  };
  
  // Request
  loanAmount: number;
}
```

### 4. Pool NFT (On-chain)

```solidity
struct Pool {
    uint256 poolId;
    string name;
    
    // Timeline
    uint256 startDate;
    uint256 endDate;
    
    // Financial (all in USD cents, converted to ETH for transactions)
    uint256 totalLoanAmount;     // Sum of all invoice loanAmounts
    uint256 totalInvested;       // Total ETH invested (in wei)
    uint256 totalDistributed;    // Amount sent to invoices
    
    // Status
    PoolStatus status;
    
    // Invoices in this pool
    uint256[] invoiceIds;
    
    uint256 createdAt;
}

enum PoolStatus {
    OPEN,           // Accepting investments
    FUNDED,         // 100% funded, distributing
    COMPLETED,      // All done
    CANCELLED
}
```

### 5. Investment Record (On-chain)

```solidity
struct Investment {
    address investor;
    uint256 poolId;
    uint256 amount;          // ETH invested (in wei)
    uint256 percentage;      // Percentage of pool (basis points, 10000 = 100%)
    uint256 timestamp;
    bool returnsClaimed;
}

// Mapping: poolId => investor => Investment
mapping(uint256 => mapping(address => Investment)) public investments;

// Mapping: poolId => investor addresses
mapping(uint256 => address[]) public poolInvestors;
```

---

## Smart Contract Functions

### Core Functions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SEATrax is ERC721, AccessControl, ReentrancyGuard {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============== EXPORTER FUNCTIONS ==============
    
    /// @notice Register as exporter (wallet login)
    function registerExporter() external;
    
    /// @notice Create invoice NFT
    function createInvoice(
        uint256 invoiceValue,      // USD cents
        uint256 loanAmount,        // USD cents
        uint256 invoiceDate,
        uint256 dueDate,
        string memory ipfsHash
    ) external returns (uint256 tokenId);
    
    /// @notice Withdraw funds (when funded >= 70%)
    function withdrawFunds(uint256 invoiceId) external nonReentrant;
    
    // ============== INVESTOR FUNCTIONS ==============
    
    /// @notice Register as investor (wallet login)
    function registerInvestor() external;
    
    /// @notice Invest in pool (send ETH)
    function invest(uint256 poolId) external payable nonReentrant;
    
    /// @notice Claim returns after pool completed
    function claimReturns(uint256 poolId) external nonReentrant;
    
    // ============== ADMIN FUNCTIONS ==============
    
    /// @notice Verify exporter
    function verifyExporter(address exporter) external onlyRole(ADMIN_ROLE);
    
    /// @notice Approve invoice
    function approveInvoice(uint256 invoiceId) external onlyRole(ADMIN_ROLE);
    
    /// @notice Reject invoice
    function rejectInvoice(uint256 invoiceId) external onlyRole(ADMIN_ROLE);
    
    /// @notice Create pool with invoices
    function createPool(
        string memory name,
        uint256[] memory invoiceIds,
        uint256 startDate,
        uint256 endDate
    ) external onlyRole(ADMIN_ROLE) returns (uint256 poolId);
    
    /// @notice Mark invoice as paid (after importer payment)
    function markInvoicePaid(uint256 invoiceId) external onlyRole(ADMIN_ROLE);
    
    /// @notice Distribute profits (when all invoices paid)
    function distributeProfits(uint256 poolId) external onlyRole(ADMIN_ROLE) nonReentrant;
    
    // ============== VIEW FUNCTIONS ==============
    
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory);
    function getPool(uint256 poolId) external view returns (Pool memory);
    function getInvestment(uint256 poolId, address investor) external view returns (Investment memory);
    function getPoolInvestors(uint256 poolId) external view returns (address[] memory);
    function getExporterInvoices(address exporter) external view returns (uint256[] memory);
    function getInvestorPools(address investor) external view returns (uint256[] memory);
    function canWithdraw(uint256 invoiceId) external view returns (bool, uint256);
    function getPoolFundingPercentage(uint256 poolId) external view returns (uint256);
}
```

### Key Logic

```solidity
/// @notice Internal: Distribute funds to invoice when pool funded
function _distributeToInvoice(uint256 poolId, uint256 invoiceId) internal {
    Pool storage pool = pools[poolId];
    Invoice storage invoice = invoices[invoiceId];
    
    // Calculate invoice's share of pool funds
    uint256 invoiceShare = (pool.totalInvested * invoice.loanAmount) / pool.totalLoanAmount;
    
    invoice.fundedAmount = invoiceShare;
    invoice.status = InvoiceStatus.FUNDED;
    pool.totalDistributed += invoiceShare;
    
    emit InvoiceFunded(invoiceId, invoiceShare);
}

/// @notice Auto-distribute when pool hits 100%
function _checkAndAutoDistribute(uint256 poolId) internal {
    Pool storage pool = pools[poolId];
    
    // Convert totalLoanAmount (USD) to ETH using current rate
    uint256 targetInETH = _usdToEth(pool.totalLoanAmount);
    
    if (pool.totalInvested >= targetInETH) {
        pool.status = PoolStatus.FUNDED;
        
        // Auto-distribute to all invoices
        for (uint i = 0; i < pool.invoiceIds.length; i++) {
            _distributeToInvoice(poolId, pool.invoiceIds[i]);
            
            // Auto-send to exporter at 100%
            Invoice storage invoice = invoices[pool.invoiceIds[i]];
            uint256 amount = invoice.fundedAmount;
            invoice.withdrawnAmount = amount;
            invoice.status = InvoiceStatus.WITHDRAWN;
            
            payable(invoice.exporter).transfer(amount);
            emit FundsWithdrawn(pool.invoiceIds[i], invoice.exporter, amount);
        }
    }
}

/// @notice Exporter withdraw (manual, when >= 70%)
function withdrawFunds(uint256 invoiceId) external nonReentrant {
    Invoice storage invoice = invoices[invoiceId];
    require(msg.sender == invoice.exporter, "Not exporter");
    require(invoice.status == InvoiceStatus.FUNDED, "Not funded");
    
    Pool storage pool = pools[invoice.poolId];
    uint256 fundingPercentage = (pool.totalInvested * 10000) / _usdToEth(pool.totalLoanAmount);
    
    require(fundingPercentage >= 7000, "Pool not 70% funded"); // 70% = 7000 basis points
    require(invoice.withdrawnAmount == 0, "Already withdrawn");
    
    uint256 amount = invoice.fundedAmount;
    invoice.withdrawnAmount = amount;
    invoice.status = InvoiceStatus.WITHDRAWN;
    
    payable(msg.sender).transfer(amount);
    emit FundsWithdrawn(invoiceId, msg.sender, amount);
}

/// @notice Distribute profits (4% to investors, rest to platform)
function distributeProfits(uint256 poolId) external onlyRole(ADMIN_ROLE) nonReentrant {
    Pool storage pool = pools[poolId];
    require(_allInvoicesPaid(poolId), "Not all invoices paid");
    require(pool.status == PoolStatus.FUNDED, "Pool not funded");
    
    uint256 totalReceived = pool.totalInvested; // ETH received from investors
    uint256 investorYield = (totalReceived * 400) / 10000; // 4%
    uint256 platformFee = (totalReceived * 100) / 10000;   // 1%
    
    // Distribute to investors (principal + 4% yield)
    address[] memory investors = poolInvestors[poolId];
    for (uint i = 0; i < investors.length; i++) {
        Investment storage inv = investments[poolId][investors[i]];
        if (!inv.returnsClaimed) {
            uint256 returns = inv.amount + (investorYield * inv.percentage) / 10000;
            inv.returnsClaimed = true;
            payable(investors[i]).transfer(returns);
            emit ReturnsClaimed(poolId, investors[i], returns);
        }
    }
    
    // Platform fee
    payable(platformTreasury).transfer(platformFee);
    
    pool.status = PoolStatus.COMPLETED;
    emit PoolCompleted(poolId, investorYield, platformFee);
}
```

---

## Frontend Pages (MVP)

### Page Structure

```
src/app/
├── page.tsx                      # Landing page
├── layout.tsx                    
│
├── onboarding/
│   ├── exporter/page.tsx         # Exporter registration form
│   └── investor/page.tsx         # Investor registration form
│
├── exporter/
│   ├── page.tsx                  # Dashboard
│   ├── invoices/
│   │   ├── page.tsx              # My invoices list
│   │   ├── new/page.tsx          # Create invoice
│   │   └── [id]/page.tsx         # Invoice detail + withdraw
│   └── payments/page.tsx         # Payment links status
│
├── investor/
│   ├── page.tsx                  # Dashboard
│   ├── pools/
│   │   ├── page.tsx              # Browse pools
│   │   └── [id]/page.tsx         # Pool detail + invest
│   ├── investments/page.tsx      # My investments
│   └── returns/page.tsx          # Claim returns
│
├── admin/
│   ├── page.tsx                  # Dashboard
│   ├── exporters/page.tsx        # Verify exporters
│   ├── invoices/
│   │   ├── page.tsx              # Review invoices
│   │   └── [id]/page.tsx         # Approve/reject
│   ├── pools/
│   │   ├── page.tsx              # Manage pools
│   │   ├── new/page.tsx          # Create pool
│   │   └── [id]/page.tsx         # Pool detail + actions
│   └── payments/page.tsx         # Track payments
│
└── api/
    ├── currency/route.ts         # USD to ETH conversion
    └── payment/
        └── [invoiceId]/route.ts  # Generate payment link
```

---

## API Integration

### Currency Conversion

```typescript
// src/lib/currency.ts
const CURRENCY_API = 'https://api.currencyfreaks.com/v2.0/rates/latest';
const API_KEY = process.env.CURRENCY_FREAKS_API_KEY;

export async function getEthRate(): Promise<number> {
  const response = await fetch(`${CURRENCY_API}?apikey=${API_KEY}&symbols=ETH`);
  const data = await response.json();
  return parseFloat(data.rates.ETH);
}

export async function usdToEth(usdAmount: number): Promise<number> {
  const ethRate = await getEthRate();
  return usdAmount * ethRate;
}

export async function ethToUsd(ethAmount: number): Promise<number> {
  const ethRate = await getEthRate();
  return ethAmount / ethRate;
}
```

### Payment Link Generation

```typescript
// src/app/api/payment/[invoiceId]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { invoiceId: string } }
) {
  const invoiceId = params.invoiceId;
  
  // Get invoice details from contract
  const invoice = await contract.getInvoice(invoiceId);
  const metadata = await fetchFromIPFS(invoice.ipfsHash);
  
  // Calculate amount due (loan + 4% interest)
  const amountDue = invoice.loanAmount * 1.04;
  
  // Generate payment link (simple for MVP)
  const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`;
  
  // Store in Supabase
  await supabase.from('payments').insert({
    invoice_id: invoiceId,
    amount_usd: amountDue,
    payment_link: paymentLink,
    status: 'pending',
    created_at: new Date(),
  });
  
  return Response.json({
    invoiceId,
    invoiceNumber: metadata.invoiceNumber,
    importerName: metadata.importerName,
    amountDue,
    currency: 'USD',
    paymentLink,
  });
}
```

### Payment Page (For Importer)

```typescript
// src/app/pay/[invoiceId]/page.tsx
// Simple page showing payment details
// Importer can see amount and confirm payment
// Admin manually marks as paid for MVP
```

---

## Database Schema (Supabase MVP)

```sql
-- Exporter profiles
CREATE TABLE exporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    country TEXT NOT NULL,
    export_license TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investor profiles
CREATE TABLE investors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice metadata (extended data not on chain)
CREATE TABLE invoice_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id INTEGER UNIQUE NOT NULL,
    invoice_number TEXT NOT NULL,
    goods_description TEXT,
    importer_name TEXT NOT NULL,
    importer_license TEXT,
    documents JSONB,  -- {purchaseOrder: 'ipfs://...', billOfLading: 'ipfs://...'}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id INTEGER NOT NULL,
    amount_usd DECIMAL(20, 2) NOT NULL,
    payment_link TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, paid
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool metadata
CREATE TABLE pool_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id INTEGER UNIQUE NOT NULL,
    description TEXT,
    risk_category TEXT, -- low, medium, high
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## MVP Flow Summary

### 1. Exporter Flow
```
Connect Wallet → Register (fill profile) → Create Invoice → Wait Approval
→ Wait Pool Funding → Withdraw at 70%+ (manual) OR Auto-receive at 100%
→ System generates payment link → Importer pays → Get remaining after profit distribution
```

### 2. Investor Flow
```
Connect Wallet → Register (fill profile) → Browse Pools → Invest (send ETH)
→ Wait for all invoices to be paid → Claim Returns (principal + 4%)
```

### 3. Admin Flow
```
Verify Exporters → Review Invoices → Approve/Reject
→ Group approved invoices → Create Pool
→ Monitor funding progress → Mark invoices as paid (after importer payment)
→ Trigger profit distribution
```

---

## Development Tasks

### Phase 1: Smart Contract (Week 1-2)
- [ ] Setup Hardhat project
- [ ] Implement data structures
- [ ] Implement exporter functions
- [ ] Implement investor functions
- [ ] Implement admin functions
- [ ] Implement profit distribution
- [ ] Write unit tests
- [ ] Deploy to Lisk Sepolia

### Phase 2: Frontend Core (Week 2-3)
- [ ] Setup role-based routing
- [ ] Implement wallet connection
- [ ] Exporter onboarding page
- [ ] Investor onboarding page
- [ ] Admin dashboard

### Phase 3: Invoice & Pool (Week 3-4)
- [ ] Create invoice form + IPFS upload
- [ ] Invoice list & detail pages
- [ ] Admin invoice review
- [ ] Create pool page
- [ ] Pool list & detail pages

### Phase 4: Investment & Distribution (Week 4-5)
- [ ] Invest in pool functionality
- [ ] My investments page
- [ ] Withdrawal functionality
- [ ] Payment link generation
- [ ] Profit distribution

### Phase 5: Testing & Polish (Week 5-6)
- [ ] Integration testing
- [ ] UI polish
- [ ] Error handling
- [ ] Deploy to production

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SEATrax

# Blockchain
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=4202
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com

# Panna SDK
NEXT_PUBLIC_PANNA_CLIENT_ID=
NEXT_PUBLIC_PANNA_PARTNER_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Pinata IPFS
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
PINATA_JWT=

# Currency API
CURRENCY_FREAKS_API_KEY=

# Platform Treasury
PLATFORM_TREASURY_ADDRESS=0x...
```

---

## Claude Code Commands

```bash
# Start development
claude

# Example prompts:
> Read MVP_DEVELOPMENT.md and create the smart contract
> Implement the exporter registration page
> Create the invoice form with IPFS upload
> Build the pool creation admin page
> Implement the invest function with USD to ETH conversion
> Fix the withdrawal logic
> Write tests for profit distribution
```

---

## Questions Resolved ✅

| Question | Answer |
|----------|--------|
| Payment Gateway | CurrencyFreaks API for USD→ETH conversion |
| Email Service | Not needed, just generate payment link |
| Withdrawal | Manual at 70%, Auto at 100% |
| Pool | Fixed once created by admin |
| Investment Limits | No limits for MVP |
| KYC | Basic profile data, wallet login |

---

Ready to start development! 🚀
