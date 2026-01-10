'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Eye,
  Building2,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types';

// Invoice status mapping for numbers
const INVOICE_STATUS_MAP: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Pending Review', color: 'text-yellow-400', bgColor: 'bg-yellow-600' },
  1: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-600' },
  2: { label: 'In Pool', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  3: { label: 'Funded', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  4: { label: 'Paid', color: 'text-green-400', bgColor: 'bg-green-600' },
  5: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-600' },
};

// Status mapping for string values from hook
const STATUS_STRING_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  'PENDING': { label: 'Pending Review', color: 'text-yellow-400', bgColor: 'bg-yellow-600' },
  'FINALIZED': { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-600' },
  'FUNDRAISING': { label: 'In Pool', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  'FUNDED': { label: 'Funded', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  'PAID': { label: 'Paid', color: 'text-green-400', bgColor: 'bg-green-600' },
  'CANCELLED': { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-600' },
};

// Helper function to get status info
const getStatusInfo = (status: InvoiceStatus | number) => {
  return typeof status === 'string' ? 
    STATUS_STRING_MAP[status] || STATUS_STRING_MAP['PENDING'] :
    INVOICE_STATUS_MAP[Number(status)] || INVOICE_STATUS_MAP[0];
};

interface InvoiceWithMetadata extends Invoice {
  metadata?: {
    invoice_number: string;
    importer_name: string;
    goods_description: string;
    created_at: string;
  };
}

export default function AdminInvoicesPage() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { getUserRoles, isLoading } = useAccessControl();
  const { getInvoice } = useInvoiceNFT();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'funded'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRoles, setUserRoles] = useState<any>(null);

  // Check admin role and redirect if not admin
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
      return;
    }

    if (isLoaded && isConnected && !isLoading && address) {
      getUserRoles(address).then((roles) => {
        setUserRoles(roles);
        if (!roles?.hasAdminRole) {
          router.push('/');
        }
      });
    }
  }, [isLoaded, isConnected, isLoading, address, getUserRoles, router]);

  // Fetch invoices when admin role is confirmed
  useEffect(() => {
    if (userRoles?.hasAdminRole) {
      fetchInvoices();
    }
  }, [userRoles]);

  // Filter invoices based on selected filter and search term
  useEffect(() => {
    let filtered = invoices;

    // Apply status filter  
    if (filter === 'pending') {
      filtered = filtered.filter(inv => inv.status === 'PENDING');
    } else if (filter === 'approved') {
      filtered = filtered.filter(inv => inv.status === 'FINALIZED'); // Hook returns 'FINALIZED' for approved
    } else if (filter === 'funded') {
      filtered = filtered.filter(inv => inv.status === 'FUNDED');
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.metadata?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.metadata?.importer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.metadata?.invoice_number || `Invoice #${inv.tokenId}`).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, filter, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      
      // Get all invoice metadata from Supabase
      const { data: metadataList, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (metadataError) throw metadataError;

      // Get invoice data from smart contract for each metadata
      const invoicesWithData: InvoiceWithMetadata[] = [];
      
      for (const metadata of metadataList || []) {
        try {
          const invoiceData = await getInvoice(BigInt(metadata.token_id));
          if (invoiceData) {
            invoicesWithData.push({
              ...invoiceData,
              metadata: {
                invoice_number: metadata.invoice_number,
                importer_name: metadata.importer_name || 'Unknown',
                goods_description: metadata.goods_description || '',
                created_at: metadata.created_at,
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch invoice ${metadata.token_id}:`, error);
        }
      }

      setInvoices(invoicesWithData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load invoices: ' + error.message });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const getFilterStats = () => {
    const pending = invoices.filter(inv => inv.status === 'PENDING').length;
    const approved = invoices.filter(inv => inv.status === 'FINALIZED').length;
    const funded = invoices.filter(inv => inv.status === 'FUNDED').length;
    return { pending, approved, funded, total: invoices.length };
  };

  const stats = getFilterStats();

  // Show loading if checking roles or not connected
  if (!isLoaded || !isConnected || isLoading || !userRoles?.hasAdminRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Invoice Review
          </h1>
          <p className="text-gray-400">
            Review and approve invoice submissions for funding pool inclusion
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Funded</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.funded}</p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All ({stats.total})
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                  className={filter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending ({stats.pending})
                </Button>
                <Button
                  variant={filter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('approved')}
                  className={filter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved ({stats.approved})
                </Button>
                <Button
                  variant={filter === 'funded' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('funded')}
                  className={filter === 'funded' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Funded ({stats.funded})
                </Button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, importer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Invoices ({filteredInvoices.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filter === 'pending' && 'Invoices awaiting admin review and approval'}
              {filter === 'approved' && 'Approved invoices ready for pool inclusion'}
              {filter === 'funded' && 'Funded invoices in active investment pools'}
              {filter === 'all' && 'All registered invoices in the platform'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvoices ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {filter === 'pending' && 'No pending invoices'}
                  {filter === 'approved' && 'No approved invoices'}
                  {filter === 'funded' && 'No funded invoices'}
                  {filter === 'all' && 'No invoices found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Invoices will appear here once submitted by exporters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusInfo(invoice.status);
                  
                  return (
                    <div
                      key={invoice.tokenId.toString()}
                      className="border border-slate-700 rounded-lg p-6 bg-slate-750 hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Invoice Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="h-5 w-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold text-white">
                              {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                            </h3>
                            <Badge 
                              className={`${statusInfo.bgColor} text-white`}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Exporter</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                Exporter: {invoice.metadata?.invoice_number || `#${invoice.tokenId}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Importer</p>
                              <p className="text-white font-medium">
                                {invoice.metadata?.importer_name || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Shipping Date</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(invoice.invoiceDate)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-gray-400">Shipping Amount</p>
                              <p className="text-white font-medium">
                                {formatCurrency(Number(invoice.invoiceValue) / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Loan Amount</p>
                              <p className="text-cyan-400 font-bold">
                                {formatCurrency(Number(invoice.loanAmount) / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Amount Invested</p>
                              <p className="text-green-400 font-medium">
                                {formatCurrency(Number(invoice.fundedAmount) / 100)}
                              </p>
                            </div>
                          </div>

                          {invoice.metadata?.goods_description && (
                            <div className="mt-3 text-sm">
                              <p className="text-gray-400">Goods Description</p>
                              <p className="text-white">{invoice.metadata.goods_description}</p>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-500">
                            Created: {invoice.metadata?.created_at ? new Date(invoice.metadata.created_at).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="lg:ml-6">
                          <Link href={`/admin/invoices/${invoice.tokenId}`}>
                            <Button variant="outline" className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}