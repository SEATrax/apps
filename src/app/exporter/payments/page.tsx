'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useSEATrax } from '@/hooks/useSEATrax';
import { supabase, isSupabaseConfigured, getExporterPaymentsFromCache } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Send,
  Bell
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ExporterHeader from '@/components/ExporterHeader';
import Link from 'next/link';

interface PaymentRecord {
  id: string;
  invoiceId: number | bigint;
  tokenId: number | bigint;
  invoiceNumber: string;
  importerCompany: string;
  exporterCompany: string;
  loanAmount: number;
  amountWithdrawn: number;
  interestAmount: number;
  totalDue: number;
  paymentLink: string | null;
  status: 'pending' | 'link_generated' | 'link_sent' | 'paid' | 'overdue';
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
  remindersSent: number;
  createdAt: string;
}

export default function PaymentsTracking() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { isLoading: contractLoading } = useSEATrax();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // Redirect to home if not connected (immediate redirect)
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
    }
  }, [isLoaded, isConnected, router]);

  useEffect(() => {
    if (isConnected && address) {
      loadPaymentsData();
    }
  }, [isConnected, address, page]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const loadPaymentsData = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use helper to fetch from Supabase (DB Cache)
      if (isSupabaseConfigured) {
        console.log('Fetching payments from cache for:', address, 'Page:', page);
        const { data: cachedInvoices, count } = await getExporterPaymentsFromCache(address, page, itemsPerPage);

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

        const formattedPayments: PaymentRecord[] = cachedInvoices.map((inv: any) => {
          const loanAmount = Number(inv.loan_amount || 0); // Already safe if from db, but verify
          const amountWithdrawn = safeCurrency(inv.amount_withdrawn);
          const interestAmount = loanAmount * 0.04; // Mock 4% interest
          const totalDue = loanAmount + interestAmount; // Simplified calc

          // Determine status from DB metadata + Payment table
          const paymentMeta = inv.payment_metadata || {};
          let derivedStatus: PaymentRecord['status'] = 'pending';

          if (paymentMeta.paid_at || inv.status === 'paid' || inv.status === 'completed') {
            derivedStatus = 'paid';
          } else if (paymentMeta.sent_at) {
            derivedStatus = 'link_sent';
          } else if (paymentMeta.payment_link) {
            derivedStatus = 'link_generated';
          } else {
            // Check Overdue
            const createdDate = new Date(inv.created_at);
            const dueDate = new Date(createdDate);
            dueDate.setDate(dueDate.getDate() + 30);
            if (new Date() > dueDate) derivedStatus = 'overdue';
          }

          return {
            id: `payment-${inv.token_id}`,
            invoiceId: inv.token_id,
            tokenId: inv.token_id,
            invoiceNumber: inv.invoice_number,
            importerCompany: inv.importer_name,
            exporterCompany: 'My Company',
            loanAmount,
            amountWithdrawn,
            interestAmount,
            totalDue,
            paymentLink: paymentMeta.payment_link || null,
            status: derivedStatus,
            sentAt: paymentMeta.sent_at,
            paidAt: paymentMeta.paid_at,
            dueDate: new Date(new Date(inv.created_at).setDate(new Date(inv.created_at).getDate() + 30)).toISOString(),
            remindersSent: 0,
            createdAt: inv.created_at,
          };
        });

        setPayments(formattedPayments);
      } else {
        // Fallback if needed, but for refactor we assume Supabase is primary
        setPayments([]);
      }

    } catch (error) {
      console.error('Error loading payments data:', error);
      setError('Failed to load payment data.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.importerCompany.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  };

  const handleCopyLink = (link: string, invoiceNumber: string) => {
    const fullLink = link.startsWith('/') ? `${window.location.origin}${link}` : link;
    navigator.clipboard.writeText(fullLink);
    setCopiedLink(invoiceNumber);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const sendReminder = async (paymentId: string) => {
    // Mock reminder
    console.log('Sending reminder for payment:', paymentId);
    // Optimistic update
    setPayments(prev =>
      prev.map(payment =>
        payment.id === paymentId
          ? { ...payment, remindersSent: payment.remindersSent + 1 }
          : payment
      )
    );
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Payment Pending</Badge>;
      case 'link_generated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Link Generated</Badge>;
      case 'link_sent':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Link Sent</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const generatePaymentLink = async (tokenId: number) => {
    try {
      const response = await fetch(`/api/payment/${tokenId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const { paymentLink } = await response.json();
        // Optimistic update
        setPayments(prev =>
          prev.map(payment =>
            Number(payment.tokenId) === tokenId
              ? { ...payment, paymentLink, status: 'link_generated' as const }
              : payment
          )
        );
        return paymentLink;
      }
    } catch (error) {
      console.error('Error generating payment link:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) { return dateString }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  // Combined Loading State
  const isPageLoading = isLoading || !isLoaded || (isConnected && contractLoading); // Contract loading less relevant now but good safety

  return (
    <div className="min-h-screen bg-slate-950">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Payment Tracking</h1>
            <p className="text-slate-400 mt-1">
              Monitor payment status and send reminders to importers
            </p>
          </div>
        </div>

        {/* Global Stats - Can mock or calculate from current page (simplified) */}
        {/* Note: In a real app, global stats should be a separate fast query. 
             For now, we remove them or keep simple ones if available, to avoid confusion with paginated data.
             Let's keep the filters and list as main focus. */}

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
                    <SelectItem value="pending" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Payment Pending</SelectItem>
                    <SelectItem value="link_generated" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Link Generated</SelectItem>
                    <SelectItem value="link_sent" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Link Sent</SelectItem>
                    <SelectItem value="paid" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Paid</SelectItem>
                    <SelectItem value="overdue" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-slate-100">
                  Payment Records
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Page {page} of {totalPages || 1}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-800 bg-red-950">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-12 w-full bg-slate-700" />
                      <Skeleton className="h-12 w-full bg-slate-700" />
                      <Skeleton className="h-12 w-full bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPayments.length > 0 ? (
              <>
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-6 rounded-lg border transition-colors ${payment.status === 'overdue'
                        ? 'bg-red-900/20 border-red-800'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-100 text-lg">
                              {payment.invoiceNumber}
                            </h3>
                            {getStatusBadge(payment.status)}
                            <Badge variant="outline" className="text-xs text-slate-300 border-slate-700 bg-slate-900/50">
                              NFT #{payment.tokenId.toString()}
                            </Badge>
                          </div>
                          <p className="text-slate-300 font-medium mb-1">{payment.importerCompany}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(payment.dueDate)}
                            </span>
                            {isOverdue(payment.dueDate, payment.status) && (
                              <span className="text-red-400 font-medium">
                                {Math.abs(getDaysUntilDue(payment.dueDate))} days overdue
                              </span>
                            )}
                            {!isOverdue(payment.dueDate, payment.status) && payment.status !== 'paid' && (
                              <span className="text-slate-400">
                                {getDaysUntilDue(payment.dueDate)} days remaining
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Link href={`/exporter/invoices/${payment.invoiceId}`}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                              <FileText className="mr-2 h-4 w-4" />
                              View Invoice
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Loan Amount</p>
                          <p className="font-semibold text-slate-100">
                            {formatCurrency(payment.loanAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Interest (4%)</p>
                          <p className="font-semibold text-cyan-400">
                            {formatCurrency(payment.interestAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Total Due</p>
                          <p className="font-semibold text-slate-100 text-lg">
                            {formatCurrency(payment.totalDue)}
                          </p>
                        </div>
                      </div>

                      {/* Payment Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-3">
                          {payment.paymentLink ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyLink(payment.paymentLink!, payment.invoiceNumber)}
                                className="border-slate-700 text-slate-300 hover:bg-slate-700"
                              >
                                <Copy className="mr-2 h-3 w-3" />
                                {copiedLink === payment.invoiceNumber ? 'Copied!' : 'Copy Link'}
                              </Button>

                              <Link href={payment.paymentLink} target="_blank">
                                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                                  <ExternalLink className="mr-2 h-3 w-3" />
                                  Open Link
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePaymentLink(Number(payment.tokenId))}
                              className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white"
                            >
                              <Send className="mr-2 h-3 w-3" />
                              Generate Payment Link
                            </Button>
                          )}

                          {payment.status === 'link_sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendReminder(payment.id)}
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              <Bell className="mr-2 h-3 w-3" />
                              Send Reminder ({payment.remindersSent})
                            </Button>
                          )}
                        </div>

                        <div className="text-sm text-slate-400">
                          {payment.status === 'paid' && payment.paidAt && (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Paid on {formatDate(payment.paidAt)}
                            </span>
                          )}
                          {payment.status === 'link_sent' && payment.sentAt && (
                            <span className="flex items-center gap-1">
                              <Send className="h-3 w-3" />
                              Sent on {formatDate(payment.sentAt)}
                            </span>
                          )}
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
                <DollarSign className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-medium text-slate-300 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching payments' : 'No payment records'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Payment records will appear here once you have funded invoices'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link href="/exporter/invoices">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      View Your Invoices
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Help Section */}
        <Card className="bg-slate-900 border-slate-800 mt-6">
          <CardHeader>
            <CardTitle className="text-slate-100">Payment Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-medium text-slate-300 mb-2">Generate Link</h4>
                <p className="text-sm text-slate-400">
                  Payment links are automatically generated when you withdraw funds
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-medium text-slate-300 mb-2">Share with Importer</h4>
                <p className="text-sm text-slate-400">
                  Copy and send the payment link to your importer
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-medium text-slate-300 mb-2">Receive Payment</h4>
                <p className="text-sm text-slate-400">
                  Track payment status and send reminders if needed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}