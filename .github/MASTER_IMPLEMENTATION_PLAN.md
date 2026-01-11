# SEATrax MVP - Complete Implementation Plan

**Version:** 2.0  
**Last Updated:** January 11, 2026  
**Status:** In Progress - 40% Complete  
**Target:** MVP-Ready (95% Complete)

---

## 📊 Current Status Overview

### Overall Progress
```
Smart Contract:     ████████████████████ 100% ✅
Backend (Hooks):    ████████████████████ 100% ✅
Database Schema:    ███████████████████░  95% ✅
Frontend UI:        ████████░░░░░░░░░░░░  40% 🟡
E2E Testing:        ██░░░░░░░░░░░░░░░░░░  10% 🔴
```

### Phase Completion

| Phase | Description | Smart Contract | Frontend | Testing | Status |
|-------|-------------|----------------|----------|---------|--------|
| **Phase 1** | Invoice Creation | ✅ 100% | 🟡 70% | 🟡 60% | 🟡 In Progress |
| **Phase 2** | Pool Creation | ✅ 100% | 🔴 30% | 🔴 0% | 🔴 Blocked |
| **Phase 3** | Investment | ✅ 100% | 🔴 40% | 🔴 0% | 🔴 Blocked |
| **Phase 4** | Payment & Settlement | ✅ 100% | 🔴 20% | 🔴 0% | 🔴 Blocked |
| **Phase 5** | Investor Returns | ✅ 100% | 🔴 30% | 🔴 0% | 🔴 Blocked |

---

## 🎯 Implementation Priorities

### 🔴 **Critical - Week 1 (Blockers)**

These items BLOCK the entire business cycle:

1. **Exporter Refactoring** (See: `EXPORTER_REFACTOR_PLAN.md`)
   - Fix event parsing (invoice ID extraction)
   - Remove all mock data
   - Implement real statistics
   - **Effort:** 1-2 days
   - **Blocks:** Full testing capability

2. **Admin Pages - Invoice Management**
   - Build `/admin/invoices` page (list pending invoices)
   - Approve/reject functionality
   - View invoice details
   - **Effort:** 1 day
   - **Blocks:** Phase 2 (Pool Creation)

3. **Admin Pages - Pool Creation**
   - Build `/admin/pools/new` page
   - Select approved invoices
   - Set dates, name, description
   - **Effort:** 1 day
   - **Blocks:** Phase 3 (Investment)

### 🟡 **High Priority - Week 2**

Required for MVP but not immediate blockers:

4. **Investor Pool Browsing**
   - Replace mock data with real pools
   - Pool detail page
   - Investment information display
   - **Effort:** 1 day

5. **Investment Flow**
   - Build investment UI
   - Test with real pools
   - Verify auto-distribution at 100%
   - **Effort:** 1 day

6. **Payment Management**
   - Admin payment confirmation UI
   - Payment link integration
   - Mark invoices as paid
   - **Effort:** 1 day

7. **Profit Distribution**
   - Admin distribute profits UI
   - Investor claim returns UI
   - Returns tracking
   - **Effort:** 1 day

### 🟢 **Medium Priority - Week 3**

Polishing and optimization:

8. **Dashboard Enhancements**
   - Real-time updates
   - Better analytics
   - Performance optimization
   - **Effort:** 1-2 days

9. **Error Handling & UX**
   - Comprehensive error messages
   - Loading states
   - Transaction feedback
   - **Effort:** 1 day

10. **Documentation & Testing**
    - Update user guides
    - E2E test scenarios
    - Video tutorials
    - **Effort:** 1-2 days

---

## 📋 Detailed Implementation Plan

### WEEK 1: Core Flow Implementation

#### Day 1-2: Exporter Refactoring ✅ Priority #1

**Objective:** Fix exporter features to enable testing

**Tasks:**
1. Fix invoice event parsing with retry + fallback
2. Remove all mock data from invoice pages
3. Implement real dashboard statistics
4. Integrate payment links from database
5. Create status display utility

**Deliverables:**
- Working invoice creation (>95% success)
- No mock data in exporter pages
- Real statistics from blockchain
- See: `EXPORTER_REFACTOR_PLAN.md` for details

**Testing:**
- Create 5 invoices, verify all succeed
- Check empty state with 0 invoices
- Verify dashboard shows real data

---

#### Day 3: Admin Invoice Management 🔴 Priority #2

**Objective:** Enable invoice approval flow

**File:** `src/app/admin/invoices/page.tsx`

**Features:**
```typescript
// Admin can:
1. View all pending invoices
2. See invoice details (exporter, amount, documents)
3. Approve invoices → status: APPROVED
4. Reject invoices → status: REJECTED
5. Filter by status (pending/approved/rejected)
```

**UI Components:**
- Table with pending invoices
- Detail modal/page
- Approve/Reject buttons
- IPFS document viewer
- Status filters

**Implementation:**

```typescript
'use client';

export default function AdminInvoicesPage() {
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<bigint | null>(null);
    const { getAllPendingInvoices, getInvoice, approveInvoice, rejectInvoice } = useSEATrax();
    
    useEffect(() => {
        loadPendingInvoices();
    }, []);
    
    const loadPendingInvoices = async () => {
        const ids = await getAllPendingInvoices();
        const invoices = await Promise.all(ids.map(id => getInvoice(id)));
        setPendingInvoices(invoices.filter(i => i !== null));
    };
    
    const handleApprove = async (invoiceId: bigint) => {
        const result = await approveInvoice(invoiceId);
        if (result.success) {
            toast.success('Invoice approved!');
            loadPendingInvoices(); // Refresh
        }
    };
    
    const handleReject = async (invoiceId: bigint) => {
        const result = await rejectInvoice(invoiceId);
        if (result.success) {
            toast.success('Invoice rejected');
            loadPendingInvoices();
        }
    };
    
    return (
        <div>
            <h1>Invoice Management</h1>
            
            {/* Filters */}
            <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
            </Tabs>
            
            {/* Invoice Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Exporter</TableHead>
                        <TableHead>Importer</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingInvoices.map(invoice => (
                        <TableRow key={invoice.tokenId}>
                            <TableCell>#{invoice.tokenId}</TableCell>
                            <TableCell>{invoice.exporterCompany}</TableCell>
                            <TableCell>{invoice.importerCompany}</TableCell>
                            <TableCell>${formatEther(invoice.loanAmount)}</TableCell>
                            <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                            <TableCell>
                                <Button onClick={() => setSelectedInvoice(invoice.tokenId)}>
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            {/* Detail Modal */}
            <Dialog open={selectedInvoice !== null} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent>
                    <InvoiceDetailView invoiceId={selectedInvoice} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleReject(selectedInvoice!)}>
                            Reject
                        </Button>
                        <Button onClick={() => handleApprove(selectedInvoice!)}>
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
```

**Testing:**
- Admin sees pending invoices from Phase 1
- Can approve invoice → status changes to APPROVED
- Can reject invoice → status changes to REJECTED
- Approved invoices move to "approved" tab

---

#### Day 4: Admin Pool Creation 🔴 Priority #3

**Objective:** Enable pool creation from approved invoices

**File:** `src/app/admin/pools/new/page.tsx`

**Features:**
```typescript
// Admin can:
1. View all approved invoices (not yet in pool)
2. Select multiple invoices for pool
3. Set pool name, dates
4. Create pool → invoices status: IN_POOL, pool status: OPEN
```

**UI Components:**
- Approved invoices list (checkbox selection)
- Pool form (name, start date, end date)
- Selected invoices summary
- Total loan amount calculation
- Create button

**Implementation:**

```typescript
'use client';

export default function CreatePoolPage() {
    const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<bigint[]>([]);
    const [poolName, setPoolName] = useState('');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
    
    const { getAllApprovedInvoices, getInvoice, createPool } = useSEATrax();
    
    useEffect(() => {
        loadAvailableInvoices();
    }, []);
    
    const loadAvailableInvoices = async () => {
        const ids = await getAllApprovedInvoices();
        const invoices = await Promise.all(ids.map(id => getInvoice(id)));
        // Filter invoices not yet in pool
        setAvailableInvoices(invoices.filter(i => i && i.poolId === 0n));
    };
    
    const toggleInvoiceSelection = (id: bigint) => {
        setSelectedInvoiceIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };
    
    const calculateTotalLoan = () => {
        return selectedInvoiceIds.reduce((sum, id) => {
            const invoice = availableInvoices.find(i => i.tokenId === id);
            return sum + (invoice ? invoice.loanAmount : 0n);
        }, 0n);
    };
    
    const handleCreatePool = async () => {
        if (selectedInvoiceIds.length === 0) {
            toast.error('Select at least one invoice');
            return;
        }
        
        const result = await createPool(
            poolName,
            selectedInvoiceIds,
            Math.floor(startDate.getTime() / 1000),
            Math.floor(endDate.getTime() / 1000)
        );
        
        if (result.success) {
            toast.success(`Pool created! ID: ${result.poolId}`);
            router.push(`/admin/pools/${result.poolId}`);
        } else {
            toast.error(result.error);
        }
    };
    
    return (
        <div>
            <h1>Create Investment Pool</h1>
            
            {/* Pool Info Form */}
            <Card>
                <CardContent>
                    <Label>Pool Name</Label>
                    <Input value={poolName} onChange={e => setPoolName(e.target.value)} />
                    
                    <Label>Start Date</Label>
                    <DatePicker value={startDate} onChange={setStartDate} />
                    
                    <Label>End Date</Label>
                    <DatePicker value={endDate} onChange={setEndDate} />
                </CardContent>
            </Card>
            
            {/* Available Invoices */}
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Select Invoices ({selectedInvoiceIds.length} selected)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Select</TableHead>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Exporter</TableHead>
                                <TableHead>Loan Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {availableInvoices.map(invoice => (
                                <TableRow key={invoice.tokenId}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedInvoiceIds.includes(invoice.tokenId)}
                                            onCheckedChange={() => toggleInvoiceSelection(invoice.tokenId)}
                                        />
                                    </TableCell>
                                    <TableCell>#{invoice.tokenId}</TableCell>
                                    <TableCell>{invoice.exporterCompany}</TableCell>
                                    <TableCell>${formatEther(invoice.loanAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
            {/* Summary */}
            <Card className="mt-4">
                <CardContent>
                    <div className="flex justify-between">
                        <span>Total Invoices:</span>
                        <span className="font-bold">{selectedInvoiceIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Loan Amount:</span>
                        <span className="font-bold">${formatEther(calculateTotalLoan())}</span>
                    </div>
                </CardContent>
            </Card>
            
            <Button onClick={handleCreatePool} className="mt-4" size="lg" disabled={selectedInvoiceIds.length === 0}>
                Create Pool
            </Button>
        </div>
    );
}
```

**Testing:**
- Admin sees approved invoices from Day 3
- Can select multiple invoices
- Pool creation succeeds → invoices status: IN_POOL
- Pool appears in open pools list

---

#### Day 5: Testing & Bug Fixes

**Objective:** Ensure Week 1 deliverables work end-to-end

**Test Scenarios:**

1. **Exporter Flow:**
   - Register → Create invoice → See in list
   - Dashboard shows real stats
   - No mock data anywhere

2. **Admin Flow:**
   - See pending invoice
   - Approve invoice
   - Create pool with approved invoice

3. **Blockchain Verification:**
   - Verify invoice status changes on-chain
   - Verify pool created with correct invoices
   - Verify pool status = OPEN

**Bug Fixes:**
- Address any issues found
- Refine UI/UX
- Performance optimization

---

### WEEK 2: Investment & Payment Flow

#### Day 6-7: Investor Features

**Tasks:**
1. Build pool browsing page (replace mock data)
2. Pool detail page with investment form
3. Investment transaction flow
4. Test auto-distribution at 100%

**Files:**
- `src/app/investor/pools/page.tsx`
- `src/app/investor/pools/[id]/page.tsx`

**Key Features:**
- Real pool data from `getAllOpenPools()`
- Investment form with amount input
- USD ↔ ETH conversion display
- Progress bar (funding percentage)
- Investor list and percentages

---

#### Day 8: Payment Management

**Tasks:**
1. Build admin payment management page
2. Mark invoice as PAID functionality
3. Payment link integration testing
4. Importer payment page testing

**Files:**
- `src/app/admin/payments/page.tsx`
- `src/app/pay/[invoiceId]/page.tsx` (already exists, needs testing)

**Key Features:**
- List WITHDRAWN invoices
- Mark as PAID button
- Payment verification workflow
- Email notification (optional)

---

#### Day 9-10: Profit Distribution & Returns

**Tasks:**
1. Build admin profit distribution page
2. Build investor returns claiming page
3. Test complete cycle: Investment → Payment → Returns

**Files:**
- `src/app/admin/pools/[id]/page.tsx` (add distribute button)
- `src/app/investor/returns/page.tsx`

**Key Features:**
- Distribute profits when all invoices PAID
- Investor claim returns UI
- Returns history tracking

---

### WEEK 3: Polish & Testing

#### Day 11-12: Dashboard Enhancements

**Tasks:**
1. Real-time updates using events
2. Performance optimization (batch queries)
3. Better analytics and charts
4. Mobile responsiveness

---

#### Day 13-14: E2E Testing

**Tasks:**
1. Full business cycle test (5 accounts)
2. Edge case testing
3. Error handling verification
4. Performance testing

**Test Script:** See `.github/TESTING_GUIDE.md`

---

#### Day 15: Documentation

**Tasks:**
1. Update all README files
2. Create user guides
3. Record demo videos
4. Prepare deployment checklist

---

## 🎯 Success Criteria

### Must Have (MVP)
- [x] Smart contract deployed and verified
- [x] All hooks implemented (useSEATrax)
- [ ] Exporter can create invoices (no errors)
- [ ] Admin can approve invoices
- [ ] Admin can create pools
- [ ] Investor can browse pools
- [ ] Investor can invest
- [ ] Auto-distribution works at 100%
- [ ] Exporter can withdraw
- [ ] Payment links functional
- [ ] Admin can mark as paid
- [ ] Admin can distribute profits
- [ ] Investor can claim returns
- [ ] No mock data anywhere

### Nice to Have
- [ ] Real-time event updates
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Multi-language support

---

## 📦 Deliverables

### Week 1
- ✅ Exporter refactoring complete
- ✅ Admin invoice management page
- ✅ Admin pool creation page
- ✅ E2E test: Exporter → Admin approval → Pool creation

### Week 2
- ✅ Investor pool browsing
- ✅ Investment flow working
- ✅ Payment management
- ✅ Profit distribution
- ✅ E2E test: Full business cycle

### Week 3
- ✅ Polished UI
- ✅ Comprehensive testing
- ✅ Documentation
- ✅ Deployment-ready

---

## 🚨 Risk Management

### High Risk
- **Event parsing failures:** Mitigated with retry + fallback
- **Auto-distribution not triggering:** Need thorough testing at 100%
- **Payment verification manual:** Admin must confirm off-chain payments

### Medium Risk
- **Network congestion:** Use gas estimation and retry logic
- **Database sync issues:** Implement reconciliation scripts
- **User errors:** Comprehensive validation and error messages

### Low Risk
- **UI bugs:** Caught in testing phase
- **Documentation gaps:** Continuous updates

---

## 📞 Support & Escalation

**Technical Issues:**
- Check `.github/` documentation first
- Review smart contract tests
- Use `check-invoice.js` and `check-tx.js` scripts

**Blockers:**
- Escalate immediately
- Document in `PROJECT_STATUS.md`
- Update timeline accordingly

---

**Next Action:** Begin Week 1 implementation starting with Exporter Refactoring (see `EXPORTER_REFACTOR_PLAN.md`)

**Updated:** January 11, 2026  
**Version:** 2.0  
**Status:** Ready for Implementation
