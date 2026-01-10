#!/bin/bash

# SEATrax Smart Contract Setup & Verification Script

echo "🚀 SEATrax Smart Contract Setup"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🔍 Verifying installation..."

# Check for critical packages
if [ -d "node_modules/hardhat" ]; then
    echo "✅ Hardhat installed"
else
    echo "❌ Hardhat missing"
fi

if [ -d "node_modules/@openzeppelin/contracts" ]; then
    echo "✅ OpenZeppelin contracts installed"
else
    echo "❌ OpenZeppelin contracts missing"
fi

if [ -d "node_modules/@nomicfoundation/hardhat-toolbox" ]; then
    echo "✅ Hardhat toolbox installed"
else
    echo "❌ Hardhat toolbox missing"
fi

echo ""
echo "🔨 Compiling contracts..."
npx hardhat compile

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
else
    echo "❌ Compilation failed"
    exit 1
fi

echo ""
echo "🧪 Running tests..."
npx hardhat test

if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy .env.example to .env.local"
echo "2. Add your DEPLOYER_PRIVATE_KEY"
echo "3. Get testnet ETH from https://sepolia-faucet.lisk.com/"
echo "4. Run: npm run deploy"
