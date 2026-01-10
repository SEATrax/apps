'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ExporterHeader from '@/components/ExporterHeader';

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
  const { getInvoicesByExporter } = useInvoiceNFT();
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
      
      // Get invoice token IDs from smart contract
      const invoiceIds = await getInvoicesByExporter(address);
      
      if (invoiceIds.length === 0) {
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
      
      // Get invoice metadata from Supabase for recent invoices
      const { data: invoiceMetadata } = await supabase
        .from('invoice_metadata')
        .select('*')
        .eq('exporter_wallet', address)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Mock stats calculation (implement with real contract data later)
      const mockStats = {
        totalInvoices: invoiceIds.length,
        pendingInvoices: Math.floor(invoiceIds.length * 0.4),
        fundedInvoices: Math.floor(invoiceIds.length * 0.6),
        totalFunded: 125000,
        totalWithdrawn: 87500,
      };
      
      // Format recent invoices
      const formattedInvoices: Invoice[] = (invoiceMetadata || []).slice(0, 5).map((meta, index) => ({
        id: meta.token_id || index,
        invoiceNumber: meta.invoice_number || `INV-${meta.token_id}`,
        importerCompany: meta.importer_name || 'Unknown Importer',
        amount: 25000, // TODO: Get from contract
        status: index % 3 === 0 ? 'funded' : index % 2 === 0 ? 'approved' : 'pending',
        createdAt: meta.created_at,
        fundedPercentage: index % 3 === 0 ? 100 : index % 2 === 0 ? 75 : 0,
      }));
      
      setStats(mockStats);
      setRecentInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      pending: 'secondary',
      approved: 'outline',
      funded: 'default',
      withdrawn: 'destructive',
      paid: 'default',
    } as const;

    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      funded: 'Funded',
      withdrawn: 'Withdrawn',
      paid: 'Paid',
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading while wallet is initializing or redirecting
  if (!isLoaded || !isConnected || (isLoaded && isConnected && !profileLoading && !profile)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Loading...</CardTitle>
            <CardDescription className="text-slate-400">
              {!isLoaded ? 'Initializing wallet connection...' : 
               !isConnected ? 'Redirecting to home...' :
               !profile ? 'Redirecting to role selection...' : 'Loading...'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (profileLoading || !isConnected) {
    return (
      <div className="min-h-screen bg-slate-950">
        <ExporterHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading exporter profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ExporterHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Status Banner */}
        {profile && !profile.is_verified && (
          <div className="mb-6 bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
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
          <div className="mb-6 bg-green-900/50 border border-green-600 rounded-lg p-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.totalInvoices}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.pendingInvoices}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Funded</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {formatCurrency(stats.totalFunded)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Withdrawn</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {formatCurrency(stats.totalWithdrawn)}
              </div>
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
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-800 rounded w-1/2"></div>
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
                      <p className="text-sm text-slate-500">Created: {invoice.createdAt}</p>
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
                <FileText className="mx-auto h-12 w-12 text-slate-600 mb-4" />
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
    </div>
  );
}