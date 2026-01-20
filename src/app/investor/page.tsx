'use client';

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

  // Fetch portfolio stats from blockchain
  useEffect(() => {
    const fetchPortfolioStats = async () => {
      if (!activeAccount?.address) return;

      try {
        setLoading(true);

        // Get all pools this investor has invested in
        const poolIds = await getInvestorPools(activeAccount.address);

        if (poolIds.length === 0) {
          // No investments yet
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
        const investments: any[] = [];

        // Fetch details for each pool
        for (const poolId of poolIds) {
          try {
            const [pool, investment, fundingPercentage] = await Promise.all([
              getPool(poolId),
              getInvestment(poolId, activeAccount.address),
              getPoolFundingPercentage(poolId)
            ]);

            if (pool && investment && investment.amount > 0n) {
              totalInvestedWei += investment.amount;

              // Check pool status
              const isCompleted = pool.status === 2; // COMPLETED
              const isFunded = pool.status === 1; // FUNDED

              if (isCompleted || isFunded) {
                if (isCompleted) {
                  // Calculate 4% yield for completed pools
                  const yieldAmount = (investment.amount * 4n) / 100n;
                  totalReturnWei += yieldAmount;
                  completedCount++;
                }
              } else {
                activeCount++;
              }

              // Build investment data for recent investments list
              investments.push({
                id: Number(poolId),
                poolName: pool.name || `Pool #${poolId.toString()}`,
                amount: Number(investment.amount) / 1e18,
                status: isCompleted ? 'Completed' : (isFunded ? 'Funded' : 'Active'),
                fundingProgress: fundingPercentage / 100, // From basis points
                poolId: poolId,
                timestamp: Number(investment.timestamp),
                expectedYield: '4.0%', // Default yield for SEATrax pools
                investedDate: new Date(Number(investment.timestamp) * 1000)
              });
            }
          } catch (poolError) {
            console.error(`Failed to fetch pool ${poolId}:`, poolError);
          }
        }

        // Sort investments by timestamp (most recent first) and take top 3
        investments.sort((a, b) => b.timestamp - a.timestamp);
        const recentThree = investments.slice(0, 3);

        // Convert Wei to ETH for display
        const totalInvestedETH = Number(totalInvestedWei) / 1e18;
        const totalReturnETH = Number(totalReturnWei) / 1e18;
        const ethPrice = 3000; // Approximate price for testing

        setPortfolioStats({
          totalInvested: totalInvestedETH * ethPrice,
          totalValue: (totalInvestedETH + totalReturnETH) * ethPrice,
          totalReturn: totalReturnETH * ethPrice,
          activeInvestments: activeCount + (poolIds.length - activeCount - completedCount)
        });

        setRecentInvestments(recentThree);
      } catch (error) {
        console.error('Failed to fetch portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioStats();
  }, [activeAccount, getInvestorPools, getPool, getInvestment, getPoolFundingPercentage]);

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

      {/* Enhanced Profile Summary for existing users */}
      {profile && (
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