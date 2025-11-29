'use client';

import { ReactNode, useEffect } from 'react';
import { PannaProvider } from 'panna-sdk';
import { ToastProvider } from '@/components/ui';
import { appConfig } from '@/config';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Suppress known Thirdweb modal nested button hydration warnings in dev
  useEffect(() => {
    const originalError = console.error;
    console.error = function (...args: unknown[]) {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        process.env.NODE_ENV !== 'production' &&
        msg.includes('<button> cannot be a descendant of <button>')
      ) {
        return; // ignore noisy modal warning
      }
      return (originalError as any).apply(console, args as any);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
  return (
    <PannaProvider
      clientId={appConfig.panna.clientId}
      partnerId={appConfig.panna.partnerId}
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </PannaProvider>
  );
}
