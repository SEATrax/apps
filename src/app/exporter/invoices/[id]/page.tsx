'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Building, 
  DollarSign, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Wallet,
  Copy,
  Link2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ExporterHeader from '@/components/ExporterHeader';

interface Invoice {
  id: number;
  tokenId: number;
  invoiceNumber: string;
  exporterCompany: string;
  importerCompany: string;
  importerAddress: string;
  importerCountry: string;
  goodsDescription: string;
  shippingAmount: number;
  loanAmount: number;
  amountInvested: number;
  amountWithdrawn: number;
  availableToWithdraw: number;
  status: 'pending' | 'approved' | 'in_pool' | 'funded' | 'withdrawn' | 'paid' | 'completed' | 'rejected';
  shippingDate: string;
  createdAt: string;
  fundedPercentage: number;
  documents: Record<string, any> | Array<{
    name: string;
    hash: string;
    size: number;
  }>;
  withdrawalHistory: Array<{
    amount: number;
    date: string;
    txHash: string;
  }>;
  paymentLink?: string;
}

export default function InvoiceDetail() {
  const { address, isConnected } = usePanna();
  const { getInvoice, withdrawFunds, canWithdraw, isLoading: contractLoading } = useSEATrax();
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [availableToWithdraw, setAvailableToWithdraw] = useState<number>(0);
  const [error, setError] = useState('');
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [documentData, setDocumentData] = useState<Record<string, { filename: string; fileUrl: string; ipfsHash: string }>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (isConnected && address && invoiceId) {
      loadInvoiceData();
    }
  }, [isConnected, address, invoiceId]);

  // Load documents when invoice changes
  useEffect(() => {
    const loadDocuments = async () => {
      if (!invoice?.documents) {
        setLoadingDocs(false);
        return;
      }

      // Handle both empty array and empty object
      const isEmptyArray = Array.isArray(invoice.documents) && invoice.documents.length === 0;
      const isEmptyObject = typeof invoice.documents === 'object' && !Array.isArray(invoice.documents) && Object.keys(invoice.documents).length === 0;
      
      if (isEmptyArray || isEmptyObject) {
        setLoadingDocs(false);
        return;
      }

      console.log('📄 [Exporter] Loading documents from invoice:', invoice.documents);
      setLoadingDocs(true);
      const docs: Record<string, { filename: string; fileUrl: string; ipfsHash: string }> = {};

      // Convert array format to object format if needed
      const documentsToProcess = Array.isArray(invoice.documents) 
        ? invoice.documents.reduce((acc: any, doc: any) => {
            if (doc.ipfsHash || doc.image) {
              acc[doc.name || 'document'] = doc;
            }
            return acc;
          }, {})
        : invoice.documents;

      for (const [key, value] of Object.entries(documentsToProcess)) {
        console.log(`Processing document [${key}]:`, value);
        
        let filename = key;
        let fileUrl = '';
        let ipfsHash = '';

        if (typeof value === 'string') {
          // String format - this is metadata hash, need to fetch and extract actual file
          console.log(`  String format (metadata hash): ${value}`);
          const metadataUrl = `https://gateway.pinata.cloud/ipfs/${value}`;
          console.log(`  Fetching metadata from: ${metadataUrl}`);
          
          try {
            const response = await fetch(metadataUrl);
            const metadataJson = await response.json();
            console.log(`  Metadata JSON:`, metadataJson);
            
            if (metadataJson.image) {
              const imageUri = metadataJson.image;
              console.log(`  Image field from metadata: ${imageUri}`);
              
              if (imageUri.startsWith('ipfs://')) {
                ipfsHash = imageUri.replace('ipfs://', '');
                fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
              } else if (imageUri.startsWith('Qm') || imageUri.startsWith('baf')) {
                ipfsHash = imageUri;
                fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
              } else if (imageUri.includes('/ipfs/')) {
                fileUrl = imageUri;
                const match = imageUri.match(/\/ipfs\/([^/?#]+)/);
                ipfsHash = match ? match[1] : '';
              } else {
                ipfsHash = imageUri;
                fileUrl = `https://gateway.pinata.cloud/ipfs/${imageUri}`;
              }
              
              filename = metadataJson.original_name || metadataJson.name || key;
              console.log(`  Extracted filename: ${filename}`);
              console.log(`  Extracted file URL: ${fileUrl}`);
            } else {
              console.error(`  ❌ No 'image' field in metadata JSON`);
              fileUrl = metadataUrl;
              ipfsHash = value;
            }
          } catch (error) {
            console.error(`  ❌ Failed to fetch metadata:`, error);
            fileUrl = metadataUrl;
            ipfsHash = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          const val = value as any;
          filename = val.original_name || val.name || key;
          console.log(`  Object format, filename: ${filename}`);
          
          if (val.image) {
            const imageUri = val.image;
            console.log(`  Image URI: ${imageUri}`);
            
            if (imageUri.startsWith('ipfs://')) {
              ipfsHash = imageUri.replace('ipfs://', '');
              fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            } else if (imageUri.startsWith('Qm') || imageUri.startsWith('baf')) {
              ipfsHash = imageUri;
              fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            } else if (imageUri.includes('/ipfs/')) {
              fileUrl = imageUri;
              const match = imageUri.match(/\/ipfs\/([^/?#]+)/);
              ipfsHash = match ? match[1] : '';
            } else {
              ipfsHash = imageUri;
              fileUrl = `https://gateway.pinata.cloud/ipfs/${imageUri}`;
            }
            console.log(`  Final URL: ${fileUrl}`);
          }
        }

        if (fileUrl) {
          docs[key] = { filename, fileUrl, ipfsHash };
          console.log(`  ✅ Added to docs:`, docs[key]);
        }
      }

      console.log('📦 [Exporter] Final documentData:', docs);
      setDocumentData(docs);
      setLoadingDocs(false);
    };

    loadDocuments();
  }, [invoice?.documents]);

  const loadInvoiceData = async () => {
    try {
      setIsLoading(true);
      
      const tokenId = BigInt(invoiceId);
      
      // Get invoice data from smart contract
      const contractInvoice = await getInvoice(tokenId);
      
      if (!contractInvoice) {
        setError('Invoice not found');
        return;
      }
      
      // Check available withdrawal amount
      const { canWithdraw: canWithdrawFunds, amount: withdrawableAmount } = await canWithdraw(tokenId);
      setAvailableToWithdraw(Number(withdrawableAmount) / 1e18); // Convert from Wei to ETH
      
      // Get metadata from Supabase
      let metadata = null;
      let paymentLink = `/pay/${invoiceId}`; // Default payment link always available
      
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('invoice_metadata')
          .select('*')
          .eq('token_id', Number(tokenId))
          .single();
        metadata = data;
        
        // Try to get payment link from database (fallback to default)
        const { data: paymentData } = await supabase
          .from('payments')
          .select('payment_link')
          .eq('invoice_id', Number(tokenId))
          .single();
        
        if (paymentData?.payment_link) {
          paymentLink = paymentData.payment_link;
        }
      }
      
      // Map status number to string
      const statusMap: Record<number, Invoice['status']> = {
        [INVOICE_STATUS.PENDING]: 'pending',
        [INVOICE_STATUS.APPROVED]: 'approved',
        [INVOICE_STATUS.IN_POOL]: 'in_pool',
        [INVOICE_STATUS.FUNDED]: 'funded',
        [INVOICE_STATUS.WITHDRAWN]: 'withdrawn',
        [INVOICE_STATUS.PAID]: 'paid',
        [INVOICE_STATUS.COMPLETED]: 'completed',
        [INVOICE_STATUS.REJECTED]: 'rejected',
      };
      
      const shippingAmount = Number(contractInvoice.shippingAmount) / 100; // USD cents to dollars
      const loanAmount = Number(contractInvoice.loanAmount) / 100;
      const amountInvested = Number(contractInvoice.amountInvested) / 1e18 * 3000; // Wei to USD (mock rate)
      const amountWithdrawn = Number(contractInvoice.amountWithdrawn) / 1e18 * 3000;
      const fundedPercentage = loanAmount > 0 ? Math.round((amountInvested / loanAmount) * 100) : 0;
      
      const invoiceData: Invoice = {
        id: Number(tokenId),
        tokenId: Number(tokenId),
        invoiceNumber: metadata?.invoice_number || `INV-${tokenId}`,
        exporterCompany: contractInvoice.exporterCompany,
        importerCompany: contractInvoice.importerCompany,
        importerAddress: metadata?.importer_address || 'N/A',
        importerCountry: metadata?.importer_country || 'N/A',
        goodsDescription: metadata?.goods_description || 'N/A',
        shippingAmount,
        loanAmount,
        amountInvested,
        amountWithdrawn,
        availableToWithdraw: Number(withdrawableAmount) / 1e18 * 3000, // Wei to USD
        status: statusMap[Number(contractInvoice.status)] || 'pending',
        shippingDate: new Date(Number(contractInvoice.shippingDate) * 1000).toISOString().split('T')[0],
        createdAt: new Date(Number(contractInvoice.createdAt) * 1000).toISOString(),
        fundedPercentage,
        documents: metadata?.documents || {},
        withdrawalHistory: [], // TODO: Get from events
        paymentLink, // From Supabase payments table
      };
      
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Failed to load invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!invoice || availableToWithdraw <= 0) return;

    setIsWithdrawing(true);
    setError('');

    try {
      const tokenId = BigInt(invoiceId);
      const result = await withdrawFunds(tokenId);
      
      if (result.success) {
        // Refresh invoice data
        await loadInvoiceData();
        setError('');
      } else {
        setError(result.error || 'Failed to withdraw funds');
      }
    } catch (error: any) {
      console.error('Error withdrawing funds:', error);
      setError(error.message || 'Failed to withdraw funds. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      pending: { variant: 'secondary' as const, label: 'Pending Review', color: 'bg-yellow-600' },
      approved: { variant: 'outline' as const, label: 'Approved', color: 'bg-blue-600' },
      in_pool: { variant: 'default' as const, label: 'In Pool', color: 'bg-cyan-600' },
      funded: { variant: 'default' as const, label: 'Funded', color: 'bg-green-600' },
      withdrawn: { variant: 'default' as const, label: 'Withdrawn', color: 'bg-purple-600' },
      paid: { variant: 'default' as const, label: 'Paid', color: 'bg-emerald-600' },
      completed: { variant: 'default' as const, label: 'Completed', color: 'bg-teal-600' },
      rejected: { variant: 'destructive' as const, label: 'Rejected', color: 'bg-red-600' },
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocumentViewer = () => {
    if (!invoice?.documents) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-600 mb-2" />
          <p>No documents uploaded</p>
        </div>
      );
    }

    // Handle both empty array and empty object
    const isEmptyArray = Array.isArray(invoice.documents) && invoice.documents.length === 0;
    const isEmptyObject = typeof invoice.documents === 'object' && !Array.isArray(invoice.documents) && Object.keys(invoice.documents).length === 0;
    
    if (isEmptyArray || isEmptyObject) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-600 mb-2" />
          <p>No documents uploaded</p>
        </div>
      );
    }

    if (loadingDocs) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
          <p>Loading documents...</p>
        </div>
      );
    }

    // Helper function to get file type icon
    const getFileTypeIcon = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return '📄';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return '🖼️';
      if (['doc', 'docx'].includes(ext || '')) return '📝';
      if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
      return '📎';
    };

    // Helper function to determine file type for preview
    const getFileType = (filename: string): 'pdf' | 'image' | 'other' => {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
      return 'other';
    };

    // Helper function to handle downloads with correct filename
    const handleDownload = (fileUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (Object.keys(documentData).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-600 mb-2" />
          <p>No documents available</p>
        </div>
      );
    }

    const toggleDoc = (key: string) => {
      setExpandedDocs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="space-y-4">
        {Object.entries(documentData).map(([key, doc]) => {
          const fileType = getFileType(doc.filename);
          const fileIcon = getFileTypeIcon(doc.filename);
          const isExpanded = expandedDocs[key] || false;

          return (
            <div key={key} className="border border-slate-600 rounded-lg overflow-hidden bg-slate-800">
              {/* File Header - Clickable to expand/collapse */}
              <div 
                className="bg-slate-700 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-650"
                onClick={() => toggleDoc(key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{fileIcon}</span>
                  <div>
                    <p className="font-medium text-white">{doc.filename}</p>
                    {doc.ipfsHash && (
                      <p className="text-sm text-gray-400">
                        IPFS: {doc.ipfsHash.substring(0, 8)}...{doc.ipfsHash.substring(doc.ipfsHash.length - 6)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(doc.fileUrl, '_blank');
                    }}
                    className="border-slate-500 text-slate-200 hover:bg-slate-600"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.fileUrl, doc.filename);
                    }}
                    className="border-slate-500 text-slate-200 hover:bg-slate-600"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </Button>
                </div>
              </div>

              {/* File Preview - Collapsible */}
              {isExpanded && (
                <div className="bg-slate-900">
                  {fileType === 'pdf' && (
                    <iframe
                      src={`${doc.fileUrl}#view=FitH`}
                      className="w-full border-0"
                      style={{ height: '600px' }}
                      title={doc.filename}
                    />
                  )}
                  {fileType === 'image' && (
                    <div className="p-4 flex justify-center">
                      <img
                        src={doc.fileUrl}
                        alt={doc.filename}
                        className="max-w-full rounded"
                        style={{ maxHeight: '500px' }}
                      />
                    </div>
                  )}
                  {fileType === 'other' && (
                    <div className="p-8 text-center text-gray-400">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                      <p className="text-lg mb-2">Preview not available for this file type</p>
                      <p className="text-sm">Click <strong>Download</strong> to view the file</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Wallet Not Connected</CardTitle>
            <CardDescription className="text-slate-400">
              Please connect your wallet to view invoice details
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <div className="animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-48"></div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-800 rounded"></div>
            <div className="h-64 bg-slate-800 rounded"></div>
            <div className="h-48 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Invoice Not Found</CardTitle>
            <CardDescription className="text-slate-400">
              The requested invoice could not be found
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation Header */}
      <ExporterHeader />
      
      {/* Page Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/exporter/invoices" className="mr-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Invoices
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">{invoice.invoiceNumber}</h1>
                <p className="text-sm text-slate-400">
                  NFT Token ID: #{invoice.tokenId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(invoice.status)}
              {invoice.paymentLink && (
                <Link href={invoice.paymentLink} target="_blank">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Payment Link
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Overview */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-slate-300 mb-3">Exporter Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-slate-400">Company:</span>
                        <span className="text-slate-100 ml-2">{invoice.exporterCompany}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-400">Wallet:</span>
                        <span className="text-slate-100 ml-2 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-slate-300 mb-3">Importer Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="text-slate-400">Company:</span>
                        <span className="text-slate-100 ml-2">{invoice.importerCompany}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-400">Country:</span>
                        <span className="text-slate-100 ml-2">{invoice.importerCountry}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-slate-400">Address:</span>
                        <span className="text-slate-100 ml-2">{invoice.importerAddress}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                <div>
                  <h4 className="font-medium text-slate-300 mb-3">Shipping Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="text-sm">
                      <span className="text-slate-400">Goods:</span>
                      <span className="text-slate-100 ml-2">{invoice.goodsDescription}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-slate-400">Shipping Date:</span>
                      <span className="text-slate-100 ml-2">{formatDate(invoice.shippingDate)}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Shipping Value</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {formatCurrency(invoice.shippingAmount)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Loan Requested</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {formatCurrency(invoice.loanAmount)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Amount Invested</p>
                    <p className="text-lg font-semibold text-cyan-400">
                      {formatCurrency(invoice.amountInvested)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Withdrawn</p>
                    <p className="text-lg font-semibold text-green-400">
                      {formatCurrency(invoice.amountWithdrawn)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Funding Progress</span>
                    <span className="text-sm text-slate-100">{invoice.fundedPercentage}%</span>
                  </div>
                  <Progress value={invoice.fundedPercentage} className="h-2" />
                  <p className="text-xs text-slate-500">
                    {formatCurrency(invoice.amountInvested)} of {formatCurrency(invoice.loanAmount)} funded
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Supporting Documents */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Supporting Documents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  View and download invoice documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDocumentViewer()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Withdrawal Section */}
            {(invoice.status === 'funded' || invoice.status === 'withdrawn') && availableToWithdraw > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Withdraw Funds
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Withdraw all available funds to your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Available to Withdraw</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(availableToWithdraw)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      All funded amount will be withdrawn
                    </p>
                  </div>
                  
                  {error && (
                    <Alert className="bg-red-900/20 border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleWithdraw}
                    disabled={isWithdrawing || availableToWithdraw <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isWithdrawing ? 'Processing Withdrawal...' : 'Withdraw All Available Funds'}
                  </Button>
                  
                  <p className="text-xs text-slate-500 text-center">
                    Note: This will withdraw all available funds at once
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Alerts */}
            {invoice.status === 'pending' && (
              <Alert className="bg-yellow-900/20 border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  Your invoice is pending admin review. You'll be notified once it's approved.
                </AlertDescription>
              </Alert>
            )}

            {invoice.status === 'in_pool' && invoice.fundedPercentage < 70 && (
              <Alert className="bg-blue-900/20 border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Your invoice is in a funding pool. You can withdraw funds once it reaches 70% funding.
                </AlertDescription>
              </Alert>
            )}
            
            {invoice.status === 'funded' && availableToWithdraw > 0 && (
              <Alert className="bg-green-900/20 border-green-800">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Your invoice is funded! You can now withdraw all available funds.
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Link - Show for all statuses except pending/rejected */}
            {invoice.status !== 'pending' && invoice.status !== 'rejected' && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Payment Link
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Share this link with your importer to receive payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-green-900/20 border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      Payment link is ready! Share with your importer.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Payment URL</p>
                    <p className="text-sm font-mono text-slate-100 break-all">
                      {typeof window !== 'undefined' ? window.location.origin : ''}{invoice?.paymentLink || `/pay/${invoiceId}`}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const fullUrl = `${window.location.origin}${invoice?.paymentLink || `/pay/${invoiceId}`}`;
                      navigator.clipboard.writeText(fullUrl);
                      alert('Payment link copied to clipboard!');
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Payment Link
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Withdrawal History */}
            {invoice.withdrawalHistory && Array.isArray(invoice.withdrawalHistory) && invoice.withdrawalHistory.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100">Withdrawal History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoice.withdrawalHistory.map((withdrawal, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {formatCurrency(withdrawal.amount)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(withdrawal.date)}
                          </p>
                        </div>
                        <Link 
                          href={`https://sepolia-blockscout.lisk.com/tx/${withdrawal.txHash}`}
                          target="_blank"
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          View TX
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}