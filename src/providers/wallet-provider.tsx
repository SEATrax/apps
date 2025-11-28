'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePanna } from '@/hooks/usePanna';

interface WalletContextType {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  getBalance: () => Promise<bigint>;
  switchChain: (chainId: number) => Promise<void>;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = usePanna();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
