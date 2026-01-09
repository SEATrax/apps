import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEther(wei: bigint, decimals = 4): string {
  const ether = Number(wei) / 1e18;
  return ether.toFixed(decimals);
}

export function parseEther(ether: string | number): bigint {
  return BigInt(Math.floor(Number(ether) * 1e18));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateFundingPercentage(current: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((current * 100n) / total);
}

// Additional utility functions for investor dashboard
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatETH(amount: string | number, decimals = 3): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(decimals)} ETH`;
}

export function formatUSD(ethAmount: string | number, ethPrice = 2400): string {
  const num = typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount;
  const usdValue = num * ethPrice;
  return formatCurrency(usdValue);
}

export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function calculateDaysRemaining(dateString: string): number {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'open':
      return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    case 'funded':
    case 'matured':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'completed':
    case 'paid':
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    case 'cancelled':
    case 'rejected':
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function calculateExpectedReturn(
  investment: bigint,
  yieldPercentage: number
): bigint {
  return investment + (investment * BigInt(yieldPercentage * 100)) / 10000n;
}

export function getDaysRemaining(dueDate: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = dueDate - now;
  return Math.max(0, Math.ceil(diff / 86400));
}

export function generateIPFSUrl(hash: string, gateway?: string): string {
  const baseGateway = gateway || process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  return `${baseGateway}/${hash}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
