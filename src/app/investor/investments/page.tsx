'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react';

export default function InvestmentsPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();

  // Mock data - will be replaced with real contract calls
  const investments = [
    {
      id: 1,
      poolId: 12,
      poolName: 'Southeast Asia Export Pool #12',
      investmentAmount: '2.1',
      investmentDate: '2024-01-05',
      status: 'Active',
      expectedReturn: '2.19',
      currentValue: '2.15',
      profitLoss: '+0.05',
      fundingProgress: 85,
      maturityDate: '2024-04-01',
      yield: '4.2%'
    },
    {
      id: 2,
      poolId: 8,
      poolName: 'Maritime Trade Pool #8',
      investmentAmount: '1.5',
      investmentDate: '2024-01-03',
      status: 'Completed',
      expectedReturn: '1.56',
      currentValue: '1.56',
      profitLoss: '+0.06',
      fundingProgress: 100,
      maturityDate: '2024-03-15',
      yield: '4.1%'
    },
    {
      id: 3,
      poolId: 15,
      poolName: 'Electronics Export Pool #15',
      investmentAmount: '1.6',
      investmentDate: '2024-01-01',
      status: 'Active',
      expectedReturn: '1.67',
      currentValue: '1.62',
      profitLoss: '+0.02',
      fundingProgress: 45,
      maturityDate: '2024-05-20',
      yield: '4.3%'
    }
  ];

  const totalStats = {
    totalInvested: investments.reduce((sum, inv) => sum + parseFloat(inv.investmentAmount), 0).toFixed(2),
    totalCurrentValue: investments.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0).toFixed(2),
    totalProfitLoss: investments.reduce((sum, inv) => sum + parseFloat(inv.profitLoss), 0).toFixed(3),
    activeInvestments: investments.filter(inv => inv.status === 'Active').length,
    completedInvestments: investments.filter(inv => inv.status === 'Completed').length
  };

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getProfitColor = (profit: string) => {
    const value = parseFloat(profit);
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

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
        <Button 
          onClick={() => router.push('/investor/pools')}
          className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
        >
          <Eye className="w-4 h-4 mr-2" />
          Browse New Pools
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total Invested</div>
            <div className="text-xl text-white font-bold">{totalStats.totalInvested} ETH</div>
            <div className="text-xs text-gray-400 mt-1">≈ ${(parseFloat(totalStats.totalInvested) * 2400).toFixed(0)} USD</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Current Value</div>
            <div className="text-xl text-white font-bold">{totalStats.totalCurrentValue} ETH</div>
            <div className="text-xs text-gray-400 mt-1">≈ ${(parseFloat(totalStats.totalCurrentValue) * 2400).toFixed(0)} USD</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400 mb-1">Total P&L</div>
            <div className={`text-xl font-bold ${getProfitColor(totalStats.totalProfitLoss)}`}>
              {totalStats.totalProfitLoss} ETH
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {(parseFloat(totalStats.totalProfitLoss) / parseFloat(totalStats.totalInvested) * 100).toFixed(2)}%
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
          <CardTitle className="text-white">Investment History</CardTitle>
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
                          <div className="text-white font-medium">{investment.investmentAmount} ETH</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Current Value</div>
                          <div className="text-cyan-400 font-medium">{investment.currentValue} ETH</div>
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

                      {investment.status === 'Active' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Pool Progress</span>
                            <span className="text-white">{investment.fundingProgress}%</span>
                          </div>
                          <Progress value={investment.fundingProgress} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Invested: {investment.investmentDate}</span>
                        <span>•</span>
                        <span>Maturity: {investment.maturityDate}</span>
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
                      
                      {investment.status === 'Completed' && (
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
          {investments.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-4">No investments yet</div>
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
    </div>
  );
}