'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { usePaymentOracle } from '@/hooks/usePaymentOracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Loader2,
  RefreshCw,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatAddress } from '@/lib/utils';
import type { Invoice } from '@/types';

interface InvoiceWithMetadata extends Invoice {
  metadata?: {
    invoice_number: string;
    importer_name: string;
    goods_description: string;
  };
}

interface PaymentRecord {
  id: number;
  invoice_id: number;
  amount_usd: number;
  payment_link: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue';
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

type PaymentStatus = 'all' | 'pending' | 'sent' | 'paid' | 'overdue';
type InvoiceStatus = 'all' | 'funded' | 'paid';

export default function PaymentTrackingPage() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { getUserRoles, isLoading } = useAccessControl();
  const { getInvoice } = useInvoiceNFT();
  const { markInvoicePaid } = usePaymentOracle();
  const router = useRouter();
  
  const [userRoles, setUserRoles] = useState<any>(null);
  const [invoices, setInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatus>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus>('all');

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

  // Load data when admin role is confirmed
  useEffect(() => {
    if (userRoles?.hasAdminRole) {
      loadData();
    }
  }, [userRoles]);

  // Apply filters whenever search term or filters change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, invoiceStatusFilter, paymentStatusFilter, invoices, payments]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all invoice metadata
      const { data: metadataList, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (metadataError) throw metadataError;

      // Load payment records
      const { data: paymentsList, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsList || []);

      // Get invoice data from smart contract
      const invoicesList: InvoiceWithMetadata[] = [];
      
      for (const metadata of metadataList || []) {
        try {
          const invoiceData = await getInvoice(BigInt(metadata.token_id));
          
          // Only include funded or paid invoices
          if (invoiceData && (invoiceData.status === 'FUNDED' || invoiceData.status === 'PAID')) {
            invoicesList.push({
              ...invoiceData,
              metadata: {
                invoice_number: metadata.invoice_number,
                importer_name: metadata.importer_name || 'Unknown',
                goods_description: metadata.goods_description || '',
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch invoice ${metadata.token_id}:`, error);
        }
      }

      setInvoices(invoicesList);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter invoices
    let filtered = invoices.filter((invoice) => {
      const matchesSearch = 
        !searchTerm ||
        (invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.metadata?.importer_name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        invoiceStatusFilter === 'all' ||
        (invoiceStatusFilter === 'funded' && invoice.status === 'FUNDED') ||
        (invoiceStatusFilter === 'paid' && invoice.status === 'PAID');

      return matchesSearch && matchesStatus;
    });

    setFilteredInvoices(filtered);

    // Filter payments
    let filteredPays = payments.filter((payment) => {
      const matchesSearch = 
        !searchTerm ||
        payment.invoice_id.toString().includes(searchTerm);

      const matchesStatus = 
        paymentStatusFilter === 'all' ||
        payment.status === paymentStatusFilter;

      return matchesSearch && matchesStatus;
    });

    setFilteredPayments(filteredPays);
  };

  const handleMarkPaid = async (invoiceId: number) => {
    try {
      setActionLoading(`paid-${invoiceId}`);
      setMessage(null);

      // Mark invoice as paid in smart contract
      await markInvoicePaid(BigInt(invoiceId));

      // Update payment record in database
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('invoice_id', invoiceId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Invoice marked as paid successfully!' });
      
      // Reload data
      await loadData();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to mark invoice as paid' });
    } finally {
      setActionLoading(null);
    }
  };

  const generatePaymentLink = (invoiceId: number) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
    return `${baseUrl}/pay/${invoiceId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  };

  const getPaymentStatus = (invoice: InvoiceWithMetadata): PaymentRecord | null => {
    return payments.find(p => p.invoice_id === Number(invoice.tokenId)) || null;
  };

  const calculateTotals = () => {
    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID').length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.loanAmount), 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.loanAmount), 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount
    };
  };

  const totals = calculateTotals();

  // Show loading if checking roles or not connected
  if (!isLoaded || !isConnected || isLoading || !userRoles?.hasAdminRole || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading payment data...</div>
        </div>
      </div>
    );
  }

  // Helper function to check if invoice is withdrawn (handles both string and number status)
  const isWithdrawn = (status: any) => {
    return status === "WITHDRAWN" || status === 3;
  };

  // Helper function to check if invoice is paid (handles both string and number status)
  const isPaid = (status: any) => {
    return status === "PAID" || status === 4;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Payment Tracking
              </h1>
              <p className="text-gray-400 mt-1">
                Monitor invoice payments and generate payment links
              </p>
            </div>
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Total Invoices</p>
                    <p className="text-lg font-bold text-white">{totals.totalInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Paid</p>
                    <p className="text-lg font-bold text-white">{totals.paidInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-lg font-bold text-white">{totals.pendingInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Total Amount</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(totals.totalAmount / 100)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value as InvoiceStatus)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="all">All Invoices</option>
                  <option value="funded">Funded</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </CardContent>
          </Card>
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

        {/* Invoice List */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No invoices found</h3>
                <p className="text-gray-500">
                  No invoices match your current filter criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => {
              const paymentRecord = getPaymentStatus(invoice);
              const paymentLink = generatePaymentLink(Number(invoice.tokenId));
              const totalDue = Number(invoice.loanAmount) * 1.04; // loan + 4% interest
              
              return (
                <Card key={invoice.tokenId.toString()} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-white">
                            {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                          </h3>
                          <Badge className={invoice.status === 'PAID' ? 'bg-green-600' : 'bg-cyan-600'}>
                            {invoice.status === 'PAID' ? 'Paid' : 'Funded'}
                          </Badge>
                          {paymentRecord && (
                            <Badge className={
                              paymentRecord.status === 'paid' ? 'bg-green-600' :
                              paymentRecord.status === 'sent' ? 'bg-blue-600' :
                              paymentRecord.status === 'overdue' ? 'bg-red-600' :
                              'bg-gray-600'
                            }>
                              Payment: {paymentRecord.status.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Exporter</p>
                            <p className="text-white font-medium">Invoice #{invoice.tokenId}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Importer</p>
                            <p className="text-white font-medium">
                              {invoice.metadata?.importer_name || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Loan Amount</p>
                            <p className="text-cyan-400 font-bold">
                              {formatCurrency(Number(invoice.loanAmount) / 100)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Total Due (with 4% interest)</p>
                            <p className="text-yellow-400 font-bold">
                              {formatCurrency(totalDue / 100)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Amount Withdrawn</p>
                            <p className="text-green-400 font-medium">
                              {formatCurrency(Number(invoice.withdrawnAmount) / 100)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Shipping Date</p>
                            <p className="text-white">{formatDate(invoice.invoiceDate)}</p>
                          </div>
                          {paymentRecord?.paid_at && (
                            <div>
                              <p className="text-gray-400 text-sm">Payment Date</p>
                              <p className="text-green-400">{formatDate(new Date(paymentRecord.paid_at).getTime())}</p>
                            </div>
                          )}
                        </div>

                        {/* Payment Link */}
                        <div className="border-t border-slate-600 pt-4 mt-4">
                          <p className="text-gray-400 text-sm mb-2">Payment Link for Importer:</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={paymentLink}
                              readOnly
                              className="bg-slate-700 border-slate-600 text-white text-sm"
                            />
                            <Button
                              onClick={() => copyToClipboard(paymentLink)}
                              size="sm"
                              variant="outline"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Link href={paymentLink} target="_blank">
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                          <p className="text-gray-500 text-xs">
                            Send this link to the importer to complete payment
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {isWithdrawn(invoice.status) && (
                          <Button
                            onClick={() => handleMarkPaid(Number(invoice.tokenId))}
                            disabled={actionLoading === `paid-${invoice.tokenId}`}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === `paid-${invoice.tokenId}` ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Marking...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Link href={`/admin/invoices/${invoice.tokenId}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}