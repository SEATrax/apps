'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax, type Pool, type Investment, POOL_STATUS } from '@/hooks/useSEATrax';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, Target, Loader2, RefreshCw } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Calculated stats from real data
  const totalStats = {
    totalInvested: investments.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0),
    totalCurrentValue: investments.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0),
    totalProfitLoss: investments.filter(inv => inv.status === 'Completed' || inv.status === 'Claimed')
      .reduce((sum, inv) => {
        const yieldRate = parseFloat(inv.yield) / 100;
        return sum + (Number(inv.investmentAmount) * yieldRate / 1e18);
      }, 0),
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

      // Import the helper dynamically 
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
          inv.returns_claimed || false // Tracked in DB now
        );

        const investmentAmountETH = Number(inv.amount) / 1e18;

        // Yield Calculation
        const yieldRate = pool?.target_yield ? Number(pool.target_yield) / 100 : 0.04;
        const expectedYieldETH = investmentAmountETH * yieldRate;
        const actualYieldStr = (yieldRate * 100).toFixed(1) + '%';

        // Progress Calculation
        const totalLoan = Number(pool?.total_loan_amount || 0);
        const totalInvested = Number(pool?.amount_invested || 0);
        let progress = totalLoan > 0 ? Math.min(100, Math.round((totalInvested / totalLoan) * 100)) : 0;

        if (pool?.status === 'FUNDED' || pool?.status === 'COMPLETED') progress = 100;

        return {
          id: index + 1,
          poolId: BigInt(inv.pool_id),
          poolName: pool?.name || `Pool #${inv.pool_id}`,
          investmentAmount: BigInt(inv.amount),
          investmentDate: new Date(Number(inv.timestamp) * 1000),
          status: status,
          expectedReturn: (investmentAmountETH + expectedYieldETH).toFixed(4),
          currentValue: investmentAmountETH.toFixed(4),
          profitLoss: status === 'Completed' || status === 'Claimed'
            ? `+${expectedYieldETH.toFixed(4)}`
            : '0.00',
          fundingProgress: progress,
          maturityDate: pool?.end_date ? new Date(Number(pool.end_date) * 1000) : null,
          yield: actualYieldStr,
          returnsClaimed: inv.returns_claimed || false
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const formatETHAmount = (amount: bigint): string => {
    return (Number(amount) / 1e18).toFixed(4);
  };

  // Filter Logic
  const filteredInvestments = investments.filter(inv => {
    const matchesSearch = inv.poolName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return b.investmentDate.getTime() - a.investmentDate.getTime();
    if (sortBy === 'oldest') return a.investmentDate.getTime() - b.investmentDate.getTime();
    if (sortBy === 'amount_high') return Number(b.investmentAmount) - Number(a.investmentAmount);
    if (sortBy === 'amount_low') return Number(a.investmentAmount) - Number(b.investmentAmount);
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvestments.length / ITEMS_PER_PAGE);
  const currentInvestments = filteredInvestments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              ${((totalStats.totalInvested / 1e18) * 3000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {(totalStats.totalInvested / 1e18).toFixed(4)} ETH
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-xl text-white font-bold">
              ${(((totalStats.totalCurrentValue / 1e18) + totalStats.totalProfitLoss) * 3000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {((totalStats.totalCurrentValue + totalStats.totalProfitLoss * 1e18) / 1e18).toFixed(4)} ETH
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total P&L</div>
            <div className={`text-xl font-bold ${totalStats.totalProfitLoss > 0 ? 'text-green-400' : 'text-gray-400'}`}>
              {totalStats.totalProfitLoss > 0 ? '+' : ''}
              ${(Math.abs(totalStats.totalProfitLoss) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalStats.totalProfitLoss > 0 ? '+' : ''}{totalStats.totalProfitLoss.toFixed(4)} ETH
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

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {/* Row 1: Search */}
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <Target className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search investments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all shadow-sm"
              />
            </div>

            {/* Row 2: Filters */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Status Filter */}
              <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 overflow-x-auto w-full md:w-auto no-scrollbar">
                {['all', 'active', 'funded', 'completed'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === filter
                      ? 'bg-slate-700/80 text-white shadow-sm ring-1 ring-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort By */}
              <div className="relative w-full md:w-48">
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-10 pl-10 pr-8 rounded-lg bg-slate-800/50 border border-slate-700 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-gray-300 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Highest Amount</option>
                  <option value="amount_low">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investments List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Investment History</span>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {filteredInvestments.length} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.length === 0 ? (
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
            ) : filteredInvestments.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-4">No investments match your criteria</div>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {currentInvestments.map((investment) => (
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
                                ${(Number(investment.investmentAmount) / 1e18 * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({formatETHAmount(investment.investmentAmount)} ETH)
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Expected Return</div>
                              <div className="text-cyan-400 font-medium">
                                ${(Number(investment.expectedReturn) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">P&L</div>
                              <div className={`font-medium ${getProfitColor(investment.profitLoss)}`}>
                                {Number(investment.profitLoss) > 0 ? '+' : ''}
                                ${(Math.abs(Number(investment.profitLoss)) * 3000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Yield</div>
                              <div className="text-white font-medium">{investment.yield}</div>
                            </div>
                          </div>

                          {(investment.status === 'Active' || investment.status === 'Funded') && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Pool Progress</span>
                                <span className="text-white font-medium">{investment.fundingProgress}%</span>
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-6 border-t border-slate-800">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                            className={currentPage === 1
                              ? 'pointer-events-none opacity-50 text-gray-500'
                              : 'cursor-pointer text-gray-300 hover:text-white hover:bg-slate-800'}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                              className={page === currentPage
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30 border-0'
                                : 'cursor-pointer text-gray-300 hover:text-white hover:bg-slate-800'}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                            className={currentPage === totalPages
                              ? 'pointer-events-none opacity-50 text-gray-500'
                              : 'cursor-pointer text-gray-300 hover:text-white hover:bg-slate-800'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
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