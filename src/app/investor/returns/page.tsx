'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Return data structure
interface ReturnData {
  id: number;
  poolId: bigint;
  poolName: string;
  investmentAmount: string;
  totalReturn: string;
  profit: string;
  yieldRate: string;
  completedDate: string;
  status: 'Ready to Claim' | 'Claimed';
  returnsClaimed: boolean;
  transactionHash?: string;
}

export default function ReturnsPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { claimReturns, getInvestorPools, getInvestment, getPool } = useSEATrax();

  const [claimableReturns, setClaimableReturns] = useState<ReturnData[]>([]);
  const [claimedReturns, setClaimedReturns] = useState<ReturnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingReturns, setClaimingReturns] = useState<number | null>(null);

  // Calculate stats from real data
  const totalStats = {
    totalClaimable: claimableReturns.reduce((sum, ret) => sum + parseFloat(ret.totalReturn), 0).toFixed(4),
    totalClaimed: claimedReturns.reduce((sum, ret) => sum + parseFloat(ret.totalReturn), 0).toFixed(4),
    totalProfit: [...claimableReturns, ...claimedReturns].reduce((sum, ret) => sum + parseFloat(ret.profit), 0).toFixed(4)
  };

  // Fetch returns data from blockchain
  const fetchReturns = useCallback(async (isRefresh = false) => {
    if (!activeAccount?.address) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Get all pools this investor has invested in
      const poolIds = await getInvestorPools(activeAccount.address);

      if (poolIds.length === 0) {
        setClaimableReturns([]);
        setClaimedReturns([]);
        return;
      }

      const claimable: ReturnData[] = [];
      const claimed: ReturnData[] = [];

      // Check each pool for returns
      for (let i = 0; i < poolIds.length; i++) {
        const poolId = poolIds[i];

        try {
          const [pool, investment] = await Promise.all([
            getPool(poolId),
            getInvestment(poolId, activeAccount.address)
          ]);

          // Only process completed pools (status === 2)
          if (pool && investment && investment.amount > 0n && pool.status === 2) {
            const investmentAmountETH = Number(investment.amount) / 1e18;
            const yieldRate = 0.04; // 4%
            const profitETH = investmentAmountETH * yieldRate;
            const totalReturnETH = investmentAmountETH + profitETH;

            const returnData: ReturnData = {
              id: i + 1,
              poolId: poolId,
              poolName: pool.name || `Pool #${poolId.toString()}`,
              investmentAmount: investmentAmountETH.toFixed(4),
              totalReturn: totalReturnETH.toFixed(4),
              profit: profitETH.toFixed(4),
              yieldRate: '4.0%',
              completedDate: pool.endDate
                ? new Date(Number(pool.endDate) * 1000).toLocaleDateString()
                : 'Unknown',
              status: investment.returnsClaimed ? 'Claimed' : 'Ready to Claim',
              returnsClaimed: investment.returnsClaimed
            };

            if (investment.returnsClaimed) {
              claimed.push(returnData);
            } else {
              claimable.push(returnData);
            }
          }
        } catch (poolError) {
          console.error(`Failed to fetch pool ${poolId}:`, poolError);
        }
      }

      setClaimableReturns(claimable);
      setClaimedReturns(claimed);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast.error('Failed to load returns data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount, getInvestorPools, getInvestment, getPool]);

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }

    fetchReturns();
  }, [activeAccount, router, fetchReturns]);

  const handleClaimReturn = async (returnData: ReturnData) => {
    setClaimingReturns(returnData.id);

    try {
      // HANDLE MOCK / SIMULATION
      if (returnData.poolId === 9999n) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake network delay
        toast.success('Returns claimed successfully! (Simulated)');

        // Move from claimable to claimed locally
        setClaimableReturns(prev => prev.filter(p => p.id !== 9999));
        setClaimedReturns(prev => [...prev, { ...returnData, status: 'Claimed', returnsClaimed: true }]);
        return;
      }

      // Call smart contract claimReturns function
      const result = await claimReturns(returnData.poolId);

      if (result.success) {
        toast.success('Returns claimed successfully! Funds transferred to your wallet.');
        // Refresh data
        setTimeout(() => {
          fetchReturns(true);
        }, 2000);
      } else {
        throw new Error(result.error || 'Claim failed');
      }
    } catch (error: any) {
      console.error('Claim failed:', error);
      toast.error(error.message || 'Failed to claim returns. Please try again.');
    } finally {
      setClaimingReturns(null);
    }
  };

  const handleClaimAll = async () => {
    if (claimableReturns.length === 0) return;

    setClaimingReturns(0); // Use 0 for "claim all"

    try {
      // Claim returns for each pool
      for (const returnData of claimableReturns) {
        const result = await claimReturns(returnData.poolId);
        if (!result.success) {
          throw new Error(result.error || `Failed to claim pool ${returnData.poolId}`);
        }
      }

      toast.success(`All returns claimed! ${totalStats.totalClaimable} ETH transferred to your wallet.`);

      // Refresh data
      setTimeout(() => {
        fetchReturns(true);
      }, 2000);
    } catch (error: any) {
      console.error('Claim all failed:', error);
      toast.error(error.message || 'Failed to claim all returns. Please try again.');
    } finally {
      setClaimingReturns(null);
    }
  };

  // Render helpers for stats (USD Primary, ETH Secondary)
  const formatUSD = (ethValue: string) => {
    const usd = parseFloat(ethValue) * 3000;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usd);
  };

  const renderPrimaryStat = (ethValue: string, colorClass: string) =>
    loading ? <Skeleton className="h-8 w-40 bg-slate-800" /> : <div className={`text-2xl font-bold ${colorClass}`}>{formatUSD(ethValue)}</div>;

  const renderSecondaryStat = (ethValue: string) =>
    loading ? <Skeleton className="h-3 w-24 mt-1 bg-slate-800" /> : <p className="text-xs text-gray-400 mt-1">{ethValue} ETH</p>;

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
        <div className="flex gap-2">
          {/* DEV ONLY: Simulation Button */}
          <Button
            onClick={() => {
              const mockItem: ReturnData = {
                id: 9999,
                poolId: 9999n,
                poolName: "Simulated High Yield Pool (Test)",
                investmentAmount: "1.5000",
                totalReturn: "1.5600",
                profit: "0.0600",
                yieldRate: "4.0%",
                completedDate: new Date().toLocaleDateString(),
                status: 'Ready to Claim',
                returnsClaimed: false
              };
              setClaimableReturns(prev => [...prev, mockItem]);
              toast.info('Test data injected');
            }}
            variant="ghost"
            className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Simulate
          </Button>

          <Button
            onClick={() => fetchReturns(true)}
            disabled={refreshing || loading}
            variant="outline"
            className="border-slate-700 text-gray-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {
            (claimableReturns.length > 0 || loading) && (
              <Button
                onClick={handleClaimAll}
                disabled={claimingReturns !== null || loading || claimableReturns.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-green-500/50"
              >
                {claimingReturns === 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming All...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Claim All Returns
                  </>
                )}
              </Button>
            )
          }
        </div >
      </div >

      {/* Summary Cards */}
      < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ready to Claim
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPrimaryStat(totalStats.totalClaimable, "text-green-400")}
            {renderSecondaryStat(totalStats.totalClaimable)}
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
            {renderPrimaryStat(totalStats.totalClaimed, "text-cyan-400")}
            {renderSecondaryStat(totalStats.totalClaimed)}
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
            {renderPrimaryStat(totalStats.totalProfit, "text-white")}
            <div className="flex items-center gap-2">
              {renderSecondaryStat(totalStats.totalProfit)}
              {!loading && <span className="text-xs text-slate-600">•</span>}
              {!loading && <p className="text-xs text-gray-500 mt-1">Lifetime</p>}
            </div>
          </CardContent>
        </Card>
      </div >

      {/* Claimable Returns */}
      {
        (loading || claimableReturns.length > 0) && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-green-400" />
                  Ready to Claim
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {loading ? <Skeleton className="h-4 w-8 bg-green-900" /> : claimableReturns.length} Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  // Skeleton List
                  [1].map((i) => (
                    <Card key={i} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-48 bg-slate-700" />
                            <Skeleton className="h-6 w-24 bg-slate-700" />
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-10 w-full bg-slate-700" />
                            <Skeleton className="h-10 w-full bg-slate-700" />
                            <Skeleton className="h-10 w-full bg-slate-700" />
                            <Skeleton className="h-10 w-full bg-slate-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  claimableReturns.map((returnItem) => (
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
                                <div className="text-white font-medium">{formatUSD(returnItem.investmentAmount)}</div>
                                <div className="text-xs text-gray-500">{returnItem.investmentAmount} ETH</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Total Return</div>
                                <div className="text-cyan-400 font-medium">{formatUSD(returnItem.totalReturn)}</div>
                                <div className="text-xs text-gray-500">{returnItem.totalReturn} ETH</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Profit</div>
                                <div className="text-green-400 font-medium">+{formatUSD(returnItem.profit)}</div>
                                <div className="text-xs text-gray-500">+{returnItem.profit} ETH</div>
                              </div>
                              <div>
                                <div className="text-gray-400">Yield</div>
                                <div className="text-white font-medium">{returnItem.yieldRate}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Completed: {returnItem.completedDate}</span>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleClaimReturn(returnItem)}
                            disabled={claimingReturns !== null}
                            className="bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:shadow-lg hover:shadow-green-500/50"
                          >
                            {claimingReturns === returnItem.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 mr-2" />
                                Claim {formatUSD(returnItem.totalReturn)}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Claimed Returns History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Claim History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <Skeleton className="h-6 w-1/3 bg-slate-700" />
                      <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="h-8 w-full bg-slate-700" />
                        <Skeleton className="h-8 w-full bg-slate-700" />
                        <Skeleton className="h-8 w-full bg-slate-700" />
                        <Skeleton className="h-8 w-full bg-slate-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : claimedReturns.length > 0 ? (
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
                            <div className="text-white font-medium">{formatUSD(returnItem.investmentAmount)}</div>
                            <div className="text-xs text-gray-500">{returnItem.investmentAmount} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Total Return</div>
                            <div className="text-cyan-400 font-medium">{formatUSD(returnItem.totalReturn)}</div>
                            <div className="text-xs text-gray-500">{returnItem.totalReturn} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Profit</div>
                            <div className="text-green-400 font-medium">+{formatUSD(returnItem.profit)}</div>
                            <div className="text-xs text-gray-500">+{returnItem.profit} ETH</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Yield</div>
                            <div className="text-white font-medium">{returnItem.yieldRate}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Completed: {returnItem.completedDate}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/investor/pools/${returnItem.poolId}`)}
                        className="border-slate-600 text-gray-300 hover:bg-slate-700"
                      >
                        View Pool
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
      {
        !loading && claimableReturns.length === 0 && claimedReturns.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 mb-4">No returns available yet</div>
              <p className="text-sm text-gray-500 mb-6">
                Your investment returns will appear here once pools are completed and ready for claim.
              </p>
              <Button
                onClick={() => router.push('/investor/pools')}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
              >
                Start Investing
              </Button>
            </CardContent>
          </Card>
        )
      }

      {/* Blockchain Status */}
      <Card className="bg-slate-900/50 border-slate-800 border-cyan-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="text-cyan-400 font-medium">Live Blockchain Data</div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Returns data is fetched directly from the SEATrax smart contract. Claiming transfers funds to your connected wallet.
          </p>
        </CardContent>
      </Card>
    </div >
  );
}