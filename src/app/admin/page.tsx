'use client';

import { useState, useEffect } from 'react';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
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
  Loader2,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { 
    isConnected, 
    address, 
    connect, 
    switchToLiskSepolia, 
    isCorrectNetwork, 
    isMetaMaskInstalled,
    error: walletError 
  } = useMetaMaskAdmin();
  const { checkUserRoles, getAllOpenPools, getPool, isLoading: contractLoading } = useSEATrax();
  const router = useRouter();
  
  const [userRoles, setUserRoles] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [checkingRole, setCheckingRole] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to connect MetaMask
  const handleConnectWallet = async () => {
    const success = await connect();
    if (!success) {
      console.error('Failed to connect MetaMask');
    }
  };

  // Check admin role when MetaMask connected
  useEffect(() => {
    // Don't check role if not connected or wrong network
    if (!isMetaMaskInstalled || !isCorrectNetwork || !isConnected || !address) {
      setCheckingRole(false);
      return;
    }

    // Check admin role
    setCheckingRole(true);
    
    checkUserRoles(address).then((roles) => {
      setUserRoles(roles);
      setCheckingRole(false);
      
      if (!roles?.isAdmin) {
        setAccessDenied(true);
      }
    }).catch(err => {
      console.error('Error checking roles:', err);
      setCheckingRole(false);
      setAccessDenied(true);
    });
  }, [isMetaMaskInstalled, isCorrectNetwork, isConnected, address, checkUserRoles]);

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

  // Show loading ONLY while checking roles or loading stats
  if (checkingRole || (userRoles?.isAdmin && isLoadingStats)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">
            {checkingRole && 'Checking admin permissions...'}
            {!checkingRole && isLoadingStats && 'Loading dashboard...'}
          </div>
        </div>
      </div>
    );
  }

  // MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">MetaMask Not Installed</p>
              <p className="text-sm">Admin dashboard requires MetaMask wallet. Please install MetaMask extension first.</p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              className="bg-cyan-600"
            >
              Install MetaMask
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Wrong network
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">Wrong Network</p>
              <p className="text-sm">Please switch to Lisk Sepolia Testnet (Chain ID: 4202)</p>
              <p className="text-sm mt-1">Current address: <code className="bg-orange-100 px-2 py-1 rounded">{address}</code></p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={switchToLiskSepolia} className="bg-cyan-600">
              Switch to Lisk Sepolia
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <Wallet className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">MetaMask Wallet Not Connected</p>
              <p className="text-sm">Please connect your MetaMask wallet to access admin dashboard.</p>
              {walletError && (
                <p className="text-sm mt-2 text-red-600">Error: {walletError}</p>
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleConnectWallet} className="bg-cyan-600">
              <Wallet className="h-4 w-4 mr-2" />
              Connect MetaMask
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Access denied - not admin
  if (accessDenied || !userRoles?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold mb-2">Access Denied - Admin Role Required</p>
              <p className="text-sm">Your address: <code className="bg-red-100 px-2 py-1 rounded">{address}</code></p>
              <p className="text-sm mt-2">Run this command to grant admin role:</p>
              <code className="block bg-red-100 p-2 rounded mt-1 text-xs break-all">
                NEW_ADMIN_ADDRESS={address} npx hardhat run scripts/grant-admin.js --network lisk-sepolia
              </code>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-cyan-600">
              Retry After Granting Role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
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
      title: 'Grant Admin Role',
      description: 'Grant admin role to new addresses',
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