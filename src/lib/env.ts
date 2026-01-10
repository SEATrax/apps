/**
 * Environment Variable Validation
 * Ensures all required environment variables are present at build/runtime
 */

// Required environment variables for production
const requiredEnvVars = {
  // Blockchain
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  
  // Smart Contracts
  NEXT_PUBLIC_ACCESS_CONTROL: process.env.NEXT_PUBLIC_ACCESS_CONTROL,
  NEXT_PUBLIC_INVOICE_NFT: process.env.NEXT_PUBLIC_INVOICE_NFT,
  NEXT_PUBLIC_POOL_NFT: process.env.NEXT_PUBLIC_POOL_NFT,
  NEXT_PUBLIC_POOL_FUNDING_MANAGER: process.env.NEXT_PUBLIC_POOL_FUNDING_MANAGER,
  NEXT_PUBLIC_PAYMENT_ORACLE: process.env.NEXT_PUBLIC_PAYMENT_ORACLE,
  NEXT_PUBLIC_PLATFORM_ANALYTICS: process.env.NEXT_PUBLIC_PLATFORM_ANALYTICS,
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  // Pinata
  NEXT_PUBLIC_PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  
  // App Config
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const;

// Server-only environment variables
const serverEnvVars = {
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  PINATA_JWT: process.env.PINATA_JWT,
  PLATFORM_TREASURY_ADDRESS: process.env.PLATFORM_TREASURY_ADDRESS,
  ADMIN_ADDRESSES: process.env.ADMIN_ADDRESSES,
} as const;

/**
 * Validate environment variables
 * Throws error if required variables are missing
 */
export function validateEnv() {
  const missing: string[] = [];

  // Check required public variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  });

  // Check server variables only on server side
  if (typeof window === 'undefined') {
    Object.entries(serverEnvVars).forEach(([key, value]) => {
      if (!value || value.trim() === '') {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

/**
 * Get validated environment configuration
 * Safe to use after validateEnv() has been called
 */
export const env = {
  // Blockchain
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  
  // Smart Contracts
  contracts: {
    accessControl: process.env.NEXT_PUBLIC_ACCESS_CONTROL!,
    invoiceNFT: process.env.NEXT_PUBLIC_INVOICE_NFT!,
    poolNFT: process.env.NEXT_PUBLIC_POOL_NFT!,
    poolFundingManager: process.env.NEXT_PUBLIC_POOL_FUNDING_MANAGER!,
    paymentOracle: process.env.NEXT_PUBLIC_PAYMENT_ORACLE!,
    platformAnalytics: process.env.NEXT_PUBLIC_PLATFORM_ANALYTICS!,
  },
  
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  // Pinata (IPFS)
  pinata: {
    gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
    jwt: process.env.PINATA_JWT,
  },
  
  // App Configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME!,
    url: process.env.NEXT_PUBLIC_APP_URL!,
  },
  
  // Platform
  platform: {
    treasuryAddress: process.env.PLATFORM_TREASURY_ADDRESS,
    adminAddresses: process.env.ADMIN_ADDRESSES?.split(',').map(addr => addr.trim()) || [],
  },
  
  // Runtime
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Validate contract addresses format
 */
export function validateContractAddresses() {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  const invalidAddresses: string[] = [];

  Object.entries(env.contracts).forEach(([name, address]) => {
    if (!addressRegex.test(address)) {
      invalidAddresses.push(`${name}: ${address}`);
    }
  });

  if (invalidAddresses.length > 0) {
    throw new Error(
      `Invalid contract addresses detected:\n${invalidAddresses.join('\n')}`
    );
  }
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Check if running on server
 */
export const isServer = !isBrowser;

// Validate environment on module load (only in production)
if (process.env.NODE_ENV === 'production') {
  try {
    validateEnv();
    validateContractAddresses();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}
