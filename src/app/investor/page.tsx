'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Target, ArrowRight, Eye, PlusCircle, BarChart3 } from 'lucide-react';
import { formatETH, formatUSD, formatPercentage, formatDateRelative, getStatusColor } from '@/lib/utils';

export default function InvestorDashboard() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { getInvestorPools, getPool, getInvestment } = useSEATrax();
  const { profile, loading: profileLoading } = useInvestorProfile();
  
  const [portfolioStats, setPortfolioStats] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalReturn: 0,
    activeInvestments: 0
  });
  const [recentInvestments, setRecentInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user name or fallback
  const getUserName = () => {
    if (profile?.name) return profile.name;
    if (activeAccount?.address) return `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}`;
    return 'Investor';
  };

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);
  
  // Fetch portfolio stats
  useEffect(() => {
    const fetchPortfolioStats = async () => {
      if (!activeAccount) return;
      
      try {
        setLoading(true);
        
        // For now, use mock data until full integration
        // TODO: Implement getInvestorPools() and calculate stats
        setPortfolioStats({
          totalInvested: 5200,
          totalValue: 5400,
          totalReturn: 200,
          activeInvestments: 3
        });
        
        setRecentInvestments([
          {
            id: 1,
            poolName: 'Southeast Asia Pool #12',
            amount: 2100,
            status: 'Active',
            fundingProgress: 85
          },
          {
            id: 2,
            poolName: 'Maritime Trade Pool #8',
            amount: 1500,
            status: 'Completed',
            fundingProgress: 100
          },
          {
            id: 3,
            poolName: 'Electronics Pool #15',
            amount: 1600,
            status: 'Active',
            fundingProgress: 45
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolioStats();
  }, [activeAccount, getInvestorPools, getPool, getInvestment]);

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">
            Welcome back, {getUserName()}
          </h1>
          <p className="text-gray-300">
            {profile?.name ? 'Track your investments and discover new opportunities' : 'Complete your profile to get started'}
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

      {/* Profile Completion Alert */}
      {!profile && activeAccount && (
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Complete Your Investor Profile</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Add your personal details to unlock full access to investment opportunities and personalized features.
                </p>
                <Button 
                  onClick={() => router.push('/onboarding/investor')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-400 text-white hover:shadow-lg"
                  size="sm"
                >
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Summary for existing users */}
      {profile && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <div className="text-cyan-400 font-bold text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{profile.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Investor since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/profile')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-slate-700"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="text-2xl text-cyan-400 font-bold">${portfolioStats.totalInvested.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">Across {portfolioStats.activeInvestments} pools</p>
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
            <div className="text-2xl text-white font-bold">{portfolioStats.activeInvestments}</div>
            <p className="text-xs text-gray-400 mt-1">ongoing pools</p>
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
            <div className="text-2xl text-green-400 font-bold">${portfolioStats.totalReturn.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">{((portfolioStats.totalReturn / portfolioStats.totalInvested) * 100).toFixed(2)}% return</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-green-400 mt-1">+${portfolioStats.totalReturn.toLocaleString()} profit</p>
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
            <Target className="w-8 h-8 text-green-400 mx-auto mb-4" />
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
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                <span className="text-green-400 font-medium">4.0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Return</span>
                <span className="text-cyan-400 font-medium">{((portfolioStats.totalReturn / portfolioStats.totalInvested) * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Claimable Returns</span>
                <span className="text-yellow-400 font-medium">${portfolioStats.totalReturn.toLocaleString()}</span>
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
                <span className="text-white font-medium">{portfolioStats.activeInvestments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Investments</span>
                <span className="text-cyan-400 font-medium">{portfolioStats.activeInvestments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Portfolio Value</span>
                <span className="text-white font-medium">${portfolioStats.totalValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Contract Integration Note */}
      <Card className="bg-slate-900/50 border-slate-800 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="text-cyan-400 font-medium">Smart Contract Integration Active</div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Dashboard is ready for real-time smart contract integration. Currently showing mock data for development testing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}