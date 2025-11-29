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

## Phase 1: Smart Contract Development

### 1.1 Setup Hardhat Project
- [ ] Create `contracts/` directory in project root
- [ ] Initialize Hardhat: `npx hardhat init`
- [ ] Install dependencies: OpenZeppelin, Hardhat plugins
- [ ] Configure for Lisk Sepolia network

### 1.2 Implement SEATrax.sol
- [ ] Import OpenZeppelin: ERC721, AccessControl, ReentrancyGuard
- [ ] Define Invoice struct with all fields
- [ ] Define Pool struct with all fields
- [ ] Define Investment struct
- [ ] Implement storage mappings
- [ ] Implement ADMIN_ROLE constant

### 1.3 Exporter Functions
- [ ] `registerExporter()` - register wallet as exporter
- [ ] `createInvoice()` - mint invoice NFT with all data
- [ ] `withdrawFunds()` - withdraw when ≥70% funded
- [ ] `getExporterInvoices()` - get all invoices by exporter

### 1.4 Investor Functions
- [ ] `registerInvestor()` - register wallet as investor
- [ ] `invest()` - invest ETH in pool, record investment
- [ ] `claimReturns()` - claim principal + yield after completion
- [ ] `getInvestorPools()` - get all pools investor participated

### 1.5 Admin Functions
- [ ] `verifyExporter()` - mark exporter as verified
- [ ] `approveInvoice()` - approve pending invoice
- [ ] `rejectInvoice()` - reject pending invoice
- [ ] `createPool()` - create pool with selected invoices
- [ ] `distributeToInvoice()` - manual distribution at 70%+
- [ ] `markInvoicePaid()` - update invoice status to PAID
- [ ] `distributeProfits()` - distribute 4% to investors, 1% fee

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

### 1.9 Testing & Deployment
- [ ] Write unit tests for all functions
- [ ] Test edge cases (70% threshold, 100% auto-distribute)
- [ ] Deploy to Lisk Sepolia testnet
- [ ] Verify contract on block explorer
- [ ] Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`
- [ ] Update ABI in `src/lib/contract.ts`

---

## Phase 2: Authentication & Onboarding

### 2.1 Login Page
- [ ] Create `src/app/(auth)/login/page.tsx`
- [ ] Connect wallet button
- [ ] Check if wallet is registered (exporter/investor/admin)
- [ ] Redirect to appropriate dashboard or onboarding

### 2.2 Exporter Onboarding
- [ ] Create `src/app/onboarding/exporter/page.tsx`
- [ ] Form fields: Company Name, Tax ID, Country, Export License
- [ ] Wallet address auto-filled from connected wallet
- [ ] Submit: save to Supabase + call `registerExporter()` on contract
- [ ] Redirect to exporter dashboard

### 2.3 Investor Onboarding
- [ ] Create `src/app/onboarding/investor/page.tsx`
- [ ] Form fields: Name, Address
- [ ] Wallet address auto-filled from connected wallet
- [ ] Submit: save to Supabase + call `registerInvestor()` on contract
- [ ] Redirect to investor dashboard

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
- [ ] Fetch invoices from contract using `getExporterInvoices()`
- [ ] Display as cards with status badges
- [ ] Filter by status
- [ ] Link to invoice detail

### 3.3 Create Invoice Page
- [ ] Create `src/app/exporter/invoices/new/page.tsx`
- [ ] Form fields:
  - [ ] Invoice Number
  - [ ] Invoice Date, Due Date
  - [ ] Total Amount (Invoice Value)
  - [ ] Currency (USD)
  - [ ] Goods Description
  - [ ] Importer Name, Importer License, Importer Email
  - [ ] Loan Amount Requested
  - [ ] Upload: Purchase Order, Bill of Lading (to IPFS)
- [ ] Convert amounts to cents before contract call
- [ ] Call `createInvoice()` on contract
- [ ] Save metadata to Supabase `invoice_metadata` table
- [ ] Redirect to invoice list

### 3.4 Invoice Detail Page
- [ ] Create `src/app/exporter/invoices/[id]/page.tsx`
- [ ] Show all invoice details
- [ ] Show funding progress bar
- [ ] Show status badge
- [ ] If status=FUNDED and ≥70%: Show "Withdraw" button
- [ ] Call `canWithdraw()` to get withdrawable amount
- [ ] Call `withdrawFunds()` on button click
- [ ] Show withdrawal history

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
- [ ] Fetch open pools from contract `getAllOpenPools()`
- [ ] Display as cards with:
  - [ ] Pool name, dates
  - [ ] Total loan amount (in USD)
  - [ ] Funding progress %
  - [ ] Number of invoices
  - [ ] Expected yield (4%)
- [ ] Filter by risk category (from Supabase metadata)
- [ ] Link to pool detail

### 4.3 Pool Detail + Invest Page
- [ ] Create `src/app/investor/pools/[id]/page.tsx`
- [ ] Show pool details
- [ ] Show invoices in pool (list)
- [ ] Show current investors and amounts
- [ ] Funding progress with percentage
- [ ] Investment form:
  - [ ] Input: Amount in USD
  - [ ] Auto-convert to ETH using `usdToEth()`
  - [ ] Show estimated returns (amount + 4%)
  - [ ] "Invest" button
- [ ] Call `invest()` with ETH value
- [ ] Show transaction status

### 4.4 My Investments Page
- [ ] Create `src/app/investor/investments/page.tsx`
- [ ] Fetch from `getInvestorPools()`
- [ ] For each pool, get investment details
- [ ] Show: Pool name, Amount, Percentage, Status
- [ ] Show expected returns

### 4.5 Claim Returns Page
- [ ] Create `src/app/investor/returns/page.tsx`
- [ ] List completed pools where user invested
- [ ] Show claimable amount (principal + 4% yield)
- [ ] "Claim" button for each
- [ ] Call `claimReturns()` on click
- [ ] Show claimed history

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
- [ ] "Verify" button
- [ ] Call `verifyExporter()` + update Supabase
- [ ] Filter: Pending, Verified, All

### 5.3 Review Invoices Page
- [ ] Create `src/app/admin/invoices/page.tsx`
- [ ] Fetch pending invoices from `getAllPendingInvoices()`
- [ ] Display with key details
- [ ] Link to detail page

### 5.4 Invoice Review Detail
- [ ] Create `src/app/admin/invoices/[id]/page.tsx`
- [ ] Show all invoice details
- [ ] Show uploaded documents (from IPFS)
- [ ] "Approve" and "Reject" buttons
- [ ] Call respective contract functions
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
- [ ] Fetch approved invoices `getAllApprovedInvoices()`
- [ ] Selectable list of invoices (checkbox)
- [ ] Show totals: Selected count, Total loan amount, Total shipping amount
- [ ] Submit: Call `createPool()` + save metadata to Supabase
- [ ] Redirect to pool list

### 5.7 Pool Detail + Distribute
- [ ] Create `src/app/admin/pools/[id]/page.tsx`
- [ ] Show pool details
- [ ] Show funding progress
- [ ] List invoices with individual funding status
- [ ] If pool ≥70%: Show "Distribute" section
  - [ ] For each unfunded invoice, show "Distribute" button
  - [ ] Call `distributeToInvoice()`
- [ ] If all invoices PAID: Show "Distribute Profits" button
  - [ ] Call `distributeProfits()`

### 5.8 Payment Tracking Page
- [ ] Create `src/app/admin/payments/page.tsx`
- [ ] List invoices in WITHDRAWN status
- [ ] Show payment link for each
- [ ] "Mark as Paid" button
- [ ] Call `markInvoicePaid()` on contract
- [ ] Update payment status in Supabase

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
src/lib/contract.ts          # Update with real ABI after deployment
src/lib/supabase.ts          # Add more helper functions as needed
src/hooks/useContract.ts     # Add any missing functions
src/app/page.tsx             # Update landing page
src/app/layout.tsx           # Add role checking
src/components/header.tsx    # Add role-based navigation
```

---

## Quick Reference: Contract Function Calls

```typescript
// Exporter
await contract.registerExporter();
await contract.createInvoice(invoiceValue, loanAmount, invoiceDate, dueDate, ipfsHash);
await contract.withdrawFunds(invoiceId);
const invoices = await contract.getExporterInvoices(address);

// Investor
await contract.registerInvestor();
await contract.invest(poolId, { value: ethAmount });
await contract.claimReturns(poolId);
const pools = await contract.getInvestorPools(address);

// Admin
await contract.verifyExporter(exporterAddress);
await contract.approveInvoice(invoiceId);
await contract.rejectInvoice(invoiceId);
await contract.createPool(name, invoiceIds, startDate, endDate);
await contract.distributeToInvoice(poolId, invoiceId, amount);
await contract.markInvoicePaid(invoiceId);
await contract.distributeProfits(poolId);

// View
const invoice = await contract.getInvoice(invoiceId);
const pool = await contract.getPool(poolId);
const investment = await contract.getInvestment(poolId, investor);
const percentage = await contract.getPoolFundingPercentage(poolId);
const [canWithdraw, amount] = await contract.canWithdraw(invoiceId);
const openPools = await contract.getAllOpenPools();
const pendingInvoices = await contract.getAllPendingInvoices();
```
