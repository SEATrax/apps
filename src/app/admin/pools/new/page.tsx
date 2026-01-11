'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  ArrowRight,
  Plus,
  DollarSign, 
  Calendar,
  FileText,
  Building2,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice } from '@/types';

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
    created_at: string;
  };
}

export default function CreatePoolPage() {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { checkUserRoles, createPool, getInvoice, getAllApprovedInvoices, isLoading } = useSEATrax();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userRoles, setUserRoles] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Step 1: Pool Metadata
  const [poolName, setPoolName] = useState('');
  const [poolDescription, setPoolDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [riskCategory, setRiskCategory] = useState<'low' | 'medium' | 'high'>('medium');

  // Step 2: Invoice Selection
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<bigint[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

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

  // Load finalized invoices when admin role is confirmed
  useEffect(() => {
    if (userRoles?.isAdmin) {
      loadFinalizedInvoices();
    }
  }, [userRoles]);

  const loadFinalizedInvoices = async () => {
    try {
      setLoadingInvoices(true);
      
      // Get all approved invoices from smart contract
      const approvedInvoiceIds = await getAllApprovedInvoices();
      
      // Get metadata from Supabase
      const { data: metadataList, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (metadataError) throw metadataError;

      // Get full invoice data and combine with metadata
      const finalizedInvoices: InvoiceWithMetadata[] = [];
      
      for (const invoiceId of approvedInvoiceIds) {
        try {
          const invoiceData = await getInvoice(invoiceId);
          const metadata = metadataList?.find(m => m.token_id === Number(invoiceId));
          
          // Only include if not already in a pool (poolId === 0)
          if (invoiceData && Number(invoiceData.poolId) === 0) {
            finalizedInvoices.push({
              ...invoiceData,
              metadata: {
                invoice_number: metadata?.invoice_number || `Invoice #${invoiceId}`,
                importer_name: metadata?.importer_name || 'Unknown',
                goods_description: metadata?.goods_description || '',
                created_at: metadata?.created_at || new Date().toISOString(),
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch invoice ${invoiceId}:`, error);
        }
      }

      setAvailableInvoices(finalizedInvoices);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load invoices: ' + error.message });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceToggle = (invoiceId: bigint, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const calculateTotals = () => {
    const selectedInvoiceData = availableInvoices.filter(inv => 
      selectedInvoices.includes(BigInt(inv.tokenId))
    );
    
    const totalLoanAmount = selectedInvoiceData.reduce(
      (sum, inv) => sum + Number(inv.loanAmount), 0
    );
    
    const totalShippingAmount = selectedInvoiceData.reduce(
      (sum, inv) => sum + Number(inv.shippingAmount), 0
    );

    return { totalLoanAmount, totalShippingAmount, count: selectedInvoices.length };
  };

  const validateStep1 = () => {
    if (!poolName.trim()) {
      setMessage({ type: 'error', text: 'Pool name is required' });
      return false;
    }
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Start and end dates are required' });
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setMessage({ type: 'error', text: 'End date must be after start date' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (selectedInvoices.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one invoice' });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setMessage(null);
    
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleCreatePool = async () => {
    if (!validateStep1() || !validateStep2()) return;

    try {
      setCreating(true);
      setMessage(null);

      // Convert dates to timestamps (in seconds)
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

      // Create pool with invoices, dates, and name
      // Signature: createPool(name, invoiceIds, startDate, endDate)
      const result = await createPool(
        poolName,
        selectedInvoices,
        startTimestamp,
        endTimestamp
      );
      
      if (!result.success || !result.poolId) {
        throw new Error(result.error || 'Failed to create pool');
      }

      // Save metadata to Supabase
      const { error: metadataError } = await supabase
        .from('pool_metadata')
        .insert({
          pool_id: Number(result.poolId),
          description: poolDescription,
          risk_category: riskCategory,
        });

      if (metadataError) {
        console.error('Metadata save error:', metadataError);
        // Don't throw - pool was created successfully on-chain
      }

      setMessage({ 
        type: 'success', 
        text: `Pool created successfully! Pool ID: ${result.poolId}. Pool is now open for investments.` 
      });

      // Redirect to pool detail page after a short delay
      setTimeout(() => {
        router.push(`/admin/pools/${result.poolId}`);
      }, 2000);

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create pool' 
      });
    } finally {
      setCreating(false);
    }
  };

  const totals = calculateTotals();

  // Show loading if checking roles or not connected
  if (!isLoaded || !isConnected || isLoading || !userRoles?.isAdmin) {
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
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/pools">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pools
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Create Investment Pool
              </h1>
              <p className="text-gray-400 mt-1">
                Set up a new investment pool with approved invoices
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step <= currentStep ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'}
                `}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${step <= currentStep ? 'text-white' : 'text-slate-400'}`}>
                  {step === 1 && 'Pool Details'}
                  {step === 2 && 'Select Invoices'}
                  {step === 3 && 'Review & Create'}
                </span>
                {step < 3 && <ArrowRight className="h-4 w-4 text-slate-600 ml-4" />}
              </div>
            ))}
          </div>
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

        {/* Step 1: Pool Metadata */}
        {currentStep === 1 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Pool Details</CardTitle>
              <CardDescription className="text-gray-400">
                Configure the basic information for your investment pool
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-gray-400">Pool Name *</Label>
                <Input
                  placeholder="e.g., Southeast Asia Export Pool #5"
                  value={poolName}
                  onChange={(e) => setPoolName(e.target.value)}
                  className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label className="text-gray-400">Description</Label>
                <Textarea
                  placeholder="Brief description of this investment pool..."
                  value={poolDescription}
                  onChange={(e) => setPoolDescription(e.target.value)}
                  className="mt-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-400">Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">End Date *</Label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400">Risk Category</Label>
                <div className="flex gap-4 mt-2">
                  {(['low', 'medium', 'high'] as const).map((risk) => (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => setRiskCategory(risk)}
                      className={`
                        px-4 py-2 rounded-lg border transition-all
                        ${riskCategory === risk 
                          ? 'bg-cyan-600 border-cyan-600 text-white' 
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-500'
                        }
                      `}
                    >
                      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextStep} className="bg-cyan-600 hover:bg-cyan-700">
                  Next: Select Invoices
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Invoice Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Select Invoices</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose approved invoices to include in this investment pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInvoices ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
                    <p className="text-gray-400">Loading available invoices...</p>
                  </div>
                ) : availableInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No approved invoices available</h3>
                    <p className="text-gray-500">
                      There are no approved invoices that can be added to a pool.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableInvoices.map((invoice) => (
                      <div
                        key={invoice.tokenId}
                        className="border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedInvoices.includes(BigInt(invoice.tokenId))}
                            onCheckedChange={(checked) => 
                              handleInvoiceToggle(BigInt(invoice.tokenId), checked as boolean)
                            }
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-white">
                                {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                              </h4>
                              <Badge className="bg-green-600 text-white">
                                Approved
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">Exporter</p>
                                <p className="text-white">Exporter: #{invoice.tokenId}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Importer</p>
                                <p className="text-white">{invoice.metadata?.importer_name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Loan Amount</p>
                                <p className="text-cyan-400 font-bold">
                                  {formatCurrency(Number(invoice.loanAmount) / 100)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Shipping Date</p>
                                <p className="text-white">{formatDate(Number(invoice.shippingDate) * 1000)}</p>
                              </div>
                            </div>

                            {invoice.metadata?.goods_description && (
                              <p className="text-gray-400 text-sm mt-2">
                                {invoice.metadata.goods_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {totals.count > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Selection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400">Selected Invoices</p>
                      <p className="text-2xl font-bold text-white">{totals.count}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Loan Amount</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(totals.totalLoanAmount / 100)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Total Shipping Value</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency(totals.totalShippingAmount / 100)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button onClick={handlePrevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleNextStep} 
                disabled={selectedInvoices.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Next: Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Review Pool Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Review all details before creating the investment pool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pool Details Review */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pool Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Pool Name</p>
                      <p className="text-white font-medium">{poolName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Risk Category</p>
                      <Badge className={
                        riskCategory === 'low' ? 'bg-green-600' :
                        riskCategory === 'high' ? 'bg-red-600' : 'bg-yellow-600'
                      }>
                        {riskCategory.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400">Start Date</p>
                      <p className="text-white font-medium">
                        {new Date(startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">End Date</p>
                      <p className="text-white font-medium">
                        {new Date(endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {poolDescription && (
                    <div className="mt-4">
                      <p className="text-gray-400">Description</p>
                      <p className="text-white">{poolDescription}</p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Financial Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-700 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Total Invoices</p>
                      <p className="text-2xl font-bold text-white">{totals.count}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Pool Size (Loan Amount)</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatCurrency(totals.totalLoanAmount / 100)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Expected Yield (4%)</p>
                      <p className="text-2xl font-bold text-green-400">
                        {formatCurrency((totals.totalLoanAmount * 0.04) / 100)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Invoices List */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Selected Invoices ({totals.count})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableInvoices
                      .filter(inv => selectedInvoices.includes(BigInt(inv.tokenId)))
                      .map((invoice) => (
                        <div key={invoice.tokenId} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                          <div>
                            <p className="text-white font-medium">
                              {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                            </p>
                            <p className="text-gray-400 text-sm">Invoice #{invoice.tokenId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-cyan-400 font-bold">
                              {formatCurrency(Number(invoice.loanAmount) / 100)}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={handlePrevStep} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleCreatePool} 
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Pool...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Pool
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}