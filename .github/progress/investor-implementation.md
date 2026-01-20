# Investor Role Implementation Progress

## Feature Verification

| Feature | Status | Implementation Details | Notes |
| :--- | :--- | :--- | :--- |
| **Registration** | ✅ Implemented | `registerInvestor`. | Tracks registration. |
| **Investment** | ✅ Implemented | `invest`. | Payable function. Auto-calculates % share. Triggers auto-distribute at exactly 100%. |
| **Claim Returns** | ✅ Implemented | `claimReturns`. | Only after pool COMPLETED. Calculates 4% yield. |
| **View Portfolio** | ✅ Implemented | `getInvestment`, `getInvestorPools`. | Data served via Supabase `investments` table for instant portfolio loading. |

## Blockchain Caching Strategy
All Investor write actions automatically update the Supabase cache:
- `registerInvestor`: Creates `investors` record.
- `invest`: Creates a new record in `investments` table (with `amount`, `timestamp`, `percentage`) and updates `pool_metadata.amount_invested`.
- `claimReturns`: (Future) Will update investment record status.

## Action Items
1.  **Yield Hardcoding**: Yield is hardcoded at 4% (`INVESTOR_YIELD_BPS = 400`). Verify if this needs to be dynamic per pool.
2.  **Investment Limits**: No minimum/maximum investment limits enforced in contract logic (unlike doc mentions of 1000 min / 1M max).
