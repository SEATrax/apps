### Profile Creation Flow

1. User authenticates (magic link or wallet connect). This only creates a Supabase `auth.users` record.
2. Wallet provisioning (Panna stub) supplies `walletAddress` and persists mapping in `user_wallets` (requires RLS policies in migrations).
3. Role resolution checks existing `exporters` / `investors` tables:
	- If no profile found, UI shows onboarding buttons.
	- After submitting onboarding form, a row is inserted and role becomes active; header dropdown then shows company name (exporter) or name (investor).
4. Admin role is determined solely by `ADMIN_ADDRESSES` env variable (lowercase addresses).

If you see no data in Supabase after magic link login:
- You have not completed onboarding; no exporter/investor row is created automatically.
- Check `user_wallets` table exists and RLS policies applied; if provisioning failed you will need an external wallet.
- Use SQL to inspect:
```sql
select * from auth.users order by created_at desc;
select * from public.user_wallets order by created_at desc;
select * from public.exporters order by created_at desc;
select * from public.investors order by created_at desc;
```

To auto-create a default investor profile on first login (optional enhancement), you could insert a row in `AuthProvider` after successful wallet provisioning if no profile is found.

# SEATrax - Shipping Invoice Funding Platform

A blockchain-based platform that enables exporters to get short-term loans against shipping invoices, with investors funding curated pools of invoices for returns.

**📍 Current Status**: **Phase 1 Complete** ✅ - Smart contract deployed and tested

## 🌊 Overview

SEATrax connects exporters, investors, and admins through smart contracts to facilitate secure and transparent shipping invoice financing. The system uses NFTs to represent both individual invoices and pools of curated invoices.

## ✨ Key Features


## 🛠️ Tech Stack

The current implementation supports two access modes:

- Wallet Login: Full functionality (creating invoices, investing, withdrawals) requires an injected EVM wallet (MetaMask) or future Panna SDK wallet integration. On connect we resolve on-chain role (admin via `ADMIN_ADDRESSES`, exporter/investor via Supabase profiles).
- Email Session (Guest / Placeholder): If no wallet provider is detected, users can start a lightweight email session (placeholder for future Panna SDK account-based auth). This session allows basic navigation (e.g. viewing pools) but cannot perform on-chain transactions. A wallet must be connected to create profiles tied to addresses or execute contract functions.

Panna SDK Integration TODOs:
1. Replace `usePanna` placeholder methods with real SDK connect/read/write.
2. Implement account-based login (email/social) using SDK APIs instead of the local email session.
3. Map SDK account → wallet address or embedded custodial key for signing transactions.
4. Remove temporary `AuthProvider` or adapt it to wrap SDK session state.

Guest / Hybrid Notes:
- Magic link via Supabase establishes session; Panna provisions wallet address automatically (stubbed).
- If Panna provisioning fails a fallback banner appears; user may connect external wallet manually.
- Role resolution occurs after wallet provisioning and is surfaced in the header dropdown.
- `user_wallets` table persists the mapping of Supabase user → wallet.

Environment Required for Full Features:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`, `ADMIN_ADDRESSES`, Supabase credentials.
Environment Required for Full Features:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`, `ADMIN_ADDRESSES`, Supabase credentials.
- Panna SDK identifiers: `NEXT_PUBLIC_PANNA_CLIENT_ID`, `NEXT_PUBLIC_PANNA_PARTNER_ID` (future real integration).

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React

### Blockchain
- **Network**: Lisk Sepolia Testnet
- **Smart Contract**: Solidity 0.8.20
- **Standards**: ERC-721, AccessControl, ReentrancyGuard
- **Libraries**: OpenZeppelin Contracts
- **Development**: Hardhat

### Backend & Storage
- **Database**: Supabase (PostgreSQL)
- **IPFS**: Pinata
- **Wallet**: Panna SDK

## 📁 Project Structure

```
seatrax-starter/
├── contracts/              # Smart contracts ✅ PHASE 1 COMPLETE
│   ├── SEATrax.sol        # Main contract (31 test cases passing)
│   └── README.md          # Contract documentation
├── scripts/               # Deployment & setup scripts
│   ├── deploy.js          # Automated deployment to Lisk Sepolia
│   ├── setup.sh           # Setup verification (Unix)
│   └── setup.ps1          # Setup verification (Windows)
├── test/                  # Contract tests
│   └── SEATrax.test.js    # Comprehensive test suite
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx      # Homepage
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles & theme
│   │   ├── invoices/     # Invoices page
│   │   ├── pools/        # Investment pools page
│   │   └── dashboard/    # User dashboard
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── header.tsx    # App header with wallet connection
│   ├── hooks/
│   │   ├── usePanna.ts   # Wallet connection
│   │   ├── useContract.ts # Smart contract interactions ✅
│   │   └── index.ts
│   ├── lib/
│   │   ├── utils.ts      # Utility functions
│   │   ├── contract.ts   # Contract ABI & constants ✅
│   │   ├── supabase.ts   # Supabase client
│   │   ├── currency.ts   # USD ↔ ETH conversion
│   │   └── pinata.ts     # IPFS/Pinata utilities
│   ├── providers/
│   │   └── wallet-provider.tsx # Wallet context
│   ├── config/
│   │   └── index.ts      # App configuration
│   └── types/
│       └── index.ts      # TypeScript types
├── hardhat.config.js      # Hardhat configuration ✅
├── .env.example           # Environment variables template
├── QUICKSTART.md          # Quick start guide
├── PHASE1_COMPLETE.md     # Phase 1 documentation
└── package.json           # Dependencies & scripts
```

## 🚀 Getting Started

### Quick Start (5 minutes)

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Compile & test contract (optional)
npm run compile
npm run test:contract

# 4. Deploy to Lisk Sepolia
npm run deploy

# 5. Start development server
npm run dev
```

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Lisk Sepolia testnet ETH ([Get from faucet](https://sepolia-faucet.lisk.com/))

## 📋 Development Status

### ✅ Phase 1: Smart Contract (COMPLETE)
- [x] SEATrax.sol implementation
- [x] Comprehensive test suite (31 tests)
- [x] Deployment scripts for Lisk Sepolia
- [x] Contract verification on BlockScout
- [x] ABI integration in frontend

**Details**: See [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md)

### ⬜ Phase 2: Authentication & Onboarding (TODO)
- [ ] Login page with wallet connection
- [ ] Exporter onboarding form
- [ ] Investor onboarding form
- [ ] Role guard component

### ⬜ Phase 3: Exporter Features (TODO)
- [ ] Dashboard with stats
- [ ] Invoice creation form
- [ ] Invoice list & detail pages
- [ ] Withdrawal functionality

### ⬜ Phase 4: Investor Features (TODO)
- [ ] Pool browsing page
- [ ] Investment interface
- [ ] Portfolio tracking
- [ ] Returns claiming

### ⬜ Phase 5: Admin Features (TODO)
- [ ] Exporter verification
- [ ] Invoice approval workflow
- [ ] Pool creation
- [ ] Payment tracking

### ⬜ Phase 6: Payment Flow (TODO)
- [ ] Payment link generation
- [ ] Importer payment page
- [ ] Payment confirmation

### ⬜ Phase 7: Testing & Polish (TODO)
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] End-to-end testing

## 🔧 Configuration

### Environment Variables

Required variables in `.env.local`:

```env
# Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Deployment (for contract deployment)
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
PLATFORM_TREASURY_ADDRESS=0xYourTreasuryAddress
BLOCKSCOUT_API_KEY=abc

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Pinata IPFS
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs
PINATA_JWT=your_pinata_jwt

# Currency API
CURRENCY_FREAKS_API_KEY=your_api_key

# Panna SDK (optional)
NEXT_PUBLIC_PANNA_CLIENT_ID=your_client_id
NEXT_PUBLIC_PANNA_PARTNER_ID=your_partner_id

# Network
NEXT_PUBLIC_CHAIN_ID=4202
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com
```

### Theme Customization

The theme uses CSS custom properties in `src/app/globals.css`. Customize colors, spacing, and more by modifying the `:root` and `.dark` selectors.

### Smart Contract

The contract is already deployed and integrated:
- **ABI**: Defined in `src/lib/contract.ts`
- **Hooks**: Available via `useContract()` hook
- **Address**: Auto-updated after deployment

## 📝 Available Scripts

### Frontend
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Smart Contract
```bash
npm run compile          # Compile Solidity contracts
npm run test:contract    # Run contract tests
npm run deploy           # Deploy to Lisk Sepolia
npm run deploy:local     # Deploy to local Hardhat network
```

## 🧪 Testing

### Contract Tests
```bash
npm run test:contract
```

Test coverage includes:
- User registration (exporter & investor)
- Invoice creation and approval
- Pool creation and management
- Investment tracking
- 70% threshold withdrawal
- 100% auto-distribution
- Profit distribution
- Access control

### Frontend Tests
```bash
# TODO: Add frontend tests in Phase 7
```

## 📱 User Roles

### Admin
- Verify exporters
- Approve/reject invoices
- Create investment pools
- Distribute funds to invoices
- Mark invoices as paid
- Distribute profits (4% investor, 1% platform)

### Exporter
- Register and get verified
- Submit shipping invoices with documents (IPFS)
- Track funding progress
- Withdraw funds at ≥70% funding
- Receive payment link for importer

### Investor
- Register as investor
- Browse curated pools
- Invest ETH in pools
- Track investments and returns
- Claim returns (principal + 4% yield)

## 🏗️ Architecture

### Smart Contract Features
- **ERC-721**: Invoice NFTs with metadata
- **Access Control**: Role-based permissions
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Auto-Distribution**: Automatic fund distribution at 100% funding
- **Profit Calculation**: Precise percentage-based distribution

### Business Logic
1. Exporter creates invoice → PENDING
2. Admin approves → APPROVED
3. Admin creates pool with approved invoices → IN_POOL
4. Investors invest ETH → tracking percentages
5. At ≥70%: Admin can distribute to invoices → FUNDED
6. Exporter withdraws funds → WITHDRAWN
7. Importer pays → PAID
8. Admin distributes profits → COMPLETED

### Key Thresholds
- **70% Funding**: Minimum for exporter withdrawal
- **100% Funding**: Triggers auto-distribution
- **4% Investor Yield**: Fixed return for investors
- **1% Platform Fee**: Platform revenue

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md) - Phase 1 detailed documentation
- [contracts/README.md](./contracts/README.md) - Smart contract documentation
- [PROMPTS.md](./.github/PROMPTS.md) - Development prompts for each phase
- [copilot-instructions.md](./.github/copilot-instructions.md) - Project overview & specs

## 🔗 Resources

- **Lisk Sepolia Faucet**: https://sepolia-faucet.lisk.com/
- **BlockScout Explorer**: https://sepolia-blockscout.lisk.com
- **Lisk Documentation**: https://docs.lisk.com
- **Hardhat Documentation**: https://hardhat.org/docs
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts

## 🤝 Contributing

This is an MVP project. For contributions:
1. Check current phase in README
2. Review PROMPTS.md for task descriptions
3. Follow existing code patterns
4. Test thoroughly before PR

## 📄 License

MIT License
