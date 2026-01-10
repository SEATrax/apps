'use client';

import React from 'react';
import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorType = 'error' | 'warning' | 'success' | 'info';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: ErrorType;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const iconMap = {
  error: XCircle,
  warning: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const colorMap = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    message: 'text-red-700',
    button: 'text-red-600 hover:text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    message: 'text-yellow-700',
    button: 'text-yellow-600 hover:text-yellow-700',
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    message: 'text-green-700',
    button: 'text-green-600 hover:text-green-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    message: 'text-blue-700',
    button: 'text-blue-600 hover:text-blue-700',
  },
};

/**
 * Reusable Error Message Component
 * Displays user-friendly error messages with retry/dismiss actions
 */
export function ErrorMessage({
  title,
  message,
  type = 'error',
  details,
  onRetry,
  onDismiss,
  className,
}: ErrorMessageProps) {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        colors.container,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', colors.icon)} />
        <div className="flex-1 space-y-2">
          {title && (
            <h3 className={cn('font-semibold text-sm', colors.title)}>
              {title}
            </h3>
          )}
          <p className={cn('text-sm', colors.message)}>{message}</p>
          
          {details && (
            <details className="mt-2">
              <summary className={cn('text-xs cursor-pointer', colors.button)}>
                Show details
              </summary>
              <pre className="mt-2 text-xs bg-white/50 p-2 rounded overflow-auto">
                {details}
              </pre>
            </details>
          )}

          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    'text-sm font-medium underline',
                    colors.button
                  )}
                >
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={cn(
                    'text-sm font-medium underline',
                    colors.button
                  )}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to format common error messages
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
}

/**
 * Helper to detect and format blockchain errors
 */
export function formatBlockchainError(error: unknown): {
  message: string;
  details?: string;
} {
  const errorMessage = formatErrorMessage(error);

  // User rejected transaction
  if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
    return {
      message: 'Transaction was cancelled',
      details: 'You rejected the transaction in your wallet.',
    };
  }

  // Insufficient funds
  if (errorMessage.includes('insufficient funds')) {
    return {
      message: 'Insufficient funds',
      details: 'You don\'t have enough ETH to complete this transaction.',
    };
  }

  // Network error
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return {
      message: 'Network connection issue',
      details: 'Please check your internet connection and try again.',
    };
  }

  // Contract execution failed
  if (errorMessage.includes('execution reverted')) {
    return {
      message: 'Transaction failed',
      details: 'The smart contract rejected this transaction. Please check the requirements.',
    };
  }

  // Default
  return {
    message: 'Transaction failed',
    details: errorMessage,
  };
}
