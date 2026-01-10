import { NextResponse } from 'next/server';
import { getEthRate, usdToEth, ethToUsd } from '@/lib/currency';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const usd = searchParams.get('usd');
  const eth = searchParams.get('eth');

  try {
    const rate = await getEthRate();

    // If USD amount provided, convert to ETH
    if (usd) {
      const usdAmount = parseFloat(usd);
      const ethAmount = await usdToEth(usdAmount);
      return NextResponse.json({
        usd: usdAmount,
        eth: ethAmount,
        rate,
        timestamp: Date.now(),
      });
    }

    // If ETH amount provided, convert to USD
    if (eth) {
      const ethAmount = parseFloat(eth);
      const usdAmount = await ethToUsd(ethAmount);
      return NextResponse.json({
        eth: ethAmount,
        usd: usdAmount,
        rate,
        timestamp: Date.now(),
      });
    }

    // Just return current rate
    return NextResponse.json({
      rate,
      description: '1 USD = X ETH',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Currency API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency rates' },
      { status: 500 }
    );
  }
}
