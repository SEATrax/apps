# Investor Feature Implementation Plan

**Version:** 1.0  
**Last Updated:** January 19, 2026  
**Branch:** `development-investor`  
**Status:** In Progress

---

## 📊 Overview

This document outlines the implementation plan for completing investor features in SEATrax. The goal is to replace all mock data with real blockchain integration and ensure a complete investor journey.

---

## 🎯 Priority Order

| # | Feature | Status | Dependencies | Effort |
|---|---------|--------|--------------|--------|
| 1 | **Profile Management** | 🟡 Enhancing | None | 1-2 hrs |
| 2 | **Investments Page** | 🔴 Mock Data | Profile done | 2-3 hrs |
| 3 | **Dashboard** | 🔴 Mock Data | Investments done | 2-3 hrs |
| 4 | **Returns Page** | 🔴 Mock Data | Admin flow | 2-3 hrs |
| 5 | **Pool Metadata** | 🔴 Optional | Supabase | 1-2 hrs |

---

## Priority 1: Investor Profile Management

### Current State ✅
- `useInvestorProfile.ts` - Hook for CRUD operations
- `InvestorOnboarding.tsx` - 2-step registration form
- Profile stored in Supabase `investors` table
- Blockchain registration via `registerInvestor()`

### What Works
- Profile creation during onboarding
- Profile fetching by wallet address
- Blockchain registration check before creating

### Enhancements Needed
1. **Profile Display on Dashboard** - Show profile info prominently
2. **Edit Profile from Dashboard** - Quick edit without re-onboarding
3. **Sync Status** - Show blockchain registration status
4. **Profile Completion Indicator** - Visual percentage

### Files to Modify
- `src/app/investor/page.tsx` - Add profile section
- `src/hooks/useInvestorProfile.ts` - Already complete

### Implementation Details

#### Dashboard Profile Section
```typescript
// Enhanced profile display with edit capability
{profile && (
  <Card className="bg-slate-900/50 border-slate-800">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold">{profile.name}</h3>
            <p className="text-gray-400 text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-cyan-400">
                Verified Investor
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditMode(true)}>
          Edit Profile
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Priority 2: Investments Page (My Portfolio)

### Current State 🔴
- All data is hardcoded mock (lines 18-62)
- UI components exist but show fake investments

### Required Changes
1. Fetch investor's pools via `getInvestorPools(address)`
2. For each pool, get investment details via `getInvestment(poolId, address)`
3. Get pool details for status and names
4. Calculate real P&L

### Smart Contract Functions Needed
```typescript
// From useSEATrax hook
getInvestorPools(investor: string): Promise<bigint[]>
getInvestment(poolId: bigint, investor: string): Promise<Investment>
getPool(poolId: bigint): Promise<Pool>
```

### Implementation
```typescript
useEffect(() => {
  const fetchInvestments = async () => {
    if (!activeAccount?.address) return;
    
    try {
      setLoading(true);
      
      // Get all pools investor has invested in
      const poolIds = await getInvestorPools(activeAccount.address);
      
      const investmentData = [];
      for (const poolId of poolIds) {
        const [investment, pool] = await Promise.all([
          getInvestment(poolId, activeAccount.address),
          getPool(poolId)
        ]);
        
        if (investment && pool) {
          investmentData.push({
            poolId: Number(poolId),
            poolName: pool.name,
            investmentAmount: formatEther(investment.amount),
            investmentDate: new Date(Number(investment.timestamp) * 1000),
            status: getPoolStatus(pool.status),
            fundingProgress: calculateProgress(pool),
            // ... more fields
          });
        }
      }
      
      setInvestments(investmentData);
    } catch (error) {
      console.error('Failed to fetch investments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchInvestments();
}, [activeAccount]);
```

---

## Priority 3: Investor Dashboard

### Current State 🔴
- Portfolio stats are hardcoded (lines 51-58)
- Recent investments are mock data (lines 60-82)

### Required Changes
1. Calculate `totalInvested` from all investments
2. Calculate `totalReturn` from completed pools
3. Count `activeInvestments` 
4. Fetch recent 3 investments for preview

### Implementation
```typescript
useEffect(() => {
  const fetchPortfolioStats = async () => {
    if (!activeAccount?.address) return;
    
    const poolIds = await getInvestorPools(activeAccount.address);
    
    let totalInvested = 0n;
    let totalReturns = 0n;
    let activeCount = 0;
    const recentInvestments = [];
    
    for (const poolId of poolIds) {
      const investment = await getInvestment(poolId, activeAccount.address);
      const pool = await getPool(poolId);
      
      totalInvested += investment.amount;
      
      if (pool.status === 2) { // COMPLETED
        totalReturns += calculateYield(investment.amount);
      }
      
      if (pool.status < 2) { // OPEN or FUNDED
        activeCount++;
      }
      
      recentInvestments.push({...});
    }
    
    setPortfolioStats({
      totalInvested: Number(totalInvested) / 1e18,
      totalValue: Number(totalInvested + totalReturns) / 1e18,
      totalReturn: Number(totalReturns) / 1e18,
      activeInvestments: activeCount
    });
    
    setRecentInvestments(recentInvestments.slice(0, 3));
  };
  
  fetchPortfolioStats();
}, [activeAccount]);
```

---

## Priority 4: Returns & Claims Page

### Current State 🔴
- Claimable returns are mock (lines 20-45)
- Claimed returns are mock (lines 47-70)

### Required Changes
1. Fetch completed pools where investor has returns
2. Check if returns have been claimed
3. Show real amounts

### Smart Contract Functions Needed
```typescript
// Check if investor has claimed returns
hasClaimedReturns(poolId: bigint, investor: string): Promise<boolean>

// Get claimable amount
getClaimableReturns(poolId: bigint, investor: string): Promise<bigint>

// Claim returns
claimReturns(poolId: bigint): Promise<TransactionResult>
```

---

## Priority 5: Pool Metadata (Optional)

### Current State
- Pool names come from blockchain
- Descriptions, risk levels are hardcoded

### Enhancement
- Store pool metadata in Supabase `pool_metadata` table
- Link by pool ID
- Display in pool cards and details

---

## 🧪 Verification Plan

### Manual Testing

#### Test 1: Profile Management
1. Connect wallet on `/login`
2. Select "Investor" role
3. If new user, complete onboarding at `/onboarding/investor`
4. Verify profile shows on `/investor` dashboard
5. Click "Edit Profile" and update a field
6. Verify changes persist after refresh

#### Test 2: Investment Flow (Prerequisite: Admin has created pools)
1. Go to `/investor/pools`
2. Click on an open pool
3. Enter investment amount (min $1000)
4. Confirm transaction
5. Go to `/investor/investments`
6. Verify investment appears in list

#### Test 3: Dashboard Stats (After making investments)
1. Go to `/investor` dashboard
2. Verify "Total Invested" shows real amount
3. Verify "Active Investments" count is correct
4. Verify "Recent Investments" shows actual investments

### Automated Tests
- Existing: `src/__tests__/phase-a.test.ts` - Tests `useSEATrax` hook functions
- Run: `npm test`

---

## 📁 Files Reference

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/useInvestorProfile.ts` | Profile CRUD operations |
| `src/hooks/useSEATrax.ts` | All blockchain interactions |
| `src/app/investor/page.tsx` | Dashboard |
| `src/app/investor/investments/page.tsx` | Portfolio |
| `src/app/investor/pools/page.tsx` | Browse pools ✅ Working |
| `src/app/investor/pools/[id]/page.tsx` | Pool detail ✅ Working |
| `src/app/investor/returns/page.tsx` | Claims |
| `src/components/InvestorOnboarding.tsx` | Registration |

### Smart Contract Functions Available
```typescript
// From useSEATrax hook - Investor-related
registerInvestor()
checkUserRoles(address)
getInvestorPools(address)
getInvestment(poolId, investor)
invest(poolId, amount)
claimReturns(poolId)
getAllOpenPools()
getPool(poolId)
getPoolFundingPercentage(poolId)
getInvoice(invoiceId)
```

---

## 📝 Notes

- All styling follows existing patterns from other pages
- Use `formatEther` and `parseEther` for Wei conversions
- USD conversion: 1 ETH ≈ $3000 (hardcoded for now)
- Min investment: $1000 USD (1000e18 tokens)
- Investor yield: 4%

---

*Last Updated: January 19, 2026*
