# SEATrax - Shipping Invoice Funding Platform

A blockchain-based platform that enables exporters to get short-term loans against shipping invoices, with investors funding curated pools of invoices for returns.

## 🌊 Overview

SEATrax connects exporters, investors, and admins through smart contracts to facilitate secure and transparent shipping invoice financing. The system uses NFTs to represent both individual invoices and pools of curated invoices.

## ✨ Key Features

- **Invoice NFTs**: Individual shipping invoices represented as ERC-721 tokens
- **Pool NFTs**: Curated bundles of invoices for investment
- **70% Funding Threshold**: Exporters can withdraw when invoices reach 70% funding
- **Profit Sharing**: 4% yield for investors + 1% platform fee
- **Role-based Access**: Admin, Exporter, and Investor roles

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Web3**: Panna SDK (Lisk blockchain)
- **Backend**: Supabase
- **IPFS**: Pinata

## 📁 Project Structure

```
seatrax-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles & theme
│   │   ├── invoices/          # Invoices page
│   │   ├── pools/             # Investment pools page
│   │   └── dashboard/         # User dashboard
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── header.tsx         # App header with wallet connection
│   ├── hooks/
│   │   ├── usePanna.ts        # Panna SDK integration hook
│   │   ├── useContract.ts     # Smart contract interactions
│   │   └── index.ts
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   ├── contract.ts        # Contract ABI & constants
│   │   ├── supabase.ts        # Supabase client
│   │   └── pinata.ts          # IPFS/Pinata utilities
│   ├── providers/
│   │   └── index.tsx          # React context providers
│   ├── config/
│   │   └── index.ts           # App configuration
│   └── types/
│       └── index.ts           # TypeScript types
├── .env.example               # Environment variables template
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Lisk Sepolia testnet ETH

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment file and configure:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Theme Customization

The theme uses CSS custom properties in `src/app/globals.css`. Customize colors, spacing, and more by modifying the `:root` and `.dark` selectors.

### Smart Contract Integration

1. Get the actual ABI from [SEATrax Smart Contract](https://github.com/SEATrax/smart-contract) (dev branch)
2. Update `src/lib/contract.ts` with the actual ABI
3. Deploy the contract and update `NEXT_PUBLIC_CONTRACT_ADDRESS`

### Panna SDK Integration

The `src/hooks/usePanna.ts` includes a placeholder implementation. Replace with actual Panna SDK when available.

## 📱 User Roles

- **Admin**: Approve/reject invoices, create pools, monitor operations
- **Exporter**: Submit invoices, track funding, withdraw at 70%, repay upon settlement
- **Investor**: Browse pools, invest, track returns, claim profits

## 📄 License

MIT License

## 🔗 Links

- [Smart Contract Repository](https://github.com/SEATrax/smart-contract)
- [Lisk Documentation](https://lisk.com/documentation)

---

Built with ❤️ using Next.js, Panna SDK, and Lisk blockchain.
