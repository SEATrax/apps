# Export-Import Funding Platform - Business Process Flow & Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Core Business Process Flow](#core-business-process-flow)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Frontend Integration Methods](#frontend-integration-methods)
5. [Role-Based Workflows](#role-based-workflows)
6. [Event Listening & Real-time Updates](#event-listening--real-time-updates)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

## Overview

The Export-Import Funding Platform is a blockchain-based system that facilitates trade financing by connecting exporters, investors, and importers through smart contracts. The platform tokenizes shipping invoices as NFTs, pools them for investment, and manages automated settlement processes.

### Key Stakeholders
- **Platform Admin**: Manages the platform, grants roles, manages pools
- **Exporters**: Submit invoices, withdraw funds after funding
- **Investors**: Invest in pools, earn returns on successful settlements
- **Importers**: Pay invoices through oracle-verified payment systems

## Core Business Process Flow

### Phase 1: Invoice Creation & Submission
```mermaid
graph TD
    A[Exporter Creates Invoice] --> B[System Validates Data]
    B --> C[Mint Invoice NFT]
    C --> D[Invoice Status: Pending]
    D --> E[Admin Approves Invoice]
    E --> F[Invoice Status: Approved]
```

**Smart Contract**: `SEATrax`

**Methods Called**:
1. `SEATrax.createInvoice()` - Create new invoice with email and IPFS hash
2. `SEATrax.approveInvoice()` - Admin approval (replaces finalize)

### Phase 2: Pool Creation & Management
```mermaid
graph TD
    A[Admin Creates Pool] --> B[Add Approved Invoices]
    B --> C[Set Start/End Dates]
    C --> D[Pool Status: Open]
    D --> E[Ready for Investment]
```

**Smart Contract**: `SEATrax`

**Methods Called**:
1. `SEATrax.createPool()` - Create pool with invoices and date range (auto-opens)

### Phase 3: Investment & Funding
```mermaid
graph TD
    A[Investors Browse Pools] --> B[Choose Pool to Invest]
    B --> C[Make Investment]
    C --> D[Track Pool Funding Progress]
    D --> E{100% Funded?}
    E -->|Yes| F[Auto-Distribution Triggered]
    E -->|No| G[Continue Fundraising]
    F --> H[Pool Status: Funded]
    H --> I[Funds Sent to Invoices]
```

**Smart Contract**: `SEATrax`

**Methods Called**:
1. `SEATrax.invest()` - Make investment (uses msg.value, auto-distributes at 100%)
2. `SEATrax.getPoolFundingPercentage()` - Check funding progress

### Phase 4: Fund Withdrawal
```mermaid
graph TD
    A[Invoices Funded] --> B[Exporter Can Withdraw]
    B --> C[Withdraw All Funds]
    C --> D[Funds Transferred to Exporter]
    D --> E[Invoice Status: Withdrawn]
```

**Smart Contract**: `SEATrax`

**Methods Called**:
1. `SEATrax.withdrawFunds()` - Withdraw all available funding (all-or-nothing)
2. `SEATrax.canWithdraw()` - Check withdrawal eligibility

### Phase 5: Payment & Settlement
```mermaid
graph TD
    A[Importer Makes Payment] --> B[Admin Confirms Payment]
    B --> C[Invoice Status: Paid]
    C --> D{All Pool Invoices Paid?}
    D -->|Yes| E[Pool Status: Completed]
    D -->|No| F[Wait for Other Payments]
    E --> G[Distribute Profits]
    G --> H[Investors Claim Returns]
```

**Smart Contract**: `SEATrax`

**Methods Called**:
1. `SEATrax.markInvoicePaid()` - Admin confirms payment
2. `SEATrax.distributeProfits()` - Calculate and distribute profits
3. `SEATrax.claimReturns()` - Investors claim returns

### Phase 6: Analytics & Reporting
```mermaid
graph TD
    A[Platform Activity] --> B[Track Metrics]
    B --> C[Manual Stats Calculation]
    C --> D[Update UI]
```

**Smart Contract**: `SEATrax`

**Note**: Analytics integrated within contract, calculated on-demand via frontend

## Smart Contract Architecture

### Unified Contract System
```
SEATrax.sol (All-in-One Contract)
    ├── Role Management (Admin, Exporter, Investor)
    ├── Invoice NFT (ERC-721 tokenization)
    ├── Pool NFT (ERC-721 tokenization)
    ├── Investment & Distribution
    ├── Payment Tracking
    └── Platform Analytics (integrated)
```

### Key Constants
- **Minimum Investment**: 1,000 tokens (1000e18)
- **Maximum Investment per Pool**: 1,000,000 tokens (1000000e18)
- **Platform Fee**: 1% (100 basis points)
- **Investor Yield**: 4% (400 basis points)
- **Minimum Funding Threshold**: 70% (7000 basis points)
- **Auto-Distribution**: 100% funding triggers automatic distribution

## Frontend Integration Methods

### 1. Access Control Management

#### Register Users (Self-Service)
```javascript
// Exporter self-registration
const registerExporter = async (companyName, taxId, country, license) => {
    const tx = await seatraxContract.registerExporter(companyName, taxId, country, license);
    await tx.wait();
    return tx.hash;
};

// Investor self-registration
const registerInvestor = async (name, address) => {
    const tx = await seatraxContract.registerInvestor(name, address);
    await tx.wait();
    return tx.hash;
};

// Admin verifies exporter (after registration)
const verifyExporter = async (exporterAddress) => {
    const tx = await seatraxContract.verifyExporter(exporterAddress);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `registerExporter(string company, string taxId, string country, string license)`
- **Description**: Self-service exporter registration
- **Access**: Public (any wallet)
- **Parameters**: 
  - `company` (string): Company name
  - `taxId` (string): Tax ID
  - `country` (string): Country
  - `license` (string): Export license number

**Function**: `registerInvestor(string name, string investorAddress)`
- **Description**: Self-service investor registration
- **Access**: Public (any wallet)
- **Parameters**:
  - `name` (string): Investor name
  - `investorAddress` (string): Investor address

**Function**: `verifyExporter(address exporter)`
- **Description**: Admin verification of exporter
- **Access**: Admin only
- **Parameters**:
  - `exporter` (address): Exporter wallet to verify

#### Check User Roles
```javascript
// Check if user has specific roles
const checkUserRoles = async (userAddress) => {
    const { isAdmin, isExporter, isInvestor } = await seatraxContract.checkUserRoles(userAddress);
    return { isAdmin, isExporter, isInvestor };
};
```

**Function**: `checkUserRoles(address account)`
- **Description**: Returns all roles for a specific address
- **Access**: Public view
- **Parameters**:
  - `account` (address): Address to check roles for
- **Returns**: 
  - `isAdmin` (bool): Whether address has admin role
  - `isExporter` (bool): Whether address has exporter role  
  - `isInvestor` (bool): Whether address has investor role

### 2. Invoice Management

#### Create Invoice
```javascript
// Create a new shipping invoice
const createInvoice = async (invoiceData) => {
    const {
        exporterCompany,
        importerCompany,
        importerEmail,
        shippingAmount,
        loanAmount,
        shippingDate,
        ipfsHash
    } = invoiceData;
    
    const tx = await seatraxContract.createInvoice(
        exporterCompany,
        importerCompany,
        importerEmail,
        ethers.parseEther(shippingAmount.toString()),
        ethers.parseEther(loanAmount.toString()),
        Math.floor(shippingDate.getTime() / 1000),
        ipfsHash
    );
    
    const receipt = await tx.wait();
    const invoiceId = receipt.logs[0].args[0]; // Get invoice ID from event
    
    return { transactionHash: tx.hash, invoiceId };
};
```

**Function**: `createInvoice(string exporterCompany, string importerCompany, string importerEmail, uint256 shippingAmount, uint256 loanAmount, uint256 shippingDate, string ipfsHash)`
- **Description**: Creates and mints a new invoice NFT
- **Access**: Exporters only
- **Parameters**:
  - `exporterCompany` (string): Name of exporter company
  - `importerCompany` (string): Name of importer company
  - `importerEmail` (string): Importer email for payment notifications
  - `shippingAmount` (uint256): Total shipping/invoice amount in wei
  - `loanAmount` (uint256): Requested loan amount in wei (≤ shipping amount)
  - `shippingDate` (uint256): Unix timestamp of shipping date
  - `ipfsHash` (string): IPFS hash of supporting documents
- **Returns**: `invoiceId` (uint256): The minted invoice NFT ID

#### Approve Invoice
```javascript
// Admin approves invoice for pool inclusion
const approveInvoice = async (invoiceId) => {
    const tx = await seatraxContract.approveInvoice(invoiceId);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `approveInvoice(uint256 invoiceId)`
- **Description**: Admin approves invoice to make it ready for pool inclusion
- **Access**: Admin only
- **Parameters**:
  - `invoiceId` (uint256): ID of the invoice to approve

#### Get Invoice Details
```javascript
// Fetch complete invoice information
const getInvoice = async (invoiceId) => {
    const invoice = await seatraxContract.getInvoice(invoiceId);
    return {
        exporterWallet: invoice.exporterWallet,
        status: invoice.status, // 0=Pending, 1=Approved, 2=InPool, 3=Funded, 4=Withdrawn, 5=Paid, 6=Completed, 7=Rejected
        shippingAmount: ethers.formatEther(invoice.shippingAmount),
        loanAmount: ethers.formatEther(invoice.loanAmount),
        amountInvested: ethers.formatEther(invoice.amountInvested),
        amountWithdrawn: ethers.formatEther(invoice.amountWithdrawn),
        shippingDate: new Date(invoice.shippingDate * 1000),
        exporterCompany: invoice.exporterCompany,
        importerCompany: invoice.importerCompany,
        importerEmail: invoice.importerEmail,
        ipfsHash: invoice.ipfsHash
    };
};
```

**Function**: `getInvoice(uint256 invoiceId)`
- **Description**: Returns complete invoice details
- **Access**: Public view
- **Parameters**:
  - `invoiceId` (uint256): ID of the invoice
- **Returns**: Complete `Invoice` struct with all fields

#### Get Invoices by Exporter
```javascript
// Get all invoices for a specific exporter
const getExporterInvoices = async (exporterAddress) => {
    const invoiceIds = await seatraxContract.getExporterInvoices(exporterAddress);
    
    const invoices = await Promise.all(
        invoiceIds.map(async (id) => {
            const invoice = await getInvoice(id);
            return { id, ...invoice };
        })
    );
    
    return invoices;
};
```

**Function**: `getExporterInvoices(address exporter)`
- **Description**: Returns array of invoice IDs owned by a specific exporter
- **Access**: Public view
- **Parameters**:
  - `exporter` (address): Exporter address
- **Returns**: `invoiceIds` (uint256[]): Array of invoice IDs

#### Withdraw Funds
```javascript
// Withdraw all available funds from an invoice
const withdrawFunds = async (invoiceId) => {
    const tx = await seatraxContract.withdrawFunds(invoiceId);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `withdrawFunds(uint256 invoiceId)`
- **Description**: Withdraws all available funds from a funded invoice (all-or-nothing)
- **Access**: Invoice owner (exporter) only
- **Parameters**:
  - `invoiceId` (uint256): ID of the invoice

### 3. Pool Management

#### Create Pool
```javascript
// Create a new investment pool
const createPool = async (poolName, invoiceIds, startDate, endDate) => {
    const tx = await seatraxContract.createPool(
        poolName,
        invoiceIds,
        Math.floor(startDate.getTime() / 1000),
        Math.floor(endDate.getTime() / 1000)
    );
    const receipt = await tx.wait();
    const poolId = receipt.logs[0].args[0]; // Get pool ID from event
    
    return { transactionHash: tx.hash, poolId };
};
```

**Function**: `createPool(string name, uint256[] invoiceIds, uint256 startDate, uint256 endDate)`
- **Description**: Creates a new investment pool with selected invoices (auto-opens)
- **Access**: Admin only
- **Parameters**:
  - `name` (string): Pool name/description
  - `invoiceIds` (uint256[]): Array of approved invoice IDs
  - `startDate` (uint256): Pool opening timestamp
  - `endDate` (uint256): Pool closing timestamp
- **Returns**: `poolId` (uint256): The created pool NFT ID

#### Get Pool Details
```javascript
// Fetch complete pool information
const getPool = async (poolId) => {
    const pool = await seatraxContract.getPool(poolId);
    return {
        poolId: pool.poolId,
        name: pool.name,
        status: pool.status, // 0=Open, 1=Funded, 2=Completed, 3=Cancelled
        totalLoanAmount: ethers.formatEther(pool.totalLoanAmount),
        totalShippingAmount: ethers.formatEther(pool.totalShippingAmount),
        amountInvested: ethers.formatEther(pool.amountInvested),
        amountDistributed: ethers.formatEther(pool.amountDistributed),
        feePaid: ethers.formatEther(pool.feePaid),
        startDate: new Date(pool.startDate * 1000),
        endDate: new Date(pool.endDate * 1000),
        invoiceIds: pool.invoiceIds
    };
};
```

**Function**: `getPool(uint256 poolId)`
- **Description**: Returns complete pool details
- **Access**: Public view
- **Parameters**:
  - `poolId` (uint256): ID of the pool
- **Returns**: Complete `Pool` struct with all fields

#### Get All Open Pools
```javascript
// Get all open pools
const getAllOpenPools = async () => {
    const poolIds = await seatraxContract.getAllOpenPools();
    
    const pools = await Promise.all(
        poolIds.map(async (id) => {
            const pool = await getPool(id);
            return { id, ...pool };
        })
    );
    
    return pools;
};
```

**Function**: `getAllOpenPools()`
- **Description**: Returns array of all open pool IDs
- **Access**: Public view
- **Returns**: `poolIds` (uint256[]): Array of open pool IDs

### 4. Investment & Funding

#### Invest in Pool
```javascript
// Make an investment in an open pool
const investInPool = async (poolId, amountInEth) => {
    const amountInWei = ethers.parseEther(amountInEth.toString());
    const tx = await seatraxContract.invest(poolId, amountInWei, {
        value: amountInWei // msg.value
    });
    await tx.wait();
    return tx.hash;
};
```

**Function**: `invest(uint256 poolId, uint256 amountInWei) payable`
- **Description**: Allows investors to invest in an open pool (auto-distributes at 100%)
- **Access**: Investors only
- **Parameters**:
  - `poolId` (uint256): ID of the pool to invest in
  - `amountInWei` (uint256): Investment amount in wei
- **Note**: Transaction must include msg.value equal to amountInWei

#### Get Investment Info
```javascript
// Get investor's investment details for a specific pool
const getInvestment = async (poolId, investorAddress) => {
    const { amount, percentage, timestamp } = await seatraxContract.getInvestment(poolId, investorAddress);
    return {
        amount: ethers.formatEther(amount),
        percentage: percentage.toString(), // basis points (10000 = 100%)
        timestamp: new Date(timestamp * 1000)
    };
};
```

**Function**: `getInvestment(uint256 poolId, address investor)`
- **Description**: Returns investment details for a specific investor in a pool
- **Access**: Public view
- **Parameters**:
  - `poolId` (uint256): ID of the pool
  - `investor` (address): Address of the investor
- **Returns**:
  - `amount` (uint256): Amount invested in wei
  - `percentage` (uint256): Investment percentage (basis points)
  - `timestamp` (uint256): Investment timestamp

#### Get Pool Funding Statistics
```javascript
// Get funding progress and statistics for a pool
const getPoolFundingStats = async (poolId) => {
    const stats = await poolFundingManagerContract.getPoolFundingStats(poolId);
    return {
        totalInvested: ethers.formatEther(stats.totalInvested),
        investorCount: stats.investorCount.toString(),
        fundingProgress: (stats.fundingProgress / 100).toString() + '%' // Convert from basis points
    };
};
```

**Function**: `getPoolFundingStats(uint256 poolId)`
- **Description**: Returns funding statistics for a pool
- **Access**: Public view
- **Parameters**:
  - `poolId` (uint256): ID of the pool
- **Returns**:
  - `totalInvested` (uint256): Total amount invested
  - `investorCount` (uint256): Number of unique investors
  - `fundingProgress` (uint256): Percentage of target funding reached (basis points)

#### Claim Investor Returns
```javascript
// Claim returns from a completed pool
const claimInvestorReturns = async (poolId) => {
    const tx = await poolFundingManagerContract.claimInvestorReturns(poolId);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `claimInvestorReturns(uint256 poolId)`
- **Description**: Allows investors to claim their returns from a completed pool
- **Access**: Investors only (must have investment in the pool)
- **Parameters**:
  - `poolId` (uint256): ID of the completed pool

### 5. Payment Oracle & Settlement

#### Submit Payment Confirmation (Oracle)
```javascript
// Oracle submits payment confirmation
const submitPaymentConfirmation = async (invoiceId, paymentHash, amountPaid) => {
    const tx = await paymentOracleContract.submitPaymentConfirmation(
        invoiceId,
        paymentHash,
        ethers.parseEther(amountPaid.toString())
    );
    await tx.wait();
    return tx.hash;
};
```

**Function**: `submitPaymentConfirmation(uint256 invoiceId, bytes32 paymentHash, uint256 amountPaid)`
- **Description**: Submits payment confirmation for an invoice (oracle only)
- **Access**: Authorized oracles only
- **Parameters**:
  - `invoiceId` (uint256): ID of the paid invoice
  - `paymentHash` (bytes32): Hash of the payment transaction/proof
  - `amountPaid` (uint256): Amount paid for the invoice in wei

#### Authorize Oracle
```javascript
// Admin authorizes a new oracle
const authorizeOracle = async (oracleAddress) => {
    const tx = await paymentOracleContract.authorizeOracle(oracleAddress);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `authorizeOracle(address oracle)`
- **Description**: Authorizes an oracle to submit payment confirmations
- **Access**: Admin only
- **Parameters**:
  - `oracle` (address): Address of the oracle to authorize

#### Get Payment Record
```javascript
// Get payment confirmation details for an invoice
const getPaymentRecord = async (invoiceId) => {
    const record = await paymentOracleContract.getPaymentRecord(invoiceId);
    return {
        amountPaid: ethers.formatEther(record.amountPaid),
        paymentTimestamp: new Date(record.paymentTimestamp * 1000),
        paymentHash: record.paymentHash,
        confirmationCount: record.confirmationCount.toString(),
        isConfirmed: record.isConfirmed,
        isDisputed: record.isDisputed,
        disputeDeadline: new Date(record.disputeDeadline * 1000)
    };
};
```

**Function**: `getPaymentRecord(uint256 invoiceId)`
- **Description**: Returns payment record details for an invoice
- **Access**: Public view
- **Parameters**:
  - `invoiceId` (uint256): ID of the invoice
- **Returns**: Complete `PaymentRecord` struct with confirmation details

#### Distribute Profits
```javascript
// Admin distributes profits after pool completion
const distributeProfits = async (poolId) => {
    const tx = await poolFundingManagerContract.distributeProfits(poolId);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `distributeProfits(uint256 poolId)`
- **Description**: Distributes profits to investors and platform after pool completion
- **Access**: Admin only
- **Parameters**:
  - `poolId` (uint256): ID of the completed pool (all invoices paid)

### 6. Analytics & Reporting

#### Update Platform Metrics
```javascript
// Update platform-wide analytics
const updatePlatformMetrics = async () => {
    const tx = await platformAnalyticsContract.updatePlatformMetrics();
    await tx.wait();
    return tx.hash;
};
```

**Function**: `updatePlatformMetrics()`
- **Description**: Updates platform-wide statistics and metrics
- **Access**: Admin only

#### Get Platform Statistics
```javascript
// Get comprehensive platform statistics
const getPlatformStats = async () => {
    const metrics = await platformAnalyticsContract.getPlatformMetrics();
    return {
        totalInvoicesCreated: metrics.totalInvoicesCreated.toString(),
        totalPoolsCreated: metrics.totalPoolsCreated.toString(),
        totalValueLocked: ethers.formatEther(metrics.totalValueLocked),
        totalValueProcessed: ethers.formatEther(metrics.totalValueProcessed),
        totalPlatformFees: ethers.formatEther(metrics.totalPlatformFees),
        totalInvestorReturns: ethers.formatEther(metrics.totalInvestorReturns),
        activeInvoices: metrics.activeInvoices.toString(),
        activePools: metrics.activePools.toString(),
        uniqueInvestors: metrics.uniqueInvestors.toString(),
        uniqueExporters: metrics.uniqueExporters.toString(),
        completedInvoices: metrics.completedInvoices.toString()
    };
};
```

**Function**: `getPlatformMetrics()`
- **Description**: Returns comprehensive platform statistics
- **Access**: Public view
- **Returns**: Complete `PlatformMetrics` struct with all platform statistics

#### Update Investor Portfolio
```javascript
// Update analytics for a specific investor
const updateInvestorPortfolio = async (investorAddress) => {
    const tx = await platformAnalyticsContract.updateInvestorPortfolio(investorAddress);
    await tx.wait();
    return tx.hash;
};
```

**Function**: `updateInvestorPortfolio(address investor)`
- **Description**: Updates portfolio metrics for a specific investor
- **Access**: Anyone can call for any investor
- **Parameters**:
  - `investor` (address): Address of the investor to update

#### Get Investor Portfolio
```javascript
// Get investor portfolio analytics
const getInvestorPortfolio = async (investorAddress) => {
    const portfolio = await platformAnalyticsContract.getInvestorPortfolio(investorAddress);
    return {
        totalInvested: ethers.formatEther(portfolio.totalInvested),
        totalReturns: ethers.formatEther(portfolio.totalReturns),
        activeInvestments: ethers.formatEther(portfolio.activeInvestments),
        completedInvestments: portfolio.completedInvestments.toString(),
        averageRoi: (portfolio.averageRoi / 100).toString() + '%', // Convert from basis points
        totalPoolsInvested: portfolio.totalPoolsInvested.toString(),
        lastInvestmentTimestamp: new Date(portfolio.lastInvestmentTimestamp * 1000),
        riskScore: (portfolio.riskScore / 100).toString() + '%' // Convert from basis points
    };
};
```

**Function**: `getInvestorPortfolio(address investor)`
- **Description**: Returns complete investor portfolio metrics
- **Access**: Public view
- **Parameters**:
  - `investor` (address): Address of the investor
- **Returns**: Complete `InvestorPortfolio` struct with all metrics

## Role-Based Workflows

### Admin Workflow
1. **Setup Phase**:
   - Grant roles to users (`grantExporterRole`, `grantInvestorRole`)
   - Authorize payment oracles (`authorizeOracle`)

2. **Pool Management**:
   - Create pools with finalized invoices (`createPool`)
   - Finalize pools for fundraising (`finalizePool`)
   - Allocate funds when threshold reached (`allocateFundsToInvoices`)

3. **Settlement**:
   - Distribute profits after completion (`distributeProfits`)
   - Handle disputes (`disputePayment`, `resolvePaymentDispute`)

4. **Analytics**:
   - Update platform metrics (`updatePlatformMetrics`)
   - Generate reports

### Exporter Workflow
1. **Invoice Management**:
   - Create invoices (`mintInvoice`)
   - Finalize invoices (`finalizeInvoice`)
   - Monitor pool inclusion

2. **Fund Management**:
   - Check available withdrawals (`getAvailableWithdrawal`)
   - Withdraw funds (`withdrawFunds`)
   - Monitor payment status

### Investor Workflow
1. **Investment**:
   - Browse available pools (`getPoolsByStatus`)
   - Check pool details and risk (`getPool`, `getPoolFundingStats`)
   - Make investments (`investInPool`)

2. **Portfolio Management**:
   - Monitor investments (`getInvestorPoolInfo`)
   - Track portfolio performance (`getInvestorPortfolio`)
   - Claim returns (`claimInvestorReturns`)

### Oracle Workflow
1. **Payment Verification**:
   - Monitor payment systems
   - Submit confirmations (`submitPaymentConfirmation`)
   - Handle disputes

## Event Listening & Real-time Updates

### Key Events to Monitor

#### Invoice Events
```javascript
// Listen for new invoices
invoiceNFTContract.on("InvoiceMinted", (invoiceId, exporter, exporterCompany, importerCompany, shippingAmount, loanAmount, shippingDate) => {
    console.log(`New invoice ${invoiceId} created by ${exporter}`);
    // Update UI with new invoice
});

// Listen for status changes
invoiceNFTContract.on("InvoiceStatusUpdated", (invoiceId, previousStatus, newStatus) => {
    console.log(`Invoice ${invoiceId} status changed from ${previousStatus} to ${newStatus}`);
    // Update invoice display
});

// Listen for funding events
invoiceNFTContract.on("InvoiceFunded", (invoiceId, amount, totalInvested) => {
    console.log(`Invoice ${invoiceId} received ${ethers.formatEther(amount)} funding`);
    // Update funding progress
});
```

#### Pool Events
```javascript
// Listen for new pools
poolNFTContract.on("PoolCreated", (poolId, creator, name, timestamp) => {
    console.log(`New pool ${poolId} "${name}" created by ${creator}`);
    // Update pool list
});

// Listen for pool status changes
poolNFTContract.on("PoolStatusUpdated", (poolId, previousStatus, newStatus) => {
    console.log(`Pool ${poolId} status changed from ${previousStatus} to ${newStatus}`);
    // Update pool status display
});

// Listen for pool funding
poolNFTContract.on("PoolFunded", (poolId, totalInvested, timestamp) => {
    console.log(`Pool ${poolId} fully funded with ${ethers.formatEther(totalInvested)}`);
    // Update pool status
});
```

#### Investment Events
```javascript
// Listen for new investments
poolFundingManagerContract.on("InvestmentMade", (investor, poolId, amount, timestamp) => {
    console.log(`${investor} invested ${ethers.formatEther(amount)} in pool ${poolId}`);
    // Update investment tracking
});

// Listen for profit distributions
poolFundingManagerContract.on("ProfitsDistributed", (poolId, platformFee, investorRewards, timestamp) => {
    console.log(`Profits distributed for pool ${poolId}`);
    // Update investor balances
});
```

#### Payment Events
```javascript
// Listen for payment confirmations
paymentOracleContract.on("PaymentConfirmed", (invoiceId, paymentHash, amount, timestamp) => {
    console.log(`Payment confirmed for invoice ${invoiceId}: ${ethers.formatEther(amount)}`);
    // Update payment status
});

// Listen for settlement triggers
paymentOracleContract.on("PoolSettlementTriggered", (poolId, totalPaid, timestamp) => {
    console.log(`Pool ${poolId} settlement triggered with total payment ${ethers.formatEther(totalPaid)}`);
    // Update settlement status
});
```

## Error Handling

### Common Error Types

#### Access Control Errors
```javascript
try {
    await contract.adminOnlyFunction();
} catch (error) {
    if (error.message.includes("NotAdmin")) {
        throw new Error("Access denied: Admin role required");
    }
    if (error.message.includes("NotExporter")) {
        throw new Error("Access denied: Exporter role required");
    }
    if (error.message.includes("NotInvestor")) {
        throw new Error("Access denied: Investor role required");
    }
}
```

#### Validation Errors
```javascript
try {
    await contract.someFunction(params);
} catch (error) {
    if (error.message.includes("InvalidAmount")) {
        throw new Error("Invalid amount provided");
    }
    if (error.message.includes("InvalidAddress")) {
        throw new Error("Invalid address provided");
    }
    if (error.message.includes("InvalidInvoiceId")) {
        throw new Error("Invoice not found");
    }
}
```

#### Business Logic Errors
```javascript
try {
    await contract.investInPool(poolId, amount);
} catch (error) {
    if (error.message.includes("PoolNotFundraising")) {
        throw new Error("Pool is not accepting investments");
    }
    if (error.message.includes("InvestmentTooSmall")) {
        throw new Error("Investment amount below minimum (1,000 tokens)");
    }
    if (error.message.includes("ExceedsMaxInvestment")) {
        throw new Error("Investment exceeds maximum per pool (1,000,000 tokens)");
    }
}
```

## Security Considerations

### Frontend Security Best Practices

1. **Input Validation**:
   - Validate all user inputs before sending to contracts
   - Check address formats, amount ranges, and data types
   - Sanitize string inputs for company names

2. **Transaction Safety**:
   - Always check user balances before transactions
   - Implement proper gas estimation
   - Use transaction confirmations and error handling

3. **Role Verification**:
   - Verify user roles before showing relevant UI elements
   - Cache role information and refresh periodically
   - Handle role changes gracefully

4. **State Management**:
   - Keep UI state synchronized with blockchain state
   - Handle pending transactions appropriately
   - Implement proper loading and error states

### Example Security Implementation
```javascript
// Comprehensive transaction wrapper with security checks
const secureTransaction = async (contractFunction, userAddress, requiredRole = null) => {
    try {
        // Check user role if required
        if (requiredRole) {
            const roles = await checkUserRoles(userAddress);
            if (!roles[requiredRole]) {
                throw new Error(`Access denied: ${requiredRole} role required`);
            }
        }
        
        // Estimate gas
        const gasEstimate = await contractFunction.estimateGas();
        const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
        
        // Execute transaction
        const tx = await contractFunction({ gasLimit });
        
        // Wait for confirmation
        const receipt = await tx.wait(1); // Wait for 1 confirmation
        
        return {
            success: true,
            transactionHash: tx.hash,
            gasUsed: receipt.gasUsed.toString()
        };
        
    } catch (error) {
        console.error("Transaction failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Usage example
const result = await secureTransaction(
    () => invoiceNFTContract.mintInvoice(...params),
    userAddress,
    'isExporter'
);

if (result.success) {
    console.log("Transaction successful:", result.transactionHash);
} else {
    console.error("Transaction failed:", result.error);
}
```

This comprehensive documentation provides frontend developers with all necessary information to integrate with the export-import funding platform smart contracts, including detailed method descriptions, parameter explanations, workflow guidance, and security best practices.