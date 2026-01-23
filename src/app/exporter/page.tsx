'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, TrendingUp, Clock, File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to convert status number to label
const getStatusLabel = (status: number): 'pending' | 'approved' | 'funded' | 'withdrawn' | 'paid' => {
  if (status === INVOICE_STATUS.PENDING) return 'pending';
  if (status === INVOICE_STATUS.APPROVED || status === INVOICE_STATUS.IN_POOL) return 'approved';
  if (status === INVOICE_STATUS.FUNDED) return 'funded';
  if (status === INVOICE_STATUS.WITHDRAWN) return 'withdrawn';
  if (status === INVOICE_STATUS.PAID || status === INVOICE_STATUS.COMPLETED) return 'paid';
  return 'pending';
};

interface DashboardStats {
  totalInvoices: number;
  pendingInvoices: number;
  fundedInvoices: number;
  totalFunded: number;
  totalWithdrawn: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  importerCompany: string;
  amount: number;
  status: 'pending' | 'approved' | 'funded' | 'withdrawn' | 'paid';
  createdAt: string;
  fundedPercentage: number;
}

export default function ExporterDashboard() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { profile, loading: profileLoading } = useExporterProfile();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    fundedInvoices: 0,
    totalFunded: 0,
    totalWithdrawn: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to home if not connected (immediate redirect, no screen shown)
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
    }
  }, [isLoaded, isConnected, router]);

  // Redirect to role selection if no profile
  useEffect(() => {
    if (isLoaded && isConnected && !profileLoading && !profile) {
      router.push('/select-role');
    }
  }, [isLoaded, isConnected, profileLoading, profile, router]);

  useEffect(() => {
    if (isConnected && address && profile) {
      loadDashboardData();
    }
  }, [isConnected, address, profile]);

  const loadDashboardData = async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Get invoice data from Supabase cache (fast)
      const { getExporterInvoicesFromCache } = await import('@/lib/supabase');
      const invoices = await getExporterInvoicesFromCache(address);

      if (invoices.length === 0) {
        setStats({
          totalInvoices: 0,
          pendingInvoices: 0,
          fundedInvoices: 0,
          totalFunded: 0,
          totalWithdrawn: 0,
        });
        setRecentInvoices([]);
        setIsLoading(false);
        return;
      }

      console.log('📊 Dashboard: Loaded cached invoices:', invoices.length);

      // Calculate statistics from cache
      let pendingCount = 0;
      let fundedCount = 0;
      let totalFunded = 0;
      let totalWithdrawn = 0;

      for (const invoice of invoices) {
        const status = invoice.status || 'PENDING';

        // Count by status
        if (status === 'PENDING' || status === 'APPROVED' || status === 'IN_POOL') {
          pendingCount++;
        } else if (status === 'FUNDED' || status === 'WITHDRAWN' || status === 'PAID' || status === 'COMPLETED') {
          fundedCount++;
        }

        if (invoice.amount_invested) {
          totalFunded += Number(invoice.amount_invested);
        }
        if (invoice.amount_withdrawn) {
          totalWithdrawn += Number(invoice.amount_withdrawn);
        }
      }

      const totalFundedEth = totalFunded / 1e18;
      const totalWithdrawnEth = totalWithdrawn / 1e18;

      const realStats = {
        totalInvoices: invoices.length,
        pendingInvoices: pendingCount,
        fundedInvoices: fundedCount,
        totalFunded: totalFundedEth,
        totalWithdrawn: totalWithdrawnEth,
      };

      // Format recent invoices (last 5)
      const recentCachedInvoices = invoices.slice(0, 5);

      const formattedInvoices: Invoice[] = recentCachedInvoices.map((inv) => ({
        id: inv.token_id,
        invoiceNumber: inv.invoice_number || `INV-${inv.token_id}`,
        importerCompany: inv.importer_name || 'Unknown Importer',
        amount: (inv.loan_amount || 0) / 100,
        status: (inv.status?.toLowerCase() || 'pending') as Invoice['status'],
        createdAt: inv.created_at,
        fundedPercentage: (inv.loan_amount && inv.loan_amount > 0)
          ? ((inv.status?.toLowerCase() === 'funded' || inv.status?.toLowerCase() === 'withdrawn') ? 100 : 0)
          : 0,
      }));

      setStats(realStats);
      setRecentInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20",
      approved: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
      funded: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
      withdrawn: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
      paid: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20",
    };

    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      funded: 'Funded',
      withdrawn: 'Withdrawn',
      paid: 'Paid',
    };

    return (
      <Badge variant="outline" className={styles[status] || styles.pending}>
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {profile?.company_name ? `Welcome back, ${profile.company_name}` : 'Dashboard'}
          </h1>
          <p className="text-slate-400">
            Track your invoices and funding status
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" asChild>
          <Link href="/exporter/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Verification Status Banner */}
      {profile && !profile.is_verified && (
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-400" />
            <div>
              <h3 className="text-yellow-400 font-medium">Account Under Review</h3>
              <p className="text-yellow-100 text-sm">
                Your exporter account is being verified by our admin team.
                Some features may be limited until verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile && profile.is_verified && (
        <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
            <div>
              <h3 className="text-green-400 font-medium">Account Verified</h3>
              <p className="text-green-100 text-sm">
                Your exporter account has been verified. You can now create invoices and access all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-slate-800" />
            ) : (
              <div className="text-2xl font-bold text-slate-100">{stats.totalInvoices}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 bg-slate-800" />
            ) : (
              <div className="text-2xl font-bold text-slate-100">{stats.pendingInvoices}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Funded</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-slate-800" />
            ) : (
              <div className="text-2xl font-bold text-slate-100">
                {formatCurrency(stats.totalFunded)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Withdrawn</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-slate-800" />
            ) : (
              <div className="text-2xl font-bold text-slate-100">
                {formatCurrency(stats.totalWithdrawn)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-slate-100">Recent Invoices</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest invoice submissions and their funding status
            </CardDescription>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" asChild>
            <Link href="/exporter/invoices">
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32 bg-slate-700" />
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                  </div>
                  <Skeleton className="h-8 w-24 bg-slate-700" />
                </div>
              ))}
            </div>
          ) : recentInvoices.length > 0 ? (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-slate-100">{invoice.invoiceNumber}</h4>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-slate-400">{invoice.importerCompany}</p>
                    <p className="text-sm text-slate-500">Created: {formatDate(invoice.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-100">
                      {formatCurrency(invoice.amount)}
                    </p>
                    {invoice.status === 'approved' || invoice.status === 'funded' ? (
                      <p className="text-sm text-cyan-400">
                        {invoice.fundedPercentage}% funded
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-4">
                    <Link href={`/exporter/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <File className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No invoices yet</h3>
              <p className="text-slate-400 mb-4">
                Create your first invoice to start getting funded
              </p>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" asChild>
                <Link href="/exporter/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}