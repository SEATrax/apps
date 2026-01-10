'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { formatBlockchainError } from '@/components/common/ErrorMessage';

export type TransactionStatus = 'idle' | 'pending' | 'success' | 'error';

interface TransactionState {
  status: TransactionStatus;
  error: Error | null;
  txHash: string | null;
}

interface UseTransactionOptions {
  onSuccess?: (txHash: string) => void | Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook for managing blockchain transaction state with error handling
 * Provides consistent transaction UX across the app
 * 
 * Usage:
 * const { execute, status, error, reset } = useTransaction({
 *   onSuccess: (txHash) => console.log('Success:', txHash),
 *   successMessage: 'Transaction completed!',
 * });
 * 
 * await execute(async () => {
 *   return await contract.someFunction();
 * });
 */
export function useTransaction(options: UseTransactionOptions = {}) {
  const { toast } = useToast();
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    error: null,
    txHash: null,
  });

  const execute = useCallback(
    async <T extends { transactionHash?: string }>(
      txFn: () => Promise<T>
    ): Promise<T | null> => {
      try {
        setState({ status: 'pending', error: null, txHash: null });

        // Execute transaction
        const result = await txFn();
        const txHash = result.transactionHash || null;

        setState({ status: 'success', error: null, txHash });

        // Show success toast
        toast({
          title: 'Success',
          description: options.successMessage || 'Transaction completed successfully',
        });

        // Call success callback
        if (options.onSuccess) {
          await options.onSuccess(txHash || '');
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setState({ status: 'error', error: err, txHash: null });

        // Format blockchain-specific errors
        const { message, details } = formatBlockchainError(err);

        // Show error toast
        toast({
          variant: 'destructive',
          title: options.errorMessage || 'Transaction Failed',
          description: message,
        });

        // Log details in development
        if (process.env.NODE_ENV === 'development' && details) {
          console.error('Transaction error details:', details);
        }

        // Call error callback
        options.onError?.(err);

        return null;
      }
    },
    [options, toast]
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null, txHash: null });
  }, []);

  return {
    execute,
    status: state.status,
    error: state.error,
    txHash: state.txHash,
    isLoading: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isIdle: state.status === 'idle',
    reset,
  };
}

/**
 * Hook for executing multiple transactions sequentially
 * Provides retry and rollback capabilities
 */
export function useTransactionSequence() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [failedStep, setFailedStep] = useState<number | null>(null);
  const { toast } = useToast();

  interface TransactionStep {
    name: string;
    execute: () => Promise<any>;
    onSuccess?: (result: any) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
  }

  const executeSequence = useCallback(
    async (steps: TransactionStep[]) => {
      setCurrentStep(0);
      setCompletedSteps([]);
      setFailedStep(null);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStep(i);

        try {
          toast({
            title: `Step ${i + 1}/${steps.length}`,
            description: step.name,
          });

          const result = await step.execute();
          
          setCompletedSteps(prev => [...prev, i]);
          await step.onSuccess?.(result);

        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          
          setFailedStep(i);
          
          const { message, details } = formatBlockchainError(err);
          
          toast({
            variant: 'destructive',
            title: `Failed at step ${i + 1}`,
            description: message,
          });

          await step.onError?.(err);
          
          throw err; // Stop sequence
        }
      }

      toast({
        title: 'Success',
        description: 'All steps completed successfully',
      });
    },
    [toast]
  );

  const retry = useCallback(
    async (steps: TransactionStep[]) => {
      if (failedStep === null) return;
      
      // Retry from failed step
      const remainingSteps = steps.slice(failedStep);
      await executeSequence(remainingSteps);
    },
    [failedStep, executeSequence]
  );

  return {
    executeSequence,
    retry,
    currentStep,
    completedSteps,
    failedStep,
    progress: completedSteps.length,
  };
}
