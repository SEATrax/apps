# 🚀 Quick Start Guide - Phase 1

## Prerequisites
- Node.js 18+ installed
- Git installed
- Wallet with Lisk Sepolia testnet ETH

## Installation (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add:
# - DEPLOYER_PRIVATE_KEY=your_wallet_private_key
# - PLATFORM_TREASURY_ADDRESS=0xYourAddress
```

### Step 3: Get Testnet ETH
Visit: https://sepolia-faucet.lisk.com/
Request ETH for your deployer wallet

### Step 4: Verify Setup (Optional)
```bash
# Compile contracts
npm run compile

# Run tests
npm run test:contract
```

### Step 5: Deploy
```bash
npm run deploy
```

✅ Done! Contract address will be in `.env.local`

---

## Quick Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production

# Smart Contract
npm run compile          # Compile Solidity contracts
npm run test:contract    # Run contract tests
npm run deploy           # Deploy to Lisk Sepolia
npm run deploy:local     # Deploy to local Hardhat network
```

---

## Project Structure

```
seatrax-starter/
├── contracts/           # Smart contracts
│   ├── SEATrax.sol     # Main contract
│   └── README.md       # Contract docs
├── scripts/            # Deployment scripts
│   ├── deploy.js       # Main deployment
│   ├── setup.sh        # Setup script (Unix)
│   └── setup.ps1       # Setup script (Windows)
├── test/               # Contract tests
│   └── SEATrax.test.js
├── src/                # Next.js application
│   ├── app/           # App routes
│   ├── components/    # React components
│   ├── hooks/         # React hooks (useContract, usePanna)
│   ├── lib/           # Utilities (contract ABI, Supabase, etc)
│   └── types/         # TypeScript types
└── hardhat.config.js  # Hardhat configuration
```

---

## After Deployment

### 1. Grant Admin Role
```javascript
// Using Hardhat console or script
const contract = await ethers.getContractAt("SEATrax", "CONTRACT_ADDRESS");
const ADMIN_ROLE = await contract.ADMIN_ROLE();
await contract.grantRole(ADMIN_ROLE, "ADMIN_WALLET_ADDRESS");
```

### 2. Verify Contract Address
Check `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### 3. Test Contract Functions
Visit BlockScout: https://sepolia-blockscout.lisk.com/address/CONTRACT_ADDRESS

---

## Development Workflow

### For Contract Changes:
1. Edit `contracts/SEATrax.sol`
2. Run `npm run compile`
3. Run `npm run test:contract`
4. Deploy: `npm run deploy`
5. Update frontend if ABI changed

### For Frontend:
1. Edit files in `src/`
2. Run `npm run dev`
3. Test in browser
4. Build: `npm run build`

---

## Troubleshooting

### "Insufficient funds"
- Get more testnet ETH from faucet
- Check deployer wallet balance

### "Contract already deployed"
- Normal if re-deploying
- Contract address will update automatically

### "Cannot find module"
- Run `npm install` again
- Check `node_modules/` exists

### Tests failing
- Ensure dependencies installed
- Check Hardhat network is running (for local tests)
- Review test output for specific errors

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `contracts/SEATrax.sol` | Main smart contract |
| `src/lib/contract.ts` | Contract ABI & address |
| `src/hooks/useContract.ts` | React hook for contract calls |
| `hardhat.config.js` | Network & deployment config |
| `scripts/deploy.js` | Deployment automation |
| `.env.local` | Environment variables (not in git) |

---

## Next Steps

After Phase 1 deployment:

✅ **Phase 1**: Smart Contract (DONE)
⬜ **Phase 2**: Authentication & Onboarding
⬜ **Phase 3**: Exporter Features
⬜ **Phase 4**: Investor Features
⬜ **Phase 5**: Admin Features
⬜ **Phase 6**: Payment Flow
⬜ **Phase 7**: Testing & Polish

See `PROMPTS.md` for detailed prompts for each phase.

---

## Resources

- **Lisk Sepolia Faucet**: https://sepolia-faucet.lisk.com/
- **BlockScout Explorer**: https://sepolia-blockscout.lisk.com
- **Lisk Documentation**: https://docs.lisk.com
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/

---

## Support

Issues? Check:
1. `PHASE1_COMPLETE.md` - Full Phase 1 documentation
2. `contracts/README.md` - Contract-specific docs
3. `PROMPTS.md` - Development prompts
4. `.github/copilot-instructions.md` - Project overview
