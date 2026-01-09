'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useInvestmentStats } from '@/hooks/useInvestmentStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Wallet, DollarSign, Target, ArrowRight, Eye, PlusCircle, BarChart3 } from 'lucide-react';
import { formatETH, formatUSD, formatPercentage, formatDateRelative, getStatusColor } from '@/lib/utils';

export default function InvestorDashboard() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { profile, loading: profileLoading } = useInvestorProfile();
  const { getUserRoles, isLoading: rolesLoading } = useAccessControl();
  const { stats, getRecentInvestments, calculatePortfolioPerformance, loading: statsLoading } = useInvestmentStats();

  const isLoading = rolesLoading || profileLoading || statsLoading;
  const recentInvestments = getRecentInvestments(3);
  const portfolioPerformance = calculatePortfolioPerformance();

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    if (!profileLoading && !profile) {
      router.push('/onboarding/investor');
      return;
    }
  }, [activeAccount, profile, profileLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to onboarding
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">
            Welcome back, {profile.name}
          </h1>
          <p className="text-gray-300">
            Track your investments and discover new opportunities
          </p>
        </div>
        <Button 
          onClick={() => router.push('/investor/pools')}
          className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Investment
        </Button>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-cyan-400 font-bold">{formatETH(stats.totalInvested)}</div>
            <p className="text-xs text-gray-400 mt-1">{formatUSD(stats.totalInvested)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Active Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{stats.activeInvestments}</div>
            <p className="text-xs text-gray-400 mt-1">across {stats.totalPools} pools</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-400 font-bold">{formatETH(stats.totalReturns)}</div>
            <p className="text-xs text-gray-400 mt-1">{formatPercentage(portfolioPerformance)} return</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{formatETH(stats.portfolioValue)}</div>
            <p className="text-xs text-green-400 mt-1">+{formatETH(stats.unrealizedGains)} unrealized</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all cursor-pointer" 
              onClick={() => router.push('/investor/pools')}>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Browse Investment Pools</h3>
            <p className="text-gray-400 text-sm">Discover new investment opportunities</p>
            <Button variant="ghost" className="mt-4 text-cyan-400 hover:text-cyan-300">
              Explore Pools <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all cursor-pointer" 
              onClick={() => router.push('/investor/investments')}>
          <CardContent className="p-6 text-center">
            <Wallet className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Manage Portfolio</h3>
            <p className="text-gray-400 text-sm">Track all your investments</p>
            <Button variant="ghost" className="mt-4 text-green-400 hover:text-green-300">
              View Portfolio <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all cursor-pointer" 
              onClick={() => router.push('/investor/returns')}>
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Claim Returns</h3>
            <p className="text-gray-400 text-sm">Withdraw your earnings</p>
            <Button variant="ghost" className="mt-4 text-yellow-400 hover:text-yellow-300">
              View Returns <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Investments */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Investments
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/investor/investments')}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInvestments.length > 0 ? (
              recentInvestments.map((investment) => {
                const statusColorClass = getStatusColor(investment.status);
                return (
                  <Card key={investment.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-medium">{investment.poolName}</h3>
                            <Badge className={statusColorClass}>{investment.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Investment</div>
                              <div className="text-cyan-400 font-medium">{formatETH(investment.amount)}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Expected Yield</div>
                              <div className="text-green-400 font-medium">{investment.expectedYield}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Date</div>
                              <div className="text-white font-medium">{formatDateRelative(investment.investedDate)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-4">No investments yet</div>
                <Button 
                  onClick={() => router.push('/investor/pools')}
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
                >
                  Start Investing
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Average Yield</span>
                <span className="text-green-400 font-medium">{formatPercentage(parseFloat(stats.averageYield))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Return</span>
                <span className="text-cyan-400 font-medium">{formatPercentage(portfolioPerformance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Claimable Returns</span>
                <span className="text-yellow-400 font-medium">{formatETH(stats.claimableReturns)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Investment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Pools Invested</span>
                <span className="text-white font-medium">{stats.totalPools}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Investments</span>
                <span className="text-cyan-400 font-medium">{stats.activeInvestments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Portfolio Value</span>
                <span className="text-white font-medium">{formatETH(stats.portfolioValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}