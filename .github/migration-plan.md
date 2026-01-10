# Migration Plan: Multiple Contracts → Single SEATrax Contract

**Branch**: `feature/single-contract-migration`  
**Date**: January 11, 2026  
**Estimated Effort**: 8-12 hours  

---

## 📋 Executive Summary

Migration involves consolidating **6 specialized smart contract hooks** into **1 unified hook** (`useSEATrax`) that interacts with the single SEATrax contract. This affects **35+ component/page files** across the codebase.

### Business Model Verification

✅ **Core business logic remains 98% identical**:
- ✅ 70% withdrawal threshold
- ✅ 4% investor yield
- ✅ 1% platform fee
- ✅ 100% auto-distribution
- ✅ Proportional fund allocation
- ✅ Same profit distribution formula

### Key Benefits

1. **Simplicity**: 1 contract address vs 6
2. **Admin Flexibility**: Can grant admin role to anyone
3. **Self-Service**: Exporters/investors register themselves
4. **Gas Optimization**: No inter-contract calls
5. **Easier Testing**: All functions in one place

---

## 🗺️ SEATrax Contract Function Inventory

### Registration Functions (Self-Service)
```solidity
registerExporter()     // Users call directly (not admin-granted)
registerInvestor()     // Users call directly (not admin-granted)
```

### Invoice Functions (Exporter)
```solidity
createInvoice(exporterCompany, importerCompany, importerEmail, shippingDate, shippingAmount, loanAmount, ipfsHash) → returns tokenId
withdrawFunds(invoiceId)                    // Withdraws ALL available funds
getExporterInvoices(exporter) → tokenIds[]
getInvoice(invoiceId) → Invoice struct
canWithdraw(invoiceId) → (bool, uint256)
```

### Investment Functions (Investor)
```solidity
invest(poolId) payable                      // Amount via msg.value
claimReturns(poolId)
getInvestorPools(investor) → poolIds[]
getInvestment(poolId, investor) → Investment struct
```

### Admin Functions
```solidity
verifyExporter(exporter)
approveInvoice(invoiceId)
rejectInvoice(invoiceId)
createPool(name, invoiceIds, startDate, endDate) → poolId
distributeToInvoice(poolId, invoiceId, amount)  // Manual distribution
markInvoicePaid(invoiceId)
distributeProfits(poolId)
updatePlatformTreasury(newTreasury)
```

### View Functions
```solidity
getPool(poolId) → Pool struct
getPoolInvestors(poolId) → addresses[]
getPoolFundingPercentage(poolId) → percentage
getAllOpenPools() → poolIds[]
getAllPendingInvoices() → tokenIds[]
getAllApprovedInvoices() → tokenIds[]
```

### Role Checking (OpenZeppelin AccessControl)
```solidity
hasRole(role, account) → bool
registeredExporters[address] → public mapping
registeredInvestors[address] → public mapping
```

---

## 🔄 Function Mapping: Current Hooks → SEATrax

### useAccessControl → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| `grantExporterRole()` | `registerExporter()` | ⚠️ **BREAKING** | User self-calls, not admin-granted |
| `grantInvestorRole()` | `registerInvestor()` | ⚠️ **BREAKING** | User self-calls, not admin-granted |
| `grantAdminRole()` | `grantRole(ADMIN_ROLE, addr)` | ✅ Direct | OpenZeppelin AccessControl |
| `getUserRoles()` | Check 3 mappings separately | ⚠️ Change | `hasRole()` + `registeredExporters[]` + `registeredInvestors[]` |

**Breaking Changes**:
- ❌ Admin can no longer grant exporter/investor roles
- ✅ Users must self-register via `registerExporter()` / `registerInvestor()`

---

### useInvoiceNFT → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| `mintInvoice()` | `createInvoice()` | ⚠️ **BREAKING** | Add `importerEmail` + `ipfsHash` params |
| `finalizeInvoice()` | ❌ **REMOVED** | ⚠️ **BREAKING** | Admin uses `approveInvoice()` directly |
| `withdrawFunds()` | `withdrawFunds()` | ⚠️ **BREAKING** | No amount param - withdraws ALL |
| `getInvoice()` | `getInvoice()` | ✅ Direct | Same |
| `getInvoicesByExporter()` | `getExporterInvoices()` | ✅ Direct | Name change only |
| `getAvailableWithdrawal()` | `canWithdraw()` | ✅ Direct | Returns `(bool, uint256)` |

**Breaking Changes**:
1. ❌ No `finalizeInvoice()` step - exporter workflow simplified
2. ⚠️ `withdrawFunds()` auto-withdraws full available amount
3. ✅ Must add `importerEmail` field to invoice creation form
4. ✅ Must pass `ipfsHash` instead of storing separately

---

### usePoolNFT → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| `createPool()` | `createPool()` | ⚠️ **BREAKING** | Parameter order changed |
| `finalizePool()` | ❌ **REMOVED** | ⚠️ **BREAKING** | Auto-finalizes at 100% funding |
| `getPool()` | `getPool()` | ✅ Direct | Same |
| `getPoolsByStatus()` | ❌ **REMOVED** | ⚠️ Change | Use `getAllOpenPools()` only |
| `addInvoicesToPool()` | ❌ **REMOVED** | ⚠️ **BREAKING** | Must include all invoices at creation |

**Breaking Changes**:
1. ⚠️ Parameter order: OLD `(name, invoiceIds)` → NEW `(name, invoiceIds, startDate, endDate)`
2. ❌ No manual pool finalization - happens automatically at 100%
3. ❌ Can only query open pools, not by arbitrary status

---

### usePoolFunding → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| `investInPool(poolId, amount)` | `invest(poolId) payable` | ⚠️ **BREAKING** | Amount via `msg.value` |
| `allocateFundsToInvoices()` | Auto at 100% funding | ⚠️ **BREAKING** | Admin can't manually trigger |
| `distributeProfits()` | `distributeProfits()` | ✅ Direct | Same |
| `claimInvestorReturns()` | `claimReturns()` | ✅ Direct | Name change only |
| `getInvestorPoolInfo()` | `getInvestment()` | ✅ Direct | Returns Investment struct |
| `getPoolFundingStats()` | `getPoolFundingPercentage()` | ⚠️ Change | Only returns percentage |
| `getInvestorReturns()` | Calculate manually | ⚠️ Change | `(investment.amount * 400) / 10000` |

**Breaking Changes**:
1. ⚠️ Investment uses `msg.value` instead of parameter
2. ❌ No manual fund allocation - happens automatically at 100%
3. ❌ Admin loses ability to trigger early distribution
4. ⚠️ Must calculate investor returns client-side

---

### usePaymentOracle → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| `submitPaymentConfirmation()` | ❌ **REMOVED** | ⚠️ **BREAKING** | No oracle system |
| `markInvoicePaid()` | `markInvoicePaid()` | ✅ Direct | Admin only |
| `getPaymentRecord()` | Check `invoice.status` | ⚠️ Change | No dedicated payment record |

**Breaking Changes**:
1. ❌ No payment timestamp tracking
2. ❌ No oracle submission - admin marks paid directly
3. ⚠️ Simpler workflow, less payment metadata

---

### usePlatformAnalytics → SEATrax

| Current Function | SEATrax Equivalent | Status | Notes |
|-----------------|-------------------|--------|-------|
| ALL FUNCTIONS | ❌ **REMOVED** | ⚠️ **BREAKING** | Move to off-chain |

**Breaking Changes**:
1. ❌ All analytics must be calculated off-chain from events or Supabase
2. ⚠️ Analytics dashboard needs major refactor to use event indexing

---

## 📦 Files Requiring Changes (35+ files)

### Core Hook Files (DELETE/CREATE)

```
❌ DELETE:
   - src/hooks/useAccessControl.ts (214 lines)
   - src/hooks/useInvoiceNFT.ts (337 lines)
   - src/hooks/usePoolNFT.ts (388 lines)
   - src/hooks/usePoolFunding.ts (336 lines)
   - src/hooks/usePaymentOracle.ts (200 lines)
   - src/hooks/usePlatformAnalytics.ts (319 lines)

✅ CREATE:
   - src/hooks/useSEATrax.ts (~500 lines)
```

### Configuration Files

```
📝 src/config/index.ts
   - Remove: contracts.accessControl, invoiceNFT, poolNFT, etc.
   - Add: contracts.seatrax

📝 src/lib/contract.ts
   - Remove: CONTRACTS object with 6 contracts
   - Add: SEATRAX_ABI extracted from SEATrax.sol
   - Update: Export single contract config

📝 src/hooks/index.ts
   - Replace: All 6 hook exports
   - With: export { useSEATrax } from './useSEATrax'
```

### Admin Pages (11 files)

```
📝 src/app/admin/page.tsx
   - useAccessControl → useSEATrax
   - usePlatformAnalytics → Calculate from pool data

📝 src/app/admin/roles/page.tsx
   - Remove: grantExporterRole, grantInvestorRole
   - Add: Instructions for self-registration

📝 src/app/admin/exporters/page.tsx
   - grantExporterRole → verifyExporter

📝 src/app/admin/invoices/page.tsx
   - useInvoiceNFT → useSEATrax

📝 src/app/admin/invoices/[id]/page.tsx
   - Add: approveInvoice() / rejectInvoice()

📝 src/app/admin/pools/page.tsx
   - usePoolNFT → useSEATrax
   - usePoolFunding → useSEATrax

📝 src/app/admin/pools/new/page.tsx
   - Fix: createPool() parameter order
   - Remove: finalizePool() call

📝 src/app/admin/pools/[id]/page.tsx
   - Remove: distributeToInvoice() manual UI
   - Add: Info about auto-distribution

📝 src/app/admin/payments/page.tsx
   - usePaymentOracle → useSEATrax

📝 src/app/admin/health/page.tsx
   - useAccessControl → useSEATrax
```

### Exporter Pages (4 files)

```
📝 src/app/exporter/page.tsx
   - useInvoiceNFT → useSEATrax

📝 src/app/exporter/invoices/page.tsx
   - Update: Invoice status enum values

📝 src/app/exporter/invoices/new/page.tsx
   - Add: importerEmail field
   - mintInvoice → createInvoice with new params
   - Remove: finalizeInvoice step

📝 src/app/exporter/payments/page.tsx
   - useInvoiceNFT → useSEATrax
```

### Investor Pages (4 files)

```
📝 src/app/investor/pools/page.tsx
   - usePoolNFT → useSEATrax
   - usePoolFunding → useSEATrax

📝 src/app/investor/pools/[id]/page.tsx
   - invest(): Use msg.value for amount

📝 src/app/investor/investments/page.tsx
   - usePlatformAnalytics → Calculate from getInvestment()

📝 src/app/investor/returns/page.tsx
   - usePoolFunding → useSEATrax
```

### Auth & Common (3 files)

```
📝 src/app/(auth)/login/page.tsx
   - getUserRoles() → Check multiple sources

📝 src/components/ExporterOnboarding.tsx
   - grantExporterRole → registerExporter (self-call)

📝 src/hooks/useRoleCheck.ts
   - useAccessControl → useSEATrax
```

### Testing (2 files)

```
📝 src/app/testing/phase-a/page.tsx
   - Replace all 6 hooks with useSEATrax

📝 src/__tests__/phase-a.test.ts
   - Update all function calls
```

---

## 🚨 Breaking Changes & Migration Gotchas

### HIGH PRIORITY ⚠️

#### 1. Role Assignment Model Changed
```diff
- Admin grants roles via grantExporterRole(address)
+ Users self-register via registerExporter()

Impact: All existing role assignment UI must be removed
Action: Update /admin/exporters to show verify button, not grant role
```

#### 2. Investment Amount Passing
```diff
- investInPool(poolId, amount)
+ invest(poolId) payable  // amount via msg.value

Impact: Must change how investment forms handle ETH
Action: Use transaction value instead of function parameter
```

#### 3. Withdrawal is All-or-Nothing
```diff
- withdrawFunds(invoiceId, amount)  // partial
+ withdrawFunds(invoiceId)           // full only

Impact: Remove amount input from withdrawal UI
Action: Show "Withdraw All Available" button
```

#### 4. Invoice Creation Parameters
```diff
- mintInvoice(company, importer, date, shipping, loan)
+ createInvoice(company, importer, email, date, shipping, loan, ipfs)

Impact: Must add importerEmail field to form
Action: Add email validation to create invoice page
```

#### 5. No Manual Pool Distribution
```diff
- Admin calls allocateFundsToInvoices() manually
+ Happens automatically at 100% funding

Impact: Remove "Distribute Funds" button
Action: Show "Auto-distributed at 100%" message
```

#### 6. No Analytics Contract
```diff
- usePlatformAnalytics.getTotalValueLocked()
+ Calculate from getPool() data or use Supabase

Impact: Analytics dashboard needs refactor
Action: Build event indexer or query Supabase
```

### MEDIUM PRIORITY ⚠️

#### 7. Invoice Status Enum Changed
```typescript
// OLD
enum InvoiceStatus {
  PENDING = 0,
  FINALIZED = 1,
  FUNDRAISING = 2,
  FUNDED = 3,
  PAID = 4,
  CANCELLED = 5
}

// NEW
enum InvoiceStatus {
  PENDING = 0,
  APPROVED = 1,
  IN_POOL = 2,
  FUNDED = 3,
  WITHDRAWN = 4,
  PAID = 5,
  COMPLETED = 6,
  REJECTED = 7
}
```

#### 8. createPool Parameter Order
```diff
- createPool(name, invoiceIds)
+ createPool(name, invoiceIds, startDate, endDate)

Impact: Must provide date range
Action: Add date pickers to create pool form
```

#### 9. Pool Status Querying Limited
```diff
- getPoolsByStatus(PoolStatus.OPEN)
+ getAllOpenPools()  // Only open pools

Impact: Can't easily show completed pools
Action: Track pool status in Supabase or iterate all pools
```

---

## 🎯 Migration Sequence

### Phase 1: Preparation (Before Code Changes)
1. ✅ Deploy SEATrax to Lisk Sepolia
2. ✅ Update `.env.local`: `NEXT_PUBLIC_CONTRACT_ADDRESS=0x...`
3. ✅ Compile ABI from SEATrax.sol
4. ✅ Create backup branch

### Phase 2: Core Infrastructure
1. Update `src/lib/contract.ts` with SEATRAX_ABI
2. Update `src/config/index.ts` contract addresses
3. Create `src/hooks/useSEATrax.ts`
4. Update `src/hooks/index.ts` exports

### Phase 3: Exporter Flow
1. `ExporterOnboarding.tsx` - Self-registration
2. `exporter/invoices/new/page.tsx` - Create invoice
3. `exporter/invoices/page.tsx` - List invoices
4. `exporter/page.tsx` - Dashboard
5. `exporter/payments/page.tsx` - Payments

### Phase 4: Admin Flow
1. `admin/exporters/page.tsx` - Verify exporters
2. `admin/invoices/page.tsx` - List pending
3. `admin/invoices/[id]/page.tsx` - Approve/reject
4. `admin/pools/new/page.tsx` - Create pool
5. `admin/pools/page.tsx` - List pools
6. `admin/pools/[id]/page.tsx` - Pool detail
7. `admin/payments/page.tsx` - Mark paid
8. `admin/page.tsx` - Dashboard

### Phase 5: Investor Flow
1. `investor/pools/page.tsx` - Browse pools
2. `investor/pools/[id]/page.tsx` - Invest
3. `investor/investments/page.tsx` - Track
4. `investor/returns/page.tsx` - Claim
5. `investor/page.tsx` - Dashboard

### Phase 6: Auth & Common
1. `(auth)/login/page.tsx` - Role detection
2. `hooks/useRoleCheck.ts` - Role utility

### Phase 7: Testing
1. `testing/phase-a/page.tsx`
2. `__tests__/phase-a.test.ts`

### Phase 8: Cleanup
1. Delete old hook files
2. Remove unused imports
3. Update documentation

---

## ✅ Testing Checklist (After Migration)

### Smoke Tests
- [ ] App compiles without TypeScript errors
- [ ] No console errors on page load
- [ ] All routes accessible

### Exporter Flow
- [ ] Can self-register as exporter
- [ ] Can create invoice with email field
- [ ] Can view invoice list
- [ ] Can withdraw funds (full amount)
- [ ] Invoice status updates correctly

### Admin Flow
- [ ] Can verify exporter
- [ ] Can approve/reject invoices
- [ ] Can create pool with dates
- [ ] Pool auto-distributes at 100%
- [ ] Can mark invoice as paid
- [ ] Can distribute profits

### Investor Flow
- [ ] Can self-register as investor
- [ ] Can browse open pools
- [ ] Can invest (via msg.value)
- [ ] Can view investments
- [ ] Can claim returns

### Edge Cases
- [ ] Partial funding (70-99%) allows withdrawal
- [ ] 100% funding triggers auto-distribution
- [ ] Cannot invest in non-open pools
- [ ] Role checks work correctly

---

## 🔄 Rollback Plan

If migration fails:

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Or checkout backup branch
git checkout backup/pre-migration

# Restore .env.local
# Point back to old contract addresses
```

Keep old contract addresses in comments:
```env
# Old multi-contract setup (backup)
# NEXT_PUBLIC_ACCESS_CONTROL=0x6dA6C2...
# NEXT_PUBLIC_INVOICE_NFT=0x8Da2dF...
```

---

## 📊 Success Metrics

Migration is complete when:
- ✅ All TypeScript errors resolved
- ✅ All 35+ files updated
- ✅ All 6 old hooks deleted
- ✅ All user flows tested end-to-end
- ✅ No console errors in production
- ✅ README.md updated
- ✅ Deployed to production

---

## 📝 Post-Migration Tasks

1. Update `README.md` with new contract info
2. Update `.github/copilot-instructions.md`
3. Update API documentation
4. Notify team of breaking changes
5. Create migration guide for users
6. Update deployment scripts
7. Archive old contract documentation

---

**Last Updated**: January 11, 2026  
**Status**: Planning Phase  
**Next Step**: Execute Phase 2 (Core Infrastructure)
