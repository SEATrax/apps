# SEATrax Implementation Checklist

## Phase 0: Project Setup
- [ ] Clone/extract seatrax-mvp-starter
- [ ] Copy `.env.example` to `.env.local`
- [ ] Setup Supabase project
- [ ] Create database tables (see SQL below)
- [ ] Get CurrencyFreaks API key
- [ ] Setup Pinata account
- [ ] Run `npm install`
- [ ] Run `npm run dev` - verify no errors

### Supabase Tables SQL
```sql
-- Run this in Supabase SQL Editor

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

-- Invoice metadata (off-chain)
CREATE TABLE invoice_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id INTEGER UNIQUE NOT NULL,
    invoice_number TEXT NOT NULL,
    goods_description TEXT,
    importer_name TEXT NOT NULL,
    importer_license TEXT,
    documents JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool metadata
CREATE TABLE pool_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id INTEGER UNIQUE NOT NULL,
    description TEXT,
    risk_category TEXT CHECK (risk_category IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id INTEGER NOT NULL,
    amount_usd DECIMAL(20, 2) NOT NULL,
    payment_link TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid')),
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust as needed)
CREATE POLICY "Public read exporters" ON exporters FOR SELECT USING (true);
CREATE POLICY "Public read investors" ON investors FOR SELECT USING (true);
CREATE POLICY "Public read invoice_metadata" ON invoice_metadata FOR SELECT USING (true);
CREATE POLICY "Public read pool_metadata" ON pool_metadata FOR SELECT USING (true);
CREATE POLICY "Public read payments" ON payments FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Anyone can insert exporters" ON exporters FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert investors" ON investors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert invoice_metadata" ON invoice_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert pool_metadata" ON pool_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert payments" ON payments FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Anyone can update exporters" ON exporters FOR UPDATE USING (true);
CREATE POLICY "Anyone can update payments" ON payments FOR UPDATE USING (true);
```

---

## Phase 1: Multiple Smart Contract Architecture

### 1.1 Setup Hardhat Project
- [x] Create `contracts/` directory in project root
- [x] Initialize Hardhat: `npx hardhat init`
- [x] Install dependencies: OpenZeppelin, Hardhat plugins
- [x] Configure for Lisk Sepolia network

### 1.2 Core Contract Architecture (COMPLETED)
- [x] **AccessControl**: Central role management (Admin, Exporter, Investor roles)
- [x] **InvoiceNFT**: ERC721 tokenization of shipping invoices
- [x] **PoolNFT**: ERC721 tokenization of investment pools
- [x] **PoolFundingManager**: Investment logic and fund distribution
- [x] **PaymentOracle**: Payment verification system
- [x] **PlatformAnalytics**: Metrics and reporting

### 1.3 Contract Functions (COMPLETED)

**AccessControl Contract:**
- [x] `grantExporterRole(address)` - Admin assigns exporter role
- [x] `grantInvestorRole(address)` - Admin assigns investor role
- [x] `getUserRoles(address)` - Check user permissions

**InvoiceNFT Contract:**
- [x] `mintInvoice()` - Create invoice NFT (exporters only)
- [x] `finalizeInvoice()` - Mark invoice ready for funding
- [x] `withdrawFunds()` - Exporter withdrawal (≥70% funded)
- [x] `getInvoicesByExporter()` - Get invoices by owner

**PoolNFT Contract:**
- [x] `createPool()` - Create investment pool NFT (admin only)
- [x] `finalizePool()` - Open pool for investments
- [x] `getPoolsByStatus()` - Query pools by status

**PoolFundingManager Contract:**
- [x] `investInPool()` - Investor funding (min 1000 tokens)
- [x] `allocateFundsToInvoices()` - Distribute pool funds (≥70%)
- [x] `distributeProfits()` - 4% yield + 1% platform fee
- [x] `claimInvestorReturns()` - Claim investment returns

**PaymentOracle Contract:**
- [x] `markInvoicePaid()` - Confirm importer payment
- [x] `submitPaymentConfirmation()` - Oracle verification

### 1.6 Internal Functions
- [ ] `_distributeToInvoice()` - internal distribution logic
- [ ] `_autoWithdrawToExporter()` - auto-send at 100%
- [ ] `_checkAndAutoDistribute()` - check if 100% and auto-distribute
- [ ] `_usdToEth()` - currency conversion helper

### 1.7 View Functions
- [ ] `getInvoice()`, `getPool()`, `getInvestment()`
- [ ] `getPoolInvestors()`, `getPoolFundingPercentage()`
- [ ] `canWithdraw()`, `getAllOpenPools()`
- [ ] `getAllPendingInvoices()`, `getAllApprovedInvoices()`

### 1.8 Events
- [ ] InvoiceCreated, InvoiceApproved, InvoiceRejected
- [ ] PoolCreated, InvestmentMade, InvoiceFunded
- [ ] FundsWithdrawn, InvoicePaid, ProfitsDistributed, ReturnsClaimed

### 1.9 Testing & Deployment (COMPLETED)
- [x] Write unit tests for all contract functions
- [x] Test NFT tokenization and cross-contract interactions
- [x] Deploy all 6 contracts to Lisk Sepolia testnet
- [x] Verify contracts on block explorer
- [x] Update contract addresses in `.env.local`:
  - [x] ACCESS_CONTROL=0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F
  - [x] INVOICE_NFT=0x8Da2dF6050158ae8B058b90B37851323eFd69E16
  - [x] POOL_NFT=0x317Ce254731655E19932b9EFEAf7eeA31F0775ad
  - [x] POOL_FUNDING_MANAGER=0xbD5f292F75D22996E7A4DD277083c75aB29ff45C
  - [x] PAYMENT_ORACLE=0x7894728174E53Df9Fec402De07d80652659296a8
  - [x] PLATFORM_ANALYTICS=0xb77C5C42b93ec46A323137B64586F0F8dED987A9
- [x] Update ABIs in `src/lib/contract.ts` for all contracts

---

## Phase 2: Authentication & Onboarding

### 2.1 Login Page
- [x] Create `src/app/(auth)/login/page.tsx`
- [x] Panna SDK wallet connection
- [x] Check wallet roles via AccessControl contract `getUserRoles()`
- [x] Redirect to appropriate dashboard or onboarding

### 2.2 Exporter Onboarding
- [x] Create `src/app/onboarding/exporter/page.tsx`
- [x] Form fields: Company Name, Tax ID, Country, Export License
- [x] Wallet address from Panna `useActiveAccount()`
- [x] Submit: save to Supabase + admin grants role via `grantExporterRole()`
- [x] Redirect to exporter dashboard

### 2.3 Investor Onboarding
- [x] Create `src/app/onboarding/investor/page.tsx`
- [x] Form fields: Name, Address
- [x] Wallet address from Panna `useActiveAccount()`
- [x] Submit: save to Supabase + admin grants role via `grantInvestorRole()`
- [x] Redirect to investor dashboard

### 2.4 Role Guard Component
- [ ] Create `src/components/common/role-guard.tsx`
- [ ] Check wallet connection
- [ ] Check user role from Supabase
- [ ] Redirect unauthorized access
- [ ] Show loading state while checking

---

## Phase 3: Exporter Features

### 3.1 Exporter Dashboard
- [ ] Create `src/app/exporter/page.tsx`
- [ ] Stats cards: Total Invoices, Pending, Funded, Withdrawn
- [ ] Recent invoices list
- [ ] Quick actions: Create Invoice

### 3.2 Invoice List Page
- [ ] Create `src/app/exporter/invoices/page.tsx`
- [ ] Fetch invoices using InvoiceNFT `getInvoicesByExporter()`
- [ ] Display NFT-based invoice cards with status badges
- [ ] Filter by InvoiceStatus enum values
- [ ] Link to invoice detail by NFT token ID

### 3.3 Create Invoice Page
- [ ] Create `src/app/exporter/invoices/new/page.tsx`
- [ ] Form fields:
  - [ ] Exporter Company, Importer Company
  - [ ] Shipping Date, Shipping Amount, Loan Amount
  - [ ] Invoice Number, Goods Description
  - [ ] Importer License, Documents (IPFS)
- [ ] Convert USD to wei for contract call
- [ ] Call InvoiceNFT `mintInvoice()` → returns NFT tokenId
- [ ] Save metadata to Supabase `invoice_metadata` table with tokenId
- [ ] Call `finalizeInvoice()` to mark ready for funding
- [ ] Redirect to invoice list

### 3.4 Invoice Detail Page
- [ ] Create `src/app/exporter/invoices/[id]/page.tsx`
- [ ] Fetch invoice NFT data using `getInvoice(tokenId)`
- [ ] Show funding progress from `amountInvested` field
- [ ] Show status from InvoiceStatus enum
- [ ] If status=Funded and ≥70%: Show "Withdraw" button
- [ ] Call `getAvailableWithdrawal()` for withdrawable amount
- [ ] Call `withdrawFunds(tokenId, amount)` on button click
- [ ] Show withdrawal history from contract events

### 3.5 Payments Page
- [ ] Create `src/app/exporter/payments/page.tsx`
- [ ] List invoices with payment status
- [ ] Show payment links when available
- [ ] Status: Pending, Sent, Paid

---

## Phase 4: Investor Features

### 4.1 Investor Dashboard
- [ ] Create `src/app/investor/page.tsx`
- [ ] Stats: Total Invested, Active Investments, Pending Returns, Claimed
- [ ] Recent investments list
- [ ] Quick actions: Browse Pools

### 4.2 Browse Pools Page
- [ ] Create `src/app/investor/pools/page.tsx`
- [ ] Fetch pools using PoolNFT `getPoolsByStatus(Open)`
- [ ] Display pool NFT cards with:
  - [ ] Pool name, start/end dates
  - [ ] Total loan amount from `totalLoanAmount`
  - [ ] Funding progress from PoolFundingManager `getPoolFundingPercentage()`
  - [ ] Invoice count from `invoiceIds.length`
  - [ ] Expected yield (4%)
- [ ] Filter by risk category (from Supabase `pool_metadata`)
- [ ] Link to pool detail by NFT poolId

### 4.3 Pool Detail + Invest Page
- [ ] Create `src/app/investor/pools/[id]/page.tsx`
- [ ] Fetch pool NFT using PoolNFT `getPool(poolId)`
- [ ] Show invoices using InvoiceNFT `getInvoice()` for each `invoiceIds`
- [ ] Show investor amounts from PoolFundingManager mapping
- [ ] Funding progress from `getPoolFundingPercentage(poolId)`
- [ ] Investment form:
  - [ ] Input: Amount in USD (min 1000 tokens)
  - [ ] Auto-convert to ETH using `usdToWei()`
  - [ ] Show estimated returns (amount + 4%)
  - [ ] "Invest" button
- [ ] Call PoolFundingManager `investInPool(poolId, amount)`
- [ ] Auto-allocate at 100% funding via smart contract logic

### 4.4 My Investments Page
- [ ] Create `src/app/investor/investments/page.tsx`
- [ ] Query PoolFundingManager `investorAmounts` mapping
- [ ] For each pool, get pool NFT details and status
- [ ] Show: Pool name, Amount, Percentage, PoolStatus
- [ ] Calculate expected returns (4% of investment)

### 4.5 Claim Returns Page
- [ ] Create `src/app/investor/returns/page.tsx`
- [ ] List pools with PoolStatus.Completed where user invested
- [ ] Show claimable amount via `getInvestorReturns(poolId, address)`
- [ ] "Claim" button for each pool
- [ ] Call PoolFundingManager `claimInvestorReturns(poolId)`
- [ ] Show claimed history from contract events

---

## Phase 5: Admin Features

### 5.1 Admin Dashboard
- [ ] Create `src/app/admin/page.tsx`
- [ ] Stats: Exporters (pending/verified), Invoices (pending/approved), Pools (open/funded)
- [ ] Quick actions: Review Invoices, Create Pool
- [ ] Recent activity feed

### 5.2 Verify Exporters Page
- [ ] Create `src/app/admin/exporters/page.tsx`
- [ ] List pending exporters from Supabase
- [ ] Show: Company, Tax ID, Country, License
- [ ] "Grant Role" button
- [ ] Call AccessControl `grantExporterRole(address)` + update Supabase
- [ ] Filter: Pending, Verified, All

### 5.3 Review Invoices Page
- [ ] Create `src/app/admin/invoices/page.tsx`
- [ ] Fetch invoices with InvoiceStatus.Pending via InvoiceNFT
- [ ] Display invoice NFTs with key details
- [ ] Link to detail page by tokenId

### 5.4 Invoice Review Detail
- [ ] Create `src/app/admin/invoices/[id]/page.tsx`
- [ ] Show invoice NFT details from `getInvoice(tokenId)`
- [ ] Show uploaded documents (from IPFS via Supabase metadata)
- [ ] "Finalize" button (moves to Fundraising status)
- [ ] Call InvoiceNFT `finalizeInvoice(tokenId)`
- [ ] Redirect back to list

### 5.5 Manage Pools Page
- [ ] Create `src/app/admin/pools/page.tsx`
- [ ] List all pools with status
- [ ] Filter by status: Open, Funded, Completed
- [ ] Link to pool detail
- [ ] "Create Pool" button

### 5.6 Create Pool Page
- [ ] Create `src/app/admin/pools/new/page.tsx`
- [ ] Form fields: Pool Name, Start Date, End Date, Description, Risk Category
- [ ] Fetch finalized invoices (InvoiceStatus.Finalized)
- [ ] Selectable list of invoice NFTs (checkbox)
- [ ] Show totals: Selected count, Total loan/shipping amounts
- [ ] Submit: Call PoolNFT `createPool(name, invoiceIds)` → get poolId
- [ ] Save metadata to Supabase `pool_metadata` with poolId
- [ ] Call `finalizePool(poolId)` to open for investments
- [ ] Redirect to pool list

### 5.7 Pool Detail + Distribute
- [ ] Create `src/app/admin/pools/[id]/page.tsx`
- [ ] Show pool NFT details from `getPool(poolId)`
- [ ] Show funding progress via `getPoolFundingPercentage(poolId)`
- [ ] List invoices with individual funding from `amountInvested`
- [ ] If pool ≥70%: Show "Allocate Funds" section
  - [ ] Call PoolFundingManager `allocateFundsToInvoices(poolId)`
  - [ ] Auto-triggers at 100% funding
- [ ] If all invoices PAID: Show "Distribute Profits" button
  - [ ] Call PoolFundingManager `distributeProfits(poolId)`

### 5.8 Payment Tracking Page
- [ ] Create `src/app/admin/payments/page.tsx`
- [ ] List invoices in InvoiceStatus.Funded (withdrawn) status
- [ ] Show payment link for each invoice NFT
- [ ] "Mark as Paid" button
- [ ] Call PaymentOracle `markInvoicePaid(tokenId)`
- [ ] Update payment status in Supabase `payments` table

---

## Phase 6: Payment Flow

### 6.1 Payment Link Generation
- [ ] Update `src/app/api/payment/[invoiceId]/route.ts`
- [ ] Fetch invoice from contract
- [ ] Calculate amount due: loanAmount * 1.04 (include 4% interest)
- [ ] Generate payment link
- [ ] Save to Supabase `payments` table
- [ ] Return link in response

### 6.2 Payment Page (for Importer)
- [ ] Create `src/app/pay/[invoiceId]/page.tsx`
- [ ] Public page (no wallet needed)
- [ ] Show invoice details
- [ ] Show amount due in USD
- [ ] Payment instructions (for MVP: bank transfer, manual)
- [ ] "Payment Completed" info for importer

### 6.3 Auto-generate Payment Link
- [ ] In exporter withdrawal flow
- [ ] After 100% withdrawn, auto-generate payment link
- [ ] Update invoice status
- [ ] Show payment link to exporter

---

## Phase 7: Polish & Testing

### 7.1 Error Handling
- [ ] Add error boundaries
- [ ] Toast notifications for errors
- [ ] Transaction failure handling
- [ ] Network error handling

### 7.2 Loading States
- [ ] Skeleton loaders for lists
- [ ] Button loading states
- [ ] Page loading indicators
- [ ] Transaction pending modals

### 7.3 Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Fix any layout issues
- [ ] Ensure touch-friendly interactions

### 7.4 End-to-End Testing
- [ ] Test complete exporter flow
- [ ] Test complete investor flow
- [ ] Test complete admin flow
- [ ] Test profit distribution calculation

### 7.5 Security Review
- [ ] Check role-based access
- [ ] Verify contract access controls
- [ ] Review API routes security

---

## Files to Create/Modify

### New Files
```
src/app/(auth)/login/page.tsx
src/app/onboarding/exporter/page.tsx
src/app/onboarding/investor/page.tsx
src/app/exporter/page.tsx
src/app/exporter/invoices/page.tsx
src/app/exporter/invoices/new/page.tsx
src/app/exporter/invoices/[id]/page.tsx
src/app/exporter/payments/page.tsx
src/app/investor/page.tsx
src/app/investor/pools/page.tsx
src/app/investor/pools/[id]/page.tsx
src/app/investor/investments/page.tsx
src/app/investor/returns/page.tsx
src/app/admin/page.tsx
src/app/admin/exporters/page.tsx
src/app/admin/invoices/page.tsx
src/app/admin/invoices/[id]/page.tsx
src/app/admin/pools/page.tsx
src/app/admin/pools/new/page.tsx
src/app/admin/pools/[id]/page.tsx
src/app/admin/payments/page.tsx
src/app/pay/[invoiceId]/page.tsx
src/app/api/payment/[invoiceId]/route.ts
src/components/common/role-guard.tsx
src/components/invoice/invoice-card.tsx
src/components/invoice/invoice-form.tsx
src/components/invoice/invoice-status.tsx
src/components/pool/pool-card.tsx
src/components/pool/invest-modal.tsx
contracts/SEATrax.sol
```

### Files to Modify
```
src/lib/contract.ts              # Multiple contract ABIs and addresses
src/lib/supabase.ts              # Add helper functions for NFT metadata
src/hooks/useAccessControl.ts    # Role management hook
src/hooks/useInvoiceNFT.ts       # Invoice NFT operations
src/hooks/usePoolNFT.ts          # Pool NFT operations  
src/hooks/usePoolFunding.ts      # Investment and distribution logic
src/hooks/usePaymentOracle.ts    # Payment verification
src/hooks/usePlatformAnalytics.ts # Metrics and reporting
src/app/page.tsx                 # Update landing page
src/app/layout.tsx               # Add multi-contract role checking
src/components/header-simple.tsx # Add role-based navigation
```

---

## Quick Reference: Multiple Contract Function Calls

```typescript
// AccessControl Contract
await accessControl.grantExporterRole(exporterAddress);  // Admin only
await accessControl.grantInvestorRole(investorAddress);  // Admin only
const roles = await accessControl.getUserRoles(userAddress);

// InvoiceNFT Contract - Exporter Functions
const tokenId = await invoiceNFT.mintInvoice(exporterCompany, importerCompany, shippingAmount, loanAmount, shippingDate);
await invoiceNFT.finalizeInvoice(tokenId);  // Mark ready for funding
await invoiceNFT.withdrawFunds(tokenId, amount);  // When ≥70% funded
const invoice = await invoiceNFT.getInvoice(tokenId);
const exporterInvoices = await invoiceNFT.getInvoicesByExporter(exporterAddress);
const withdrawable = await invoiceNFT.getAvailableWithdrawal(tokenId);

// PoolNFT Contract - Admin Functions  
const poolId = await poolNFT.createPool(name, invoiceIds);  // Admin only
await poolNFT.finalizePool(poolId);  // Open for investments
const pool = await poolNFT.getPool(poolId);
const openPools = await poolNFT.getPoolsByStatus(PoolStatus.Open);

// PoolFundingManager Contract - Investment Functions
await poolFunding.investInPool(poolId, amount, { value: ethAmount });  // Min 1000 tokens
await poolFunding.allocateFundsToInvoices(poolId);  // Admin, when ≥70%
await poolFunding.distributeProfits(poolId);  // Admin, when all paid
await poolFunding.claimInvestorReturns(poolId);  // Investors
const percentage = await poolFunding.getPoolFundingPercentage(poolId);
const returns = await poolFunding.getInvestorReturns(poolId, investorAddress);

// PaymentOracle Contract - Payment Verification
await paymentOracle.markInvoicePaid(tokenId);  // Admin/Oracle only
await paymentOracle.submitPaymentConfirmation(tokenId);  // Oracle only

// PlatformAnalytics Contract - Metrics
await analytics.updatePlatformMetrics();
const tvl = await analytics.getTotalValueLocked();
const stats = await analytics.getInvestorStats(investorAddress);
```
