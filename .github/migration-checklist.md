# Migration Implementation Checklist

**Project**: SEATrax - Single Contract Migration  
**Branch**: `feature/single-contract-migration`  
**Started**: January 11, 2026  

---

## 📋 Pre-Migration Setup

- [ ] **Deploy SEATrax.sol to Lisk Sepolia**
  - [ ] Compile contract with Hardhat
  - [ ] Deploy using deployment script
  - [ ] Verify on BlockScout
  - [ ] Save contract address
  - [ ] Test basic functions (registerExporter, createInvoice, createPool)

- [ ] **Prepare Development Environment**
  - [ ] Create branch: `git checkout -b feature/single-contract-migration`
  - [ ] Create backup branch: `git checkout -b backup/pre-migration`
  - [ ] Switch back: `git checkout feature/single-contract-migration`
  - [ ] Pull latest changes from development

- [ ] **Extract Contract ABI**
  - [ ] Compile SEATrax.sol
  - [ ] Copy ABI from `artifacts/contracts/SEATrax.sol/SEATrax.json`
  - [ ] Format ABI for TypeScript (add `as const`)
  - [ ] Document all function signatures

- [ ] **Update Environment Variables**
  - [ ] Add `NEXT_PUBLIC_CONTRACT_ADDRESS=0x...` (new SEATrax address)
  - [ ] Keep old addresses commented for rollback
  - [ ] Update `DEPLOYER_PRIVATE_KEY` if needed
  - [ ] Verify all env vars loaded correctly

---

## 🏗️ Phase 2: Core Infrastructure

### A. Contract Configuration

- [ ] **Update `src/lib/contract.ts`**
  - [ ] Remove `CONTRACTS` object (lines 8-15)
  - [ ] Add `SEATRAX_ABI` constant with full ABI
  - [ ] Remove individual contract ABI exports
  - [ ] Export single `getSEATraxContract()` function
  - [ ] Test ABI compiles without errors

- [ ] **Update `src/config/index.ts`**
  - [ ] Remove: `contracts.accessControl`
  - [ ] Remove: `contracts.invoiceNFT`
  - [ ] Remove: `contracts.poolNFT`
  - [ ] Remove: `contracts.poolFundingManager`
  - [ ] Remove: `contracts.paymentOracle`
  - [ ] Remove: `contracts.platformAnalytics`
  - [ ] Add: `contracts.seatrax.address`
  - [ ] Verify config loads correctly

### B. Create Unified Hook

- [ ] **Create `src/hooks/useSEATrax.ts`**
  - [ ] Import dependencies (ethers, panna-sdk, contract ABI)
  - [ ] Define TypeScript interfaces (Invoice, Pool, Investment)
  - [ ] Create hook structure with useCallback
  
  - [ ] **Registration Functions**
    - [ ] `registerExporter()`
    - [ ] `registerInvestor()`
  
  - [ ] **Invoice Functions**
    - [ ] `createInvoice(exporterCompany, importerCompany, importerEmail, shippingDate, shippingAmount, loanAmount, ipfsHash)`
    - [ ] `withdrawFunds(invoiceId)`
    - [ ] `getInvoice(invoiceId)`
    - [ ] `getExporterInvoices(exporter)`
    - [ ] `canWithdraw(invoiceId)`
  
  - [ ] **Pool Functions**
    - [ ] `createPool(name, invoiceIds, startDate, endDate)`
    - [ ] `getPool(poolId)`
    - [ ] `getAllOpenPools()`
    - [ ] `getPoolInvestors(poolId)`
    - [ ] `getPoolFundingPercentage(poolId)`
  
  - [ ] **Investment Functions**
    - [ ] `invest(poolId, amount)` - handles msg.value
    - [ ] `claimReturns(poolId)`
    - [ ] `getInvestment(poolId, investor)`
    - [ ] `getInvestorPools(investor)`
  
  - [ ] **Admin Functions**
    - [ ] `verifyExporter(exporter)`
    - [ ] `approveInvoice(invoiceId)`
    - [ ] `rejectInvoice(invoiceId)`
    - [ ] `markInvoicePaid(invoiceId)`
    - [ ] `distributeProfits(poolId)`
    - [ ] `distributeToInvoice(poolId, invoiceId, amount)`
  
  - [ ] **Role Checking**
    - [ ] `checkUserRoles(address)` - returns {isAdmin, isExporter, isInvestor}
    - [ ] Handle registeredExporters mapping
    - [ ] Handle registeredInvestors mapping
    - [ ] Handle hasRole(ADMIN_ROLE) check
  
  - [ ] **Error Handling**
    - [ ] Wrap all contract calls in try-catch
    - [ ] Parse Solidity revert messages
    - [ ] Return user-friendly error messages
  
  - [ ] **Loading States**
    - [ ] Track loading per function
    - [ ] Return `isLoading` state
  
  - [ ] **Return Hook Interface**
    - [ ] Export all functions
    - [ ] Export loading states
    - [ ] Export error states
    - [ ] Add TypeScript types

- [ ] **Update `src/hooks/index.ts`**
  - [ ] Remove exports for old hooks
  - [ ] Add: `export { useSEATrax } from './useSEATrax'`
  - [ ] Keep other hooks (usePanna, useToast, etc.)

- [ ] **Test Core Infrastructure**
  - [ ] Run `npm run dev`
  - [ ] Check TypeScript compilation
  - [ ] Check browser console for errors
  - [ ] Test import paths work

---

## 👨‍💼 Phase 3: Exporter Flow

### A. Onboarding

- [ ] **`src/components/ExporterOnboarding.tsx`**
  - [ ] Replace: `useAccessControl` → `useSEATrax`
  - [ ] Change: `grantExporterRole()` → `registerExporter()`
  - [ ] Update: Success message ("Self-registered")
  - [ ] Update: Error handling
  - [ ] Test: Registration flow works

### B. Invoice Creation

- [ ] **`src/app/exporter/invoices/new/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Add: `importerEmail` field to form
    - [ ] Add to FormData interface
    - [ ] Add Input component
    - [ ] Add email validation
  - [ ] Add: `ipfsHash` parameter (use existing IPFS upload)
  - [ ] Change: `mintInvoice()` → `createInvoice()`
  - [ ] Update: Parameter order to match SEATrax
  - [ ] Remove: `finalizeInvoice()` step
  - [ ] Update: Success message
  - [ ] Test: Can create invoice with all fields

### C. Invoice List

- [ ] **`src/app/exporter/invoices/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Update: Status enum values
    ```typescript
    // OLD: PENDING, FINALIZED, FUNDRAISING, FUNDED, PAID, CANCELLED
    // NEW: PENDING, APPROVED, IN_POOL, FUNDED, WITHDRAWN, PAID, COMPLETED, REJECTED
    ```
  - [ ] Update: Status display labels
  - [ ] Update: Status badge colors
  - [ ] Test: Invoice list shows correct statuses

### D. Invoice Detail & Withdrawal

- [ ] **`src/app/exporter/invoices/[id]/page.tsx`** (if exists)
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Remove: Amount input from withdrawal form
  - [ ] Update: "Withdraw All Available" button
  - [ ] Change: `withdrawFunds(id, amount)` → `withdrawFunds(id)`
  - [ ] Update: Success message
  - [ ] Test: Can withdraw full amount

### E. Dashboard

- [ ] **`src/app/exporter/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Update: Dashboard stats calculations
  - [ ] Update: Invoice status checks
  - [ ] Test: Dashboard displays correctly

### F. Payments Page

- [ ] **`src/app/exporter/payments/page.tsx`**
  - [ ] Replace: `useInvoiceNFT` → `useSEATrax`
  - [ ] Update: Payment status checks
  - [ ] Test: Payments list works

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

**Started**: _________  
**Phase 2 Complete**: _________  
**Phase 3 Complete**: _________  
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
**Current Phase**: Pre-Migration  
**Blocked By**: None
