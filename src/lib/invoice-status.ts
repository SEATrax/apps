/**
 * Invoice Status Utilities
 * Centralized status mapping and display logic
 */

import { INVOICE_STATUS } from '@/hooks/useSEATrax';

export type InvoiceStatusLabel = 
  | 'pending' 
  | 'approved' 
  | 'in_pool' 
  | 'funded' 
  | 'withdrawn' 
  | 'paid' 
  | 'completed' 
  | 'rejected';

export interface StatusDisplay {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
  bgColor: string;
}

/**
 * Convert blockchain status number to label
 */
export function getInvoiceStatusLabel(status: number): InvoiceStatusLabel {
  switch (status) {
    case INVOICE_STATUS.PENDING:
      return 'pending';
    case INVOICE_STATUS.APPROVED:
      return 'approved';
    case INVOICE_STATUS.IN_POOL:
      return 'in_pool';
    case INVOICE_STATUS.FUNDED:
      return 'funded';
    case INVOICE_STATUS.WITHDRAWN:
      return 'withdrawn';
    case INVOICE_STATUS.PAID:
      return 'paid';
    case INVOICE_STATUS.COMPLETED:
      return 'completed';
    case INVOICE_STATUS.REJECTED:
      return 'rejected';
    default:
      return 'pending';
  }
}

/**
 * Get display information for a status
 */
export function getInvoiceStatusDisplay(status: number | InvoiceStatusLabel): StatusDisplay {
  const label = typeof status === 'number' ? getInvoiceStatusLabel(status) : status;
  
  const displays: Record<InvoiceStatusLabel, StatusDisplay> = {
    pending: {
      label: 'Pending Review',
      variant: 'secondary',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20 border-yellow-800',
    },
    approved: {
      label: 'Approved',
      variant: 'outline',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20 border-blue-800',
    },
    in_pool: {
      label: 'In Pool',
      variant: 'outline',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20 border-purple-800',
    },
    funded: {
      label: 'Funded',
      variant: 'default',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20 border-green-800',
    },
    withdrawn: {
      label: 'Withdrawn',
      variant: 'default',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/20 border-cyan-800',
    },
    paid: {
      label: 'Paid',
      variant: 'default',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20 border-emerald-800',
    },
    completed: {
      label: 'Completed',
      variant: 'default',
      color: 'text-green-500',
      bgColor: 'bg-green-900/30 border-green-700',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20 border-red-800',
    },
  };
  
  return displays[label];
}

/**
 * Get user-friendly status description
 */
export function getInvoiceStatusDescription(status: number | InvoiceStatusLabel): string {
  const label = typeof status === 'number' ? getInvoiceStatusLabel(status) : status;
  
  const descriptions: Record<InvoiceStatusLabel, string> = {
    pending: 'Your invoice is awaiting admin review and approval.',
    approved: 'Invoice approved and ready to be added to a funding pool.',
    in_pool: 'Invoice is in a funding pool, accepting investor funds.',
    funded: 'Invoice has reached funding target. You can now withdraw funds.',
    withdrawn: 'Funds have been withdrawn. Awaiting importer payment.',
    paid: 'Importer has paid. Awaiting profit distribution.',
    completed: 'All payments distributed. Invoice cycle complete.',
    rejected: 'Invoice was rejected during review. Please contact support.',
  };
  
  return descriptions[label];
}

/**
 * Check if invoice can be withdrawn
 */
export function canWithdrawInvoice(status: number, fundedPercentage: number): boolean {
  const label = getInvoiceStatusLabel(status);
  return (label === 'funded' || label === 'in_pool') && fundedPercentage >= 70;
}

/**
 * Check if payment link should be shown
 */
export function shouldShowPaymentLink(status: number): boolean {
  const label = getInvoiceStatusLabel(status);
  return label === 'withdrawn' || label === 'paid' || label === 'completed';
}

/**
 * Get next action for exporter based on status
 */
export function getNextAction(status: number, fundedPercentage: number): string {
  const label = getInvoiceStatusLabel(status);
  
  switch (label) {
    case 'pending':
      return 'Wait for admin approval';
    case 'approved':
      return 'Wait for admin to add to funding pool';
    case 'in_pool':
      return fundedPercentage >= 70 
        ? 'You can withdraw funds now' 
        : `Wait for ${70 - fundedPercentage}% more funding`;
    case 'funded':
      return 'Withdraw available funds';
    case 'withdrawn':
      return 'Share payment link with importer';
    case 'paid':
      return 'Wait for profit distribution';
    case 'completed':
      return 'Invoice completed successfully';
    case 'rejected':
      return 'Contact support for details';
    default:
      return '';
  }
}
