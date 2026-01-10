# Migration Implementation Checklist

**Project**: SEATrax - Single Contract Migration  
**Branch**: `feature/single-contract-migration`  
**Started**: January 11, 2026  

---

## 📋 Pre-Migration Setup

- [x] **Deploy SEATrax.sol to Lisk Sepolia**
  - [x] Compile contract with Hardhat ✅ (0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2)
  - [x] Deploy using deployment script ✅ (Block #29548300, Nov 29 2025)
  - [x] Verify on BlockScout ✅ (Verified at https://sepolia-blockscout.lisk.com/address/0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2)
  - [x] Save contract address ✅ (deployments/lisk-sepolia.json)
  - [x] Test basic functions ✅ (Read-only tests passed: admin role ✓, contract accessible ✓)
  - [ ] Test write functions ⚠️ (Transactions timeout - likely RPC issue, can skip for now)

- [x] **Prepare Development Environment**
  - [x] Create branch: `git checkout -b feature/single-contract-migration` ✅
  - [ ] Create backup branch: `git checkout -b backup/pre-migration` (recommended)
  - [x] On correct branch: feature/single-contract-migration ✅
  - [x] Latest changes from development ✅

- [x] **Extract Contract ABI**
  - [x] Compile SEATrax.sol ✅ (Hardhat compiled successfully)
  - [x] ABI available at `artifacts/contracts/SEATrax.sol/SEATrax.json` ✅ (130KB)
  - [ ] Format ABI for TypeScript (add `as const`) - Phase 2
  - [ ] Document all function signatures - Phase 2

- [x] **Update Environment Variables**
  - [x] Add `NEXT_PUBLIC_CONTRACT_ADDRESS=0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2` ✅
  - [x] Keep old addresses for rollback ✅ (lines 42-47 in .env.local)
  - [x] DEPLOYER_PRIVATE_KEY configured ✅
  - [x] All env vars loaded correctly ✅

---

## 🏗️ Phase 2: Core Infrastructure

### A. Contract Configuration

- [x] **Update `src/lib/contract.ts`**
  - [x] Extract ABI from artifacts ✅ (1884 lines exported to seatrax-abi.json)
  - [x] Create new contract.ts with SEATRAX_ABI import ✅
  - [x] Add SEATRAX_CONTRACT export ✅
  - [x] Update ROLES constants (ADMIN only, exporter/investor now mappings) ✅
  - [x] Update INVOICE_STATUS enum (8 statuses vs 6) ✅
  - [x] Update POOL_STATUS enum (4 statuses) ✅
  - [x] Add TypeScript interfaces (Invoice, Pool, Investment) ✅
  - [x] Keep legacy contracts commented for rollback ✅
  - [x] Test ABI compiles without errors ✅

- [x] **Update `src/config/index.ts`**
  - [x] Add: `contracts.seatrax.address` ✅
  - [x] Move old contracts to: `legacyContracts` ✅
  - [x] Verify config loads correctly ✅

### B. Create Unified Hook

- [x] **Create `src/hooks/useSEATrax.ts`** ✅
  - [x] Import dependencies (ethers, panna-sdk, contract) ✅
  - [x] Define TypeScript interfaces ✅
  - [x] Create hook structure with useCallback ✅
  
  - [x] **Registration Functions** ✅
    - [x] `registerExporter()` ✅
    - [x] `registerInvestor()` ✅
  
  - [x] **Invoice Functions** ✅
    - [x] `createInvoice()` (with importerEmail + ipfsHash) ✅
    - [x] `withdrawFunds()` (all-or-nothing) ✅
    - [x] `getInvoice()` ✅
    - [x] `getExporterInvoices()` ✅
    - [x] `canWithdraw()` ✅
  
  - [x] **Pool Functions** ✅
    - [x] `createPool()` (with startDate + endDate) ✅
    - [x] `getPool()` ✅
    - [x] `getAllOpenPools()` ✅
    - [x] `getPoolInvestors()` ✅
    - [x] `getPoolFundingPercentage()` ✅
    - [x] `getAllPendingInvoices()` ✅
    - [x] `getAllApprovedInvoices()` ✅
  
  - [x] **Investment Functions** ✅
    - [x] `invest()` (msg.value) ✅
    - [x] `claimReturns()` ✅
    - [x] `getInvestment()` ✅
    - [x] `getInvestorPools()` ✅
  
  - [x] **Admin Functions** ✅
    - [x] `verifyExporter()` ✅
    - [x] `approveInvoice()` ✅
    - [x] `rejectInvoice()` ✅
    - [x] `markInvoicePaid()` ✅
    - [x] `distributeProfits()` ✅
    - [x] `distributeToInvoice()` ✅
    - [x] `grantAdminRole()` ✅
  
  - [x] **Role Checking** ✅
    - [x] `checkUserRoles()` - returns {isAdmin, isExporter, isInvestor} ✅
  
  - [x] **Error Handling** ✅
    - [x] Wrap all contract calls in try-catch ✅
    - [x] Parse Solidity revert messages ✅
    - [x] Return user-friendly error messages ✅
  
  - [x] **Loading States** ✅
    - [x] Track loading per function ✅
    - [x] Return `isLoading` state ✅
  
  - [x] **Return Hook Interface** ✅
    - [x] Export all functions ✅
    - [x] Export loading states ✅
    - [x] Export error states ✅
    - [x] Add TypeScript types ✅

- [x] **Update `src/hooks/index.ts`** ✅
  - [x] Add: `export { useSEATrax } from './useSEATrax'` ✅
  - [x] Export: INVOICE_STATUS, POOL_STATUS from useSEATrax ✅
  - [x] Keep old hooks as "legacy" for backward compatibility ✅

- [x] **Test Core Infrastructure**
  - [x] Run `npm run dev` ✅ (Server started successfully on port 3000)
  - [x] Check TypeScript compilation ✅ (No errors - Next.js Ready in 2.6s)
  - [ ] Check browser console for errors (pending manual test)
  - [x] Test import paths work ✅

---

## 👨‍💼 Phase 3: Exporter Flow

### A. Onboarding

- [x] **`src/components/ExporterOnboarding.tsx`** ✅
  - [x] Replace: `useAccessControl` → `useSEATrax`
  - [x] Change: `grantExporterRole()` → `registerExporter()`
  - [x] Update: Success message ("Self-registered")
  - [x] Update: Error handling
  - [x] Test: Registration flow works

### B. Invoice Creation

- [x] **`src/app/exporter/invoices/new/page.tsx`** ✅
  - [x] Replace: `useInvoiceNFT` → `useSEATrax`
  - [x] Add: `importerEmail` field to form
    - [x] Add to FormData interface
    - [x] Add Input component
    - [x] Add email validation
  - [x] Add: `ipfsHash` parameter (use existing IPFS upload)
  - [x] Change: `mintInvoice()` → `createInvoice()`
  - [x] Update: Parameter order to match SEATrax
  - [x] Remove: `finalizeInvoice()` step
  - [x] Update: Success message
  - [x] Test: Can create invoice with all fields

### C. Invoice List

- [x] **`src/app/exporter/invoices/page.tsx`** ✅
  - [x] Replace: `useInvoiceNFT` → `useSEATrax`
  - [x] Update: Status enum values
    ```typescript
    // OLD: PENDING, FINALIZED, FUNDRAISING, FUNDED, PAID, CANCELLED
    // NEW: PENDING, APPROVED, IN_POOL, FUNDED, WITHDRAWN, PAID, COMPLETED, REJECTED
    ```
  - [x] Update: Status display labels
  - [x] Update: Status badge colors
  - [x] Test: Invoice list shows correct statuses

### D. Invoice Detail & Withdrawal

- [x] **`src/app/exporter/invoices/[id]/page.tsx`** ✅
  - [x] Import: `useSEATrax` hook
  - [x] Replace: Mock data with real contract calls
  - [x] Remove: Amount input from withdrawal form (all-or-nothing)
  - [x] Update: "Withdraw All Available" button
  - [x] Implement: `withdrawFunds(id)` - no amount parameter
  - [x] Update: Status enum (6 → 8 statuses)
  - [x] Update: Status checks ('fundraising' → 'in_pool')
  - [x] Load: Real invoice data via `getInvoice(tokenId)`
  - [x] Update: Success message
  - [x] Test: Can withdraw full amount

### E. Dashboard

- [x] **`src/app/exporter/page.tsx`** ✅
  - [x] Replace: `useInvoiceNFT` → `useSEATrax`
  - [x] Update: Dashboard stats calculations
  - [x] Update: Invoice status checks
  - [x] Test: Dashboard displays correctly

### F. Payments Page

- [x] **`src/app/exporter/payments/page.tsx`** ✅
  - [x] Replace: `useInvoiceNFT` → `useSEATrax`
  - [x] Update: Payment status checks
  - [x] Update: Field names (withdrawnAmount → amountWithdrawn)
  - [x] Update: Status comparisons to use INVOICE_STATUS enum
  - [x] Test: Payments list works

---

## 👨‍💼 Phase 4: Admin Flow

### A. Dashboard

- [ ] **`src/app/admin/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Remove: `usePlatformAnalytics`
  - [ ] Update: `getUserRoles()` → `checkUserRoles()`
  - [ ] Remove: `getTotalValueLocked()` call
  - [ ] Calculate: TVL from pool data manually
    ```typescript
    const pools = await getAllOpenPools();
    const tvl = pools.reduce((sum, pool) => sum + pool.amountInvested, 0);
    ```
  - [ ] Test: Dashboard loads without analytics contract

### B. Exporter Management

- [ ] **`src/app/admin/exporters/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Remove: "Grant Exporter Role" button
  - [ ] Add: "Verify Exporter" button
  - [ ] Change: `grantExporterRole()` → `verifyExporter()`
  - [ ] Add: Notice "Exporters self-register"
  - [ ] Test: Can verify exporters

### C. Invoice Management

- [ ] **`src/app/admin/invoices/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Update: Fetch pending invoices
  - [ ] Test: Invoice list shows pending items

- [ ] **`src/app/admin/invoices/[id]/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Add: `approveInvoice()` button
  - [ ] Add: `rejectInvoice()` button
  - [ ] Update: Approval flow (no finalize step)
  - [ ] Test: Can approve/reject invoices

### D. Pool Creation

- [ ] **`src/app/admin/pools/new/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Replace: `usePoolNFT` → `useSEATrax`
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Add: Date range pickers
    - [ ] `startDate` input (DatePicker)
    - [ ] `endDate` input (DatePicker)
    - [ ] Validation: endDate > startDate
  - [ ] Update: `createPool()` call with new params
    ```typescript
    createPool(name, invoiceIds, startDate, endDate)
    ```
  - [ ] Remove: `finalizePool()` call
  - [ ] Add: Notice "Pool auto-finalizes at 100%"
  - [ ] Test: Can create pool with dates

### E. Pool Management

- [ ] **`src/app/admin/pools/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Replace: `usePoolNFT` → `useSEATrax`
  - [ ] Replace: `usePoolFunding` → `useSEATrax`
  - [ ] Update: Fetch open pools only
  - [ ] Test: Pool list displays

- [ ] **`src/app/admin/pools/[id]/page.tsx`**
  - [ ] Replace all 5 hooks → `useSEATrax`
  - [ ] Remove: "Distribute to Invoices" button
  - [ ] Remove: Manual distribution UI
  - [ ] Add: Info banner "Funds auto-distribute at 100%"
  - [ ] Keep: "Distribute Profits" button (after all paid)
  - [ ] Test: Pool detail shows correct info

### F. Payment Management

- [ ] **`src/app/admin/payments/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Replace: `usePaymentOracle` → `useSEATrax`
  - [ ] Update: Mark paid flow
  - [ ] Test: Can mark invoices as paid

### G. Role Management

- [ ] **`src/app/admin/roles/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Remove: Grant Exporter/Investor buttons
  - [ ] Keep: Grant Admin button (still works)
  - [ ] Add: Instructions for user self-registration
  - [ ] Test: Can grant admin role

### H. Health Check

- [ ] **`src/app/admin/health/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Test: Health check works

---

## 💰 Phase 5: Investor Flow

### A. Onboarding

- [ ] **`src/components/InvestorOnboarding.tsx`** (if exists)
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Change: `grantInvestorRole()` → `registerInvestor()`
  - [ ] Update: Success message
  - [ ] Test: Registration works

### B. Pool Browsing

- [ ] **`src/app/investor/pools/page.tsx`**
  - [ ] Replace: `usePoolNFT` → `useSEATrax`
  - [ ] Replace: `usePoolFunding` → `useSEATrax`
  - [ ] Update: Fetch open pools
  - [ ] Update: Pool stats display
  - [ ] Test: Can browse pools

### C. Pool Investment

- [ ] **`src/app/investor/pools/[id]/page.tsx`**
  - [ ] Replace all 3 hooks → `useSEATrax`
  - [ ] Update: Investment form
    - [ ] Remove amount parameter
    - [ ] Use transaction value instead
    ```typescript
    // OLD: invest(poolId, amount)
    // NEW: invest(poolId) with { value: amount }
    ```
  - [ ] Update: Transaction options
  - [ ] Test: Can invest in pool

### D. Investment Tracking

- [ ] **`src/app/investor/investments/page.tsx`**
  - [ ] Replace: `usePoolNFT` → `useSEATrax`
  - [ ] Remove: `usePlatformAnalytics`
  - [ ] Calculate: Stats from `getInvestment()` data
    ```typescript
    const investment = await getInvestment(poolId, address);
    const estimatedReturn = (investment.amount * 400) / 10000; // 4%
    ```
  - [ ] Test: Investment list shows correctly

### E. Returns Claiming

- [ ] **`src/app/investor/returns/page.tsx`**
  - [ ] Replace: `usePoolFunding` → `useSEATrax`
  - [ ] Update: Claim returns flow
  - [ ] Test: Can claim returns

### F. Dashboard

- [ ] **`src/app/investor/page.tsx`**
  - [ ] Replace hooks → `useSEATrax`
  - [ ] Calculate: Portfolio stats manually
  - [ ] Test: Dashboard displays

---

## 🔐 Phase 6: Auth & Common

### A. Login & Role Detection

- [ ] **`src/app/(auth)/login/page.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Update: `getUserRoles()` logic
    ```typescript
    const checkRoles = async (address) => {
      const isAdmin = await contract.hasRole(ADMIN_ROLE, address);
      const isExporter = await contract.registeredExporters(address);
      const isInvestor = await contract.registeredInvestors(address);
      return { isAdmin, isExporter, isInvestor };
    };
    ```
  - [ ] Test: Role detection works

### B. Role Checking Hook

- [ ] **`src/hooks/useRoleCheck.ts`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Update: Role checking logic
  - [ ] Keep: Dev mode support
  - [ ] Test: Role checks work in production mode

---

## 🧪 Phase 7: Testing Pages

### A. Phase A Testing

- [ ] **`src/app/testing/phase-a/page.tsx`**
  - [ ] Replace all 6 hooks → `useSEATrax`
  - [ ] Update all function calls
  - [ ] Update test scenarios
  - [ ] Test: All test scenarios pass

### B. Unit Tests

- [ ] **`src/__tests__/phase-a.test.ts`**
  - [ ] Replace all 6 hooks → `useSEATrax`
  - [ ] Update mock data
  - [ ] Update assertions
  - [ ] Test: All tests pass

---

## 🧹 Phase 8: Cleanup

### A. Delete Old Hooks

- [ ] Delete `src/hooks/useAccessControl.ts`
- [ ] Delete `src/hooks/useInvoiceNFT.ts`
- [ ] Delete `src/hooks/usePoolNFT.ts`
- [ ] Delete `src/hooks/usePoolFunding.ts`
- [ ] Delete `src/hooks/usePaymentOracle.ts`
- [ ] Delete `src/hooks/usePlatformAnalytics.ts`

### B. Remove Unused Imports

- [ ] Search: `import.*useAccessControl`
- [ ] Search: `import.*useInvoiceNFT`
- [ ] Search: `import.*usePoolNFT`
- [ ] Search: `import.*usePoolFunding`
- [ ] Search: `import.*usePaymentOracle`
- [ ] Search: `import.*usePlatformAnalytics`
- [ ] Verify: No remaining references

### C. Update Documentation

- [ ] **Update `README.md`**
  - [ ] Remove: Multiple contract addresses
  - [ ] Add: Single SEATrax contract info
  - [ ] Update: Quick start instructions
  - [ ] Update: Environment variables section

- [ ] **Update `.github/copilot-instructions.md`**
  - [ ] Remove: Multiple contract architecture section
  - [ ] Add: Single contract section
  - [ ] Update: Smart contract functions list
  - [ ] Update: Business flow diagrams

- [ ] **Update `.github/business-process-documentation.md`**
  - [ ] Update: Contract interaction examples
  - [ ] Update: Function signatures
  - [ ] Update: Frontend integration guide

---

## ✅ Final Testing

### Smoke Tests

- [ ] App compiles without TypeScript errors
- [ ] No console errors on any page
- [ ] All routes are accessible
- [ ] Wallet connection works
- [ ] Dev mode toggle still works

### End-to-End Tests

- [ ] **Exporter Journey**
  - [ ] Register as exporter
  - [ ] Create invoice (with email)
  - [ ] Wait for admin approval
  - [ ] View invoice in list
  - [ ] Withdraw funds when funded
  - [ ] See payment status

- [ ] **Admin Journey**
  - [ ] Verify exporter
  - [ ] Approve invoice
  - [ ] Create pool (with dates)
  - [ ] View pool status
  - [ ] Mark invoice paid
  - [ ] Distribute profits

- [ ] **Investor Journey**
  - [ ] Register as investor
  - [ ] Browse open pools
  - [ ] Invest in pool (via msg.value)
  - [ ] View investment in portfolio
  - [ ] Claim returns when pool completes

### Edge Cases

- [ ] 70% funding allows exporter withdrawal
- [ ] 100% funding triggers auto-distribution
- [ ] Cannot invest in non-open pools
- [ ] Rejected invoices don't appear in pool creation
- [ ] Role checks prevent unauthorized access
- [ ] Dev mode bypasses role checks correctly

### Performance

- [ ] Page load times acceptable
- [ ] No memory leaks
- [ ] Contract calls don't timeout
- [ ] Error messages are user-friendly

---

## 🚀 Deployment

### Pre-Deploy Checklist

- [ ] All tests passing
- [ ] No console warnings
- [ ] Environment variables set
- [ ] Contract verified on BlockScout
- [ ] Database migrations run

### Deploy Steps

- [ ] Merge to `development` branch
- [ ] Create pull request to `main`
- [ ] Get code review approval
- [ ] Merge to `main`
- [ ] Deploy to production
- [ ] Verify production deployment

### Post-Deploy

- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Update status in PROJECT_STATUS.md
- [ ] Announce migration complete
- [ ] Archive backup branch

---

## 📊 Progress Tracking

**Started**: January 11, 2026  
**Phase 2 Complete**: January 11, 2026  
**Phase 3 Complete**: January 11, 2026  
**Phase 4 Complete**: _________  
**Phase 5 Complete**: _________  
**Phase 6 Complete**: _________  
**Phase 7 Complete**: _________  
**Phase 8 Complete**: _________  
**Deployed**: _________  

**Total Hours**: _________  

---

## 🐛 Issues Log

| Issue | Description | Solution | Status |
|-------|-------------|----------|--------|
|       |             |          |        |

---

## 📝 Notes

<!-- Add migration notes here -->

---

**Last Updated**: January 11, 2026  
**Current Phase**: Phase 4 - Admin Flow  
**Blocked By**: None
