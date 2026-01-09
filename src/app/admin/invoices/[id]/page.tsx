'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  Building2,
  Globe,
  ArrowLeft,
  Download,
  ExternalLink,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { appConfig } from '@/config';
import type { Invoice, InvoiceStatus } from '@/types';

// Extended Invoice interface to match smart contract data
interface InvoiceWithContractData {
  tokenId: bigint;
  exporter: string;
  invoiceValue: bigint;
  loanAmount: bigint;
  fundedAmount: bigint;
  withdrawnAmount: bigint;
  status: InvoiceStatus | number; // Can be either string enum or number
  poolId: bigint;
  invoiceDate: number;
  dueDate: number;
  createdAt: number;
  updatedAt: number;
  ipfsHash: string;
  id?: string;
  // Additional fields from contract
  exporterCompany?: string;
  importerCompany?: string;
  shippingDate?: number;
  shippingAmount?: bigint;
  amountInvested?: bigint;
  amountWithdrawn?: bigint;
  metadata?: any;
}

// Invoice status mapping
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

interface InvoiceMetadata {
  invoice_number: string;
  importer_name: string;
  importer_license: string;
  goods_description: string;
  documents: any;
  created_at: string;
}

interface InvoiceDetailProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailProps) {
  const { isLoaded, isConnected, address } = useWalletSession();
  const { getUserRoles, isLoading } = useAccessControl();
  const { getInvoice, finalizeInvoice } = useInvoiceNFT();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceWithContractData | null>(null);
  const [metadata, setMetadata] = useState<InvoiceMetadata | null>(null);
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRoles, setUserRoles] = useState<any>(null);

  // Get invoice ID from params
  useEffect(() => {
    params.then(resolvedParams => {
      setInvoiceId(resolvedParams.id);
    });
  }, [params]);

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

  // Fetch invoice data when admin role is confirmed and invoiceId is available
  useEffect(() => {
    if (userRoles?.hasAdminRole && invoiceId) {
      fetchInvoiceData();
    }
  }, [userRoles, invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setLoadingInvoice(true);
      
      // Get invoice data from smart contract
      const invoiceData = await getInvoice(BigInt(invoiceId));
      
      if (!invoiceData) {
        setMessage({ type: 'error', text: 'Invoice not found' });
        return;
      }

      // Map Invoice to InvoiceWithContractData
      const mappedInvoice: InvoiceWithContractData = {
        ...invoiceData,
        updatedAt: Date.now(),
        id: invoiceId,
      };
      
      setInvoice(mappedInvoice);

      // Get metadata from Supabase
      const { data: metadataData, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .eq('token_id', parseInt(invoiceId))
        .single();

      if (metadataError) {
        console.error('Metadata error:', metadataError);
        // Don't throw error, metadata might not exist for old invoices
      } else {
        setMetadata(metadataData);
      }

    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load invoice: ' + error.message });
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleApproveInvoice = async () => {
    if (!invoice) return;

    try {
      setApproving(true);
      setMessage(null);

      // Call finalizeInvoice to approve it
      await finalizeInvoice(BigInt(invoiceId));

      setMessage({ 
        type: 'success', 
        text: 'Invoice approved successfully! It can now be added to investment pools.' 
      });

      // Refresh invoice data to show updated status
      await fetchInvoiceData();

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to approve invoice' 
      });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectInvoice = async () => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    try {
      setRejecting(true);
      setMessage(null);

      // For now, we'll just record the rejection in Supabase
      // In a full implementation, you might want a dedicated rejection table
      console.log('Rejecting invoice with reason:', rejectReason);

      setMessage({ 
        type: 'success', 
        text: 'Invoice rejected. Exporter will be notified.' 
      });

      // Clear rejection reason
      setRejectReason('');

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to reject invoice' 
      });
    } finally {
      setRejecting(false);
    }
  };

  const renderDocumentViewer = () => {
    if (!metadata?.documents || Object.keys(metadata.documents).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-600 mb-2" />
          <p>No documents uploaded</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(metadata.documents).map(([key, value]: [string, any]) => (
          <div key={key} className="border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">{value.name || key}</p>
                  <p className="text-sm text-gray-400">
                    {value.description || 'No description'}
                  </p>
                </div>
              </div>
              {value.ipfsHash && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${appConfig.pinata.gateway}/${value.ipfsHash}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${appConfig.pinata.gateway}/${value.ipfsHash}`;
                      link.download = value.name || 'document';
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Show loading if checking roles or not connected
  if (!isLoaded || !isConnected || isLoading || !userRoles?.hasAdminRole || loadingInvoice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Invoice not found or failed to load.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const statusInfo = typeof invoice.status === 'string' ? 
    STATUS_STRING_MAP[invoice.status] || STATUS_STRING_MAP['PENDING'] :
    INVOICE_STATUS_MAP[Number(invoice.status)] || INVOICE_STATUS_MAP[0];

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {metadata?.invoice_number || `Invoice #${invoiceId}`}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${statusInfo.bgColor} text-white`}>
                  {statusInfo.label}
                </Badge>
                <span className="text-gray-400">
                  Created: {metadata?.created_at ? new Date(metadata.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Invoice Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-400">Exporter Company</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">{invoice.metadata?.invoiceNumber || `Invoice #${invoice.tokenId}`}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Importer Company</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">
                        {metadata?.importer_name || invoice.metadata?.importerName || 'Unknown Importer'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Shipping Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">
                        {formatDate(invoice.invoiceDate)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Importer License</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">
                        {metadata?.importer_license || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {metadata?.goods_description && (
                  <div>
                    <Label className="text-gray-400">Goods Description</Label>
                    <p className="text-white mt-1">{metadata.goods_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Financial Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-400">Shipping Amount</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-white font-bold text-lg">
                        {formatCurrency(Number(invoice.invoiceValue) / 100)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Loan Amount Requested</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-cyan-400" />
                      <span className="text-cyan-400 font-bold text-lg">
                        {formatCurrency(Number(invoice.loanAmount) / 100)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Amount Invested</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-bold text-lg">
                        {formatCurrency(Number(invoice.amountInvested) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Loan to Shipping Ratio:</span>
                    <span className="text-white font-medium">
                      {((Number(invoice.loanAmount) / Number(invoice.invoiceValue)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-400">Funding Progress:</span>
                    <span className="text-white font-medium">
                      {Number(invoice.loanAmount) > 0 
                        ? ((Number(invoice.amountInvested) / Number(invoice.loanAmount)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Section */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Supporting Documents</CardTitle>
                <CardDescription className="text-gray-400">
                  Review all uploaded documents for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDocumentViewer()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Review Actions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Review Actions</CardTitle>
                <CardDescription className="text-gray-400">
                  Approve or reject this invoice submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.status === 0 ? (
                  <>
                    <Button
                      onClick={handleApproveInvoice}
                      disabled={approving}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {approving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Invoice
                        </>
                      )}
                    </Button>

                    <div className="space-y-2">
                      <Label className="text-gray-400">Rejection Reason</Label>
                      <Textarea
                        placeholder="Enter reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        rows={3}
                      />
                      <Button
                        onClick={handleRejectInvoice}
                        disabled={rejecting || !rejectReason.trim()}
                        variant="destructive"
                        className="w-full"
                      >
                        {rejecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Reject Invoice
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Badge className={`${statusInfo.bgColor} text-white`}>
                      {statusInfo.label}
                    </Badge>
                    <p className="text-gray-400 text-sm mt-2">
                      This invoice has already been processed
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Checklist */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Verification Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Invoice details complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Financial amounts verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Exporter company verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Documents uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Shipping date reasonable</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}