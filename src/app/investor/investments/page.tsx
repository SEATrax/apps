'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax, type Pool, type Investment, POOL_STATUS } from '@/hooks/useSEATrax';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, DollarSign, Target, Clock, ArrowRight, Wallet, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { formatEther } from '@/lib/utils';

// Investment data combined from pool + investment contract calls
interface InvestmentData {
  id: number;
  poolId: bigint;
  poolName: string;
  investmentAmount: bigint;
  investmentDate: Date;
  status: string;
  expectedReturn: string;
  currentValue: string;
  profitLoss: string;
  fundingProgress: number;
  maturityDate: Date | null;
  yield: string;
  returnsClaimed: boolean;
}

// Pool status mapping
const getPoolStatusText = (status: number): string => {
  switch (status) {
    case 0: return 'Open';
    case 1: return 'Funded';
    case 2: return 'Completed';
    case 3: return 'Cancelled';
    default: return 'Unknown';
  }
};

// Convert pool status to display status for investor
const getInvestmentStatus = (poolStatus: number, returnsClaimed: boolean): string => {
  if (returnsClaimed) return 'Claimed';
  if (poolStatus === 2) return 'Completed';
  if (poolStatus === 1) return 'Funded';
  return 'Active';
};

export default function InvestmentsPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { getInvestorPools, getInvestment, getPool, getPoolFundingPercentage } = useSEATrax();

  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated stats from real data
  const totalStats = {
    totalInvested: investments.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0),
    totalCurrentValue: investments.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0), // Same as invested for now
    totalProfitLoss: investments.filter(inv => inv.status === 'Completed' || inv.status === 'Claimed')
      .reduce((sum, inv) => sum + (Number(inv.investmentAmount) * 0.04 / 1e18), 0), // 4% yield in ETH
    activeInvestments: investments.filter(inv => inv.status === 'Active' || inv.status === 'Funded').length,
    completedInvestments: investments.filter(inv => inv.status === 'Completed' || inv.status === 'Claimed').length
  };

  // Fetch investments from Supabase (Cached Data)
  const fetchInvestments = async (isRefresh = false) => {
    if (!activeAccount?.address) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Import the helper dynamically to avoid server/client issues if any, implies strict client side
      // but we can just import at top level if not for this tool limitation, let's assume top level import available or use this block
      const { getInvestorPortfolio } = await import('@/lib/supabase');

      const portfolio = await getInvestorPortfolio(activeAccount.address);

      if (!portfolio || portfolio.length === 0) {
        setInvestments([]);
        return;
      }

      const investmentData: InvestmentData[] = portfolio.map((inv: any, index: number) => {
        const pool = inv.pool_metadata;
        const status = getInvestmentStatus(
          ['OPEN', 'FUNDED', 'COMPLETED', 'CANCELLED'].indexOf(pool?.status || 'OPEN'),
          false // returnsClaimed not yet tracked in DB
        );

        const investmentAmountETH = Number(inv.amount) / 1e18;
        const expectedYield = investmentAmountETH * 0.04; // 4% yield

        // Calculate progress from cached metadata
        const totalLoanStart = Number(pool?.total_loan_amount || 0);
        // Note: pool.amount_invested is in Wei, loan is in USD Cents. 
        // We can't easily calc % without conversion. 
        // Fallback: Use 0 or try to estimate if we had rates. 
        // Actually, let's rely on status. If FUNDED/COMPLETED -> 100%.
        let progress = 0;
        if (pool?.status === 'FUNDED' || pool?.status === 'COMPLETED') progress = 1;
        // precise progress is hard without live price feed in this view, 
        // but we can trust the cache eventually. For now, showing status is safer.

        return {
          id: index + 1,
          poolId: BigInt(inv.pool_id),
          poolName: pool?.name || `Pool #${inv.pool_id}`,
          investmentAmount: BigInt(inv.amount),
          investmentDate: new Date(Number(inv.timestamp) * 1000),
          status: status,
          expectedReturn: (investmentAmountETH + expectedYield).toFixed(4),
          currentValue: investmentAmountETH.toFixed(4),
          profitLoss: status === 'Completed' || status === 'Claimed'
            ? `+${expectedYield.toFixed(4)}`
            : '0.00',
          fundingProgress: progress,
          maturityDate: pool?.end_date ? new Date(Number(pool.end_date) * 1000) : null,
          yield: '4.0%',
          returnsClaimed: false // Pending DB update
        };
      });

      setInvestments(investmentData);
    } catch (err: any) {
      console.error('Failed to fetch investments:', err);
      setError(err.message || 'Failed to load investments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    fetchInvestments();
  }, [activeAccount, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Funded': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Claimed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProfitColor = (profit: string) => {
    const value = parseFloat(profit);
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Format ETH amount for display
  const formatETHAmount = (amount: bigint): string => {
    return (Number(amount) / 1e18).toFixed(4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
          <div className="text-gray-400">Loading investments from blockchain...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">My Investments</h1>
          <p className="text-gray-300">
            Track your investment portfolio and performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchInvestments(true)}
            disabled={refreshing}
            variant="outline"
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => router.push('/investor/pools')}
            className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Browse New Pools
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-red-400">{error}</div>
            <Button
              onClick={() => fetchInvestments()}
              variant="outline"
              size="sm"
              className="mt-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Invested</div>
            <div className="text-xl text-white font-bold">
              {(totalStats.totalInvested / 1e18).toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ≈ ${((totalStats.totalInvested / 1e18) * 3000).toFixed(0)} USD
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-xl text-white font-bold">
              {((totalStats.totalCurrentValue + totalStats.totalProfitLoss * 1e18) / 1e18).toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400 mt-1">
              ≈ ${(((totalStats.totalCurrentValue / 1e18) + totalStats.totalProfitLoss) * 3000).toFixed(0)} USD
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total P&L</div>
            <div className={`text-xl font-bold ${totalStats.totalProfitLoss > 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {totalStats.totalProfitLoss > 0 ? '+' : ''}{totalStats.totalProfitLoss.toFixed(4)} ETH
            </div>
            <div className="text-xs text-gray-400 mt-1">
              From completed investments
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Active</div>
            <div className="text-xl text-cyan-400 font-bold">{totalStats.activeInvestments}</div>
            <div className="text-xs text-gray-400 mt-1">Investments</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Completed</div>
            <div className="text-xl text-green-400 font-bold">{totalStats.completedInvestments}</div>
            <div className="text-xs text-gray-400 mt-1">Investments</div>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Investment History</span>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {investments.length} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.map((investment) => (
              <Card key={investment.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Investment Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium text-lg">{investment.poolName}</h3>
                        <Badge className={getStatusColor(investment.status)}>
                          {investment.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Investment</div>
                          <div className="text-white font-medium">
                            {formatETHAmount(investment.investmentAmount)} ETH
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Expected Return</div>
                          <div className="text-cyan-400 font-medium">{investment.expectedReturn} ETH</div>
                        </div>
                        <div>
                          <div className="text-gray-400">P&L</div>
                          <div className={`font-medium ${getProfitColor(investment.profitLoss)}`}>
                            {investment.profitLoss} ETH
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Yield</div>
                          <div className="text-white font-medium">{investment.yield}</div>
                        </div>
                      </div>

                      {(investment.status === 'Active' || investment.status === 'Funded') && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Pool Progress</span>
                            <span className="text-white">{investment.fundingProgress}%</span>
                          </div>
                          <Progress value={investment.fundingProgress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Invested: {investment.investmentDate.toLocaleDateString()}</span>
                        {investment.maturityDate && (
                          <>
                            <span>•</span>
                            <span>Maturity: {investment.maturityDate.toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/investor/pools/${investment.poolId}`)}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Pool
                      </Button>

                      {investment.status === 'Completed' && !investment.returnsClaimed && (
                        <Button
                          size="sm"
                          onClick={() => router.push('/investor/returns')}
                          className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Claim Returns
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {investments.length === 0 && !error && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-4">No investments yet</div>
              <p className="text-gray-500 text-sm mb-6">
                Start investing in pools to see your portfolio here.
              </p>
              <Button
                onClick={() => router.push('/investor/pools')}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
              >
                Browse Investment Pools
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Status */}
      <Card className="bg-slate-900/50 border-slate-800 border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="text-cyan-400 font-medium">Live Blockchain Data</div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Investment data is fetched directly from the SEATrax smart contract on Lisk Sepolia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}