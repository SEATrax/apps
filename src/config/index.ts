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
  
  // Contract Configuration
  contract: {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
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
    jwt: process.env.PINATA_JWT || '', // Server-side only
  },
  
  // Platform Settings
  platform: {
    investorYield: 4, // 4% yield for investors
    platformFee: 1,   // 1% platform fee
    fundingThreshold: 70, // 70% funding threshold for withdrawal
    minInvestment: 0.01, // Minimum investment in ETH
    maxInvestment: 100,  // Maximum investment in ETH
  },
} as const;

export type AppConfig = typeof appConfig;
