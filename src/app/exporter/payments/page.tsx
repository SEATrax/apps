'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface PaymentRecord {
  id: number;
  invoiceId: number;
  tokenId: number;
  invoiceNumber: string;
  importerCompany: string;
  loanAmount: number;
  interestAmount: number;
  totalDue: number;
  paymentLink: string;
  status: 'pending' | 'link_sent' | 'paid' | 'overdue';
  sentAt?: string;
  paidAt?: string;
  dueDate: string;
  remindersSent: number;
}

export default function PaymentsTracking() {
  const { address, isConnected } = usePanna();
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState<string>('');

  useEffect(() => {
    if (isConnected && address) {
      loadPaymentsData();
    }
  }, [isConnected, address]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter]);

  const loadPaymentsData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual database/smart contract calls
      // Fetch payments from Supabase where exporter = address
      
      // Mock data for now
      const mockPayments: PaymentRecord[] = [
        {
          id: 1,
          invoiceId: 1,
          tokenId: 1,
          invoiceNumber: 'INV-2024-001',
          importerCompany: 'Global Trading Ltd',
          loanAmount: 15000,
          interestAmount: 600, // 4% interest
          totalDue: 15600,
          paymentLink: `${window.location.origin}/pay/1`,
          status: 'paid',
          sentAt: '2024-11-26T10:30:00Z',
          paidAt: '2024-11-28T14:20:00Z',
          dueDate: '2024-12-15',
          remindersSent: 0,
        },
        {
          id: 2,
          invoiceId: 2,
          tokenId: 2,
          invoiceNumber: 'INV-2024-002',
          importerCompany: 'Asia Import Co',
          loanAmount: 22000,
          interestAmount: 880,
          totalDue: 22880,
          paymentLink: `${window.location.origin}/pay/2`,
          status: 'link_sent',
          sentAt: '2024-11-27T09:15:00Z',
          dueDate: '2024-12-20',
          remindersSent: 1,
        },
        {
          id: 3,
          invoiceId: 4,
          tokenId: 3,
          invoiceNumber: 'INV-2024-004',
          importerCompany: 'Pacific Traders',
          loanAmount: 12000,
          interestAmount: 480,
          totalDue: 12480,
          paymentLink: `${window.location.origin}/pay/4`,
          status: 'pending',
          dueDate: '2024-11-30',
          remindersSent: 0,
        },
        {
          id: 4,
          invoiceId: 5,
          tokenId: 4,
          invoiceNumber: 'INV-2024-005',
          importerCompany: 'European Goods Inc',
          loanAmount: 18000,
          interestAmount: 720,
          totalDue: 18720,
          paymentLink: `${window.location.origin}/pay/5`,
          status: 'overdue',
          sentAt: '2024-11-20T16:45:00Z',
          dueDate: '2024-11-25',
          remindersSent: 3,
        },
      ];
      
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error loading payments data:', error);
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
    navigator.clipboard.writeText(link);
    setCopiedLink(invoiceNumber);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const sendReminder = async (paymentId: number) => {
    try {
      // TODO: Implement reminder email/notification system
      console.log('Sending reminder for payment:', paymentId);
      
      // Update reminders count
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, remindersSent: payment.remindersSent + 1 }
            : payment
        )
      );
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Payment Pending', color: 'bg-yellow-600' },
      link_sent: { variant: 'default' as const, label: 'Link Sent', color: 'bg-blue-600' },
      paid: { variant: 'default' as const, label: 'Paid', color: 'bg-green-600' },
      overdue: { variant: 'destructive' as const, label: 'Overdue', color: 'bg-red-600' },
    };

    const { variant, label, color } = config[status];
    
    return (
      <Badge variant={variant} className={`text-xs text-white ${color}`}>
        {label}
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'paid' && new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Wallet Not Connected</CardTitle>
            <CardDescription className="text-slate-400">
              Please connect your wallet to view payment tracking
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
            <div className="flex items-center">
              <Link href="/exporter" className="mr-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Payment Tracking</h1>
                <p className="text-sm text-slate-400">
                  Monitor payment status and send reminders to importers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              title: 'Total Outstanding', 
              value: formatCurrency(filteredPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.totalDue, 0)),
              icon: DollarSign,
              color: 'text-slate-400'
            },
            { 
              title: 'Paid This Month', 
              value: formatCurrency(filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.totalDue, 0)),
              icon: CheckCircle,
              color: 'text-green-400'
            },
            { 
              title: 'Overdue Payments', 
              value: filteredPayments.filter(p => p.status === 'overdue').length.toString(),
              icon: AlertCircle,
              color: 'text-red-400'
            },
            { 
              title: 'Pending Links', 
              value: filteredPayments.filter(p => p.status === 'pending').length.toString(),
              icon: Clock,
              color: 'text-yellow-400'
            }
          ].map((stat, index) => (
            <Card key={index} className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Payment Pending</SelectItem>
                    <SelectItem value="link_sent">Link Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Payment Records ({filteredPayments.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Manage payment links and track importer payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-slate-700 rounded mb-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`p-6 rounded-lg border transition-colors ${
                      payment.status === 'overdue' 
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
                          <Badge variant="outline" className="text-xs">
                            NFT #{payment.tokenId}
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(payment.paymentLink, payment.invoiceNumber)}
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

                        {payment.status === 'link_sent' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendReminder(payment.id)}
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            Send Reminder ({payment.remindersSent})
                          </Button>
                        )}
                      </div>

                      <div className="text-sm text-slate-400">
                        {payment.status === 'paid' && payment.paidAt && (
                          <span className="text-green-400">
                            Paid on {formatDate(payment.paidAt)}
                          </span>
                        )}
                        {payment.status === 'link_sent' && payment.sentAt && (
                          <span>
                            Sent on {formatDate(payment.sentAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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