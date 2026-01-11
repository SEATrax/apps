'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Shield,
  UserCheck,
  CreditCard,
  BarChart3,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { checkUserRoles, getAllOpenPools, getPool, isLoading: contractLoading } = useSEATrax();
  const router = useRouter();
  
  const [userRoles, setUserRoles] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin role and redirect if not admin
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
      return;
    }

    if (isLoaded && isConnected && !contractLoading && address) {
      checkUserRoles(address).then((roles) => {
        setUserRoles(roles);
        if (!roles?.isAdmin) {
          router.push('/');
        }
      }).catch((error) => {
        setError('Failed to check user roles');
        console.error('Error checking roles:', error);
      });
    }
  }, [isLoaded, isConnected, contractLoading, address, checkUserRoles, router]);

  // Load platform statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!isConnected || !userRoles?.isAdmin) return;
      
      try {
        setIsLoadingStats(true);
        setError(null);
        
        // Get real data from database
        const [
          { count: exportersCount },
          { count: investorsCount },
          { count: invoicesCount },
          { count: poolsCount }
        ] = await Promise.all([
          supabase.from('exporters').select('*', { count: 'exact', head: true }),
          supabase.from('investors').select('*', { count: 'exact', head: true }),
          supabase.from('invoice_metadata').select('*', { count: 'exact', head: true }),
          supabase.from('pool_metadata').select('*', { count: 'exact', head: true })
        ]);

        // Calculate TVL from all pools manually
        const poolIds = await getAllOpenPools();
        let tvl = 0n;
        
        // Get each pool's data and sum up amountInvested
        for (const poolId of poolIds) {
          try {
            const pool = await getPool(poolId);
            if (pool) {
              tvl += pool.amountInvested;
            }
          } catch (error) {
            console.error(`Failed to get pool ${poolId}:`, error);
          }
        }
        
        setPlatformStats({
          totalValueLocked: tvl || 0n,
          totalExporters: exportersCount || 0,
          totalInvestors: investorsCount || 0,
          activeInvoices: invoicesCount || 0,
          activePools: poolsCount || 0,
          totalTransactions: (exportersCount || 0) + (investorsCount || 0) + (invoicesCount || 0) // Rough estimate
        });
      } catch (error: any) {
        setError('Failed to load platform statistics');
        console.error('Error loading platform stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isConnected, userRoles, getAllOpenPools, getPool]);

  // Show loading screen while checking authentication
  if (!isLoaded || !isConnected || contractLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!userRoles?.isAdmin) {
    return null;
  }

  const quickActions = [
    {
      title: 'Verify Exporters',
      description: 'Review and approve new exporter registrations',
      icon: UserCheck,
      href: '/admin/exporters',
      color: 'bg-blue-500',
    },
    {
      title: 'Review Invoices', 
      description: 'Approve or reject invoice submissions',
      icon: FileText,
      href: '/admin/invoices',
      color: 'bg-green-500',
    },
    {
      title: 'Create Pool',
      description: 'Create new investment pools',
      icon: Plus,
      href: '/admin/pools/new',
      color: 'bg-purple-500',
    },
    {
      title: 'Manage Roles',
      description: 'Grant roles to wallet addresses for testing',
      icon: Shield,
      href: '/admin/roles',
      color: 'bg-amber-500',
    },
    {
      title: 'Manage Payments',
      description: 'Track invoice payments and confirmations',
      icon: CreditCard,
      href: '/admin/payments',
      color: 'bg-emerald-500',
    },
  ];

  const stats = [
    {
      title: 'Total Value Locked',
      value: formatCurrency(Number(platformStats?.totalValueLocked || 0n) / 100),
      description: 'Across all pools and invoices',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-600/20',
    },
    {
      title: 'Active Exporters',
      value: platformStats?.totalExporters?.toString() || '0',
      description: 'Verified and active',
      icon: Users,
      color: 'text-blue-400', 
      bgColor: 'bg-blue-600/20',
    },
    {
      title: 'Active Investors',
      value: platformStats?.totalInvestors?.toString() || '0',
      description: 'Registered investors',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
    },
    {
      title: 'Active Invoices',
      value: platformStats?.activeInvoices?.toString() || '0',
      description: 'Pending and funded',
      icon: FileText,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/20',
    },
    {
      title: 'Investment Pools',
      value: platformStats?.activePools?.toString() || '0',
      description: 'Active funding pools',
      icon: BarChart3,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/20',
    },
    {
      title: 'Platform Activity',
      value: platformStats?.totalTransactions?.toString() || '0',
      description: 'Total actions performed',
      icon: ArrowUpRight,
      color: 'text-pink-400',
      bgColor: 'bg-pink-600/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Manage platform operations and monitor key metrics
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-white mb-1">
                        {isLoadingStats ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-lg">Loading...</span>
                          </div>
                        ) : stat.value}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ArrowUpRight className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-gray-400">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {action.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest platform events and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-white">New exporter registered</p>
                  <p className="text-sm text-gray-400">ABC Trading Co. submitted registration documents</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-white">Invoice approved</p>
                  <p className="text-sm text-gray-400">Invoice #INV-001 approved and added to Pool #2</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-white">Pool fully funded</p>
                  <p className="text-sm text-gray-400">Pool #1 reached 100% funding, distributing to invoices</p>
                </div>
                <span className="text-sm text-gray-500">6 hours ago</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" className="border-slate-600 text-gray-300 hover:bg-slate-700" asChild>
                <Link href="/admin/pools">
                  View All Pools
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}