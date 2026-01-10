'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToastContextValue {
  show: (msg: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const show = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((prev) => [...prev, { id, duration: 4000, ...msg }]);
  }, []);

  const remove = (id: string) => setMessages((prev) => prev.filter((m) => m.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((m) => (
          <ToastPrimitive.Root
            key={m.id}
            duration={m.duration}
            onOpenChange={(open) => { if (!open) remove(m.id); }}
            className={cn(
              'group pointer-events-auto relative mb-2 w-[320px] rounded-md border p-4 shadow-lg bg-background backdrop-blur-sm',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0',
              m.variant === 'success' && 'border-green-600/40 bg-green-600/10',
              m.variant === 'error' && 'border-red-600/40 bg-red-600/10',
              m.variant === 'warning' && 'border-yellow-500/40 bg-yellow-500/10'
            )}
          >
            {m.title && <div className="font-medium text-sm mb-1">{m.title}</div>}
            {m.description && <div className="text-xs leading-relaxed text-muted-foreground">{m.description}</div>}
            <ToastPrimitive.Close className="absolute top-2 right-2 text-xs opacity-60 hover:opacity-100">×</ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-50 flex max-h-screen w-full flex-col items-end" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
