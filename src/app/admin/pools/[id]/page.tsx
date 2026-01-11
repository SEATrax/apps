'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  DollarSign,
  FileText,
  Users,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp,
  Banknote,
  Target,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatAddress } from '@/lib/utils';
import type { Pool, Invoice } from '@/types';

interface PoolData {
  poolId: bigint;
  name: string;
  startDate: bigint;
  endDate: bigint;
  invoiceIds: bigint[];
  totalLoanAmount: bigint;
  totalShippingAmount: bigint;
  amountInvested: bigint;
  amountDistributed: bigint;
  feePaid: bigint;
  status: number;
  createdAt: bigint;
}

interface PoolMetadata {
  id: number;
  pool_id: number;
  description: string | null;
  risk_category: 'low' | 'medium' | 'high';
  created_at: string;
}

interface InvoiceWithMetadata {
  tokenId: bigint;
  exporter: string;
  exporterCompany: string;
  importerCompany: string;
  importerEmail: string;
  shippingDate: bigint;
  shippingAmount: bigint;
  loanAmount: bigint;
  amountInvested: bigint;
  amountWithdrawn: bigint;
  status: number;
  poolId: bigint;
  ipfsHash: string;
  createdAt: bigint;
  metadata?: {
    invoice_number: string;
    importer_name: string;
    goods_description: string;
  };
}

interface Investment {
  investor: string;
  amount: bigint;
  percentage: number;
  timestamp: number;
}

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;
  
  const { isLoaded, isConnected, address } = useWalletSession();
  const { 
    checkUserRoles,
    getPool,
    getPoolFundingPercentage,
    distributeProfits,
    getInvoice,
    markInvoicePaid,
    getPoolInvestors,
    isLoading 
  } = useSEATrax();
  
  const [userRoles, setUserRoles] = useState<any>(null);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [poolMetadata, setPoolMetadata] = useState<PoolMetadata | null>(null);
  const [invoices, setInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [fundingPercentage, setFundingPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check admin role and redirect if not admin
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
      return;
    }

    if (isLoaded && isConnected && !isLoading && address) {
      checkUserRoles(address).then((roles) => {
        setUserRoles(roles);
        if (!roles?.isAdmin) {
          router.push('/');
        }
      });
    }
  }, [isLoaded, isConnected, isLoading, address, checkUserRoles, router]);

  // Load pool data when admin role is confirmed
  useEffect(() => {
    if (userRoles?.isAdmin && poolId) {
      loadPoolData();
    }
  }, [userRoles, poolId]);

  const loadPoolData = async () => {
    try {
      setLoading(true);
      
      // Get pool data from smart contract
      const poolData = await getPool(BigInt(poolId));
      if (!poolData) {
        throw new Error('Pool not found');
      }
      setPool(poolData);

      // Get pool metadata from Supabase
      const { data: metadata, error: metadataError } = await supabase
        .from('pool_metadata')
        .select('*')
        .eq('pool_id', poolId)
        .single();

      if (!metadataError) {
        setPoolMetadata(metadata);
      }

      // Get funding percentage
      const percentage = await getPoolFundingPercentage(BigInt(poolId));
      setFundingPercentage(Number(percentage));

      // Load invoices data
      const invoicesData: InvoiceWithMetadata[] = [];
      for (const invoiceId of poolData.invoiceIds) {
        try {
          const invoiceData = await getInvoice(invoiceId);
          if (invoiceData) {
            // Get metadata from Supabase
            const { data: invMetadata } = await supabase
              .from('invoice_metadata')
              .select('*')
              .eq('token_id', Number(invoiceId))
              .single();

            invoicesData.push({
              ...invoiceData,
              metadata: invMetadata ? {
                invoice_number: invMetadata.invoice_number,
                importer_name: invMetadata.importer_name || 'Unknown',
                goods_description: invMetadata.goods_description || '',
              } : undefined
            });
          }
        } catch (error) {
          console.error(`Failed to load invoice ${invoiceId}:`, error);
        }
      }
      setInvoices(invoicesData);

      // TODO: Load investments data from contract events
      // This would require implementing event listening or keeping investment records

    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load pool data: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // REMOVED: handleAllocateFunds - funds auto-distribute at 100%

  const handleDistributeProfits = async () => {
    if (!pool) return;

    try {
      setActionLoading('distribute');
      setMessage(null);

      const result = await distributeProfits(BigInt(poolId));
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to distribute profits');
      }
      
      setMessage({ type: 'success', text: 'Profits distributed successfully!' });
      
      // Reload pool data
      await loadPoolData();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to distribute profits' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (invoiceId: bigint) => {
    try {
      setActionLoading(`paid-${invoiceId}`);
      setMessage(null);

      await markInvoicePaid(invoiceId);
      
      setMessage({ type: 'success', text: 'Invoice marked as paid successfully!' });
      
      // Reload pool data
      await loadPoolData();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to mark invoice as paid' });
    } finally {
      setActionLoading(null);
    }
  };

  const getPoolStatus = () => {
    if (!pool) return 'Unknown';
    
    // Handle both string and number status types
    const status = pool.status as any;
    if (typeof status === 'string') {
      return status;
    }
    
    switch (status) {
      case 0: return 'Open';
      case 1: return 'Fundraising';
      case 2: return 'PartiallyFunded';
      case 3: return 'Funded';
      case 4: return 'Settling';
      case 5: return 'Completed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!pool) return 'bg-gray-600';
    
    // Handle both string and number status types
    const status = pool.status as any;
    
    if (typeof status === 'string') {
      switch (status) {
        case 'Open': return 'bg-blue-600';
        case 'Fundraising': return 'bg-yellow-600';
        case 'PartiallyFunded': return 'bg-orange-600';
        case 'Funded': return 'bg-green-600';
        case 'Settling': return 'bg-purple-600';
        case 'Completed': return 'bg-emerald-600';
        default: return 'bg-gray-600';
      }
    }
    
    switch (status) {
      case 0: return 'bg-blue-600'; // Open
      case 1: return 'bg-yellow-600'; // Fundraising
      case 2: return 'bg-orange-600'; // PartiallyFunded
      case 3: return 'bg-green-600'; // Funded
      case 4: return 'bg-purple-600'; // Settling
      case 5: return 'bg-emerald-600'; // Completed
      default: return 'bg-gray-600';
    }
  };

  // Helper function to get invoice status class (handles both string and number status)
  const getInvoiceStatusClass = (status: any) => {
    if (typeof status === 'string') {
      switch (status) {
        case 'PENDING': return 'bg-yellow-600';
        case 'FINALIZED': return 'bg-blue-600'; 
        case 'FUNDRAISING': return 'bg-green-600';
        case 'FUNDED': return 'bg-cyan-600';
        case 'WITHDRAWN': return 'bg-purple-600';
        case 'PAID': return 'bg-emerald-600';
        default: return 'bg-gray-600';
      }
    }
    
    switch (status) {
      case 0: return 'bg-yellow-600'; // Pending
      case 1: return 'bg-blue-600'; // Finalized
      case 2: return 'bg-green-600'; // Fundraising
      case 3: return 'bg-cyan-600'; // Funded
      case 4: return 'bg-purple-600'; // Withdrawn
      case 5: return 'bg-emerald-600'; // Paid
      default: return 'bg-gray-600';
    }
  };

  // Helper function to get invoice status text (handles both string and number status)
  const getInvoiceStatusText = (status: any) => {
    if (typeof status === 'string') return status;
    
    switch (status) {
      case 0: return 'PENDING';
      case 1: return 'FINALIZED';
      case 2: return 'FUNDRAISING';
      case 3: return 'FUNDED';
      case 4: return 'WITHDRAWN';
      case 5: return 'PAID';
      default: return 'UNKNOWN';
    }
  };

  // Helper function to check if invoice is funded (handles both string and number status)
  const isFunded = (status: any) => {
    return (typeof status === 'string' && status === 'FUNDED') || status === 3;
  };

  // REMOVED: canAllocateFunds - funds auto-distribute at 100%

  const canDistributeProfits = () => {
    if (!pool) return false;
    
    // Check if all invoices in the pool are marked as paid
    const allInvoicesPaid = invoices.every(invoice => {
      const status = invoice.status as any;
      return typeof status === 'string' ? status === 'PAID' : status === 4;
    });
    
    const poolStatus = pool.status as any;
    const isFunded = typeof poolStatus === 'string' ? poolStatus === 'Funded' : poolStatus === 3;
    
    return allInvoicesPaid && isFunded;
  };

  // Show loading if checking roles or not connected
  if (!isLoaded || !isConnected || isLoading || !userRoles?.hasAdminRole || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading pool details...</div>
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Pool not found or failed to load.
            </AlertDescription>
          </Alert>
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
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/pools">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pools
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {pool.name}
              </h1>
              <p className="text-gray-400 mt-1">
                Pool #{poolId} • {poolMetadata?.description || 'Investment Pool Management'}
              </p>
            </div>
            <div className="ml-auto">
              <Badge className={getStatusColor()}>
                {getPoolStatus()}
              </Badge>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Pool Size</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(Number(pool.totalLoanAmount) / 100)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Funded</p>
                    <p className="text-lg font-bold text-white">
                      {fundingPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Invoices</p>
                    <p className="text-lg font-bold text-white">
                      {pool.invoiceIds.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Expected Yield</p>
                    <p className="text-lg font-bold text-white">4%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funding Progress */}
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Funding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatCurrency(Number(pool.amountInvested) / 1e18 * 3000)} raised
                  </span>
                  <span className="text-gray-400">
                    {formatCurrency(Number(pool.totalLoanAmount) / 100)} target
                  </span>
                </div>
                <Progress value={fundingPercentage} className="h-3" />
                <div className="text-center">
                  {fundingPercentage >= 100 && (
                    <Badge className="bg-green-600 text-white">
                      100% funded - Funds auto-distributed to exporters
                    </Badge>
                  )}
                  {fundingPercentage >= 70 && fundingPercentage < 100 && (
                    <Badge className="bg-cyan-600 text-white">
                      {fundingPercentage.toFixed(0)}% funded - Exporters can withdraw
                    </Badge>
                  )}
                </div>
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

        {/* Admin Actions */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Pool Management Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Distribute profits when all invoices are paid (auto-distribution happens at 100% funding)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-cyan-900/20 border-cyan-800">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              <AlertDescription className="text-cyan-300">
                📢 Funds automatically distribute to exporters when pool reaches 100% funding. No manual allocation needed.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleDistributeProfits}
                disabled={!canDistributeProfits() || actionLoading === 'distribute'}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {actionLoading === 'distribute' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Distributing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Distribute Profits
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 text-sm space-y-2">
              <p className="text-gray-400">
                • <strong>Allocate Funds:</strong> Available when pool is 70%+ funded. Sends funds to exporters for withdrawal.
              </p>
              <p className="text-gray-400">
                • <strong>Distribute Profits:</strong> Available when all invoices are marked as paid. Distributes 4% yield to investors.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="invoices" className="text-gray-400 data-[state=active]:text-white">
              Invoices ({pool.invoiceIds.length})
            </TabsTrigger>
            <TabsTrigger value="investments" className="text-gray-400 data-[state=active]:text-white">
              Investments ({investments.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-400 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            {invoices.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No invoices in this pool</h3>
                </CardContent>
              </Card>
            ) : (
              invoices.map((invoice) => (
                <Card key={invoice.tokenId} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                          </h3>
                          <Badge className={getInvoiceStatusClass(invoice.status)}>
                            {getInvoiceStatusText(invoice.status)}
                          </Badge>
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
                            <p className="text-gray-400 text-sm">Shipping Date</p>
                            <p className="text-white">{formatDate(Number(invoice.shippingDate) * 1000)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm">Amount Invested</p>
                            <p className="text-green-400 font-medium">
                              {formatCurrency(Number(invoice.amountInvested) / 1e18 * 3000)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Amount Withdrawn</p>
                            <p className="text-yellow-400 font-medium">
                              {formatCurrency(Number(invoice.amountWithdrawn) / 1e18 * 3000)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Available for Withdrawal</p>
                            <p className="text-purple-400 font-medium">
                              {formatCurrency((Number(invoice.amountInvested) - Number(invoice.amountWithdrawn)) / 1e18 * 3000)}
                            </p>
                          </div>
                        </div>

                        {invoice.metadata?.goods_description && (
                          <p className="text-gray-400 text-sm">
                            <strong>Goods:</strong> {invoice.metadata.goods_description}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {isFunded(invoice.status) && (
                          <Button
                            onClick={() => handleMarkPaid(BigInt(invoice.tokenId))}
                            disabled={actionLoading === `paid-${invoice.tokenId}`}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
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
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Investor List</CardTitle>
                <CardDescription className="text-gray-400">
                  Track individual investments and returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-center py-8">
                  Investment tracking will be implemented via contract events listening.
                  This feature requires additional backend infrastructure to index blockchain events.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Pool Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Pool Value</span>
                      <span className="text-white font-bold">
                        {formatCurrency(Number(pool.totalLoanAmount) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Value Coverage</span>
                      <span className="text-white font-bold">
                        {formatCurrency(Number(pool.totalLoanAmount) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Returns</span>
                      <span className="text-green-400 font-bold">
                        {formatCurrency((Number(pool.totalLoanAmount) * 0.04) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform Fee (1%)</span>
                      <span className="text-yellow-400 font-bold">
                        {formatCurrency((Number(pool.totalLoanAmount) * 0.01) / 100)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Category</span>
                      <Badge className={
                        poolMetadata?.risk_category === 'low' ? 'bg-green-600' :
                        poolMetadata?.risk_category === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                      }>
                        {poolMetadata?.risk_category?.toUpperCase() || 'MEDIUM'} RISK
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diversification</span>
                      <span className="text-white">{pool.invoiceIds.length} invoices</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool Duration</span>
                      <span className="text-white">
                        {Math.ceil((Number(pool.endDate) - Number(pool.startDate)) / (24 * 60 * 60))} days
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}