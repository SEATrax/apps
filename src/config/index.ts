export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'SEATrax',
  description: 'Shipping Invoice Funding Platform',
  
  // Chain Configuration
  chain: {
    id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 4202,
    name: 'Lisk Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia-api.lisk.com',
    blockExplorer: 'https://sepolia-blockscout.lisk.com',
    currency: {
      name: 'Lisk',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  
  // Multiple Smart Contracts
  contracts: {
    accessControl: process.env.ACCESS_CONTROL || '0x6dA6C2Afcf8f2a1F31fC0eCc4C037C0b6317bA2F',
    invoiceNFT: process.env.INVOICE_NFT || '0x8Da2dF6050158ae8B058b90B37851323eFd69E16',
    poolNFT: process.env.POOL_NFT || '0x317Ce254731655E19932b9EFEAf7eeA31F0775ad',
    poolFundingManager: process.env.POOL_FUNDING_MANAGER || '0xbD5f292F75D22996E7A4DD277083c75aB29ff45C',
    paymentOracle: process.env.PAYMENT_ORACLE || '0x7894728174E53Df9Fec402De07d80652659296a8',
    platformAnalytics: process.env.PLATFORM_ANALYTICS || '0xb77C5C42b93ec46A323137B64586F0F8dED987A9',
  },
  
  // Legacy Contract (deprecated)
  contract: {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2',
  },
  
  // Panna SDK Configuration
  panna: {
    clientId: process.env.NEXT_PUBLIC_PANNA_CLIENT_ID || '',
    partnerId: process.env.NEXT_PUBLIC_PANNA_PARTNER_ID || '',
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Pinata Configuration
  pinata: {
    gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs',
    jwt: process.env.PINATA_JWT || '',
  },
  
  // Currency API
  currency: {
    apiKey: process.env.CURRENCY_FREAKS_API_KEY || '',
  },
  
  // Platform Settings
  platform: {
    investorYield: 4, // 4% yield for investors
    platformFee: 1,   // 1% platform fee
    fundingThreshold: 70, // 70% funding threshold for withdrawal
    minInvestment: 1000, // Minimum investment in USD cents
    treasury: process.env.PLATFORM_TREASURY_ADDRESS || '0x8ebc2bf5a904a5da2e09b7a8ab5d5aaec32610f8',
    adminAddresses: (process.env.ADMIN_ADDRESSES || '0x3023A1B0fAf10DeE06a0aA5197eE00882b401152').split(','),
  },
} as const;

export type AppConfig = typeof appConfig;
