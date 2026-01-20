# Investor Role Implementation Progress

## Feature Verification

| Feature | Status | Implementation Details | Notes |
| :--- | :--- | :--- | :--- |
| **Registration** | ✅ Implemented | `registerInvestor`. | Tracks registration. |
| **Investment** | ✅ Implemented | `invest`. | Payable function. Auto-calculates % share. Triggers auto-distribute at exactly 100%. |
| **Claim Returns** | ✅ Implemented | `claimReturns`. | Only after pool COMPLETED. Calculates 4% yield. |
| **View Portfolio** | ✅ Implemented | `getInvestment`, `getInvestorPools`. | Basic on-chain tracking available. |

## Action Items
1.  **Yield Hardcoding**: Yield is hardcoded at 4% (`INVESTOR_YIELD_BPS = 400`). Verify if this needs to be dynamic per pool.
2.  **Investment Limits**: No minimum/maximum investment limits enforced in contract logic (unlike doc mentions of 1000 min / 1M max).
