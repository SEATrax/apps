# SEATrax Deployment Guide - Hardhat v2.22+ & Node v25

## Prerequisites Check

### 1. Node.js Version
```bash
node --version
# Should show: v25.x.x or v22.x.x (recommended)
```

**Note**: Hardhat 2.22+ works best with Node.js v22 LTS. If using v25, ensure all dependencies are compatible.

### 2. Check Package Manager
```bash
npm --version
# Should show: v10.x.x or higher
```

## Installation Steps

### Step 1: Clean Install
```bash
# Remove old node_modules and lock files
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Verify Hardhat installation
npx hardhat --version
# Should show: 2.22.16 or higher
```

### Step 2: Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add:
nano .env.local
```

Required variables:
```env
# Your wallet private key (DO NOT SHARE!)
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere

# Platform treasury address (can be same as deployer for testing)
PLATFORM_TREASURY_ADDRESS=0xYourTreasuryAddressHere

# Optional: For contract verification
BLOCKSCOUT_API_KEY=abc

# Network (already set in .env.example)
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com
NEXT_PUBLIC_CHAIN_ID=4202
```

### Step 3: Get Testnet ETH
1. Go to: https://sepolia-faucet.lisk.com/
2. Connect your wallet (same address as DEPLOYER_PRIVATE_KEY)
3. Request testnet ETH
4. Wait for confirmation

### Step 4: Compile Contracts
```bash
# Compile smart contracts
npm run compile

# You should see:
# ✓ Compiled 1 Solidity file successfully
```

**If you see errors about OpenZeppelin imports:**
```bash
# Ensure OpenZeppelin is installed
npm install @openzeppelin/contracts@^5.1.0
npm run compile
```

### Step 5: Run Tests (Optional but Recommended)
```bash
# Run all contract tests
npm run test:contract

# You should see all 31 tests passing
```

### Step 6: Deploy to Lisk Sepolia
```bash
# Deploy contract
npm run deploy

# This will:
# 1. Deploy SEATrax contract
# 2. Wait for confirmations (5 blocks)
# 3. Verify on BlockScout (if API key provided)
# 4. Update .env.local with contract address
# 5. Save deployment info to deployments/lisk-sepolia.json
```

Expected output:
```
🚀 Deploying SEATrax contract to Lisk Sepolia...
Network: lisk-sepolia
📝 Deploying with account: 0x...
💰 Account balance: X.XXX ETH

⏳ Deploying SEATrax contract...
Constructor args: { platformTreasury: '0x...' }
Waiting for deployment transaction...
✅ SEATrax deployed to: 0x...
🔗 View on BlockScout: https://sepolia-blockscout.lisk.com/address/0x...

⏳ Waiting for block confirmations...
✅ Confirmed!

⏳ Verifying contract on BlockScout...
✅ Contract verified!

⏳ Updating .env.local...
✅ Updated .env.local with contract address

====================================================
📋 DEPLOYMENT SUMMARY
====================================================
Network:          Lisk Sepolia
Contract Address: 0x...
Deployer:         0x...
Treasury:         0x...
BlockScout:       https://sepolia-blockscout.lisk.com/address/0x...
====================================================

✅ Deployment complete!
```

## Troubleshooting

### Error: "Cannot find module '@nomicfoundation/hardhat-toolbox'"
```bash
npm install
# or
npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0
```

### Error: "Insufficient funds"
```bash
# Get more testnet ETH
# Visit: https://sepolia-faucet.lisk.com/
```

### Error: "Invalid private key"
```bash
# Check your .env.local file
# Private key should start with 0x
# Example: DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...
```

### Error: "Error HH108: Cannot connect to network"
```bash
# Check RPC URL in .env.local
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com

# Test connection
curl https://rpc.sepolia-api.lisk.com \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Error: "ReentrancyGuard.sol not found"
```bash
# Update OpenZeppelin to v5.1+
npm install @openzeppelin/contracts@^5.1.0
npm run compile
```

### Compilation Warnings
Solidity warnings are normal. As long as compilation succeeds, you can proceed.

## After Deployment

### 1. Verify Contract Address
Check `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedAddress
```

### 2. Grant Admin Role
Create `scripts/grant-admin.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const adminAddress = "0xYourAdminAddress"; // Replace with actual admin
  
  const contract = await hre.ethers.getContractAt("SEATrax", contractAddress);
  const ADMIN_ROLE = await contract.ADMIN_ROLE();
  
  console.log("Granting ADMIN_ROLE to:", adminAddress);
  const tx = await contract.grantRole(ADMIN_ROLE, adminAddress);
  await tx.wait();
  
  console.log("✅ Admin role granted!");
}

main().catch(console.error);
```

Run:
```bash
node scripts/grant-admin.js
```

### 3. Verify on BlockScout
Visit: `https://sepolia-blockscout.lisk.com/address/YOUR_CONTRACT_ADDRESS`

You should see:
- Contract verified ✓
- Contract source code
- Read/Write contract interface

### 4. Test Contract Functions
Using BlockScout "Read Contract" tab, test:
- `getAllOpenPools()` - should return empty array initially
- `platformTreasury()` - should return your treasury address

## Node.js Version Compatibility

| Node Version | Status | Notes |
|--------------|--------|-------|
| v22.x LTS | ✅ Recommended | Best compatibility |
| v23.x | ✅ Supported | Works well |
| v24.x | ✅ Supported | Works well |
| v25.x | ⚠️ Testing | May have minor issues |
| v18.x | ⚠️ Deprecated | Use v22+ |

**Recommendation**: Use Node.js v22 LTS for best stability.

```bash
# Using nvm (Node Version Manager)
nvm install 22
nvm use 22

# Or using n
n 22
```

## Quick Commands Reference

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production

# Smart Contract
npm run compile          # Compile contracts
npm run test:contract    # Run tests
npm run deploy           # Deploy to Lisk Sepolia
npm run deploy:local     # Deploy to local Hardhat network

# Hardhat Console
npx hardhat console --network lisk-sepolia

# Check deployed contract
npx hardhat verify --network lisk-sepolia CONTRACT_ADDRESS "TREASURY_ADDRESS"
```

## Security Checklist

Before mainnet deployment:
- [ ] Audit smart contract code
- [ ] Test all functions thoroughly
- [ ] Use hardware wallet for deployment
- [ ] Set proper admin addresses
- [ ] Configure multi-sig for treasury
- [ ] Enable time-locks for critical functions
- [ ] Add pause mechanism
- [ ] Conduct security audit

## Support

If you encounter issues:
1. Check this guide first
2. Review `QUICKSTART.md`
3. Check Hardhat docs: https://hardhat.org/docs
4. Lisk docs: https://docs.lisk.com

---

**Updated**: November 29, 2025
**Hardhat Version**: 2.22.16+
**Node.js**: v22-25 supported
