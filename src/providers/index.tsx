'use client';

import { ReactNode } from 'react';
import { WalletProvider } from './wallet-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}

export { WalletProvider, useWallet } from './wallet-provider';
