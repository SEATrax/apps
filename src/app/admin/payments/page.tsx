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
  CreditCard,
  Info,
  Eye,
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatDateString, formatAddress } from '@/lib/utils';
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
  status: 'link_generated' | 'pending_confirmation' | 'paid' | 'overdue';
  payment_method?: string;
  payment_reference?: string;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

type PaymentStatus = 'all' | 'link_generated' | 'pending_confirmation' | 'paid' | 'overdue';
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
        (invoice.metadata?.importer_name || 'Unknown').toLowerCase().includes(searchTerm.toLowerCase());

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

  // New function: Confirm payment from importer
  const handleConfirmPayment = async (invoiceId: number, paymentId: number) => {
    try {
      setActionLoading(`confirm-${paymentId}`);
      setMessage(null);

      // Update payment status to 'paid' in database
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Mark invoice as paid in smart contract
      await markInvoicePaid(BigInt(invoiceId));

      setMessage({ type: 'success', text: 'Payment confirmed successfully! Invoice marked as paid.' });
      
      // Reload data
      await loadData();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to confirm payment' });
    } finally {
      setActionLoading(null);
    }
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

  const getPaymentStatusBadge = (status: string) => {
    const configs = {
      'link_generated': { color: 'bg-blue-600', icon: Info, label: 'Payment Due' },
      'pending_confirmation': { color: 'bg-orange-600', icon: Clock, label: 'Pending Confirmation' },
      'paid': { color: 'bg-green-600', icon: CheckCircle, label: 'Payment Confirmed' },
      'overdue': { color: 'bg-red-600', icon: AlertCircle, label: 'Overdue' }
    };
    
    const config = configs[status as keyof typeof configs] || configs['link_generated'];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateTotals = () => {
    const totalInvoices = filteredInvoices.length;
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID').length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.loanAmount), 0);
    const paidAmount = filteredInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.loanAmount), 0);

    const pendingConfirmations = payments.filter(p => p.status === 'pending_confirmation').length;

    return { 
      totalInvoices, 
      paidInvoices, 
      totalAmount, 
      paidAmount,
      pendingConfirmations
    };
  };

  const showPaymentConfirmationSection = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending_confirmation');
    
    if (pendingPayments.length === 0) {
      return (
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-slate-300 font-medium mb-2">No Pending Confirmations</h3>
            <p className="text-slate-400 text-sm">All payments have been processed.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {pendingPayments.map((payment) => {
          const invoice = invoices.find(inv => Number(inv.tokenId) === payment.invoice_id);
          const isLoading = actionLoading === `confirm-${payment.id}`;
          
          return (
            <Card key={payment.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 border-orange-600/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      {invoice?.metadata?.invoice_number || `Invoice #${payment.invoice_id}`}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {invoice?.metadata?.importer_name || 'Unknown Importer'}
                    </p>
                  </div>
                  {getPaymentStatusBadge(payment.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs">Amount</p>
                    <p className="text-white font-medium">{formatCurrency(payment.amount_usd)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Payment Method</p>
                    <p className="text-white">{payment.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Reference</p>
                    <p className="text-white text-sm">{payment.payment_reference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Submitted</p>
                    <p className="text-white text-sm">{formatDateString(payment.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleConfirmPayment(payment.invoice_id, payment.id)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(payment.payment_link)}
                    className="border-slate-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Show loading or access check
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  if (!isConnected || !userRoles?.hasAdminRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Access Denied</h2>
            <p className="text-slate-400">Admin privileges required to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalInvoices, paidInvoices, totalAmount, paidAmount, pendingConfirmations } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Payment Management</h1>
            <p className="text-slate-400">Track and confirm invoice payments</p>
          </div>
          <Button onClick={loadData} variant="outline" className="border-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'bg-red-600/20 border-red-600' : 'bg-green-600/20 border-green-600'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{totalInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Paid</p>
                  <p className="text-2xl font-bold text-white">{paidInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-600/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingConfirmations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-600/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Paid Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(paidAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-600">
              Pending Confirmations ({pendingConfirmations})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-cyan-600">
              All Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-cyan-600">
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-400" />
                  Payments Awaiting Confirmation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Payments submitted by importers that need admin verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showPaymentConfirmationSection()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            {/* Search and filters for invoices */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value as InvoiceStatus)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
              >
                <option value="all">All Statuses</option>
                <option value="funded">Funded</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="space-y-4">
              {loading ? (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-cyan-600 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-400">Loading invoices...</p>
                  </CardContent>
                </Card>
              ) : filteredInvoices.length === 0 ? (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">No Invoices Found</h3>
                    <p className="text-slate-400 text-sm">No funded or paid invoices match your criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredInvoices.map((invoice) => {
                  const payment = getPaymentStatus(invoice);
                  const paymentLink = generatePaymentLink(Number(invoice.tokenId));
                  const isPaidLoading = actionLoading === `paid-${invoice.tokenId}`;
                  
                  return (
                    <Card key={invoice.tokenId} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-medium mb-1">
                              {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                            </h3>
                            <p className="text-slate-400 text-sm">{invoice.metadata?.goods_description}</p>
                            <p className="text-slate-300 text-sm mt-1">{invoice.metadata?.importer_name}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={invoice.status === 'PAID' ? 'bg-green-600' : 'bg-blue-600'}>
                              {invoice.status === 'PAID' ? 'Paid' : 'Funded'}
                            </Badge>
                            {payment && getPaymentStatusBadge(payment.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-slate-400 text-xs">Loan Amount</p>
                            <p className="text-white font-medium">{formatCurrency(Number(invoice.loanAmount))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Invoice Value</p>
                            <p className="text-white">{formatCurrency(Number(invoice.invoiceValue))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Invoice Date</p>
                            <p className="text-white">{formatDate(Number(invoice.invoiceDate))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">Payment Link</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(paymentLink)}
                              className="text-cyan-400 hover:text-cyan-300 p-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {invoice.status !== 'PAID' && (
                          <div className="flex gap-3">
                            <Link href={paymentLink} target="_blank">
                              <Button variant="outline" size="sm" className="border-slate-700">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Payment Page
                              </Button>
                            </Link>
                            <Button 
                              onClick={() => handleMarkPaid(Number(invoice.tokenId))}
                              disabled={isPaidLoading}
                              variant="outline" 
                              size="sm"
                              className="border-green-600 text-green-400 hover:bg-green-600/10"
                            >
                              {isPaidLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Search and filters for payments */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white"
              >
                <option value="all">All Statuses</option>
                <option value="link_generated">Payment Due</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="space-y-4">
              {loading ? (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-cyan-600 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-400">Loading payments...</p>
                  </CardContent>
                </Card>
              ) : filteredPayments.length === 0 ? (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardContent className="p-8 text-center">
                    <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-slate-300 font-medium mb-2">No Payment Records Found</h3>
                    <p className="text-slate-400 text-sm">No payments match your search criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPayments.map((payment) => (
                  <Card key={payment.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-white font-medium mb-1">
                            Invoice #{payment.invoice_id}
                          </h3>
                          <p className="text-slate-400 text-sm">Payment Record #{payment.id}</p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-slate-400 text-xs">Amount</p>
                          <p className="text-white font-medium">{formatCurrency(payment.amount_usd)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Payment Method</p>
                          <p className="text-white">{payment.payment_method || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Created</p>
                          <p className="text-white">{formatDateString(payment.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Status Updated</p>
                          <p className="text-white">
                            {payment.paid_at 
                              ? formatDateString(payment.paid_at)
                              : payment.sent_at 
                                ? formatDateString(payment.sent_at)
                                : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}