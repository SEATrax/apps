# SEATrax Development Phases

## Project Overview

**SEATrax** adalah platform blockchain untuk membiayai shipping invoice. Platform ini menghubungkan:
- **Exporter**: Submit shipping invoice untuk mendapatkan loan
- **Investor**: Invest di pool invoice yang sudah dikurasi
- **Admin**: Manage master data, kurasi invoice, dan konfigurasi sistem

---

## Smart Contract Architecture

### NFT Contracts

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEATrax Smart Contract                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  ShippingInvoice │        │    InvoicePool   │              │
│  │      (ERC-721)   │  1:N   │    (ERC-721)     │              │
│  │                  │◄───────│                  │              │
│  │ - exporterCompany│        │ - poolName       │              │
│  │ - walletAddress  │        │ - startDate      │              │
│  │ - importerCompany│        │ - endDate        │              │
│  │ - importerEmail  │        │ - totalLoanAmount│              │
│  │ - shippingDate   │        │ - totalShipping  │              │
│  │ - shippingAmount │        │ - amountInvested │              │
│  │ - loanAmount     │        │ - amountDistrib  │              │
│  │ - amountWithdrawn│        │ - feePaid        │              │
│  │ - amountInvested │        │ - status         │              │
│  │ - status         │        │ - invoiceIds[]   │              │
│  └──────────────────┘        └──────────────────┘              │
│                                       │                         │
│                                       │ 1:N                     │
│                                       ▼                         │
│                              ┌──────────────────┐              │
│                              │   Investment     │              │
│                              │   (Mapping)      │              │
│                              │                  │              │
│                              │ - investor       │              │
│                              │ - poolId         │              │
│                              │ - amount         │              │
│                              │ - timestamp      │              │
│                              │ - claimed        │              │
│                              └──────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Smart Contract Development

### 1.1 Data Structures

```solidity
// Shipping Invoice NFT Data
struct ShippingInvoice {
    uint256 tokenId;
    address exporterWallet;
    string exporterCompany;
    string importerCompany;
    string importerEmail;        // For payment notification
    uint256 shippingDate;
    uint256 shippingAmount;      // Total shipping value
    uint256 loanAmount;          // Amount requested for loan
    uint256 amountInvested;      // Amount received from pool
    uint256 amountWithdrawn;     // Amount withdrawn by exporter
    string ipfsHash;             // Additional docs on IPFS
    InvoiceStatus status;
    uint256 poolId;              // 0 if not in pool yet
    uint256 createdAt;
}

enum InvoiceStatus {
    PENDING,        // Submitted, waiting admin review
    APPROVED,       // Approved, ready for pool
    IN_POOL,        // Added to a pool
    FUNDED,         // Received investment (>=70%)
    WITHDRAWN,      // Exporter withdrew funds
    PAYMENT_SENT,   // Payment request sent to importer
    PAID,           // Importer paid
    COMPLETED,      // Profit distributed
    REJECTED        // Rejected by admin
}

// Pool NFT Data
struct InvoicePool {
    uint256 poolId;
    string poolName;
    uint256 startDate;
    uint256 endDate;
    uint256 totalLoanAmount;     // Sum of all invoice loanAmount
    uint256 totalShippingAmount; // Sum of all invoice shippingAmount
    uint256 amountInvested;      // Total ETH invested
    uint256 amountDistributed;   // Amount sent to invoices
    uint256 feePaid;             // Platform fee collected
    PoolStatus status;
    uint256[] invoiceIds;        // Array of invoice tokenIds
    uint256 createdAt;
}

enum PoolStatus {
    OPEN,           // Accepting investments
    FUNDING,        // Active, distributing to invoices
    DISTRIBUTING,   // Sending funds to exporters
    COMPLETED,      // All profits distributed
    CANCELLED       // Pool cancelled
}

// Investment Record
struct Investment {
    address investor;
    uint256 poolId;
    uint256 amount;
    uint256 timestamp;
    uint256 returnsClaimed;
    bool claimed;
}
```

### 1.2 Smart Contract Functions

```solidity
// ============== EXPORTER FUNCTIONS ==============

// Create shipping invoice NFT
function createShippingInvoice(
    string memory exporterCompany,
    string memory importerCompany,
    string memory importerEmail,
    uint256 shippingDate,
    uint256 shippingAmount,
    uint256 loanAmount,
    string memory ipfsHash
) external returns (uint256 tokenId);

// Withdraw funds from invoice (when amountInvested >= 70% of loanAmount)
function withdrawFromInvoice(uint256 invoiceId) external;

// ============== ADMIN FUNCTIONS ==============

// Approve invoice for pool inclusion
function approveInvoice(uint256 invoiceId) external onlyAdmin;

// Reject invoice
function rejectInvoice(uint256 invoiceId, string memory reason) external onlyAdmin;

// Create new pool with selected invoices
function createPool(
    string memory poolName,
    uint256[] memory invoiceIds,
    uint256 endDate
) external onlyAdmin returns (uint256 poolId);

// Distribute funds from pool to specific invoice
function distributeToInvoice(
    uint256 poolId,
    uint256 invoiceId,
    uint256 amount
) external onlyAdmin;

// Mark invoice as paid (after importer payment)
function markInvoiceAsPaid(uint256 invoiceId) external onlyAdmin;

// Trigger profit distribution for completed pool
function distributeProfits(uint256 poolId) external onlyAdmin;

// ============== INVESTOR FUNCTIONS ==============

// Invest in pool
function investInPool(uint256 poolId) external payable;

// Claim returns after pool completion
function claimReturns(uint256 poolId) external;

// ============== VIEW FUNCTIONS ==============

function getInvoice(uint256 invoiceId) external view returns (ShippingInvoice memory);
function getPool(uint256 poolId) external view returns (InvoicePool memory);
function getInvestment(address investor, uint256 poolId) external view returns (Investment memory);
function getPoolInvestors(uint256 poolId) external view returns (address[] memory);
function getInvoicesByExporter(address exporter) external view returns (uint256[] memory);
function getPoolsByStatus(PoolStatus status) external view returns (uint256[] memory);
function canWithdraw(uint256 invoiceId) external view returns (bool);
function getWithdrawableAmount(uint256 invoiceId) external view returns (uint256);
```

### 1.3 Events

```solidity
event InvoiceCreated(uint256 indexed tokenId, address indexed exporter, uint256 loanAmount);
event InvoiceApproved(uint256 indexed tokenId, address indexed admin);
event InvoiceRejected(uint256 indexed tokenId, address indexed admin, string reason);
event InvoiceAddedToPool(uint256 indexed tokenId, uint256 indexed poolId);

event PoolCreated(uint256 indexed poolId, string name, uint256 totalLoanAmount);
event PoolStatusChanged(uint256 indexed poolId, PoolStatus newStatus);

event InvestmentMade(uint256 indexed poolId, address indexed investor, uint256 amount);
event FundsDistributed(uint256 indexed poolId, uint256 indexed invoiceId, uint256 amount);
event FundsWithdrawn(uint256 indexed invoiceId, address indexed exporter, uint256 amount);

event PaymentRequestSent(uint256 indexed invoiceId, string importerEmail);
event InvoicePaid(uint256 indexed invoiceId, uint256 amount);

event ProfitsDistributed(uint256 indexed poolId, uint256 investorShare, uint256 platformFee);
event ReturnsClaimed(uint256 indexed poolId, address indexed investor, uint256 amount);
```

---

## Phase 2: Frontend Development

### 2.1 Page Structure

```
src/app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout with providers
│
├── (auth)/
│   └── login/page.tsx          # Role selection / wallet connect
│
├── exporter/
│   ├── page.tsx                # Exporter dashboard
│   ├── invoices/
│   │   ├── page.tsx            # List my invoices
│   │   ├── new/page.tsx        # Create new invoice
│   │   └── [id]/page.tsx       # Invoice detail
│   └── withdrawals/page.tsx    # Withdrawal history
│
├── investor/
│   ├── page.tsx                # Investor dashboard
│   ├── pools/
│   │   ├── page.tsx            # Browse available pools
│   │   └── [id]/page.tsx       # Pool detail + invest
│   ├── investments/page.tsx    # My investments
│   └── returns/page.tsx        # Claim returns
│
├── admin/
│   ├── page.tsx                # Admin dashboard
│   ├── invoices/
│   │   ├── page.tsx            # Review pending invoices
│   │   └── [id]/page.tsx       # Approve/reject invoice
│   ├── pools/
│   │   ├── page.tsx            # Manage pools
│   │   ├── new/page.tsx        # Create new pool
│   │   └── [id]/
│   │       ├── page.tsx        # Pool detail
│   │       └── distribute/page.tsx  # Distribute funds
│   ├── payments/page.tsx       # Payment tracking
│   └── settings/page.tsx       # Platform settings
│
└── api/
    ├── payment/
    │   ├── generate/route.ts   # Generate payment URL
    │   └── webhook/route.ts    # Payment gateway webhook
    └── notifications/
        └── route.ts            # Send email notifications
```

### 2.2 Component Structure

```
src/components/
├── ui/                         # shadcn/ui components
│
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── footer.tsx
│   └── role-guard.tsx          # Route protection by role
│
├── invoice/
│   ├── invoice-form.tsx        # Create/edit invoice
│   ├── invoice-card.tsx        # Invoice summary card
│   ├── invoice-detail.tsx      # Full invoice details
│   ├── invoice-status.tsx      # Status badge
│   └── invoice-list.tsx        # List with filters
│
├── pool/
│   ├── pool-card.tsx           # Pool summary card
│   ├── pool-detail.tsx         # Full pool details
│   ├── pool-create-form.tsx    # Create pool (admin)
│   ├── pool-invoices.tsx       # Invoices in pool
│   ├── pool-investors.tsx      # Investors list
│   └── invest-modal.tsx        # Investment dialog
│
├── investment/
│   ├── investment-card.tsx
│   ├── investment-history.tsx
│   └── claim-returns.tsx
│
├── dashboard/
│   ├── stats-card.tsx
│   ├── recent-activity.tsx
│   └── charts/
│       ├── investment-chart.tsx
│       └── pool-progress.tsx
│
└── common/
    ├── wallet-button.tsx
    ├── transaction-status.tsx
    ├── loading-states.tsx
    └── empty-states.tsx
```

---

## Phase 3: User Flows

### 3.1 Exporter Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXPORTER FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Connect Wallet                                               │
│         │                                                        │
│         ▼                                                        │
│  2. Fill Invoice Form                                            │
│     - Exporter company                                           │
│     - Importer company + email                                   │
│     - Shipping date & amount                                     │
│     - Loan amount requested                                      │
│     - Upload supporting docs (IPFS)                              │
│         │                                                        │
│         ▼                                                        │
│  3. Submit → Creates Invoice NFT (status: PENDING)               │
│         │                                                        │
│         ▼                                                        │
│  4. Wait for Admin Approval                                      │
│         │                                                        │
│         ▼                                                        │
│  5. Invoice added to Pool by Admin                               │
│         │                                                        │
│         ▼                                                        │
│  6. Pool receives investments                                    │
│         │                                                        │
│         ▼                                                        │
│  7. Admin distributes funds to Invoice                           │
│     (amountInvested updated)                                     │
│         │                                                        │
│         ▼                                                        │
│  8. When amountInvested >= 70% loanAmount                        │
│     → Exporter can WITHDRAW                                      │
│         │                                                        │
│         ▼                                                        │
│  9. After full withdrawal:                                       │
│     → System generates payment URL                               │
│     → Sends to importer email                                    │
│         │                                                        │
│         ▼                                                        │
│  10. Importer pays → Invoice status: PAID                        │
│         │                                                        │
│         ▼                                                        │
│  11. Profit distribution (exporter receives remaining)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Investor Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVESTOR FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Connect Wallet                                               │
│         │                                                        │
│         ▼                                                        │
│  2. Browse Available Pools                                       │
│     - Filter by: risk, deadline, amount                          │
│     - View pool details & invoices                               │
│         │                                                        │
│         ▼                                                        │
│  3. Select Pool & Investment Amount                              │
│         │                                                        │
│         ▼                                                        │
│  4. Invest (send ETH to contract)                                │
│     → Investment recorded on-chain                               │
│     → Pool amountInvested updated                                │
│         │                                                        │
│         ▼                                                        │
│  5. Track Investment Progress                                    │
│     - Pool funding status                                        │
│     - Invoice payment status                                     │
│         │                                                        │
│         ▼                                                        │
│  6. When all invoices in pool are PAID:                          │
│     → Pool status: COMPLETED                                     │
│     → Returns available to claim                                 │
│         │                                                        │
│         ▼                                                        │
│  7. Claim Returns                                                │
│     → Receive: investment + 4% yield                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Admin Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  A. INVOICE MANAGEMENT                                           │
│  ────────────────────                                            │
│  1. Review pending invoices                                      │
│  2. Verify exporter & importer info                              │
│  3. Approve or Reject invoice                                    │
│                                                                  │
│  B. POOL MANAGEMENT                                              │
│  ──────────────────                                              │
│  1. Select approved invoices                                     │
│     - Group by: shipping date, deadline, risk                    │
│  2. Create pool with selected invoices                           │
│     - Set pool name, end date                                    │
│     - Auto-calculate: totalLoanAmount, totalShippingAmount       │
│  3. Pool NFT created (status: OPEN)                              │
│                                                                  │
│  C. FUND DISTRIBUTION                                            │
│  ────────────────────                                            │
│  1. Monitor pool investment progress                             │
│  2. When pool >= 70% funded:                                     │
│     → Distribute funds to individual invoices                    │
│     → Update: pool.amountDistributed, invoice.amountInvested     │
│                                                                  │
│  D. PAYMENT TRACKING                                             │
│  ───────────────────                                             │
│  1. Monitor payment URL generation                               │
│  2. Handle payment webhook                                       │
│  3. Mark invoices as PAID                                        │
│                                                                  │
│  E. PROFIT DISTRIBUTION                                          │
│  ─────────────────────                                           │
│  1. When all invoices in pool are PAID:                          │
│     → Trigger profit distribution                                │
│     → 4% to investors (proportional)                             │
│     → 1% platform fee                                            │
│     → Rest to exporters                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Profit Distribution Logic

### 4.1 Distribution Formula

```
Pool Total Loan Amount: 100,000 ETH
Pool Total Received (from importers): 100,000 ETH

Distribution:
├── Investor Returns: 4% of totalLoanAmount = 4,000 ETH
│   └── Distributed proportionally based on investment %
│
├── Platform Fee: 1% of totalLoanAmount = 1,000 ETH
│   └── Sent to platform treasury
│
└── Exporter Returns: 95,000 ETH
    └── Distributed to each exporter based on their invoice
        (minus what they already withdrew)

Example:
- Investor A invested 10,000 ETH (10% of pool)
  → Receives: 10,000 + (4,000 × 10%) = 10,400 ETH

- Exporter X has invoice with loanAmount = 20,000 ETH
  → Already withdrew: 14,000 ETH (70%)
  → Receives: 20,000 - 14,000 - (20,000 × 5%) = 5,000 ETH
```

### 4.2 Smart Contract Distribution

```solidity
function distributeProfits(uint256 poolId) external onlyAdmin {
    InvoicePool storage pool = pools[poolId];
    require(allInvoicesPaid(poolId), "Not all invoices paid");
    require(pool.status != PoolStatus.COMPLETED, "Already distributed");
    
    uint256 totalLoanAmount = pool.totalLoanAmount;
    
    // Calculate shares
    uint256 investorShare = (totalLoanAmount * 400) / 10000;  // 4%
    uint256 platformFee = (totalLoanAmount * 100) / 10000;    // 1%
    uint256 exporterShare = totalLoanAmount - investorShare - platformFee;
    
    // Transfer platform fee
    payable(platformTreasury).transfer(platformFee);
    pool.feePaid = platformFee;
    
    // Mark investor returns as claimable
    pool.investorReturnsPool = investorShare;
    
    // Distribute to exporters
    for (uint i = 0; i < pool.invoiceIds.length; i++) {
        uint256 invoiceId = pool.invoiceIds[i];
        ShippingInvoice storage invoice = invoices[invoiceId];
        
        uint256 invoiceShare = (exporterShare * invoice.loanAmount) / totalLoanAmount;
        uint256 remaining = invoiceShare - invoice.amountWithdrawn;
        
        if (remaining > 0) {
            payable(invoice.exporterWallet).transfer(remaining);
        }
        
        invoice.status = InvoiceStatus.COMPLETED;
    }
    
    pool.status = PoolStatus.COMPLETED;
    emit ProfitsDistributed(poolId, investorShare, platformFee);
}
```

---

## Phase 5: Database Schema (Supabase)

```sql
-- Users (off-chain profile data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'exporter', 'investor')) NOT NULL,
    company_name TEXT,
    email TEXT,
    kyc_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice metadata (extended info not on chain)
CREATE TABLE invoice_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id TEXT UNIQUE NOT NULL,
    exporter_id UUID REFERENCES users(id),
    supporting_docs JSONB,  -- Array of IPFS hashes
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool metadata
CREATE TABLE pool_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id TEXT UNIQUE NOT NULL,
    description TEXT,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    category TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_token_id TEXT NOT NULL,
    payment_url TEXT,
    payment_provider TEXT,
    payment_reference TEXT,
    amount DECIMAL(20, 8),
    status TEXT DEFAULT 'pending',
    importer_email TEXT,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,  -- 'invoice', 'pool', 'investment'
    entity_id TEXT,
    tx_hash TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 6: API Routes

### 6.1 Payment Integration

```typescript
// src/app/api/payment/generate/route.ts
export async function POST(req: Request) {
    const { invoiceId } = await req.json();
    
    // 1. Get invoice details from contract
    // 2. Generate payment URL (Stripe, Midtrans, etc.)
    // 3. Save payment record to Supabase
    // 4. Send email to importer
    // 5. Return payment URL
}

// src/app/api/payment/webhook/route.ts
export async function POST(req: Request) {
    // 1. Verify webhook signature
    // 2. Update payment status in Supabase
    // 3. Call smart contract to mark invoice as PAID
    // 4. Notify exporter
}
```

### 6.2 Notification Service

```typescript
// src/app/api/notifications/route.ts
export async function POST(req: Request) {
    const { type, userId, data } = await req.json();
    
    // Types: 
    // - invoice_approved
    // - invoice_rejected
    // - pool_created
    // - investment_received
    // - withdrawal_available
    // - payment_received
    // - returns_available
}
```

---

## Phase 7: Development Milestones

### Week 1-2: Smart Contract
- [ ] Define data structures
- [ ] Implement core functions
- [ ] Write unit tests
- [ ] Deploy to Lisk Sepolia testnet

### Week 3-4: Frontend - Core
- [ ] Setup authentication (role-based)
- [ ] Exporter: Create invoice flow
- [ ] Admin: Review & approve invoices
- [ ] Admin: Create pool flow

### Week 5-6: Frontend - Investment
- [ ] Investor: Browse pools
- [ ] Investor: Investment flow
- [ ] Admin: Fund distribution
- [ ] Exporter: Withdrawal flow

### Week 7-8: Payment & Distribution
- [ ] Payment URL generation
- [ ] Payment gateway integration
- [ ] Webhook handling
- [ ] Profit distribution

### Week 9-10: Polish & Testing
- [ ] E2E testing
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Security audit

---

## Using Claude Code

### Recommended Workflow

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Navigate to project
cd seatrax-app

# Start Claude Code session
claude

# Example commands in Claude Code:
> Read the DEVELOPMENT_PHASES.md and help me implement Phase 1
> Create the smart contract based on the data structures
> Implement the exporter invoice creation flow
> Fix the TypeScript error in useContract.ts
> Write tests for the distributeProfit function
```

### Benefits of Claude Code for This Project

1. **Smart Contract Development**
   - Generate Solidity code from specs
   - Write and run Hardhat tests
   - Debug contract interactions

2. **Frontend Implementation**
   - Implement components from specs
   - Fix TypeScript errors in real-time
   - Integrate with contract hooks

3. **Testing & Debugging**
   - Run tests and fix failures
   - Debug transaction issues
   - Optimize gas usage

4. **Git Integration**
   - Commit changes with proper messages
   - Create feature branches
   - Review diffs before committing

---

## Questions to Clarify

1. **Payment Gateway**: Which payment provider for importer payments? (Stripe, Midtrans, Xendit?)

2. **Email Service**: Which service for notifications? (SendGrid, AWS SES, Resend?)

3. **Withdrawal Timing**: Should exporter be able to withdraw in multiple transactions or all at once when 70% reached?

4. **Pool Creation**: Can admin add more invoices to existing pool, or is it fixed once created?

5. **Investment Limits**: Min/max investment per investor per pool?

6. **KYC Requirements**: Do exporters/investors need KYC verification before using platform?

---

## Next Steps

1. **Review this document** and clarify any questions
2. **Setup development environment** with Claude Code
3. **Start with Smart Contract** (Phase 1)
4. **Parallel: Database schema** in Supabase
5. **Frontend development** following the phases

Ready to start coding? Let's go! 🚀
