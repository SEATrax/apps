'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { supabase, isSupabaseConfigured, getExporterInvoicesFromCache } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Invoice {
  id: number | bigint;
  tokenId?: number | bigint;
  invoiceNumber: string;
  importerCompany: string;
  exporterCompany: string;
  shippingAmount: number;
  loanAmount: number;
  amountInvested: number;
  amountWithdrawn: number;
  status: 'pending' | 'approved' | 'in_pool' | 'funded' | 'withdrawn' | 'paid' | 'completed' | 'rejected';
  shippingDate: string;
  createdAt: string;
  fundedPercentage: number;
}

export default function InvoiceList() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { profile, loading: profileLoading } = useExporterProfile();
  const { getExporterInvoices, getInvoice } = useSEATrax(); // Keep for fallback if needed, or remove if confident
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // Check for success parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('created') === 'true') {
      setShowSuccess(true);
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  // Redirect to home if not connected
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
    if (isConnected && address) {
      loadInvoices();
    }
  }, [isConnected, address, page]); // Reload when page changes

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);

      if (!address) {
        setInvoices([]);
        return;
      }

      // 1. Fetch from Supabase Cache (Pagination Supported)
      if (isSupabaseConfigured) {
        console.log('Fetching invoices from cache for:', address, 'Page:', page);
        const { data: cachedInvoices, count } = await getExporterInvoicesFromCache(address, page, itemsPerPage);

        // Update pagination state
        if (count !== null) {
          setTotalPages(Math.ceil(count / itemsPerPage));
        }

        // Helper to safely convert potential Wei values to USD
        const safeCurrency = (val: any) => {
          const num = Number(val || 0);
          if (num > 1_000_000_000) {
            return (num / 1e18) * 3000;
          }
          return num;
        };

        if (cachedInvoices && cachedInvoices.length > 0) {
          const formattedInvoices = cachedInvoices.map((inv: any) => {
            const amountInvested = safeCurrency(inv.amount_invested);
            const loanAmount = Number(inv.loan_amount || 0);

            // Log raw status for debugging
            if (page === 1) console.log(`Processing invoice ${inv.invoice_number} raw status: ${inv.status}`);
            return {
              id: inv.token_id,
              tokenId: inv.token_id,
              invoiceNumber: inv.invoice_number,
              importerCompany: inv.importer_name,
              exporterCompany: profile?.company_name || 'My Company',
              shippingAmount: inv.shipping_amount || 0,
              loanAmount,
              amountInvested,
              amountWithdrawn: safeCurrency(inv.amount_withdrawn),
              status: (inv.status || 'pending').toLowerCase() as Invoice['status'],
              shippingDate: inv.shipping_date ? new Date(inv.shipping_date * 1000).toISOString() : new Date().toISOString(),
              createdAt: inv.created_at,
              fundedPercentage: (loanAmount > 0) ? Math.round((amountInvested / loanAmount) * 100) : 0
            };
          });

          console.log('Formatted Invoices:', formattedInvoices);
          setInvoices(formattedInvoices);
          setIsLoading(false);
          return;
        } else {
          // If empty and page 1, show empty state. If page > 1, maybe out of bounds?
          setInvoices([]);
          setIsLoading(false);
          return;
        }
      }

      // Fallback removed for pagination simplicity - Cache is source of truth for lists.
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          invoice.importerCompany.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredInvoices(filtered);
  };

  // Standardized Badge for Exporter Pages (Matches Details & Dashboard Page)
  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      pending: { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50' },
      approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-400 border-blue-500/50' },
      in_pool: { label: 'In Pool', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' },
      funded: { label: 'Funded', color: 'bg-green-500/10 text-green-400 border-green-500/50' },
      withdrawn: { label: 'Withdrawn', color: 'bg-purple-500/10 text-purple-400 border-purple-500/50' },
      paid: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' },
      completed: { label: 'Completed', color: 'bg-teal-500/10 text-teal-400 border-teal-500/50' },
      rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/50' },
    };
    const { label, color } = config[status] || config['pending'];
    return <Badge variant="outline" className={cn("px-3 py-1 font-medium capitalize border", color)}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) { return dateStr }
  };

  // Consolidate loading state for UI
  const isPageLoading = isLoading || !isLoaded || (isConnected && profileLoading);


  return (
    <div className="min-h-screen bg-slate-950">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Invoices</h1>
            <p className="text-slate-400 mt-1">
              Manage and track your invoice submissions
            </p>
          </div>
          <Link href="/exporter/invoices/new">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 bg-green-900/20 border-green-800 text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Invoice created successfully! It's now pending admin review.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by invoice number or importer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <SelectItem value="all" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">All Status</SelectItem>
                    <SelectItem value="pending" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Pending Review</SelectItem>
                    <SelectItem value="approved" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Approved</SelectItem>
                    <SelectItem value="in_pool" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Fundraising</SelectItem>
                    <SelectItem value="funded" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Funded</SelectItem>
                    <SelectItem value="paid" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Paid</SelectItem>
                    <SelectItem value="rejected" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Invoice List ({filteredInvoices.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Click on an invoice to view details and manage funding
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPageLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 rounded-lg bg-slate-800 border border-slate-700">
                    <div className="flex justify-between mb-4">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32 bg-slate-700" />
                        <Skeleton className="h-4 w-48 bg-slate-700" />
                      </div>
                      <Skeleton className="h-9 w-24 bg-slate-700" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Skeleton className="h-10 w-full bg-slate-700" />
                      <Skeleton className="h-10 w-full bg-slate-700" />
                      <Skeleton className="h-10 w-full bg-slate-700" />
                      <Skeleton className="h-10 w-full bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length > 0 ? (
              <>
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id.toString()}
                      className="p-6 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-100 text-lg">
                              {invoice.invoiceNumber}
                            </h3>
                            {getStatusBadge(invoice.status)}
                            {invoice.tokenId ? (
                              <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 bg-slate-900/50">
                                NFT #{invoice.tokenId.toString()}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-slate-300 font-medium">{invoice.importerCompany}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Ship: {formatDate(invoice.shippingDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Created: {formatDate(invoice.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Link href={`/exporter/invoices/${invoice.id}`}>
                            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Shipping Amount</p>
                          <p className="font-semibold text-slate-100">
                            {formatCurrency(invoice.shippingAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Loan Requested</p>
                          <p className="font-semibold text-slate-100">
                            {formatCurrency(invoice.loanAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Amount Invested</p>
                          <p className="font-semibold text-cyan-400">
                            {formatCurrency(invoice.amountInvested)}
                          </p>
                          {invoice.status === 'in_pool' || invoice.status === 'funded' ? (
                            <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
                              <div
                                className="bg-cyan-600 h-2 rounded-full"
                                style={{ width: `${Math.min(invoice.fundedPercentage, 100)}%` }}
                              ></div>
                            </div>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Withdrawn</p>
                          <p className="font-semibold text-green-400">
                            {formatCurrency(invoice.amountWithdrawn)}
                          </p>
                          {invoice.status === 'funded' && invoice.fundedPercentage >= 70 && invoice.amountWithdrawn < invoice.amountInvested ? (
                            <p className="text-xs text-yellow-400 mt-1">Available to withdraw</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="border-slate-700 text-slate-300"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="border-slate-700 text-slate-300"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-medium text-slate-300 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first invoice to start getting funded by investors'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link href="/exporter/invoices/new">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Invoice
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}