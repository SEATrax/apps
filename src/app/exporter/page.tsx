'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

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
  const { address, isConnected } = usePanna();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    fundedInvoices: 0,
    totalFunded: 0,
    totalWithdrawn: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData();
    }
  }, [isConnected, address]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual smart contract calls
      // Mock data for now
      setStats({
        totalInvoices: 12,
        pendingInvoices: 3,
        fundedInvoices: 6,
        totalFunded: 85000,
        totalWithdrawn: 72000,
      });

      setRecentInvoices([
        {
          id: 1,
          invoiceNumber: 'INV-001',
          importerCompany: 'Global Trading Ltd',
          amount: 15000,
          status: 'funded',
          createdAt: '2024-11-25',
          fundedPercentage: 85,
        },
        {
          id: 2,
          invoiceNumber: 'INV-002',
          importerCompany: 'Asia Import Co',
          amount: 22000,
          status: 'approved',
          createdAt: '2024-11-24',
          fundedPercentage: 45,
        },
        {
          id: 3,
          invoiceNumber: 'INV-003',
          importerCompany: 'European Goods Inc',
          amount: 18000,
          status: 'pending',
          createdAt: '2024-11-23',
          fundedPercentage: 0,
        },
      ]);
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Wallet Not Connected</CardTitle>
            <CardDescription className="text-slate-400">
              Please connect your wallet to access the exporter dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Exporter Dashboard</h1>
              <p className="text-sm text-slate-400">
                Manage your invoices and track funding progress
              </p>
            </div>
            <Link href="/exporter/invoices/new">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link href="/exporter/invoices">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                View All
              </Button>
            </Link>
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
                <Link href="/exporter/invoices/new">
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}