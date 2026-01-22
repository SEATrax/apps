'use client';

import { useState, useEffect } from 'react';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useAdminContract } from '@/hooks/useAdminContract';
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
  X,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import { appConfig } from '@/config';
import type { Invoice, InvoiceStatus } from '@/types';

// Extended Invoice interface to match smart contract data
interface InvoiceWithContractData {
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
  id?: string;
  metadata?: any;
}

// Invoice status mapping (8 statuses)
const INVOICE_STATUS_MAP: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-600' },
  1: { label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-600' },
  2: { label: 'In Pool', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  3: { label: 'Funded', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  4: { label: 'Withdrawn', color: 'text-purple-400', bgColor: 'bg-purple-600' },
  5: { label: 'Paid', color: 'text-green-400', bgColor: 'bg-green-600' },
  6: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-600' },
  7: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-600' },
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
  const { isConnected, address } = useMetaMaskAdmin();
  const { getInvoice } = useSEATrax();
  const { approveInvoice, rejectInvoice, isLoading: contractLoading } = useAdminContract();
  const router = useRouter();
  
  const [invoice, setInvoice] = useState<InvoiceWithContractData | null>(null);
  const [metadata, setMetadata] = useState<InvoiceMetadata | null>(null);
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [documentData, setDocumentData] = useState<Record<string, { filename: string; fileUrl: string; ipfsHash: string }>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Get invoice ID from params
  useEffect(() => {
    params.then(resolvedParams => {
      setInvoiceId(resolvedParams.id);
    });
  }, [params]);

  // Fetch invoice data when connected and invoiceId is available
  useEffect(() => {
    if (isConnected && address && invoiceId) {
      fetchInvoiceData();
    }
  }, [isConnected, address, invoiceId]);

  // Load documents when metadata changes
  useEffect(() => {
    const loadDocuments = async () => {
      if (!metadata?.documents || Object.keys(metadata.documents).length === 0) {
        setLoadingDocs(false);
        return;
      }

      console.log('📄 Loading documents from metadata:', metadata.documents);
      setLoadingDocs(true);
      const docs: Record<string, { filename: string; fileUrl: string; ipfsHash: string }> = {};

      for (const [key, value] of Object.entries(metadata.documents)) {
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
              // Extract actual file URL from metadata
              const imageUri = metadataJson.image;
              console.log(`  Image field from metadata: ${imageUri}`);
              
              // Convert to gateway URL if needed
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
              
              // Use original_name from metadata if available
              filename = metadataJson.original_name || metadataJson.name || key;
              console.log(`  Extracted filename: ${filename}`);
              console.log(`  Extracted file URL: ${fileUrl}`);
              console.log(`  Extracted IPFS hash: ${ipfsHash}`);
            } else {
              console.error(`  ❌ No 'image' field in metadata JSON`);
              // Fallback: use metadata URL as file URL
              fileUrl = metadataUrl;
              ipfsHash = value;
            }
          } catch (error) {
            console.error(`  ❌ Failed to fetch metadata:`, error);
            // Fallback: use hash directly
            fileUrl = metadataUrl;
            ipfsHash = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Object format - NFT metadata already parsed
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
        } else {
          console.error(`  ❌ Failed to extract file URL for ${key}`);
        }
      }

      console.log('📦 Final documentData:', docs);
      setDocumentData(docs);
      setLoadingDocs(false);
    };

    loadDocuments();
  }, [metadata?.documents]);

  const fetchInvoiceData = async () => {
    try {
      setLoadingInvoice(true);
      
      // Get invoice data from smart contract
      const invoiceData = await getInvoice(BigInt(invoiceId));
      
      if (!invoiceData) {
        setMessage({ type: 'error', text: 'Invoice not found' });
        return;
      }

      // Use invoice data directly (already matches InvoiceWithContractData)
      setInvoice({ ...invoiceData, id: invoiceId });

      // Get metadata from Supabase
      const { data: metadataData, error: metadataError } = await supabase
        .from('invoice_metadata')
        .select('*')
        .eq('token_id', parseInt(invoiceId))
        .single();

      if (metadataError && metadataError.code !== 'PGRST116') {
        // Only log error if it's not "no rows returned" error
        console.error('Metadata fetch error:', metadataError.message);
      }
      
      if (metadataData) {
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

      // Call approveInvoice
      const result = await approveInvoice(BigInt(invoiceId));
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve invoice');
      }

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

      // Call rejectInvoice from SEATrax contract
      const result = await rejectInvoice(BigInt(invoiceId));
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject invoice');
      }

      // Store rejection reason in Supabase for reference
      await supabase
        .from('invoice_metadata')
        .update({ rejection_reason: rejectReason })
        .eq('token_id', parseInt(invoiceId));

      setMessage({ 
        type: 'success', 
        text: 'Invoice rejected. Exporter will be notified.' 
      });

      // Clear rejection reason
      setRejectReason('');
      
      // Refresh invoice data
      await fetchInvoiceData();

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

    // Parse document metadata (handles both NFT format and simple hash format)
    const parseDocument = async (key: string, value: any) => {
      let filename = key;
      let fileUrl = '';
      let ipfsHash = '';

      // Check if value is NFT metadata object
      if (typeof value === 'object' && value !== null) {
        // Use original_name if available, otherwise use name field
        filename = value.original_name || value.name || key;
        
        // NFT metadata format - value.image contains IPFS reference
        if (value.image) {
          const imageUri = value.image;
          
          // Convert various IPFS formats to gateway URL
          if (imageUri.startsWith('ipfs://')) {
            // Format: ipfs://QmHash...
            ipfsHash = imageUri.replace('ipfs://', '');
            fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          } else if (imageUri.startsWith('Qm') || imageUri.startsWith('baf')) {
            // Format: QmHash... or bafyHash...
            ipfsHash = imageUri;
            fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          } else if (imageUri.includes('/ipfs/')) {
            // Format: https://gateway.pinata.cloud/ipfs/QmHash...
            const match = imageUri.match(/\/ipfs\/([^/?#]+)/);
            if (match) {
              ipfsHash = match[1];
              fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            } else {
              fileUrl = imageUri;
            }
          } else {
            // Already full URL or unknown format
            fileUrl = imageUri;
          }
        }
      } else if (typeof value === 'string') {
        // Simple IPFS hash format
        if (value.startsWith('ipfs://')) {
          ipfsHash = value.replace('ipfs://', '');
          fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        } else if (value.startsWith('Qm') || value.startsWith('baf')) {
          ipfsHash = value;
          fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        } else {
          ipfsHash = value;
          fileUrl = `https://gateway.pinata.cloud/ipfs/${value}`;
        }
        filename = key;
      }

      return { filename, fileUrl, ipfsHash };
    };

    const toggleDoc = (key: string) => {
      setExpandedDocs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loadingDocs) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
          <p>Loading documents...</p>
        </div>
      );
    }

    if (Object.keys(documentData).length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-600 mb-2" />
          <p>No documents available</p>
        </div>
      );
    }

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

  // Show loading while fetching invoice data
  if (loadingInvoice) {
    return (
      <AdminAuthGuard>
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading invoice...</div>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  if (!invoice) {
    return (
      <AdminAuthGuard>
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
      </AdminAuthGuard>
    );
  }

  const statusInfo = INVOICE_STATUS_MAP[Number(invoice.status)] || INVOICE_STATUS_MAP[0];

  return (
    <AdminAuthGuard>
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
                      <span className="text-white font-medium">{invoice.exporterCompany || 'Unknown Exporter'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Importer Company</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">
                        {invoice.importerCompany || metadata?.importer_name || 'Unknown Importer'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Shipping Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span className="text-white font-medium">
                        {formatDate(Number(invoice.shippingDate) * 1000)}
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
                        {formatCurrency(Number(invoice.shippingAmount) / 100)}
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
                        {formatCurrency(Number(invoice.amountInvested) / 1e18 * 3000)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Loan to Shipping Ratio:</span>
                    <span className="text-white font-medium">
                      {((Number(invoice.loanAmount) / Number(invoice.shippingAmount)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-400">Funding Progress:</span>
                    <span className="text-white font-medium">
                      {Number(invoice.loanAmount) > 0 
                        ? ((Number(invoice.amountInvested) / 1e18 * 3000 * 100 / (Number(invoice.loanAmount) / 100))).toFixed(1)
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
                {Number(invoice.status) === 0 ? (
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
    </AdminAuthGuard>
  );
}