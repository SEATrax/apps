'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, DollarSign, Target, ArrowRight, Eye, PlusCircle } from 'lucide-react';

export default function InvestorDashboard() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { profile, loading: profileLoading } = useInvestorProfile();
  const { getUserRoles, isLoading: rolesLoading } = useAccessControl();

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

  // Mock data for now - will be replaced with real contract calls
  const investmentStats = {
    totalInvested: '5.2',
    activeInvestments: 3,
    pendingReturns: '0.8',
    totalReturns: '1.2'
  };

  const recentInvestments = [
    { id: 1, poolName: 'Southeast Asia Export Pool #12', amount: '2.1', status: 'Active', yield: '4.2%', date: '2024-01-05' },
    { id: 2, poolName: 'Maritime Trade Pool #8', amount: '1.5', status: 'Completed', yield: '4.1%', date: '2024-01-03' },
    { id: 3, poolName: 'Electronics Export Pool #15', amount: '1.6', status: 'Active', yield: '4.3%', date: '2024-01-01' }
  ];

  if (!activeAccount || profileLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-gray-300">
            Monitor your investments and discover new opportunities
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/investor/pools')}
            className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Browse Pools
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{investmentStats.totalInvested} ETH</div>
            <p className="text-xs text-gray-400 mt-1">≈ $12,480 USD</p>
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
            <div className="text-2xl text-white font-bold">{investmentStats.activeInvestments}</div>
            <p className="text-xs text-gray-400 mt-1">Pools funded</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Pending Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-cyan-400 font-bold">{investmentStats.pendingReturns} ETH</div>
            <p className="text-xs text-gray-400 mt-1">Ready to claim</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-400 font-bold">{investmentStats.totalReturns} ETH</div>
            <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Investments */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Recent Investments</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/investor/investments')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInvestments.map((investment) => (
              <div key={investment.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all">
                <div className="flex-1">
                  <h3 className="text-white font-medium">{investment.poolName}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span>Amount: {investment.amount} ETH</span>
                    <span>Yield: {investment.yield}</span>
                    <span>Date: {investment.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    investment.status === 'Active' 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {investment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {recentInvestments.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">No investments yet</div>
              <Button 
                onClick={() => router.push('/investor/pools')}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Make Your First Investment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 h-auto p-4 flex-col gap-2"
              onClick={() => router.push('/investor/pools')}
            >
              <Eye className="w-6 h-6" />
              Browse Investment Pools
            </Button>
            <Button 
              variant="outline" 
              className="border-slate-600 text-gray-300 hover:bg-slate-700 h-auto p-4 flex-col gap-2"
              onClick={() => router.push('/investor/investments')}
            >
              <Target className="w-6 h-6" />
              Manage Portfolio
            </Button>
            <Button 
              variant="outline" 
              className="border-slate-600 text-gray-300 hover:bg-slate-700 h-auto p-4 flex-col gap-2"
              onClick={() => router.push('/investor/returns')}
            >
              <TrendingUp className="w-6 h-6" />
              Claim Returns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}