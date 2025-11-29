# 🚀 Quick Fix - Hardhat v2.22 for Node v25

## ⚡ Fast Track Installation

### Step 1: Clean Install (Choose one)

**Windows PowerShell:**
```powershell
.\scripts\reinstall.ps1
```

**Unix/Linux/Mac:**
```bash
chmod +x scripts/reinstall.sh && ./scripts/reinstall.sh
```

**Manual:**
```bash
rm -rf node_modules package-lock.json cache artifacts
npm install
```

### Step 2: Verify
```bash
npm run compile
# Should see: ✓ Compiled 1 Solidity file successfully
```

### Step 3: Deploy
```bash
# Setup environment first
cp .env.example .env.local
# Add your DEPLOYER_PRIVATE_KEY to .env.local

# Get testnet ETH
# https://sepolia-faucet.lisk.com/

# Deploy
npm run deploy
```

## ✅ What Was Fixed

| Issue | Solution |
|-------|----------|
| Hardhat v2.19 → v2.22 | Updated to latest stable version |
| Node v25 compatibility | All deps updated for Node v25 |
| OpenZeppelin v5 imports | Fixed ReentrancyGuard path |
| Gas estimation | Added `gas: "auto"` config |
| Missing plugins | Added hardhat-verify, hardhat-ethers |

## 📦 Key Dependencies

```json
"hardhat": "^2.22.16"              ✅ Latest stable
"@openzeppelin/contracts": "^5.1.0" ✅ Latest
"ethers": "^6.13.4"                 ✅ Latest
"@nomicfoundation/hardhat-toolbox": "^5.0.0" ✅ Latest
```

## 🧪 Test It

```bash
npm run test:contract
# Expected: 31 passing
```

## 📚 Full Documentation

- `HARDHAT_UPDATE.md` - Full changelog
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `QUICKSTART.md` - Quick start guide

## 🆘 Troubleshooting

**Error: Cannot find module**
```bash
npm run reinstall
```

**Error: Compilation failed**
```bash
npm install @openzeppelin/contracts@^5.1.0
npm run compile
```

**Error: Network connection**
```bash
# Check .env.local has:
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia-api.lisk.com
```

## ✨ Status

✅ All dependencies updated
✅ Contract compiles
✅ All tests pass
✅ Deployment script works
✅ Node v25 compatible

**Ready to deploy!** 🎉
