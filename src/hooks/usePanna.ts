'use client';

import { useActiveAccount, usePanna as usePannaSDK } from 'panna-sdk';
import { useEffect, useState } from 'react';

interface MockUser {
  id: string;
  name: string;
  role: string;
  address: string;
  verified: boolean;
}

/**
 * Custom hook that wraps panna-sdk hooks
 * Provides backwards compatibility with old usePanna interface
 * Supports mock users for testing
 */
export function usePanna() {
  const activeAccount = useActiveAccount();
  const { client } = usePannaSDK();
  const [mockUser, setMockUser] = useState<MockUser | null>(null);

  // Check for mock user in localStorage
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mockUser');
      if (stored) {
        try {
          setMockUser(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse mock user:', e);
        }
      }
    }
  }, []);

  // Use mock user if available, otherwise use real wallet
  const isConnected = !!activeAccount || !!mockUser;
  const address = activeAccount?.address || mockUser?.address;

  return {
    // Connection state
    isConnected,
    isConnecting: false, // Panna SDK handles this internally
    
    // Wallet info
    address,
    mockUser,
    
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
    
    // Mock user helpers
    setMockUser: (user: MockUser | null) => {
      setMockUser(user);
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('mockUser', JSON.stringify(user));
        } else {
          localStorage.removeItem('mockUser');
        }
      }
    },
    
    switchToMockUser: (role: 'exporter' | 'investor' | 'admin') => {
      const mockUsers = {
        exporter: {
          id: 'mock-exp-1',
          name: 'Test Exporter (Mock)',
          role: 'exporter',
          address: '0x1234567890123456789012345678901234567890',
          verified: true
        },
        investor: {
          id: 'mock-inv-1', 
          name: 'Test Investor (Mock)',
          role: 'investor',
          address: '0x0987654321098765432109876543210987654321',
          verified: true
        },
        admin: {
          id: 'mock-adm-1',
          name: 'Test Admin (Mock)',
          role: 'admin', 
          address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
          verified: true
        }
      };
      
      const user = mockUsers[role];
      setMockUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(user));
      }
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
