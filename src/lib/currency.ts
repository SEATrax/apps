import { appConfig } from '@/config';

const CURRENCY_API = 'https://api.currencyfreaks.com/v2.0/rates/latest';

interface CurrencyRates {
  date: string;
  base: string;
  rates: {
    ETH: string;
    [key: string]: string;
  };
}

let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current ETH rate from CurrencyFreaks API
 * Returns: 1 USD = X ETH
 */
export async function getEthRate(): Promise<number> {
  // Check cache
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    return cachedRate.rate;
  }

  const apiKey = process.env.CURRENCY_FREAKS_API_KEY;
  
  if (!apiKey) {
    console.warn('CurrencyFreaks API key not configured, using fallback rate');
    return 0.0003; // Fallback: ~$3000/ETH
  }

  try {
    const response = await fetch(`${CURRENCY_API}?apikey=${apiKey}&symbols=ETH`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: CurrencyRates = await response.json();
    const ethRate = parseFloat(data.rates.ETH);

    // Cache the result
    cachedRate = {
      rate: ethRate,
      timestamp: Date.now(),
    };

    return ethRate;
  } catch (error) {
    console.error('Failed to fetch ETH rate:', error);
    // Return cached rate if available, otherwise fallback
    return cachedRate?.rate || 0.0003;
  }
}

/**
 * Convert USD to ETH
 * @param usdAmount Amount in USD
 * @returns Amount in ETH
 */
export async function usdToEth(usdAmount: number): Promise<number> {
  const ethRate = await getEthRate();
  return usdAmount * ethRate;
}

/**
 * Convert ETH to USD
 * @param ethAmount Amount in ETH
 * @returns Amount in USD
 */
export async function ethToUsd(ethAmount: number): Promise<number> {
  const ethRate = await getEthRate();
  if (ethRate === 0) return 0;
  return ethAmount / ethRate;
}

/**
 * Convert USD to Wei (for smart contract)
 * @param usdAmount Amount in USD
 * @returns Amount in Wei (bigint)
 */
export async function usdToWei(usdAmount: number): Promise<bigint> {
  const ethAmount = await usdToEth(usdAmount);
  return BigInt(Math.floor(ethAmount * 1e18));
}

/**
 * Convert Wei to USD
 * @param weiAmount Amount in Wei (bigint)
 * @returns Amount in USD
 */
export async function weiToUsd(weiAmount: bigint): Promise<number> {
  const ethAmount = Number(weiAmount) / 1e18;
  return ethToUsd(ethAmount);
}

/**
 * Format USD amount for display
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format ETH amount for display
 */
export function formatEth(amount: number | bigint, decimals = 6): string {
  const value = typeof amount === 'bigint' ? Number(amount) / 1e18 : amount;
  return `${value.toFixed(decimals)} ETH`;
}

/**
 * Parse ETH string to Wei
 */
export function parseEthToWei(ethString: string): bigint {
  const eth = parseFloat(ethString);
  return BigInt(Math.floor(eth * 1e18));
}

/**
 * Format Wei to ETH string
 */
export function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

/**
 * Convert USD cents to Wei (for precise smart contract calls)
 * Smart contracts often use cents to avoid floating point issues
 */
export async function usdCentsToWei(usdCents: number): Promise<bigint> {
  return usdToWei(usdCents / 100);
}

/**
 * Convert Wei to USD cents
 */
export async function weiToUsdCents(weiAmount: bigint): Promise<number> {
  const usd = await weiToUsd(weiAmount);
  return Math.round(usd * 100);
}
