# SEATrax - Copilot Instructions

## Project Overview

SEATrax adalah **Shipping Invoice Funding Platform** berbasis blockchain yang menghubungkan:
- **Exporter**: Submit shipping invoice untuk mendapatkan loan
- **Investor**: Invest di pool invoice yang dikurasi admin
- **Admin**: Manage master data, kurasi invoice, konfigurasi sistem

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Lisk Sepolia, Panna SDK
- **Smart Contracts**: Multiple contract architecture with specialized responsibilities
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

### Multiple Contract System

```
AccessControl (Core Role Management)
    ├── InvoiceNFT (Invoice Tokenization)
    ├── PoolNFT (Pool Tokenization)
    ├── PoolFundingManager (Investment & Distribution)
    ├── PaymentOracle (Payment Verification)
    └── PlatformAnalytics (Metrics & Reporting)
```

### Contract Addresses

```env
ACCESS_CONTROL="0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F"
INVOICE_NFT="0x8Da2dF6050158ae8B058b90B37851323eFd69E16"
POOL_NFT="0x317Ce254731655E19932b9EFEAf7eeA31F0775ad"
POOL_FUNDING_MANAGER="0xbD5f292F75D22996E7A4DD277083c75aB29ff45C"
PAYMENT_ORACLE="0x7894728174E53Df9Fec402De07d80652659296a8"
PLATFORM_ANALYTICS="0xb77C5C42b93ec46A323137B64586F0F8dED987A9"
```

### Invoice NFT Structure

```solidity
struct Invoice {
    string exporterCompany;
    address exporterWallet;
    string importerCompany;
    uint256 shippingDate;
    uint256 shippingAmount;         // Total shipping value
    uint256 loanAmount;             // Requested loan amount
    uint256 amountInvested;         // Funds allocated from pools
    uint256 amountWithdrawn;        // Exporter withdrawals
    InvoiceStatus status;
    // Off-chain: importer payment reference
}

enum InvoiceStatus {
    Pending,
    Finalized,
    Fundraising,
    Funded,
    Paid,
    Cancelled
}
```

### Pool NFT Structure

```solidity
struct Pool {
    string name;
    uint256 startDate;
    uint256 endDate;
    uint256[] invoiceIds;           // Array of Invoice NFT IDs
    uint256 totalLoanAmount;        // Sum of invoice loans
    uint256 totalShippingAmount;    // Sum of shipping amounts
    uint256 amountInvested;         // Total investor funds
    uint256 amountDistributed;      // Funds sent to invoices
    uint256 feePaid;                // Platform fees paid
    PoolStatus status;
}

enum PoolStatus {
    Open,
    Fundraising,
    PartiallyFunded,
    Funded,
    Settling,
    Completed
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

### AccessControl Contract
```solidity
function grantExporterRole(address account) external; // Admin only
function grantInvestorRole(address account) external; // Admin only
function getUserRoles(address account) external view returns (bool hasAdminRole, bool hasExporterRole, bool hasInvestorRole);
```

### InvoiceNFT Contract
```solidity
function mintInvoice(string exporterCompany, string importerCompany, uint256 shippingAmount, uint256 loanAmount, uint256 shippingDate) external returns (uint256 invoiceId); // Exporters only
function finalizeInvoice(uint256 invoiceId) external; // Invoice owner only
function withdrawFunds(uint256 invoiceId, uint256 amount) external; // Invoice owner only
function getInvoice(uint256 invoiceId) external view returns (Invoice);
function getInvoicesByExporter(address exporter) external view returns (uint256[] invoiceIds);
function getAvailableWithdrawal(uint256 invoiceId) external view returns (uint256);
```

### PoolNFT Contract
```solidity
function createPool(string name, uint256[] invoiceIds) external returns (uint256 poolId); // Admin only
function finalizePool(uint256 poolId) external; // Admin only
function getPool(uint256 poolId) external view returns (Pool);
function getPoolsByStatus(PoolStatus status) external view returns (uint256[] poolIds);
```

### PoolFundingManager Contract
```solidity
function investInPool(uint256 poolId, uint256 amount) external; // Investors only, min 1000 tokens
function allocateFundsToInvoices(uint256 poolId) external; // Admin only, when ≥70% funded
function distributeProfits(uint256 poolId) external; // Admin only, when all invoices paid
function claimInvestorReturns(uint256 poolId) external; // Investors only
function getPoolFundingPercentage(uint256 poolId) external view returns (uint256);
function getInvestorReturns(uint256 poolId, address investor) external view returns (uint256);
```

### PaymentOracle Contract
```solidity
function submitPaymentConfirmation(uint256 invoiceId) external; // Oracle only
function markInvoicePaid(uint256 invoiceId) external; // Admin/Oracle only
```

### PlatformAnalytics Contract
```solidity
function updatePlatformMetrics() external;
function updateInvestorPortfolio(address investor) external;
function updatePoolPerformance(uint256 poolId) external;
function getTotalValueLocked() external view returns (uint256);
function getInvestorStats(address investor) external view returns (uint256 totalInvested, uint256 totalReturns, uint256 activeInvestments);
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
2. Use multiple contract hooks for specific contract interactions:
   - `useAccessControl` for role management
   - `useInvoiceNFT` for invoice operations
   - `usePoolNFT` for pool operations
   - `usePoolFunding` for investment operations
   - `usePaymentOracle` for payment verification
   - `usePlatformAnalytics` for metrics
3. Use `usePanna` hook for wallet connection
4. Handle loading and error states
5. Show transaction status with toast notifications

### When implementing smart contract calls:
1. Always convert USD to ETH using `usdToWei()` from `@/lib/currency`
2. Use appropriate contract based on operation:
   - Invoice creation/withdrawal → InvoiceNFT
   - Pool creation/management → PoolNFT
   - Investment/funding → PoolFundingManager
   - Role assignment → AccessControl
   - Payment confirmation → PaymentOracle
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
# Multiple Smart Contracts
ACCESS_CONTROL=0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F
INVOICE_NFT=0x8Da2dF6050158ae8B058b90B37851323eFd69E16
POOL_NFT=0x317Ce254731655E19932b9EFEAf7eeA31F0775ad
POOL_FUNDING_MANAGER=0xbD5f292F75D22996E7A4DD277083c75aB29ff45C
PAYMENT_ORACLE=0x7894728174E53Df9Fec402De07d80652659296a8
PLATFORM_ANALYTICS=0xb77C5C42b93ec46A323137B64586F0F8dED987A9

# Legacy (deprecated)
NEXT_PUBLIC_CONTRACT_ADDRESS=

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
