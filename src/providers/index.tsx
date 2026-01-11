'use client';

import { ReactNode, useEffect } from 'react';
import { PannaProvider } from 'panna-sdk';
import { ToastProvider } from '@/hooks/use-toast';
import { DevModeProvider } from '@/contexts/DevModeContext';
import { appConfig } from '@/config';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Suppress known Thirdweb modal nested button hydration warnings in dev
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const originalError = console.error;
      console.error = function (...args: unknown[]) {
        const msg = typeof args[0] === 'string' ? args[0] : '';
        
        // Suppress known non-critical warnings
        if (
          msg.includes('<button> cannot be a descendant of <button>') ||
          msg.includes('Hydration failed because the initial UI') ||
          msg.includes('Warning: Expected server HTML to contain')
        ) {
          return; // ignore noisy warnings
        }
        
        return originalError.apply(console, args);
      };
      
      return () => {
        console.error = originalError;
      };
    }
  }, []);
  return (
    <PannaProvider
      clientId={appConfig.panna.clientId}
      partnerId={appConfig.panna.partnerId}
    >
      <DevModeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </DevModeProvider>
    </PannaProvider>
  );
}
