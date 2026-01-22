'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useInvestorProfile } from '@/hooks/useInvestorProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TrendingUp, DollarSign, Target, ArrowRight, Eye, PlusCircle, BarChart3, CheckCircle, Pencil, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { formatETH, formatUSD, formatPercentage, formatDateRelative, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';

export default function InvestorDashboard() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const { getInvestorPools, getPool, getInvestment, checkUserRoles, getPoolFundingPercentage } = useSEATrax();
  const { profile, loading: profileLoading, updateProfile, refetch } = useInvestorProfile();

  const [portfolioStats, setPortfolioStats] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalReturn: 0,
    activeInvestments: 0
  });
  const [recentInvestments, setRecentInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Blockchain status
  const [isBlockchainVerified, setIsBlockchainVerified] = useState(false);

  // Get user name or fallback
  const getUserName = () => {
    if (profile?.name) return profile.name;
    if (activeAccount?.address) return `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}`;
    return 'Investor';
  };

  // Check blockchain verification status
  useEffect(() => {
    const checkBlockchainStatus = async () => {
      if (!activeAccount?.address) return;

      try {
        const roles = await checkUserRoles(activeAccount.address);
        setIsBlockchainVerified(roles.isInvestor);
      } catch (error) {
        console.error('Failed to check blockchain status:', error);
      }
    };

    checkBlockchainStatus();
  }, [activeAccount, checkUserRoles]);

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  // Populate edit form when profile loads or dialog opens
  useEffect(() => {
    if (profile && isEditDialogOpen) {
      setEditFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile, isEditDialogOpen]);

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!editFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: editFormData.name.trim(),
        email: editFormData.email.trim() || undefined,
        phone: editFormData.phone.trim() || undefined,
        address: editFormData.address.trim() || undefined
      });

      toast.success('Profile updated successfully');
      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch portfolio stats from Supabase cache
  useEffect(() => {
    const fetchPortfolioStats = async () => {
      if (!activeAccount?.address) return;

      try {
        setLoading(true);

        // Dynamically import helper
        const { getInvestorPortfolio } = await import('@/lib/supabase');
        const portfolio = await getInvestorPortfolio(activeAccount.address);

        if (!portfolio || portfolio.length === 0) {
          setPortfolioStats({
            totalInvested: 0,
            totalValue: 0,
            totalReturn: 0,
            activeInvestments: 0
          });
          setRecentInvestments([]);
          return;
        }

        let totalInvestedWei = 0n;
        let totalReturnWei = 0n;
        let activeCount = 0;
        let completedCount = 0;

        // Track unique pools to report "Active Investments" as count of pools, not transactions
        // Wait, "Active Investments" could mean active *positions*.
        // Detailed logic:
        // - Single pool can have multiple investments? 
        //   Our `investments` table is per-transaction?
        //   No, `investments` table has `pool_id` and `amount`.
        //   The `createInvestment` inserts a NEW row every time? YES.
        //   But `getInvestment` on contract returns AGGREGATED amount.
        //   The `investments` table should ideally reflect the aggregation OR we sum it up.
        //   The `getInvestorPortfolio` returns ALL rows.
        //   So we need to group by pool_id to simulate "positions".

        // Group investments by pool
        const poolMap = new Map<number, {
          amount: bigint,
          pool: any,
          latestTimestamp: number,
          fundingPercentage: number /// We'll need to fetch this or approx
        }>();

        for (const record of portfolio) {
          const pid = record.pool_id;
          const amt = BigInt(record.amount); // amount is string in DB
          const current = poolMap.get(pid);

          if (current) {
            current.amount += amt;
            if (record.timestamp > current.latestTimestamp) {
              current.latestTimestamp = record.timestamp;
            }
          } else {
            // Pool metadata is joined
            poolMap.set(pid, {
              amount: amt,
              pool: record.pool_metadata || { status: 'OPEN', name: `Pool #${pid}` },
              latestTimestamp: record.timestamp,
              fundingPercentage: 0 // Placeholder
            });
          }
        }

        // Calculate stats from grouped positions
        const processedInvestments = [];

        for (const [pid, data] of poolMap.entries()) {
          const poolStatus = data.pool.status || 'OPEN';
          // Map status string/enum to our logic
          // pool_metadata status is text: 'Open', 'Funded', 'Completed'
          // Or 0, 1, 2, 3? Schema says 'text'. Backfill uses strings?
          // Let's assume text.

          const isCompleted = poolStatus === 'COMPLETED';
          const isFunded = poolStatus === 'FUNDED';

          totalInvestedWei += data.amount;

          if (isCompleted || isFunded) {
            if (isCompleted) {
              // Mock 4% yield
              const yieldAmount = (data.amount * 4n) / 100n;
              totalReturnWei += yieldAmount;
              completedCount++;
            }
          } else {
            activeCount++;
          }

          // Don't push to processedInvestments here - we use raw portfolio for list
        }

        const totalInvestedETH = Number(totalInvestedWei) / 1e18;
        const totalReturnETH = Number(totalReturnWei) / 1e18;
        const ethPrice = 3000;

        setPortfolioStats({
          totalInvested: totalInvestedETH * ethPrice,
          totalValue: (totalInvestedETH + totalReturnETH) * ethPrice,
          totalReturn: totalReturnETH * ethPrice,
          activeInvestments: activeCount + (poolMap.size - activeCount - completedCount)
        });

        // Recent Investments - Show individual transactions
        const recentTransactions = portfolio.map((record) => {
          const pid = record.pool_id;
          const amtWei = BigInt(record.amount);
          const poolMeta = record.pool_metadata || { status: 'OPEN', name: `Pool #${pid}` };
          // Helper to normalize status string if case differs
          const poolStatusRaw = String(poolMeta.status || 'OPEN').toUpperCase();

          const isCompleted = poolStatusRaw === 'COMPLETED';
          const isFunded = poolStatusRaw === 'FUNDED';
          // If 'status' is simply "Open" or 0 from contract, treat as Active

          const amtEth = Number(amtWei) / 1e18;

          return {
            id: record.id,
            poolName: poolMeta.name,
            amount: amtEth,
            status: isCompleted ? 'Completed' : (isFunded ? 'Funded' : 'Active'),
            fundingProgress: (isCompleted || isFunded) ? 1 : (Number(poolMeta.amount_invested || 0) / Number(poolMeta.total_loan_amount || 1)),
            poolId: pid,
            timestamp: record.timestamp,
            expectedYield: '4.0%',
            investedDate: new Date(record.timestamp * 1000)
          };
        });

        recentTransactions.sort((a, b) => b.timestamp - a.timestamp);
        const recentFive = recentTransactions.slice(0, 5); // Show top 5

        setRecentInvestments(recentFive);

      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioStats();
  }, [activeAccount]);

  // Removed blocking loader to allow Skeleton UI
  // if (loading || profileLoading) { return ... }

  return (
    <div className="space-y-6">
      {/* Profile Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your investor profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Full Name *</Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter your full name"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="your@email.com"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
              <Input
                id="phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-300">Address</Label>
              <Input
                id="address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Enter your address"
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-slate-700 text-gray-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 bg-slate-800" />
              <Skeleton className="h-4 w-96 bg-slate-800" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl lg:text-3xl text-white mb-2">
                Welcome back, {getUserName()}
              </h1>
              <p className="text-gray-300">
                {profile?.name ? 'Track your investments and discover new opportunities' : 'Complete your profile to get started'}
              </p>
            </>
          )}
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
      {!profileLoading && !profile && activeAccount && (
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

      {/* Enhanced Profile Summary for existing users or Skeleton */}
      {profileLoading ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full bg-slate-800" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48 bg-slate-800" />
                <Skeleton className="h-4 w-full max-w-md bg-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (profile && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/30 to-teal-400/30 rounded-full flex items-center justify-center border border-cyan-500/30">
                  <div className="text-cyan-400 font-bold text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold text-lg">{profile.name}</h3>
                    {isBlockchainVerified && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-2">
                    {profile.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-cyan-400">
                      <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setIsEditDialogOpen(true)}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Portfolio Overview Cards - With Loading Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24 bg-slate-800 mb-1" />
            ) : (
              <div className="text-2xl text-cyan-400 font-bold">${portfolioStats.totalInvested.toLocaleString()}</div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {loading ? <Skeleton className="h-3 w-32 bg-slate-800" /> : `Across ${portfolioStats.activeInvestments} pools`}
            </p>
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
            {loading ? <Skeleton className="h-8 w-12 bg-slate-800 mb-1" /> : (
              <div className="text-2xl text-white font-bold">{portfolioStats.activeInvestments}</div>
            )}
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
            {loading ? <Skeleton className="h-8 w-24 bg-slate-800 mb-1" /> : (
              <div className="text-2xl text-green-400 font-bold">${portfolioStats.totalReturn.toLocaleString()}</div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {loading ? <Skeleton className="h-3 w-16 bg-slate-800" /> : (
                portfolioStats.totalInvested > 0 ?
                  `${((portfolioStats.totalReturn / portfolioStats.totalInvested) * 100).toFixed(2)}% return` :
                  "0.00% return"
              )}
            </p>
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
            {loading ? <Skeleton className="h-8 w-32 bg-slate-800 mb-1" /> : (
              <div className="text-2xl text-white font-bold">${portfolioStats.totalValue.toLocaleString()}</div>
            )}
            <p className="text-xs text-green-400 mt-1">
              {loading ? <Skeleton className="h-3 w-24 bg-slate-800" /> : `+$${portfolioStats.totalReturn.toLocaleString()} profit`}
            </p>
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
            {loading ? (
              // Skeleton List
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-48 bg-slate-700" />
                        <Skeleton className="h-5 w-20 bg-slate-700" />
                      </div>
                      <div className="flex justify-between mt-2">
                        <Skeleton className="h-4 w-24 bg-slate-700" />
                        <Skeleton className="h-4 w-24 bg-slate-700" />
                        <Skeleton className="h-4 w-24 bg-slate-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentInvestments.length > 0 ? (
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
                              <div className="text-cyan-400 font-medium">{formatUSD(investment.amount, 3000)}</div>
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
                {loading ? <Skeleton className="h-5 w-16 bg-slate-800" /> : <span className="text-green-400 font-medium">4.0%</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Return</span>
                {loading ? <Skeleton className="h-5 w-16 bg-slate-800" /> : (
                  <span className="text-cyan-400 font-medium">
                    {portfolioStats.totalInvested > 0 ? ((portfolioStats.totalReturn / portfolioStats.totalInvested) * 100).toFixed(2) : "0.00"}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Claimable Returns</span>
                {loading ? <Skeleton className="h-5 w-24 bg-slate-800" /> : <span className="text-yellow-400 font-medium">${portfolioStats.totalReturn.toLocaleString()}</span>}
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
                {loading ? <Skeleton className="h-5 w-8 bg-slate-800" /> : <span className="text-white font-medium">{portfolioStats.activeInvestments}</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Investments</span>
                {loading ? <Skeleton className="h-5 w-8 bg-slate-800" /> : <span className="text-cyan-400 font-medium">{portfolioStats.activeInvestments}</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Portfolio Value</span>
                {loading ? <Skeleton className="h-5 w-32 bg-slate-800" /> : <span className="text-white font-medium">${portfolioStats.totalValue.toLocaleString()}</span>}
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