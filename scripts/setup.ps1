# SEATrax Smart Contract Setup & Verification Script (Windows)

Write-Host "🚀 SEATrax Smart Contract Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan

# Check for critical packages
$checks = @(
    @{ Path = "node_modules/hardhat"; Name = "Hardhat" },
    @{ Path = "node_modules/@openzeppelin/contracts"; Name = "OpenZeppelin contracts" },
    @{ Path = "node_modules/@nomicfoundation/hardhat-toolbox"; Name = "Hardhat toolbox" }
)

foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "✅ $($check.Name) installed" -ForegroundColor Green
    } else {
        Write-Host "❌ $($check.Name) missing" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔨 Compiling contracts..." -ForegroundColor Cyan
npx hardhat compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilation successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Compilation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Cyan
npx hardhat test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy .env.example to .env.local"
Write-Host "2. Add your DEPLOYER_PRIVATE_KEY"
Write-Host "3. Get testnet ETH from https://sepolia-faucet.lisk.com/"
Write-Host "4. Run: npm run deploy"
