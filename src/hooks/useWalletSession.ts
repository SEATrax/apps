'use client';

import { useState, useEffect, useRef } from 'react';
import { useActiveAccount } from 'panna-sdk';

export interface WalletSessionState {
  isLoaded: boolean;
  isConnected: boolean;
  account: any;
  address: string | undefined;
  wasConnected: boolean; // Track if user was previously connected
}

/**
 * Custom hook to handle wallet session persistence and loading state
 * Prevents flash of "wallet not connected" during page load
 * Tracks logout events for immediate redirect
 */
export function useWalletSession(): WalletSessionState {
  const activeAccount = useActiveAccount();
  const [isLoaded, setIsLoaded] = useState(false);
  const wasConnectedRef = useRef(false);
  
  // Track if user was connected to detect logout
  const [wasConnected, setWasConnected] = useState(false);

  useEffect(() => {
    // Give Panna SDK time to restore session from localStorage/persistence
    const timer = setTimeout(() => {
      setIsLoaded(true);
      // Initialize wasConnected state after loading
      if (!!activeAccount) {
        wasConnectedRef.current = true;
        setWasConnected(true);
      }
    }, 1200); // Slightly longer timeout for better UX

    return () => clearTimeout(timer);
  }, [activeAccount]);

  // Update wasConnected when connection state changes
  useEffect(() => {
    if (isLoaded) {
      if (!!activeAccount) {
        wasConnectedRef.current = true;
        setWasConnected(true);
      } else if (wasConnectedRef.current) {
        // User was connected but now disconnected (logout detected)
        setWasConnected(true); // Keep this true to indicate logout happened
      }
    }
  }, [activeAccount, isLoaded]);

  return {
    isLoaded,
    isConnected: !!activeAccount,
    account: activeAccount,
    address: activeAccount?.address,
    wasConnected,
  };
}