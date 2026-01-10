#!/bin/bash

echo "🧹 Cleaning up old installations..."

# Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -rf cache
rm -rf artifacts

echo "✅ Cleanup complete!"
echo ""
echo "📦 Installing dependencies with latest versions..."

npm install

echo ""
echo "🔍 Verifying installation..."

# Check Node version
echo "Node version: $(node --version)"

# Check npm version
echo "npm version: $(npm --version)"

# Check if Hardhat is installed
if [ -f "node_modules/.bin/hardhat" ]; then
    echo "✅ Hardhat installed: $(npx hardhat --version)"
else
    echo "❌ Hardhat not found!"
    exit 1
fi

# Check OpenZeppelin
if [ -d "node_modules/@openzeppelin/contracts" ]; then
    echo "✅ OpenZeppelin contracts installed"
else
    echo "❌ OpenZeppelin contracts missing!"
    exit 1
fi

echo ""
echo "🔨 Compiling contracts..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Setup complete and verified!"
echo "================================"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env.local with your DEPLOYER_PRIVATE_KEY"
echo "2. Get testnet ETH from https://sepolia-faucet.lisk.com/"
echo "3. Run: npm run deploy"
