'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionPendingProps {
  message?: string;
  txHash?: string;
  className?: string;
}

/**
 * Transaction Pending Indicator
 * Shows loading state during blockchain transactions
 */
export function TransactionPending({
  message = 'Transaction in progress...',
  txHash,
  className,
}: TransactionPendingProps) {
  const explorerUrl = txHash 
    ? `https://sepolia-blockscout.lisk.com/tx/${txHash}`
    : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 space-y-4',
        className
      )}
    >
      <div className="relative">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-cyan-500/20" />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-900">{message}</p>
        <p className="text-sm text-gray-600">
          This may take a few moments. Please don't close this window.
        </p>
      </div>

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-600 hover:text-cyan-700 underline"
        >
          View on Block Explorer
        </a>
      )}
    </div>
  );
}

/**
 * Inline Transaction Loader - For buttons
 */
export function TransactionLoader({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
  );
}

/**
 * Full Page Transaction Overlay
 */
export function TransactionOverlay({
  isOpen,
  message,
  txHash,
}: {
  isOpen: boolean;
  message?: string;
  txHash?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <TransactionPending message={message} txHash={txHash} />
      </div>
    </div>
  );
}

/**
 * Multi-step Transaction Progress
 */
interface TransactionStepProps {
  steps: {
    label: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }[];
  className?: string;
}

export function TransactionSteps({ steps, className }: TransactionStepProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          {/* Status Icon */}
          <div
            className={cn(
              'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm',
              step.status === 'completed' && 'bg-green-500 text-white',
              step.status === 'current' && 'bg-cyan-500 text-white',
              step.status === 'pending' && 'bg-gray-200 text-gray-500',
              step.status === 'error' && 'bg-red-500 text-white'
            )}
          >
            {step.status === 'completed' && '✓'}
            {step.status === 'current' && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {step.status === 'pending' && index + 1}
            {step.status === 'error' && '✕'}
          </div>

          {/* Step Label */}
          <div
            className={cn(
              'flex-1 text-sm font-medium',
              step.status === 'current' && 'text-gray-900',
              step.status === 'completed' && 'text-gray-600',
              step.status === 'pending' && 'text-gray-400',
              step.status === 'error' && 'text-red-600'
            )}
          >
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
}
