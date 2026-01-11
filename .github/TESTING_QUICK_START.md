# Quick Testing Guide - Thirdweb SDK Migration

## Prerequisites
- ✅ Dev server running: `npm run dev` at http://localhost:3000
- ✅ MetaMask installed
- ✅ Deployer private key from `.env.local`

## Testing Steps

### Step 1: Import Deployer Account to MetaMask

1. Open MetaMask
2. Click account icon → "Add account or hardware wallet" → "Import account"
3. Paste deployer private key from `.env.local`:
   ```
   DEPLOYER_PRIVATE_KEY=your_key_here
   ```
4. Verify deployer address: `0x3023A1B0fAf10DeE06a0aA5197eE00882b401152`
5. Check ETH balance: Should show ~0.190 ETH

### Step 2: Connect Wallet to SEATrax

1. Navigate to http://localhost:3000
2. Click "Connect Wallet" button
3. Select MetaMask
4. Approve connection with deployer account
5. **Expected**: Wallet connects successfully
6. **Expected**: Shows deployer address `0x3023...1152`

### Step 3: Test Exporter Registration

1. Click "Get Started" or navigate to `/onboarding/exporter`
2. Fill in exporter registration form:
   - Use "Auto-fill Test Data" button for quick entry
   - Or manually enter:
     - Company Name: Test Export Co
     - Tax ID: TAX123456
     - Country: Indonesia
     - Export License: EXP789
3. Click "Register as Exporter"
4. **Expected**: MetaMask popup appears requesting transaction approval
5. **Expected**: Gas fee shown: ~0.0001-0.0002 ETH (~$0.24 USD)
6. Approve transaction
7. **Expected**: Transaction succeeds without "insufficient funds" error
8. **Expected**: Success message appears
9. **Expected**: Redirected to exporter dashboard

### Step 4: Verify Gas Fee Deduction

1. Check MetaMask balance
2. **Expected**: ETH balance decreased by gas fee amount
3. **Expected**: Transaction appears in activity tab
4. **Expected**: Transaction confirmed on Lisk Sepolia

### Step 5: Test Invoice Creation (Optional)

1. Navigate to `/exporter/invoices/new`
2. Fill invoice form:
   - Use "Auto-fill Test Data" button
   - Or manually enter shipping details
3. Click "Create Invoice"
4. **Expected**: MetaMask popup appears
5. **Expected**: Gas fee shown: ~0.0002-0.0003 ETH (~$0.45 USD)
6. Approve transaction
7. **Expected**: Transaction succeeds
8. **Expected**: Invoice created successfully
9. **Expected**: Redirected to invoice detail page

## Success Criteria

### ✅ Pass Conditions
- [x] Wallet connects without errors
- [x] Transaction popup appears in MetaMask
- [x] Gas fee is reasonable (~$0.24-0.45 USD)
- [x] Transaction succeeds (no "insufficient funds" error)
- [x] ETH balance decreases after transaction
- [x] On-chain state updated (exporter registered/invoice created)

### ❌ Fail Conditions
- [ ] "Insufficient funds for gas" error
- [ ] Transaction fails with unknown error
- [ ] Gas fee is 0 or extremely high
- [ ] No MetaMask popup appears
- [ ] Balance doesn't change after transaction

## Troubleshooting

### Issue: "Insufficient funds" error still appears
**Diagnosis**: Thirdweb SDK not being used correctly
**Fix**: Check console logs for errors, verify imports in useSEATrax.ts

### Issue: No MetaMask popup
**Diagnosis**: Wallet not connected or client not initialized
**Fix**: Reconnect wallet, check Panna provider status

### Issue: Transaction fails with "execution reverted"
**Diagnosis**: Smart contract logic issue (not gas related)
**Fix**: Check if exporter already registered, verify contract state

### Issue: Gas fee too high (>0.001 ETH)
**Diagnosis**: Complex transaction or network congestion
**Fix**: Normal on testnet, but verify transaction parameters

## Next Steps After Testing

### If Tests Pass ✅
1. Complete E2E testing guide (26 steps, 5 accounts)
2. Test investor flow
3. Test admin flow (approve invoices, create pools)
4. Test full investment lifecycle

### If Tests Fail ❌
1. Report error in chat with:
   - Error message
   - Transaction hash (if available)
   - Console logs
   - MetaMask screenshots
2. Check browser console for detailed errors
3. Verify contract address matches deployed contract

## Admin Login (For Later Testing)

To test admin functions:
1. Import deployer address (already done in Step 1)
2. Connect wallet with deployer account
3. **Expected**: Automatically has ADMIN role (granted during deployment)
4. Access `/admin` routes
5. Test invoice approval, pool creation, etc.

Admin address: `0x3023A1B0fAf10DeE06a0aA5197eE00882b401152` (deployer = admin)

## Estimated Gas Costs

| Action | Gas Fee (ETH) | USD Equivalent |
|--------|---------------|----------------|
| Register Exporter | ~0.0001 | ~$0.24 |
| Register Investor | ~0.0001 | ~$0.24 |
| Create Invoice | ~0.0002 | ~$0.45 |
| Create Pool | ~0.00015 | ~$0.30 |
| Invest in Pool | ~0.00015 | ~$0.35 |
| Withdraw Funds | ~0.00012 | ~$0.28 |

**Total budget**: 0.190 ETH = sufficient for 40-50 transactions

## Reference Documentation

- Migration details: `.github/THIRDWEB_MIGRATION.md`
- Gasless limitation: `.github/GASLESS_LIMITATION.md`
- E2E testing: `.github/E2E_TESTING_GUIDE.md`
- Project instructions: `.github/copilot-instructions.md`

---

**Quick Test Command**:
```bash
# Start dev server if not running
npm run dev

# In another terminal, check contract deployment
node scripts/check-db.sh
```

**Expected Output**: Contract address `0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2` on Lisk Sepolia
