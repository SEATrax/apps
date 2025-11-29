# SEATrax - Copilot Instructions

## Project Overview

SEATrax adalah **Shipping Invoice Funding Platform** berbasis blockchain yang menghubungkan:
- **Exporter**: Submit shipping invoice untuk mendapatkan loan
- **Investor**: Invest di pool invoice yang dikurasi admin
- **Admin**: Manage master data, kurasi invoice, konfigurasi sistem

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Lisk Sepolia, Panna SDK
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

## Data Structures

### Invoice NFT (On-chain)

```solidity
struct Invoice {
    uint256 tokenId;
    address exporter;
    string exporterCompany;
    string importerCompany;
    string importerEmail;           // For payment notification
    uint256 shippingDate;
    uint256 shippingAmount;         // Total shipping value (USD cents)
    uint256 loanAmount;             // Requested loan (USD cents)
    uint256 amountInvested;         // Received from pool (ETH wei)
    uint256 amountWithdrawn;        // Withdrawn by exporter (ETH wei)
    InvoiceStatus status;
    uint256 poolId;                 // 0 if not in pool
    string ipfsHash;                // Documents
    uint256 createdAt;
}

enum InvoiceStatus {
    PENDING,      // 0
    APPROVED,     // 1
    IN_POOL,      // 2
    FUNDED,       // 3
    WITHDRAWN,    // 4
    PAID,         // 5
    COMPLETED,    // 6
    REJECTED      // 7
}
```

### Pool NFT (On-chain)

```solidity
struct Pool {
    uint256 poolId;
    string name;
    uint256 startDate;
    uint256 endDate;
    uint256 totalLoanAmount;        // Sum of invoice loans (USD cents)
    uint256 totalShippingAmount;    // Sum of invoice shipping (USD cents)
    uint256 amountInvested;         // Total ETH invested (wei)
    uint256 amountDistributed;      // Amount sent to invoices (wei)
    uint256 feePaid;                // Platform fee collected (wei)
    PoolStatus status;
    uint256[] invoiceIds;
    uint256 createdAt;
}

enum PoolStatus {
    OPEN,         // 0 - Accepting investments
    FUNDED,       // 1 - 100% funded
    COMPLETED,    // 2 - Profits distributed
    CANCELLED     // 3
}
```

### Investment Record (On-chain mapping)

```solidity
struct Investment {
    address investor;
    uint256 poolId;
    uint256 amount;                 // ETH invested (wei)
    uint256 percentage;             // Basis points (10000 = 100%)
    uint256 timestamp;
    bool returnsClaimed;
}

// Mappings
mapping(uint256 => mapping(address => Investment)) public investments;
mapping(uint256 => address[]) public poolInvestors;
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

### Exporter Functions
```solidity
function registerExporter() external;
function createInvoice(exporterCompany, importerCompany, importerEmail, shippingDate, shippingAmount, loanAmount, ipfsHash) returns (uint256 tokenId);
function withdrawFunds(uint256 invoiceId) external;
```

### Investor Functions
```solidity
function registerInvestor() external;
function invest(uint256 poolId) external payable;
function claimReturns(uint256 poolId) external;
```

### Admin Functions
```solidity
function verifyExporter(address exporter) external;
function approveInvoice(uint256 invoiceId) external;
function rejectInvoice(uint256 invoiceId) external;
function createPool(name, invoiceIds[], startDate, endDate) returns (uint256 poolId);
function distributeToInvoice(poolId, invoiceId, amount) external;  // Manual at 70%
function markInvoicePaid(uint256 invoiceId) external;
function distributeProfits(uint256 poolId) external;
```

### View Functions
```solidity
function getInvoice(uint256 invoiceId) returns (Invoice);
function getPool(uint256 poolId) returns (Pool);
function getInvestment(poolId, investor) returns (Investment);
function getPoolFundingPercentage(poolId) returns (uint256);
function canWithdraw(invoiceId) returns (bool, uint256);
function getAllOpenPools() returns (uint256[]);
function getAllPendingInvoices() returns (uint256[]);
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
2. Use `useContract` hook for all smart contract interactions
3. Use `usePanna` hook for wallet connection
4. Handle loading and error states
5. Show transaction status with toast notifications

### When implementing smart contract calls:
1. Always convert USD to ETH using `usdToWei()` from `@/lib/currency`
2. Handle transaction confirmation and errors
3. Update UI optimistically where appropriate
4. Refresh data after successful transactions

### File naming conventions:
- Pages: `page.tsx`
- Components: `kebab-case.tsx` (e.g., `invoice-card.tsx`)
- Hooks: `camelCase.ts` (e.g., `useContract.ts`)
- Types: defined in `@/types/index.ts`

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_CONTRACT_ADDRESS=
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
