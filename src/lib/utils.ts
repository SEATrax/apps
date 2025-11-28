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

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    funding: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    funded: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    defaulted: 'bg-red-500/10 text-red-500 border-red-500/20',
    rejected: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    open: 'bg-green-500/10 text-green-500 border-green-500/20',
    closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    matured: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    liquidating: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
}

export function generateIPFSUrl(hash: string, gateway?: string): string {
  const baseGateway = gateway || process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  return `${baseGateway}/${hash}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
