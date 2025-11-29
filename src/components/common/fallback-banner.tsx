'use client';

import { useEffect, useState } from 'react';

export function FallbackBanner() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      // Custom events from AuthProvider
      if (e.type === 'auth:walletReady') {
        setShow(false);
      }
    };
    window.addEventListener('auth:walletReady', handler);
    return () => {
      window.removeEventListener('auth:walletReady', handler);
    };
  }, []);

  // Listen panna availability via a global flag (set by AuthProvider when failing)
  useEffect(() => {
    const interval = setInterval(() => {
      const flag = (window as any).__PANNA_UNAVAILABLE__;
      if (flag) {
        setShow(true);
        setMessage('Wallet services degraded. Connect external wallet to transact.');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;
  return (
    <div className="w-full bg-yellow-600/15 border-b border-yellow-600/40 text-xs text-yellow-900 dark:text-yellow-200 px-4 py-2 flex items-center justify-between">
      <span>{message}</span>
      <button
        className="opacity-70 hover:opacity-100"
        onClick={() => setShow(false)}
      >
        ×
      </button>
    </div>
  );
}
