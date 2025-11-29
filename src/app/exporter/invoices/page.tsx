'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface Invoice {
  id: number;
  tokenId?: number;
  invoiceNumber: string;
  importerCompany: string;
  exporterCompany: string;
  shippingAmount: number;
  loanAmount: number;
  amountInvested: number;
  amountWithdrawn: number;
  status: 'pending' | 'finalized' | 'fundraising' | 'funded' | 'paid' | 'cancelled';
  shippingDate: string;
  createdAt: string;
  fundedPercentage: number;
}

export default function InvoiceList() {
  const { address, isConnected, mockUser, setMockUser } = usePanna();
  const { getInvoicesByExporter, getInvoice, InvoiceStatus } = useInvoiceNFT();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);

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

  useEffect(() => {
    if (isConnected && address) {
      loadInvoices();
    }
  }, [isConnected, address]);

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
      
      // Get invoice token IDs from smart contract
      const tokenIds = await getInvoicesByExporter(address);
      
      if (tokenIds.length === 0) {
        setInvoices([]);
        return;
      }
      
      // Fetch invoice data from smart contract and metadata from Supabase
      const invoicePromises = tokenIds.map(async (tokenId) => {
        try {
          const contractInvoice = await getInvoice(tokenId);
          if (!contractInvoice) return null;
          
          // Get metadata from Supabase (if configured)
          let metadata = null;
          if (isSupabaseConfigured) {
            try {
              const { data } = await supabase
                .from('invoice_metadata')
                .select('*')
                .eq('token_id', tokenId)
                .single();
              metadata = data;
            } catch (error) {
              console.warn('Failed to fetch metadata for token', tokenId, error);
            }
          }
          
          // Convert status number to string
          const statusMap: Record<number, 'pending' | 'finalized' | 'fundraising' | 'funded' | 'paid' | 'cancelled'> = {
            [InvoiceStatus.Pending]: 'pending',
            [InvoiceStatus.Finalized]: 'finalized',
            [InvoiceStatus.Fundraising]: 'fundraising',
            [InvoiceStatus.Funded]: 'funded',
            [InvoiceStatus.Paid]: 'paid',
            [InvoiceStatus.Cancelled]: 'cancelled',
          };
          
          const shippingAmount = parseFloat(contractInvoice.shippingAmount) * 3000; // Convert ETH to USD (mock rate)
          const loanAmount = parseFloat(contractInvoice.loanAmount) * 3000;
          const amountInvested = parseFloat(contractInvoice.amountInvested) * 3000;
          const amountWithdrawn = parseFloat(contractInvoice.amountWithdrawn) * 3000;
          
          return {
            id: tokenId,
            tokenId,
            invoiceNumber: metadata?.invoice_number || `INV-${tokenId}`,
            importerCompany: contractInvoice.importerCompany,
            exporterCompany: contractInvoice.exporterCompany,
            shippingAmount,
            loanAmount,
            amountInvested,
            amountWithdrawn,
            status: statusMap[contractInvoice.status] || 'pending',
            shippingDate: new Date(parseInt(contractInvoice.shippingDate) * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0], // Fallback
            fundedPercentage: loanAmount > 0 ? Math.round((amountInvested / loanAmount) * 100) : 0,
          };
        } catch (error) {
          console.error(`Error loading invoice ${tokenId}:`, error);
          return null;
        }
      });
      
      const invoiceResults = await Promise.all(invoicePromises);
      const validInvoices = invoiceResults.filter(Boolean) as Invoice[];
      
      // If no invoices from blockchain, show mock data for demo
      if (validInvoices.length === 0) {
        const mockInvoices: Invoice[] = [
          {
            id: 1,
            tokenId: 1,
            invoiceNumber: 'INV-2024-001',
            importerCompany: 'Global Trading Ltd',
            exporterCompany: 'Southeast Exports Co',
            shippingAmount: 18000,
            loanAmount: 15000,
            amountInvested: 12750,
            amountWithdrawn: 10500,
            status: 'funded',
            shippingDate: '2024-12-15',
            createdAt: '2024-11-25',
            fundedPercentage: 85,
          },
          {
            id: 2,
            tokenId: 2,
            invoiceNumber: 'INV-2024-002',
            importerCompany: 'Asia Import Co',
            exporterCompany: 'Southeast Exports Co',
            shippingAmount: 25000,
            loanAmount: 22000,
            amountInvested: 9900,
            amountWithdrawn: 0,
            status: 'fundraising',
            shippingDate: '2024-12-20',
            createdAt: '2024-11-24',
            fundedPercentage: 45,
          },
          {
            id: 3,
            tokenId: 0,
            invoiceNumber: 'INV-2024-003',
            importerCompany: 'European Goods Inc',
            exporterCompany: 'Southeast Exports Co',
            shippingAmount: 20000,
            loanAmount: 18000,
            amountInvested: 0,
            amountWithdrawn: 0,
            status: 'pending',
            shippingDate: '2024-12-25',
            createdAt: '2024-11-23',
            fundedPercentage: 0,
          },
        ];
        setInvoices(mockInvoices);
      } else {
        setInvoices(validInvoices);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Fallback to empty array on error
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
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    setFilteredInvoices(filtered);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Pending Review', color: 'bg-yellow-600' },
      finalized: { variant: 'outline' as const, label: 'Approved', color: 'bg-blue-600' },
      fundraising: { variant: 'default' as const, label: 'Fundraising', color: 'bg-cyan-600' },
      funded: { variant: 'default' as const, label: 'Funded', color: 'bg-green-600' },
      paid: { variant: 'default' as const, label: 'Paid', color: 'bg-emerald-600' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled', color: 'bg-red-600' },
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Access Required</CardTitle>
            <CardDescription className="text-slate-400">
              Connect your wallet or use the testing environment to access invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug Info */}
            <div className="text-xs text-slate-500 p-2 bg-slate-800 rounded">
              Debug: isConnected={isConnected.toString()}, address={address || 'none'}, mockUser={mockUser?.name || 'none'}
            </div>
            
            {/* Quick Test Login */}
            <Button 
              onClick={() => setMockUser({
                id: 'exporter-1',
                name: 'Southeast Exports Co',
                role: 'exporter',
                address: '0xExporter123...',
                verified: true
              })}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Quick Login as Exporter (Test)
            </Button>
            
            <Link href="/login" className="w-full">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                Go to Login
              </Button>
            </Link>
            <Link href="/testing" className="w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-700">
                Use Testing Environment
              </Button>
            </Link>
          </CardContent>
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
              <h1 className="text-xl font-semibold text-slate-100">My Invoices</h1>
              <p className="text-sm text-slate-400">
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    <SelectItem value="finalized" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Approved</SelectItem>
                    <SelectItem value="fundraising" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Fundraising</SelectItem>
                    <SelectItem value="funded" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Funded</SelectItem>
                    <SelectItem value="paid" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Paid</SelectItem>
                    <SelectItem value="cancelled" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Cancelled</SelectItem>
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
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-700 rounded mb-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length > 0 ? (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
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
                            <Badge variant="outline" className="text-xs">
                              NFT #{invoice.tokenId}
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
                        {invoice.status === 'fundraising' || invoice.status === 'funded' ? (
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
    </div>
  );
}