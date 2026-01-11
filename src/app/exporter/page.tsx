'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ExporterHeader from '@/components/ExporterHeader';

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
  const { getExporterInvoices, getInvoice } = useSEATrax();
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
      const invoiceIds = await getExporterInvoices(address);
      
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
      
      // Get all invoice data from blockchain
      const invoicePromises = invoiceIds.map(async (tokenId) => {
        try {
          return await getInvoice(tokenId);
        } catch (error) {
          console.error(`Error loading invoice ${tokenId}:`, error);
          return null;
        }
      });
      
      const invoices = await Promise.all(invoicePromises);
      const validInvoices = invoices.filter(Boolean);
      
      console.log('📊 Dashboard: Loaded invoices:', validInvoices.length);
      if (validInvoices.length > 0) {
        console.log('First invoice sample:', {
          tokenId: validInvoices[0]?.tokenId?.toString(),
          status: validInvoices[0]?.status,
          amountInvested: validInvoices[0]?.amountInvested?.toString(),
          amountWithdrawn: validInvoices[0]?.amountWithdrawn?.toString(),
        });
      }
      
      // Calculate real statistics from blockchain data
      let pendingCount = 0;
      let fundedCount = 0;
      let totalFunded = 0n; // BigInt
      let totalWithdrawn = 0n; // BigInt
      
      for (const invoice of validInvoices) {
        if (invoice) {
          // Count by status
          if (invoice.status === INVOICE_STATUS.PENDING || invoice.status === INVOICE_STATUS.APPROVED) {
            pendingCount++;
          } else if (invoice.status === INVOICE_STATUS.FUNDED || 
                     invoice.status === INVOICE_STATUS.WITHDRAWN || 
                     invoice.status === INVOICE_STATUS.PAID || 
                     invoice.status === INVOICE_STATUS.COMPLETED) {
            fundedCount++;
          }
          
          // Sum amounts with null safety
          if (invoice.amountInvested !== undefined && invoice.amountInvested !== null) {
            totalFunded += BigInt(invoice.amountInvested);
          }
          if (invoice.amountWithdrawn !== undefined && invoice.amountWithdrawn !== null) {
            totalWithdrawn += BigInt(invoice.amountWithdrawn);
          }
        }
      }
      
      const realStats = {
        totalInvoices: invoiceIds.length,
        pendingInvoices: pendingCount,
        fundedInvoices: fundedCount,
        totalFunded: Number(totalFunded) / 1e18, // Convert from Wei to ETH
        totalWithdrawn: Number(totalWithdrawn) / 1e18,
      };
      
      // Format recent invoices - Start from blockchain (source of truth)
      // Take last 5 invoices from contract
      const recentContractInvoices = validInvoices.slice(-5).reverse();
      
      const formattedInvoices: Invoice[] = await Promise.all(
        recentContractInvoices.map(async (contractData) => {
          // Try to get metadata from Supabase (optional)
          const { data: metadata } = await supabase
            .from('invoice_metadata')
            .select('*')
            .eq('token_id', Number(contractData.tokenId))
            .single();
          
          return {
            id: Number(contractData.tokenId),
            invoiceNumber: metadata?.invoice_number || `INV-${contractData.tokenId}`,
            importerCompany: metadata?.importer_name || contractData.importerCompany,
            amount: Number(contractData.loanAmount) / 100, // USD cents to dollars
            status: getStatusLabel(contractData.status),
            createdAt: metadata?.created_at || new Date().toISOString(),
            fundedPercentage: contractData && Number(contractData.loanAmount) > 0
              ? Math.round((Number(contractData.amountInvested) / Number(contractData.loanAmount)) * 100)
              : 0,
          };
        })
      );
      
      setStats(realStats);
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