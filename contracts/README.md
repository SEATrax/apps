# SEATrax Smart Contract

## Overview

SEATrax is a shipping invoice funding platform that connects exporters, investors, and importers through blockchain technology.

## Contract Architecture

- **Network**: Lisk Sepolia Testnet (Chain ID: 4202)
- **Standard**: ERC721 (Invoice NFTs)
- **Access Control**: OpenZeppelin AccessControl
- **Security**: ReentrancyGuard for withdrawal functions

## Features

### For Exporters
- Register as exporter
- Create invoice NFT with shipping details
- Withdraw funds when invoice is ≥70% funded
- Auto-receive funds at 100% pool funding

### For Investors
- Register as investor
- Invest ETH in curated invoice pools
- Automatic percentage calculation
- Claim returns (principal + 4% yield) after completion

### For Admins
- Verify exporters
- Approve/reject invoices
- Create investment pools
- Distribute funds to invoices
- Mark invoices as paid
- Distribute profits

## Business Logic

### Invoice Lifecycle
```
PENDING → APPROVED → IN_POOL → FUNDED → WITHDRAWN → PAID → COMPLETED
              ↘ REJECTED
```

### Pool Lifecycle
```
OPEN (0-100% funded) → FUNDED (100%) → COMPLETED (profits distributed)
```

### Key Rules

1. **70% Threshold**: Exporter can withdraw when invoice receives ≥70% of requested loan
2. **100% Auto-Distribution**: When pool hits 100%, all invoices are automatically funded and funds sent to exporters
3. **Profit Distribution**:
   - Investors: 4% yield (400 basis points)
   - Platform: 1% fee (100 basis points)
   - Exporters: Remaining after repayment

## Installation

```bash
# Install dependencies
npm install

# Install Hardhat and OpenZeppelin
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

## Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Add your configuration:
```env
DEPLOYER_PRIVATE_KEY=your_private_key
PLATFORM_TREASURY_ADDRESS=0xYourTreasuryAddress
BLOCKSCOUT_API_KEY=abc
```

## Testing

Run all tests:
```bash
npm run test:contract
```

Tests cover:
- ✅ User registration (exporter & investor)
- ✅ Invoice creation and approval workflow
- ✅ Pool creation with multiple invoices
- ✅ Investment tracking and percentage calculation
- ✅ 70% threshold withdrawal
- ✅ 100% auto-distribution
- ✅ Profit distribution (4% investor, 1% platform fee)
- ✅ Access control and permissions

## Compilation

Compile contracts:
```bash
npm run compile
```

This will:
- Compile Solidity contracts
- Generate ABIs in `artifacts/`
- Create type definitions

## Deployment

### Deploy to Lisk Sepolia Testnet

1. Get testnet ETH from [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)

2. Deploy contract:
```bash
npm run deploy
```

This will:
- Deploy SEATrax contract
- Wait for confirmations
- Verify on BlockScout
- Update `.env.local` with contract address
- Save deployment info to `deployments/lisk-sepolia.json`

### Deploy to Local Hardhat Network

For testing:
```bash
npm run deploy:local
```

## Contract Interaction

After deployment, interact with contract:

### View Functions (no gas)
```javascript
// Get invoice details
await contract.getInvoice(tokenId);

// Get pool details
await contract.getPool(poolId);

// Check if exporter can withdraw
await contract.canWithdraw(invoiceId);

// Get pool funding percentage
await contract.getPoolFundingPercentage(poolId);
```

### State-Changing Functions (requires gas)

**Exporter:**
```javascript
await contract.registerExporter();
await contract.createInvoice(exporterCompany, importerCompany, ...);
await contract.withdrawFunds(invoiceId);
```

**Investor:**
```javascript
await contract.registerInvestor();
await contract.invest(poolId, { value: ethAmount });
await contract.claimReturns(poolId);
```

**Admin:**
```javascript
await contract.approveInvoice(invoiceId);
await contract.createPool(name, invoiceIds, startDate, endDate);
await contract.distributeProfits(poolId);
```

## Admin Setup

After deployment, grant admin role:

```javascript
const ADMIN_ROLE = await contract.ADMIN_ROLE();
await contract.grantRole(ADMIN_ROLE, adminAddress);
```

## Security Considerations

1. **ReentrancyGuard**: All withdrawal functions protected against reentrancy attacks
2. **AccessControl**: Role-based permissions for admin functions
3. **Validation**: Extensive input validation on all functions
4. **Status Checks**: Invoice and pool status verified before state changes

## Gas Optimization

- Uses `Counters` for efficient ID generation
- Optimized storage patterns
- Batch operations where possible
- View functions for off-chain data access

## Events

All important actions emit events for off-chain tracking:
- `InvoiceCreated`, `InvoiceApproved`, `InvoiceRejected`
- `PoolCreated`, `InvestmentMade`
- `InvoiceFunded`, `FundsWithdrawn`
- `InvoicePaid`, `ProfitsDistributed`, `ReturnsClaimed`

## Upgrades & Maintenance

This is a non-upgradeable contract. For production:
- Consider implementing proxy pattern
- Add pause functionality
- Implement emergency withdrawal
- Add governance mechanisms

## Links

- **Lisk Sepolia RPC**: https://rpc.sepolia-api.lisk.com
- **BlockScout Explorer**: https://sepolia-blockscout.lisk.com
- **Lisk Docs**: https://docs.lisk.com

## License

MIT
