# Clean Installation Script for Windows

Write-Host "🧹 Cleaning up old installations..." -ForegroundColor Cyan

# Remove node_modules and lock files
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

if (Test-Path "cache") {
    Remove-Item -Recurse -Force "cache"
    Write-Host "✅ Removed cache" -ForegroundColor Green
}

if (Test-Path "artifacts") {
    Remove-Item -Recurse -Force "artifacts"
    Write-Host "✅ Removed artifacts" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies with latest versions..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan

# Check Node version
$nodeVersion = node --version
Write-Host "Node version: $nodeVersion" -ForegroundColor Yellow

# Check npm version
$npmVersion = npm --version
Write-Host "npm version: $npmVersion" -ForegroundColor Yellow

# Check if Hardhat is installed
if (Test-Path "node_modules/.bin/hardhat") {
    $hardhatVersion = npx hardhat --version
    Write-Host "✅ Hardhat installed: $hardhatVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Hardhat not found!" -ForegroundColor Red
    exit 1
}

# Check OpenZeppelin
if (Test-Path "node_modules/@openzeppelin/contracts") {
    Write-Host "✅ OpenZeppelin contracts installed" -ForegroundColor Green
} else {
    Write-Host "❌ OpenZeppelin contracts missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔨 Compiling contracts..." -ForegroundColor Cyan
npm run compile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Compilation successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup complete and verified!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env.local with your DEPLOYER_PRIVATE_KEY"
Write-Host "2. Get testnet ETH from https://sepolia-faucet.lisk.com/"
Write-Host "3. Run: npm run deploy"
