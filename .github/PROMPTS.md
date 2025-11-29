# SEATrax Development Prompts

Kumpulan prompt yang dioptimalkan untuk pengembangan SEATrax menggunakan coding agent (Claude Code, Cursor, GitHub Copilot, dll).

---

## 🚀 Getting Started

### Initial Setup
```
Baca file .github/copilot-instructions.md dan .github/implementation-checklist.md untuk memahami project SEATrax. 
Kemudian setup project dengan:
1. Copy .env.example ke .env.local
2. Jalankan npm install
3. Beri tahu saya jika ada error
```

### Check Project Status
```
Lihat implementation-checklist.md dan beri tahu saya:
1. Task mana yang sudah selesai (cek file yang ada)
2. Task mana yang harus dikerjakan selanjutnya
3. Estimasi waktu untuk task berikutnya
```

---

## 📝 Phase 1: Smart Contract

### Create Smart Contract
```
Buat smart contract SEATrax.sol berdasarkan spesifikasi di copilot-instructions.md.
Contract harus include:
- Invoice struct dengan semua field (tokenId, exporter, exporterCompany, importerCompany, importerEmail, shippingDate, shippingAmount, loanAmount, amountInvested, amountWithdrawn, status, poolId, ipfsHash, createdAt)
- Pool struct dengan semua field
- Investment struct untuk tracking investor
- Semua function untuk exporter, investor, dan admin
- Events untuk setiap action penting
- Gunakan OpenZeppelin untuk ERC721, AccessControl, ReentrancyGuard

Buat di folder contracts/SEATrax.sol
```

### Write Contract Tests
```
Buat unit test untuk smart contract SEATrax.sol.
Test harus cover:
1. Registration (exporter & investor)
2. Invoice creation dan approval flow
3. Pool creation dengan multiple invoices
4. Investment dan percentage calculation
5. 70% threshold withdrawal
6. 100% auto-distribution
7. Profit distribution (4% investor, 1% platform)
8. Access control (only admin can approve, etc)

Buat di test/SEATrax.test.js
```

### Deploy Contract
```
Buat script deployment untuk Lisk Sepolia testnet.
1. Buat deploy script di scripts/deploy.js
2. Configure hardhat.config.js untuk Lisk Sepolia
3. Deploy dan verify contract
4. Update src/lib/contract.ts dengan ABI baru dan address
```

---

## 📝 Phase 2: Authentication

### Login Page
```
Buat halaman login di src/app/(auth)/login/page.tsx.
Fitur:
- Connect wallet button (gunakan usePanna hook)
- Setelah connect, cek role user dari Supabase (getExporterByWallet atau getInvestorByWallet)
- Jika admin (cek ADMIN_ADDRESSES env), redirect ke /admin
- Jika exporter, redirect ke /exporter
- Jika investor, redirect ke /investor  
- Jika belum terdaftar, tampilkan pilihan: "Register as Exporter" atau "Register as Investor"
- Gunakan shadcn/ui components
```

### Exporter Onboarding
```
Buat halaman onboarding exporter di src/app/onboarding/exporter/page.tsx.
Form fields:
- Company Name (required)
- Tax ID (required)
- Country (dropdown dengan list negara)
- Export License (required)
- Wallet Address (auto-filled, readonly)

On submit:
1. Validate semua field
2. Call createExporter() di Supabase
3. Call registerExporter() di smart contract
4. Show success message
5. Redirect ke /exporter

Gunakan react-hook-form untuk form handling
```

### Investor Onboarding
```
Buat halaman onboarding investor di src/app/onboarding/investor/page.tsx.
Form fields:
- Name (required)
- Address (physical address, required)
- Wallet Address (auto-filled, readonly)

On submit:
1. Validate fields
2. Call createInvestor() di Supabase
3. Call registerInvestor() di smart contract
4. Show success message
5. Redirect ke /investor
```

### Role Guard Component
```
Buat component role-guard di src/components/common/role-guard.tsx.
Props: allowedRoles: ('admin' | 'exporter' | 'investor')[]
Functionality:
- Wrap protected pages
- Check if wallet connected
- Check user role from Supabase
- If not allowed, redirect to login
- Show loading spinner while checking
- Pass user data to children

Contoh usage:
<RoleGuard allowedRoles={['exporter']}>
  <ExporterDashboard />
</RoleGuard>
```

---

## 📝 Phase 3: Exporter Features

### Exporter Dashboard
```
Buat dashboard exporter di src/app/exporter/page.tsx.
Tampilkan:
1. Welcome message dengan nama company
2. Stats cards:
   - Total Invoices (count)
   - Pending Approval (count dengan status PENDING)
   - Funded (count dengan status FUNDED/WITHDRAWN)
   - Total Withdrawn (sum dalam USD)
3. Recent invoices (5 terakhir) dengan status badges
4. Quick action button: "Create New Invoice"

Wrap dengan RoleGuard allowedRoles={['exporter']}
Fetch data dari contract menggunakan getExporterInvoices()
```

### Invoice List Page
```
Buat halaman list invoice di src/app/exporter/invoices/page.tsx.
Features:
- Fetch all invoices milik exporter dari contract
- Display sebagai cards atau table
- Setiap invoice tampilkan:
  - Invoice number
  - Importer name
  - Loan amount (USD)
  - Funding progress (jika di pool)
  - Status badge (color-coded)
- Filter tabs: All, Pending, In Pool, Funded, Completed
- Search by invoice number
- "Create Invoice" button di header
- Click invoice -> navigate ke detail page
```

### Create Invoice Form
```
Buat halaman create invoice di src/app/exporter/invoices/new/page.tsx.
Form sections:

1. Invoice Details:
   - Invoice Number (text, required)
   - Invoice Date (date picker, required)
   - Due Date (date picker, required, must be after invoice date)
   - Total Invoice Amount (number, USD, required)
   - Currency (fixed: USD)
   - Goods Description (textarea, required)

2. Importer Information:
   - Importer Name (text, required)
   - Importer License (text, optional)
   - Importer Email (email, required - untuk payment notification)

3. Loan Request:
   - Loan Amount (number, USD, required, must be <= invoice amount)
   - Show calculated: "You'll repay: $X (loan + 4% interest)"

4. Documents:
   - Purchase Order (file upload, PDF/image)
   - Bill of Lading (file upload, PDF/image)
   - Upload ke Pinata IPFS

On Submit:
1. Validate all fields
2. Upload documents to IPFS, get hashes
3. Create IPFS metadata JSON with all invoice details
4. Convert amounts to cents (multiply by 100)
5. Call createInvoice() on contract
6. Save to invoice_metadata table in Supabase
7. Show success, redirect to invoice list
```

### Invoice Detail Page
```
Buat halaman detail invoice di src/app/exporter/invoices/[id]/page.tsx.
Sections:

1. Header:
   - Invoice number
   - Status badge (large)
   - Created date

2. Invoice Details Card:
   - All invoice information
   - Importer details
   - Documents (link to IPFS)

3. Funding Status Card (if in pool):
   - Pool name
   - Funding progress bar
   - Amount funded / Loan amount
   - Percentage

4. Financial Card:
   - Loan Amount
   - Amount Invested (received from pool)
   - Amount Withdrawn
   - Remaining to withdraw

5. Actions:
   - If status=FUNDED and canWithdraw(): Show "Withdraw Funds" button
   - Call withdrawFunds() on click
   - Show transaction status
   - Refresh data after success

6. Payment Section (if status=WITHDRAWN):
   - Show payment link
   - Copy link button
   - Payment status from Supabase
```

---

## 📝 Phase 4: Investor Features

### Investor Dashboard
```
Buat dashboard investor di src/app/investor/page.tsx.
Stats cards:
- Total Invested (sum of all investments in ETH/USD)
- Active Investments (count of pools with status OPEN/FUNDED)
- Pending Returns (pools completed but not claimed)
- Total Returns Claimed

Recent investments list (5 terakhir)
Quick actions: "Browse Pools"

Wrap dengan RoleGuard allowedRoles={['investor']}
```

### Browse Pools Page
```
Buat halaman browse pools di src/app/investor/pools/page.tsx.
Features:
- Fetch all open pools dari getAllOpenPools()
- Display sebagai cards dengan:
  - Pool name
  - Date range (start - end)
  - Total loan amount (USD)
  - Number of invoices
  - Funding progress bar dan percentage
  - Risk category badge (from Supabase metadata)
  - Expected yield: 4%
- Filter by risk: Low, Medium, High, All
- Sort by: Newest, Ending Soon, Most Funded
- Click -> navigate to pool detail
```

### Pool Detail + Invest Page
```
Buat halaman detail pool di src/app/investor/pools/[id]/page.tsx.
Sections:

1. Pool Header:
   - Name, dates, status
   - Description (from Supabase)
   - Risk badge

2. Funding Progress:
   - Large progress bar
   - Current amount / Target amount
   - Percentage funded
   - Number of investors

3. Invoices in Pool:
   - List semua invoices
   - Show: exporter company, loan amount, due date

4. Current Investors (if any):
   - List investor addresses (truncated)
   - Their investment amounts

5. Investment Form (if status=OPEN):
   - Input: Amount in USD
   - Show converted ETH amount (from currency API)
   - Show expected return: principal + 4%
   - "Invest" button
   - On click: Call invest() with ETH value
   - Show transaction pending/success/error

6. If user already invested:
   - Show "Your Investment" card
   - Amount, percentage, expected return
```

### My Investments Page
```
Buat halaman my investments di src/app/investor/investments/page.tsx.
- Fetch pools dari getInvestorPools()
- For each pool, fetch investment details
- Display cards with:
  - Pool name
  - Investment amount (ETH/USD)
  - Your percentage of pool
  - Pool status
  - Expected returns
  - Progress towards completion
- Filter by: Active, Completed, All
```

### Claim Returns Page
```
Buat halaman claim returns di src/app/investor/returns/page.tsx.
- List completed pools where user has unclaimed returns
- For each:
  - Pool name
  - Original investment
  - Returns earned (4%)
  - Total claimable
  - "Claim" button
- On claim: Call claimReturns()
- Show transaction status
- Below: History of claimed returns
```

---

## 📝 Phase 5: Admin Features

### Admin Dashboard
```
Buat dashboard admin di src/app/admin/page.tsx.
Stats:
- Exporters: X pending verification, Y verified
- Invoices: X pending, Y approved, Z in pools
- Pools: X open, Y funded, Z completed
- Total Platform Volume (USD)
- Platform Fees Collected

Quick Actions:
- Verify Exporters (badge with pending count)
- Review Invoices (badge with pending count)
- Create Pool
- View Payments

Recent Activity Feed:
- New exporter registrations
- New invoices
- New investments
- Payments received

Wrap dengan RoleGuard allowedRoles={['admin']}
```

### Verify Exporters Page
```
Buat halaman verify exporters di src/app/admin/exporters/page.tsx.
- Tabs: Pending, Verified, All
- List exporters from Supabase
- For pending:
  - Show all details: company, tax ID, country, license
  - "Verify" button -> call verifyExporter() + update Supabase
  - "Reject" button (just update Supabase, optional for MVP)
- Show verification date for verified exporters
```

### Review Invoices Page
```
Buat halaman review invoices di src/app/admin/invoices/page.tsx.
- Fetch pending invoices dari getAllPendingInvoices()
- Display as table or cards:
  - Invoice number
  - Exporter company (check if verified)
  - Loan amount
  - Due date
  - Created date
- Click -> go to detail page for review
```

### Invoice Review Detail
```
Buat halaman review invoice detail di src/app/admin/invoices/[id]/page.tsx.
Sections:
1. Exporter Info:
   - Company name
   - Verification status
   - Country, Tax ID

2. Invoice Details:
   - All fields
   - Documents (view/download from IPFS)

3. Risk Assessment (manual by admin):
   - Invoice value vs loan amount ratio
   - Due date timeline
   - Exporter history (optional)

4. Actions:
   - "Approve" button -> approveInvoice()
   - "Reject" button -> rejectInvoice()
   - Optional: Add admin notes
   - Redirect to list after action
```

### Create Pool Page
```
Buat halaman create pool di src/app/admin/pools/new/page.tsx.
Form:
1. Pool Details:
   - Pool Name (required)
   - Start Date (required)
   - End Date (required)
   - Description (textarea)
   - Risk Category (dropdown: Low, Medium, High)

2. Select Invoices:
   - Fetch approved invoices dari getAllApprovedInvoices()
   - Display as selectable list (checkboxes)
   - Show: invoice number, exporter, loan amount, due date
   - Multi-select

3. Summary (auto-calculated):
   - Number of invoices selected
   - Total loan amount
   - Total shipping amount
   - Date range of invoices

On Submit:
- Call createPool() with selected invoice IDs
- Save metadata to Supabase
- Redirect to pool list
```

### Pool Management Page
```
Buat halaman manage pools di src/app/admin/pools/page.tsx.
- List all pools
- Tabs: Open, Funded, Completed, All
- Cards showing:
  - Pool name
  - Date range
  - Funding progress
  - Number of investors
  - Status badge
- Actions per pool:
  - View details
  - If funded: Distribute button
  - If all paid: Distribute profits button
```

### Pool Detail + Actions
```
Buat halaman pool detail di src/app/admin/pools/[id]/page.tsx.
Sections:

1. Pool Overview:
   - All pool details
   - Funding progress
   - Investor list

2. Invoices Table:
   - All invoices in pool
   - Status of each
   - Funded amount for each
   - Actions per invoice

3. Distribution Section (if pool ≥70% funded):
   - For each invoice not yet funded:
     - Show "Distribute" button
     - Input amount (or calculate proportionally)
     - Call distributeToInvoice()

4. Profit Distribution (if all invoices PAID):
   - Show calculation:
     - Total to investors (4%)
     - Platform fee (1%)
     - Total to exporters
   - "Distribute Profits" button
   - Call distributeProfits()

5. Activity Log:
   - Distribution history
   - Payment history
```

### Payment Tracking Page
```
Buat halaman payment tracking di src/app/admin/payments/page.tsx.
- List invoices dengan status WITHDRAWN (payment pending)
- For each:
  - Invoice details
  - Payment link
  - Amount due
  - "Mark as Paid" button
- On mark paid:
  - Call markInvoicePaid()
  - Update Supabase payments table
  - Show success

- Also show: Recently paid invoices
- Filter: Pending, Paid, All
```

---

## 📝 Phase 6: Payment Flow

### Payment API Route
```
Update src/app/api/payment/[invoiceId]/route.ts
GET handler:
1. Fetch invoice from contract
2. Calculate amount due: loanAmount * 1.04
3. Generate payment link: {APP_URL}/pay/{invoiceId}
4. Upsert to Supabase payments table
5. Return: { invoiceId, invoiceNumber, importerName, amountDue, paymentLink }
```

### Payment Page for Importer
```
Buat halaman payment di src/app/pay/[invoiceId]/page.tsx.
- Public page (no wallet required)
- Fetch invoice details
- Show:
  - Invoice number
  - Exporter company
  - Amount due (loan + 4% interest)
  - Due date
  - Payment instructions (for MVP: show bank details or manual process)
- "I have made the payment" info text
- Note: Admin will verify and mark as paid
```

---

## 📝 Phase 7: Testing & Polish

### Add Loading States
```
Untuk setiap halaman yang fetch data:
1. Add loading skeleton saat data loading
2. Add loading spinner di buttons saat transaction pending
3. Add loading overlay untuk full-page actions

Gunakan component dari shadcn/ui atau buat custom skeleton components.
```

### Add Error Handling
```
Review semua halaman dan tambahkan:
1. Try-catch untuk setiap contract call
2. Toast notifications untuk errors (gunakan sonner atau react-hot-toast)
3. Error boundaries untuk unexpected errors
4. Retry buttons untuk failed fetches
5. Friendly error messages
```

### Mobile Responsiveness
```
Review dan fix semua halaman untuk mobile:
1. Check layout di viewport 375px
2. Fix overflow issues
3. Make tables scrollable horizontal
4. Adjust padding dan spacing
5. Test touch interactions
```

### Final Testing
```
Lakukan testing end-to-end:
1. Test complete exporter flow: register -> create invoice -> withdraw
2. Test complete investor flow: register -> invest -> claim returns
3. Test complete admin flow: verify -> approve -> create pool -> distribute
4. Test edge cases: 70% threshold, 100% auto-distribute
5. Test error scenarios: rejected transactions, insufficient funds
```

---

## 🔧 Utility Prompts

### Fix TypeScript Errors
```
Jalankan npm run build dan fix semua TypeScript errors yang muncul.
Untuk setiap error:
1. Identifikasi root cause
2. Fix dengan proper typing
3. Jangan gunakan 'any' kecuali absolutely necessary
```

### Add Missing Component
```
Buat component [COMPONENT_NAME] di src/components/[FOLDER]/[FILE].tsx
Props yang dibutuhkan: [DESCRIBE PROPS]
Functionality: [DESCRIBE WHAT IT DOES]
Gunakan shadcn/ui components dan Tailwind CSS
```

### Update Contract Integration
```
ABI contract telah diupdate. 
1. Update src/lib/contract.ts dengan ABI baru dari [LOCATION]
2. Update CONTRACT_ADDRESS dengan address: [ADDRESS]
3. Update useContract hook jika ada function baru
4. Test semua contract calls masih working
```

### Debug Issue
```
Ada bug: [DESCRIBE THE BUG]
Expected behavior: [WHAT SHOULD HAPPEN]
Actual behavior: [WHAT ACTUALLY HAPPENS]

Tolong investigate dan fix. Check:
1. Console errors
2. Network requests
3. Contract call parameters
4. State management
```

---

## 📋 Quick Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check linting

# Smart Contract (jika pakai Hardhat)
npx hardhat compile              # Compile contracts
npx hardhat test                 # Run tests
npx hardhat run scripts/deploy.js --network lisk-sepolia  # Deploy

# Database
# Run SQL in Supabase dashboard

# Check file structure
ls -la src/app/
ls -la src/components/
```

---

## Tips untuk Coding Agent

1. **Selalu baca file context dulu** - Minta agent baca copilot-instructions.md sebelum coding
2. **Satu task per prompt** - Fokus satu halaman/component per prompt
3. **Provide feedback** - Jika hasil tidak sesuai, jelaskan apa yang kurang
4. **Incremental development** - Build dan test setelah setiap task
5. **Check implementation-checklist.md** - Update checklist setelah selesai task
