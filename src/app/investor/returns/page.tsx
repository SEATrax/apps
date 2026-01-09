'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ReturnsPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const [claimingReturns, setClaimingReturns] = useState<number | null>(null);

  // Mock data - will be replaced with real contract calls
  const claimableReturns = [
    {
      id: 1,
      poolId: 8,
      poolName: 'Maritime Trade Pool #8',
      investmentAmount: '1.5',
      totalReturn: '1.56',
      profit: '0.06',
      yieldRate: '4.1%',
      maturityDate: '2024-03-15',
      status: 'Ready to Claim',
      completedDate: '2024-03-20'
    },
    {
      id: 2,
      poolId: 5,
      poolName: 'Tech Components Pool #5',
      investmentAmount: '0.8',
      totalReturn: '0.83',
      profit: '0.03',
      yieldRate: '4.0%',
      maturityDate: '2024-02-28',
      status: 'Ready to Claim',
      completedDate: '2024-03-01'
    }
  ];

  const claimedReturns = [
    {
      id: 3,
      poolId: 3,
      poolName: 'Southeast Trade Pool #3',
      investmentAmount: '2.0',
      totalReturn: '2.08',
      profit: '0.08',
      yieldRate: '4.2%',
      claimedDate: '2024-02-15',
      transactionHash: '0xabc123...'
    },
    {
      id: 4,
      poolId: 1,
      poolName: 'Electronics Export Pool #1',
      investmentAmount: '1.2',
      totalReturn: '1.25',
      profit: '0.05',
      yieldRate: '4.1%',
      claimedDate: '2024-01-20',
      transactionHash: '0xdef456...'
    }
  ];

  const totalStats = {
    totalClaimable: claimableReturns.reduce((sum, ret) => sum + parseFloat(ret.totalReturn), 0).toFixed(3),
    totalClaimed: claimedReturns.reduce((sum, ret) => sum + parseFloat(ret.totalReturn), 0).toFixed(3),
    totalProfit: [...claimableReturns, ...claimedReturns].reduce((sum, ret) => sum + parseFloat(ret.profit), 0).toFixed(3)
  };

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  const handleClaimReturn = async (returnId: number) => {
    setClaimingReturns(returnId);
    
    try {
      // TODO: Implement real claim via PoolFundingManager.claimInvestorReturns
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      toast.success('Returns claimed successfully! Funds transferred to your wallet.');
      // In real implementation, refresh data here
    } catch (error) {
      toast.error('Failed to claim returns. Please try again.');
    } finally {
      setClaimingReturns(null);
    }
  };

  const handleClaimAll = async () => {
    if (claimableReturns.length === 0) return;
    
    setClaimingReturns(0); // Use 0 for "claim all"
    
    try {
      // TODO: Implement batch claim functionality
      await new Promise(resolve => setTimeout(resolve, 3000)); // Mock delay
      
      toast.success(`All returns claimed! ${totalStats.totalClaimable} ETH transferred to your wallet.`);
    } catch (error) {
      toast.error('Failed to claim all returns. Please try again.');
    } finally {
      setClaimingReturns(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">Returns & Claims</h1>
          <p className="text-gray-300">
            Claim your investment returns and track earnings history
          </p>
        </div>
        {claimableReturns.length > 0 && (
          <Button 
            onClick={handleClaimAll}
            disabled={claimingReturns !== null}
            className="bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-green-500/50"
          >
            {claimingReturns === 0 ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Claiming All...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Claim All Returns
              </>
            )}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ready to Claim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-400 font-bold">{totalStats.totalClaimable} ETH</div>
            <p className="text-xs text-gray-400 mt-1">≈ ${(parseFloat(totalStats.totalClaimable) * 2400).toFixed(0)} USD</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Already Claimed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-cyan-400 font-bold">{totalStats.totalClaimed} ETH</div>
            <p className="text-xs text-gray-400 mt-1">≈ ${(parseFloat(totalStats.totalClaimed) * 2400).toFixed(0)} USD</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{totalStats.totalProfit} ETH</div>
            <p className="text-xs text-gray-400 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Claimable Returns */}
      {claimableReturns.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-green-400" />
                Ready to Claim
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {claimableReturns.length} Available
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claimableReturns.map((returnItem) => (
                <Card key={returnItem.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium text-lg">{returnItem.poolName}</h3>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {returnItem.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Investment</div>
                            <div className="text-white font-medium">{returnItem.investmentAmount} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Total Return</div>
                            <div className="text-cyan-400 font-medium">{returnItem.totalReturn} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Profit</div>
                            <div className="text-green-400 font-medium">+{returnItem.profit} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Yield</div>
                            <div className="text-white font-medium">{returnItem.yieldRate}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Completed: {returnItem.completedDate}</span>
                          <span>•</span>
                          <span>Matured: {returnItem.maturityDate}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleClaimReturn(returnItem.id)}
                        disabled={claimingReturns !== null}
                        className="bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-green-500/50"
                      >
                        {claimingReturns === returnItem.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Claiming...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Claim {returnItem.totalReturn} ETH
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claimed Returns History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Claim History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimedReturns.length > 0 ? (
            <div className="space-y-4">
              {claimedReturns.map((returnItem) => (
                <Card key={returnItem.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium text-lg">{returnItem.poolName}</h3>
                          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                            Claimed
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Investment</div>
                            <div className="text-white font-medium">{returnItem.investmentAmount} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Total Return</div>
                            <div className="text-cyan-400 font-medium">{returnItem.totalReturn} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Profit</div>
                            <div className="text-green-400 font-medium">+{returnItem.profit} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Yield</div>
                            <div className="text-white font-medium">{returnItem.yieldRate}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Claimed: {returnItem.claimedDate}</span>
                          <span>•</span>
                          <span>TX: {returnItem.transactionHash}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://sepolia-blockscout.lisk.com/tx/${returnItem.transactionHash}`, '_blank')}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        View Transaction
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-4">No returns claimed yet</div>
              <Button 
                onClick={() => router.push('/investor/investments')}
                variant="outline"
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
              >
                View Your Investments
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State for no claimable returns */}
      {claimableReturns.length === 0 && claimedReturns.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-400 mb-4">No returns available yet</div>
            <p className="text-sm text-gray-500 mb-6">
              Your investment returns will appear here once pools mature and are ready for claim.
            </p>
            <Button 
              onClick={() => router.push('/investor/pools')}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
            >
              Start Investing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}