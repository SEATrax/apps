'use client';

import { useActiveAccount, usePanna as usePannaSDK } from 'panna-sdk';

/**
 * Custom hook that wraps panna-sdk hooks
 * Provides backwards compatibility with old usePanna interface
 */
export function usePanna() {
  const activeAccount = useActiveAccount();
  const { client } = usePannaSDK();

  return {
    // Connection state
    isConnected: !!activeAccount,
    isConnecting: false, // Panna SDK handles this internally
    
    // Wallet info
    address: activeAccount?.address,
    
    // Client for contract interactions
    client,
    account: activeAccount,
    
    // Functions (Panna SDK handles this via LoginButton)
    connect: () => {
      console.warn('Use LoginButton component instead of connect()');
    },
    disconnect: () => {
      console.warn('Use LoginButton component instead of disconnect()');
    },
    
    // Contract interaction helpers
    readContract: async (args: any) => {
      throw new Error('Use useContract hook for contract interactions');
    },
    writeContract: async (args: any) => {
      throw new Error('Use useContract hook for contract interactions');
    },
  };
}
