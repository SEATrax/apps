# Smart Contracts

⚠️ **Note**: This project uses a **multiple smart contract architecture** deployed on Lisk Sepolia testnet.

## Architecture

The platform uses **6 specialized smart contracts** for separation of concerns and better gas efficiency:

1. **AccessControl** - Central role management (Admin, Exporter, Investor)
2. **InvoiceNFT** - Invoice tokenization (ERC721)
3. **PoolNFT** - Pool tokenization (ERC721)
4. **PoolFundingManager** - Investment logic and fund distribution
5. **PaymentOracle** - Payment verification system
6. **PlatformAnalytics** - Metrics and reporting

## Smart Contract Repository

All smart contracts are maintained in a **separate repository**:

🔗 **[https://github.com/seatrax/smart-contract](https://github.com/seatrax/smart-contract)**

## Deployed Contracts (Lisk Sepolia)

```
AccessControl:        0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F
InvoiceNFT:          0x8Da2dF6050158ae8B058b90B37851323eFd69E16
PoolNFT:             0x317Ce254731655E19932b9EFEAf7eeA31F0775ad
PoolFundingManager:  0xbD5f292F75D22996E7A4DD277083c75aB29ff45C
PaymentOracle:       0x7894728174E53Df9Fec402De07d80652659296a8
PlatformAnalytics:   0xb77C5C42b93ec46A323137B64586F0F8dED987A9
```

## Frontend Integration

Contract ABIs and addresses are configured in:
- **ABIs**: `src/lib/contract.ts`
- **Addresses**: `.env.local`
- **Hooks**: `src/hooks/use*.ts` (useInvoiceNFT, usePoolNFT, etc.)

## Legacy Contract

The `SEATrax.sol` file in this directory is a **legacy monolithic contract** from Phase 1 development. It is **NOT** used in the current production application.

For the current smart contract implementation, please refer to:
👉 [https://github.com/seatrax/smart-contract](https://github.com/seatrax/smart-contract)
