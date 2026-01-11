# Quick Start: Implementation Execution

**Date:** January 11, 2026  
**Current Phase:** Week 1 - Exporter Refactoring

---

## 🎯 Today's Focus

**Priority:** Fix Exporter Features (Blockers)

**Time Estimate:** 4-6 hours

**Goal:** Enable reliable invoice creation and remove all mock data

---

## ✅ Step-by-Step Execution

### Step 1: Fix Invoice Event Parsing (2-3 hours)

**File:** `src/hooks/useSEATrax.ts`

**Location:** Lines 240-265 (createInvoice function)

**Tasks:**
1. Add retry logic with 1-second delay
2. Implement fallback using getExporterInvoices
3. Change fromBlock to `receipt.blockNumber - 1n`
4. Test with 5 invoice creations

**Success:** >95% of invoices return valid ID

---

### Step 2: Remove Mock Data from Invoice List (1 hour)

**File:** `src/app/exporter/invoices/page.tsx`

**Tasks:**
1. Delete lines 162-211 (mock invoices block)
2. Add empty state component
3. Test with 0 invoices
4. Test with 3+ invoices

**Success:** No fake invoices ever shown

---

### Step 3: Implement Real Dashboard Stats (2 hours)

**File:** `src/app/exporter/page.tsx`

**Tasks:**
1. Replace mockStats calculation (lines 100-120)
2. Fetch all invoices via getInvoice()
3. Calculate real totals and counts
4. Update formattedInvoices with real data

**Success:** Dashboard shows actual blockchain data

---

### Step 4: Integrate Payment Links (1 hour)

**File:** `src/app/exporter/invoices/[id]/page.tsx`

**Tasks:**
1. Add Supabase query for payments table
2. Replace hardcoded payment link
3. Add copy-to-clipboard button
4. Show payment status badge

**Success:** Payment link appears from database

---

### Step 5: Create Status Utility (1 hour)

**File:** `src/lib/contract.ts`

**Tasks:**
1. Create getInvoiceStatusDisplay() function
2. Update all pages to use utility
3. Test all 8 status states

**Success:** Consistent status display everywhere

---

## 🧪 Testing Commands

After each step, test with:

```bash
# Check if invoice exists on blockchain
node check-invoice.js

# Check transaction for event details
# (Update TX_HASH in file first)
node check-tx.js

# Run dev server
npm run dev

# Build to check for errors
npm run build
```

---

## 📋 Completion Checklist

### After Step 1
- [ ] Created 5 invoices successfully
- [ ] All 5 returned valid invoice IDs
- [ ] No "Invoice ID not returned" errors
- [ ] Verified IDs on blockchain with check-invoice.js

### After Step 2
- [ ] Empty state shows when no invoices
- [ ] "Create Invoice" button visible
- [ ] Real invoices display correctly
- [ ] No mock data in list

### After Step 3
- [ ] Dashboard shows real invoice count
- [ ] Total funded calculated from blockchain
- [ ] Total withdrawn accurate
- [ ] Status counts correct (pending, funded, etc.)

### After Step 4
- [ ] Payment link fetched from database
- [ ] Copy button works
- [ ] Link only shows for WITHDRAWN+ statuses
- [ ] Payment status badge visible

### After Step 5
- [ ] All invoice pages use getInvoiceStatusDisplay()
- [ ] Consistent badge colors
- [ ] Next actions shown for each status
- [ ] No hardcoded status labels

---

## 🚀 Next Day Tasks

Once exporter refactoring complete:

### Day 3: Admin Invoice Management

**Priority:** Build approval UI

**Tasks:**
1. Create `/admin/invoices/page.tsx`
2. List pending invoices
3. Add approve/reject buttons
4. Test approval flow

**See:** `MASTER_IMPLEMENTATION_PLAN.md` - Week 1, Day 3

---

## 📞 Quick Reference

**Documentation:**
- Exporter details: `.github/EXPORTER_REFACTOR_PLAN.md`
- Full roadmap: `.github/MASTER_IMPLEMENTATION_PLAN.md`
- Testing guide: `.github/TESTING_QUICK_START.md`

**Helper Scripts:**
- `check-invoice.js` - Verify invoices on blockchain
- `check-tx.js` - Parse transaction events
- `scripts/check-db.sh` - Check Supabase data

**Contract:**
- Address: `0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2`
- Network: Lisk Sepolia (Chain ID: 4202)
- Explorer: https://sepolia-blockscout.lisk.com/

**Supabase:**
- Dashboard: https://yazynajjhzowyvuzrqkb.supabase.co
- Tables: exporters, investors, invoice_metadata, payments

---

## 💡 Tips

1. **Test incrementally** - Don't wait until all steps done
2. **Use console.log** - Verify data at each step
3. **Check blockchain first** - Use scripts to verify contract state
4. **Keep dev server running** - See changes in real-time
5. **Commit frequently** - After each working step

---

## 🐛 Common Issues

**"Invoice ID not returned"**
- This is what we're fixing in Step 1
- Check console for event parsing logs
- Use fallback query if events fail

**Empty dashboard**
- Check if getExporterInvoices returns IDs
- Verify getInvoice returns data for each ID
- Check console for errors

**Mock data still showing**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if you deleted the right lines

**Payment link not showing**
- Verify invoice status >= 4 (WITHDRAWN)
- Check Supabase payments table has data
- Check console for Supabase errors

---

**Ready to start? Begin with Step 1!**

**Estimated completion time:** End of today (6 hours total)
