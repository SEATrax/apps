# Investor Role Implementation Progress

## Feature Verification

| Feature | Implementation Condition | Caching Status | Notes |
| :--- | :--- | :--- | :--- |
| **Registration** | ✅ 100% Implemented | ✅ Cached | `registerInvestor` -> `investors` table. |
| **Investment** | ✅ 100% Implemented | ✅ Cached | `invest` -> `investments` table & `pool_metadata` update. |
| **Claim Returns** | ⚠️ 90% Implemented | ❌ Partial | `claimReturns` works on-chain. Cache update for `returns_claimed` flag pending DB schema update. |
| **View Portfolio** | ✅ 100% Implemented | ✅ Cached | Served via Supabase `investments` table. |

## Feature Implementation Details

### 1. Registration (100%)
- **Function**: `registerInvestor()`
- **Logic**: Calls contract to register and immediately inserts row into `investors` table in Supabase.
- **Verification**: Verified in `useSEATrax.ts`.

### 2. Investment (100%)
- **Function**: `invest(poolId, amount)`
- **Logic**: 
    1. Sends ETH to contract.
    2. Waits for receipt.
    3. Creates record in `investments` table.
    4. Updates `amount_invested` in `pool_metadata`.
- **Verification**: Verified in `useSEATrax.ts` lines 790-858.

### 3. Claim Returns (90%)
- **Function**: `claimReturns(poolId)`
- **Logic**: 
    1. Calls contract to withdraw funds.
    2. **Missing Cache Update**: The `returns_claimed` status is tracked on-chain but not yet mirrored to a database column.
- **Action Item**: Add `returns_claimed` boolean to `investments` table in next migration.

### 4. View Portfolio (100%)
- **Function**: `getInvestment`, `getInvestorPools`
- **Logic**: Frontend reads directly from Supabase for fast loading.

## Action Items
1.  **Database Migration**: Add `returns_claimed` column to `investments` table.
2.  **Yield Parametrization**: Discuss if 4% yield should be dynamic.
3.  **Investment Limits**: Enforce min/max limits in Frontend validation (Backend/Contract enforcement is optional for MVP).
