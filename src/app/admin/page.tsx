'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useAccessControl } from '@/hooks/useAccessControl';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';
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
  ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import Link from 'next/link';

export default function AdminDashboard() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { getUserRoles, isLoading: rolesLoading } = useAccessControl();
  const { getTotalValueLocked, getInvestorStats, isLoading: analyticsLoading } = usePlatformAnalytics();
  const router = useRouter();
  
  const [userRoles, setUserRoles] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Check admin role and redirect if not admin
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
      return;
    }

    if (isLoaded && isConnected && !rolesLoading && address) {
      getUserRoles(address).then((roles) => {
        setUserRoles(roles);
        if (!roles?.hasAdminRole) {
          router.push('/');
        }
      });
    }
  }, [isLoaded, isConnected, rolesLoading, address, getUserRoles, router]);

  // Load platform statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!isConnected || !userRoles?.hasAdminRole) return;
      
      try {
        setIsLoadingStats(true);
        const tvl = await getTotalValueLocked();
        // Mock data for now - will be replaced with real data from smart contracts
        setPlatformStats({
          totalValueLocked: tvl || '0',
          totalExporters: '12',
          totalInvestors: '48',
          activeInvoices: '8',
          activePools: '3',
          totalTransactions: '156'
        });
      } catch (error) {
        console.error('Error loading platform stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isConnected, userRoles, getTotalValueLocked]);

  // Don't render anything while checking authentication
  if (!isLoaded || !isConnected || rolesLoading || !userRoles?.hasAdminRole) {
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
      description: 'Grant admin, exporter, and investor roles',
      icon: Shield,
      href: '/admin/roles',
      color: 'bg-orange-500',
    },
  ];

  const stats = [
    {
      title: 'Total Value Locked',
      value: `$${Number(platformStats?.totalValueLocked || 0).toLocaleString()}`,
      description: 'Across all pools and invoices',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Exporters',
      value: platformStats?.totalExporters || '0',
      description: 'Verified and active',
      icon: Users,
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Investors',
      value: platformStats?.totalInvestors || '0',
      description: 'Registered investors',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active Invoices',
      value: platformStats?.activeInvoices || '0',
      description: 'Pending and funded',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Investment Pools',
      value: platformStats?.activePools || '0',
      description: 'Active funding pools',
      icon: BarChart3,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Total Transactions',
      value: platformStats?.totalTransactions || '0',
      description: 'All platform transactions',
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage platform operations and monitor key metrics
          </p>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {isLoadingStats ? '...' : stat.value}
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Card className="hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
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

        {/* Recent Activity placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform events and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">New exporter registered</p>
                  <p className="text-sm text-gray-600">ABC Trading Co. submitted registration documents</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Invoice approved</p>
                  <p className="text-sm text-gray-600">Invoice #INV-001 approved and added to Pool #2</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Pool fully funded</p>
                  <p className="text-sm text-gray-600">Pool #1 reached 100% funding, distributing to invoices</p>
                </div>
                <span className="text-sm text-gray-500">6 hours ago</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/admin/activity">
                  View All Activity
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}