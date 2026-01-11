/**
 * useMetaMaskAdmin Hook
 * 
 * MetaMask connector specifically for admin pages.
 * Uses direct EOA connection (no account abstraction).
 * 
 * Why separate from Panna SDK:
 * - Admin needs EOA address for role checking
 * - No need for account abstraction complexity
 * - Direct MetaMask integration is simpler for admin operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MetaMaskAdminState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
}

const LISK_SEPOLIA_CHAIN_ID = 4202;
const LISK_SEPOLIA_RPC = 'https://rpc.sepolia-api.lisk.com';

export function useMetaMaskAdmin() {
  const [state, setState] = useState<MetaMaskAdminState>({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isCorrectNetwork: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      return false;
    }

    try {
      setError(null);
      
      // Request account access
      const accounts = await window.ethereum!.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setState({
        isConnected: true,
        address: accounts[0],
        provider,
        signer,
        chainId,
        isCorrectNetwork: chainId === LISK_SEPOLIA_CHAIN_ID,
      });

      console.log('✅ MetaMask connected:', accounts[0]);
      console.log('🔗 Chain ID:', chainId);

      return true;
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      setError(err.message || 'Failed to connect to MetaMask');
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Disconnect
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isCorrectNetwork: false,
    });
    console.log('🔌 MetaMask disconnected');
  }, []);

  // Switch to Lisk Sepolia network
  const switchToLiskSepolia = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      // Try to switch to Lisk Sepolia
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${LISK_SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
      
      // Reconnect to update state
      await connect();
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${LISK_SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Lisk Sepolia Testnet',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [LISK_SEPOLIA_RPC],
              blockExplorerUrls: ['https://sepolia-blockscout.lisk.com'],
            }],
          });
          
          // Reconnect after adding network
          await connect();
          return true;
        } catch (addError: any) {
          console.error('Failed to add Lisk Sepolia network:', addError);
          setError('Failed to add Lisk Sepolia network to MetaMask');
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      setError('Failed to switch to Lisk Sepolia network');
      return false;
    }
  }, [isMetaMaskInstalled, connect]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnect();
      } else if (accounts[0] !== state.address) {
        // Account changed - reconnect
        connect();
      }
    };

    const handleChainChanged = () => {
      // Chain changed - reload to avoid state issues
      window.location.reload();
    };

    window.ethereum!.on('accountsChanged', handleAccountsChanged);
    window.ethereum!.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled, state.address, connect, disconnect]);

  // Try to restore connection on mount
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const checkConnection = async () => {
      try {
        const accounts = await window.ethereum!.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts && accounts.length > 0) {
          // Already connected - restore session
          await connect();
        }
      } catch (err) {
        console.error('Failed to check MetaMask connection:', err);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled, connect]);

  return {
    ...state,
    connect,
    disconnect,
    switchToLiskSepolia,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    error,
  };
}
