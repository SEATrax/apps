'use client';

import { useState, useCallback, useEffect } from 'react';
import { appConfig } from '@/config';

// Local wallet state type (without role - role is determined from Supabase)
interface LocalWalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: bigint;
}

// ============================================================
// PANNA SDK PLACEHOLDER
// ============================================================
// This is a placeholder implementation for Panna SDK.
// Replace this with actual Panna SDK integration when available.
// 
// To integrate actual Panna SDK:
// 1. Install: npm install @panna/sdk (or the correct package name)
// 2. Import and initialize the SDK
// 3. Replace the mock functions below with actual SDK calls
// ============================================================

interface UsePannaReturn {
  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  
  // Contract Interaction
  readContract: <T>(functionName: string, args?: unknown[]) => Promise<T>;
  writeContract: (functionName: string, args?: unknown[], value?: bigint) => Promise<string>;
  
  // Utilities
  getBalance: () => Promise<bigint>;
  switchChain: (chainId: number) => Promise<void>;
  
  // State
  error: Error | null;
}

export function usePanna(): UsePannaReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletState, setWalletState] = useState<LocalWalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: 0n,
  });
  const [error, setError] = useState<Error | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      // TODO: Replace with actual Panna SDK connection check
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          }) as string[];
          
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ 
              method: 'eth_chainId' 
            }) as string;
            
            setWalletState({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              balance: 0n,
            });
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accts = accounts as string[];
        if (accts.length === 0) {
          setWalletState({
            isConnected: false,
            address: null,
            chainId: null,
            balance: 0n,
          });
        } else {
          setWalletState((prev) => ({
            ...prev,
            address: accts[0],
            isConnected: true,
          }));
        }
      };

      const handleChainChanged = (chainId: unknown) => {
        setWalletState((prev) => ({
          ...prev,
          chainId: parseInt(chainId as string, 16),
        }));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // TODO: Replace with actual Panna SDK connect
      // Example with Panna SDK:
      // const panna = new PannaSDK({
      //   clientId: appConfig.panna.clientId,
      //   partnerId: appConfig.panna.partnerId,
      // });
      // const result = await panna.connect();

      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        }) as string[];

        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        }) as string;

        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          balance: 0n,
        });

        // Switch to Lisk Sepolia if not already on it
        if (parseInt(chainId, 16) !== appConfig.chain.id) {
          await switchChain(appConfig.chain.id);
        }
      } else {
        throw new Error('No wallet found. Please install MetaMask or use Panna SDK.');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // TODO: Replace with actual Panna SDK disconnect
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: 0n,
    });
  }, []);

  const switchChain = useCallback(async (targetChainId: number) => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (switchError: unknown) {
        // Chain not added, try to add it
        if ((switchError as { code?: number })?.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: appConfig.chain.name,
                nativeCurrency: appConfig.chain.currency,
                rpcUrls: [appConfig.chain.rpcUrl],
                blockExplorerUrls: [appConfig.chain.blockExplorer],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  }, []);

  const getBalance = useCallback(async (): Promise<bigint> => {
    if (!walletState.address) return 0n;

    // TODO: Replace with actual Panna SDK getBalance
    if (typeof window !== 'undefined' && window.ethereum) {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletState.address, 'latest'],
      }) as string;
      return BigInt(balance);
    }
    return 0n;
  }, [walletState.address]);

  const readContract = useCallback(async <T>(
    functionName: string,
    args: unknown[] = []
  ): Promise<T> => {
    // TODO: Replace with actual Panna SDK readContract
    // Example:
    // const panna = getPannaInstance();
    // return await panna.readContract({
    //   address: appConfig.contract.address,
    //   abi: SEATRAX_ABI,
    //   functionName,
    //   args,
    // });

    console.log(`[Mock] readContract: ${functionName}`, args);
    throw new Error(`readContract not implemented. Function: ${functionName}`);
  }, []);

  const writeContract = useCallback(async (
    functionName: string,
    args: unknown[] = [],
    value?: bigint
  ): Promise<string> => {
    // TODO: Replace with actual Panna SDK writeContract
    // Example:
    // const panna = getPannaInstance();
    // const tx = await panna.writeContract({
    //   address: appConfig.contract.address,
    //   abi: SEATRAX_ABI,
    //   functionName,
    //   args,
    //   value,
    // });
    // return tx.hash;

    console.log(`[Mock] writeContract: ${functionName}`, args, value);
    throw new Error(`writeContract not implemented. Function: ${functionName}`);
  }, []);

  return {
    connect,
    disconnect,
    isConnecting,
    isConnected: walletState.isConnected,
    address: walletState.address,
    chainId: walletState.chainId,
    readContract,
    writeContract,
    getBalance,
    switchChain,
    error,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
