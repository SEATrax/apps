# SEATrax - Copilot Instructions

## Project Overview

SEATrax adalah **Shipping Invoice Funding Platform** berbasis blockchain yang menghubungkan:
- **Exporter**: Submit shipping invoice untuk mendapatkan loan
- **Investor**: Invest di pool invoice yang dikurasi admin
- **Admin**: Manage master data, kurasi invoice, konfigurasi sistem

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Lisk Sepolia, Panna SDK
- **Smart Contract**: SEATrax.sol - Unified contract with all functionality
- **Backend**: Supabase (PostgreSQL)
- **Storage**: Pinata (IPFS)
- **Currency API**: CurrencyFreaks (USD ↔ ETH conversion)

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Role selection
│   ├── onboarding/               # Exporter & Investor registration
│   │   ├── exporter/
│   │   └── investor/
│   ├── exporter/                 # Exporter pages
│   │   ├── invoices/
│   │   │   ├── new/              # Create invoice
│   │   │   └── [id]/             # Invoice detail + withdraw
│   │   └── payments/
│   ├── investor/                 # Investor pages
│   │   ├── pools/
│   │   │   └── [id]/             # Pool detail + invest
│   │   ├── investments/
│   │   └── returns/
│   ├── admin/                    # Admin pages
│   │   ├── exporters/            # Verify exporters
│   │   ├── invoices/             # Review invoices
│   │   │   └── [id]/
│   │   ├── pools/
│   │   │   ├── new/              # Create pool
│   │   │   └── [id]/             # Pool detail + distribute
│   │   └── payments/
│   ├── pay/[invoiceId]/          # Payment page for importer
│   └── api/
│       ├── currency/
│       └── payment/[invoiceId]/
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── invoice/
│   ├── pool/
│   └── common/
├── hooks/
│   ├── usePanna.ts               # Wallet connection
│   └── useContract.ts            # Smart contract interactions
├── lib/
│   ├── contract.ts               # Contract ABI
│   ├── currency.ts               # USD ↔ ETH conversion
│   ├── supabase.ts               # Database client
│   ├── pinata.ts                 # IPFS upload
│   └── utils.ts
├── providers/
├── config/
└── types/
```

---

## Core Business Logic

### 1. User Roles

| Role | Capabilities |
|------|-------------|
| **Exporter** | Register, create invoice, withdraw funds |
| **Investor** | Register, browse pools, invest, claim returns |
| **Admin** | Verify exporters, approve/reject invoices, create pools, distribute funds, mark paid |

### 2. Invoice Lifecycle

```
PENDING → APPROVED → IN_POOL → FUNDED → WITHDRAWN → PAID → COMPLETED
                 ↘ REJECTED
```

### 3. Pool Lifecycle

```
OPEN (accepting investments) → FUNDED (100% invested) → COMPLETED (profits distributed)
```

### 4. Key Business Rules

- **70% Threshold**: Exporter can withdraw when invoice is 70%+ funded
- **100% Auto-distribute**: When pool hits 100%, funds auto-sent to exporters
- **Profit Distribution**: 4% to investors, 1% platform fee, rest to exporters
- **Investment Tracking**: Record investor address, amount, percentage, timestamp on-chain

---

## Smart Contract Architecture

### Unified Contract System

```
SEATrax.sol (All-in-One Contract)
    ├── Role Management (Admin, Exporter, Investor)
    ├── Invoice NFT (ERC-721 tokenization)
    ├── Pool NFT (ERC-721 tokenization)
    ├── Investment & Distribution
    ├── Payment Tracking
    └── Platform Analytics
```

### Contract Address

```env
NEXT_PUBLIC_CONTRACT_ADDRESS="0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2"
```

**Deployed**: November 29, 2025  
**Network**: Lisk Sepolia  
**Explorer**: [View on BlockScout](https://sepolia-blockscout.lisk.com/address/0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2)

### Invoice NFT Structure

```solidity
struct Invoice {
    string exporterCompany;
    address exporterWallet;
    string importerCompany;
    string importerEmail;           // NEW: For payment notifications
    uint256 shippingDate;
    uint256 shippingAmount;         // Total shipping value
    uint256 loanAmount;             // Requested loan amount
    uint256 amountInvested;         // Funds allocated from pools
    uint256 amountWithdrawn;        // Exporter withdrawals
    string ipfsHash;                // NEW: Document storage reference
    InvoiceStatus status;
}

enum InvoiceStatus {
    PENDING,        // 0: Newly created
    APPROVED,       // 1: Admin approved
    IN_POOL,        // 2: Added to pool
    FUNDED,         // 3: Investment received
    WITHDRAWN,      // 4: Exporter withdrew funds
    PAID,           // 5: Importer paid
    COMPLETED,      // 6: Profits distributed
    REJECTED        // 7: Admin rejected
}
```

### Pool NFT Structure

```solidity
struct Pool {
    uint256 poolId;                 // Unique pool identifier
    string name;
    uint256 startDate;              // Pool opening date
    uint256 endDate;                // Pool closing date
    uint256[] invoiceIds;           // Array of Invoice NFT IDs
    uint256 totalLoanAmount;        // Sum of invoice loans
    uint256 totalShippingAmount;    // Sum of shipping amounts
    uint256 amountInvested;         // Total investor funds
    uint256 amountDistributed;      // Funds sent to invoices
    uint256 feePaid;                // Platform fees paid
    PoolStatus status;
}

enum PoolStatus {
    OPEN,           // 0: Accepting investments
    FUNDED,         // 1: 100% funded, auto-distributed
    COMPLETED,      // 2: All invoices paid, profits distributed
    CANCELLED       // 3: Pool cancelled by admin
}
```

### Investment Tracking

```solidity
// In PoolFundingManager contract
mapping(address investor => uint256 amountInvestedInPool) public investorAmounts;
mapping(uint256 invoiceId => uint256 amountAllocatedFromPool) public invoiceAllocations;
mapping(address investor => mapping(uint256 invoiceId => uint256 amount)) public investorInvoiceAllocations;
```

### Database Tables (Supabase)

```sql
-- Exporter profiles
exporters (id, wallet_address, company_name, tax_id, country, export_license, is_verified, created_at)

-- Investor profiles
investors (id, wallet_address, name, address, created_at)

-- Invoice metadata (off-chain)
invoice_metadata (id, token_id, invoice_number, goods_description, importer_name, importer_license, documents, created_at)

-- Pool metadata
pool_metadata (id, pool_id, description, risk_category, created_at)

-- Payment tracking
payments (id, invoice_id, amount_usd, payment_link, status, sent_at, paid_at, created_at)
```

---

## Smart Contract Functions

### SEATrax Contract - All Functions

#### Registration & Role Management
```solidity
function registerExporter(string company, string taxId, string country, string license) external;
function registerInvestor(string name, string investorAddress) external;
function verifyExporter(address exporter) external; // Admin only
function grantAdminRole(address account) external; // Admin only
function checkUserRoles(address account) external view returns (bool isAdmin, bool isExporter, bool isInvestor);
```

#### Invoice Functions
```solidity
function createInvoice(string exporterCompany, string importerCompany, string importerEmail, uint256 shippingAmount, uint256 loanAmount, uint256 shippingDate, string ipfsHash) external returns (uint256 invoiceId);
function approveInvoice(uint256 invoiceId) external; // Admin only
function rejectInvoice(uint256 invoiceId) external; // Admin only
function withdrawFunds(uint256 invoiceId) external; // All-or-nothing withdrawal
function markInvoicePaid(uint256 invoiceId) external; // Admin only
function getInvoice(uint256 invoiceId) external view returns (Invoice);
function getExporterInvoices(address exporter) external view returns (uint256[] invoiceIds);
function getAllPendingInvoices() external view returns (uint256[] invoiceIds);
function getAllApprovedInvoices() external view returns (uint256[] invoiceIds);
function canWithdraw(uint256 invoiceId) external view returns (bool);
```

#### Pool Functions
```solidity
function createPool(string name, uint256[] invoiceIds, uint256 startDate, uint256 endDate) external returns (uint256 poolId); // Admin only, auto-opens
function getPool(uint256 poolId) external view returns (Pool);
function getAllOpenPools() external view returns (uint256[] poolIds);
function getPoolInvestors(uint256 poolId) external view returns (address[] investors);
function getPoolFundingPercentage(uint256 poolId) external view returns (uint256);
```

#### Investment Functions
```solidity
function invest(uint256 poolId, uint256 amountInWei) external payable; // Uses msg.value, auto-distributes at 100%
function claimReturns(uint256 poolId) external;
function getInvestment(uint256 poolId, address investor) external view returns (uint256 amount, uint256 percentage, uint256 timestamp);
function getInvestorPools(address investor) external view returns (uint256[] poolIds);
```

#### Distribution Functions (Admin)
```solidity
function distributeToInvoice(uint256 poolId, uint256 invoiceId) external; // Manual distribution if needed
function distributeProfits(uint256 poolId) external; // After all invoices paid
```

---

## Key Implementation Details

### Currency Conversion

```typescript
// Use CurrencyFreaks API: https://api.currencyfreaks.com/v2.0/rates/latest
// Convert USD to ETH for smart contract transactions
// Store USD values in cents (integer) on-chain for precision
```

### Auto-Distribution at 100%

```solidity
function invest(uint256 poolId) external payable {
    // ... record investment ...
    
    // Check if pool is 100% funded
    if (pool.amountInvested >= _usdToEth(pool.totalLoanAmount)) {
        pool.status = PoolStatus.FUNDED;
        
        // Auto-distribute to all invoices
        for (uint i = 0; i < pool.invoiceIds.length; i++) {
            _distributeToInvoice(poolId, pool.invoiceIds[i]);
            _autoWithdrawToExporter(pool.invoiceIds[i]);
        }
    }
}
```

### Profit Distribution Formula

```
Pool Total Loan Amount: $100,000
After all invoices PAID:

Investor Returns = 4% of totalLoanAmount = $4,000
  → Distributed proportionally: investor_share = (4000 * investor_percentage) / 10000

Platform Fee = 1% of totalLoanAmount = $1,000
  → Sent to treasury address

Exporter Returns = remaining after subtracting already withdrawn amounts
  → Each exporter: (their_invoice_loan - already_withdrawn)
```

### Payment Flow

```
1. Exporter withdraws 100% of funded amount
2. System generates payment link: /pay/{invoiceId}
3. Payment link shows invoice details + amount due (loan + 4% interest)
4. Admin manually marks as PAID when importer pays
5. When all invoices in pool are PAID → trigger distributeProfits()
```

---

## Coding Guidelines

### When implementing components:
1. Use shadcn/ui components from `@/components/ui`
2. Use `useSEATrax` hook for ALL contract interactions:
   ```typescript
   import { useSEATrax } from '@/hooks';
   
   const {
     // Registration
     registerExporter, registerInvestor, verifyExporter,
     // Invoices
     createInvoice, approveInvoice, withdrawFunds,
     // Pools
     createPool, getAllOpenPools, getPool,
     // Investment
     invest, claimReturns, getInvestment,
     // Role checking
     checkUserRoles,
     // Loading states
     isLoading
   } = useSEATrax();
   ```
3. Use `usePanna` hook for wallet connection
4. Handle loading and error states
5. Show transaction status with toast notifications

### When implementing smart contract calls:
1. Always convert USD to ETH using `usdToWei()` from `@/lib/currency`
2. All functions available in single `useSEATrax` hook:
   - Registration: `registerExporter()`, `registerInvestor()`, `verifyExporter()`
   - Invoices: `createInvoice()`, `approveInvoice()`, `withdrawFunds()`
   - Pools: `createPool()`, `getPool()`, `getAllOpenPools()`
   - Investment: `invest()` (with msg.value), `claimReturns()`
   - Roles: `checkUserRoles()` returns `{isAdmin, isExporter, isInvestor}`
3. Handle transaction confirmation and errors
4. Update UI optimistically where appropriate
5. Refresh data after successful transactions

### File naming conventions:
- Pages: `page.tsx`
- Components: `kebab-case.tsx` (e.g., `invoice-card.tsx`)
- Hooks: `camelCase.ts` (e.g., `useInvoiceNFT.ts`)
- Types: defined in `@/types/index.ts`

---

## Environment Variables

```env
# SEATrax Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2

# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_PINATA_GATEWAY=
PINATA_JWT=
CURRENCY_FREAKS_API_KEY=

# Optional
NEXT_PUBLIC_PANNA_CLIENT_ID=
NEXT_PUBLIC_PANNA_PARTNER_ID=
ADMIN_ADDRESSES=0x...,0x...
PLATFORM_TREASURY_ADDRESS=
```

---

## Testing Checklist

Before marking a feature complete:
- [ ] Works with wallet connected
- [ ] Handles wallet not connected state
- [ ] Shows loading states during transactions
- [ ] Shows error messages on failure
- [ ] Updates UI after successful transaction
- [ ] Mobile responsive
- [ ] TypeScript compiles without errors
