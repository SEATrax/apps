'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, FileText, Calendar, Building, DollarSign, Download,
  ExternalLink, AlertCircle, CheckCircle, Wallet, Copy, Link2,
  MapPin, Box, ChevronDown, ChevronRight, Share2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  documents: Record<string, any> | Array<{ name: string; hash: string; size: number }>;
  paymentLink?: string;
}

export default function InvoiceDetail() {
  const { address, isConnected } = usePanna();
  const { getInvoice, withdrawFunds, canWithdraw } = useSEATrax();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [availableToWithdraw, setAvailableToWithdraw] = useState<number>(0);
  const [error, setError] = useState('');

  // Document State
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [documentData, setDocumentData] = useState<Record<string, { filename: string; fileUrl: string; ipfsHash: string }>>({});
  const [loadingDocs, setLoadingDocs] = useState(true);


  useEffect(() => {
    if (isConnected && address && invoiceId) {
      loadInvoiceData();
    }
  }, [isConnected, address, invoiceId]);

  // --- Invoice Data Loading ---
  const loadInvoiceData = async () => {
    try {
      setIsLoading(true);
      const tokenId = BigInt(invoiceId);

      // 1. Fetch Metadata from Supabase (Primary Source)
      let metadata: any = null;
      let paymentLink = `/pay/${invoiceId}`;
      let exporterProfile: any = null;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('invoice_metadata')
          .select('*')
          .eq('token_id', Number(tokenId))
          .single();

        if (!error && data) {
          metadata = data;

          // Secure Payment Link (UUID)
          if (data.id) {
            paymentLink = `/pay/${data.id}`;
          }

          // Fetch Exporter Name if wallet is present
          if (data.exporter_wallet) {
            const { data: exporterData } = await supabase
              .from('exporters')
              .select('company_name')
              .eq('wallet_address', data.exporter_wallet.toLowerCase())
              .single();
            exporterProfile = exporterData;
          }
        }

        const { data: paymentData } = await supabase
          .from('payments')
          .select('payment_link')
          .eq('invoice_id', Number(tokenId))
          .single();

        // Custom payment link overrides standard link if set
        if (paymentData?.payment_link) paymentLink = paymentData.payment_link;
      }

      // 2. Fetch Blockchain Data (Secondary/Verification Source)
      // We still need this for 'availableToWithdraw' and real-time status if DB is stale
      let contractInvoice: any = null;
      try {
        contractInvoice = await getInvoice(tokenId);
      } catch (err) {
        console.warn('Contract call failed or invoice not minted yet:', err);
      }

      // If we have neither, it's an error
      if (!metadata && !contractInvoice) {
        setError('Invoice not found');
        return;
      }

      // 3. Withdraw Status (only if on-chain)
      if (contractInvoice) {
        try {
          const { amount: withdrawableAmount } = await canWithdraw(tokenId);
          setAvailableToWithdraw(Number(withdrawableAmount) / 1e18);
        } catch (e) {
          console.warn('Failed to check withdrawal status:', e);
        }
      }

      // 4. Format Data (Prioritize Metadata)
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

      // Helper: DB value > Contract Value > Default
      // For amounts, we assume DB stores standard units (e.g. USD) as numbers, 
      // while contract might need conversion if we were using it provided raw (wei etc). 
      // Based on backfill, DB has direct numbers.
      // Helper: DB value > Contract Value > Default
      // For amounts, we assume DB stores standard units (e.g. USD) as numbers, 
      // while contract might need conversion if we were using it provided raw (wei etc). 
      // Based on backfill, DB has direct numbers.
      const shippingAmount = metadata?.shipping_amount ?? (contractInvoice ? Number(contractInvoice.shippingAmount) / 100 : 0);
      const loanAmount = metadata?.loan_amount ?? (contractInvoice ? Number(contractInvoice.loanAmount) / 100 : 0);

      // Helper to calculate value with Wei check
      const calculateFinancial = (contractVal: any, metaVal: any) => {
        let raw = 0;
        if (contractVal && Number(contractVal) > 0) raw = Number(contractVal);
        else if (metaVal) raw = Number(metaVal);

        // If value is massive (likely Wei), convert. Mock rate 3000 used for demo consistency.
        // Threshold: > 1,000,000,000 (1 billion) is likely Wei (unless we have billion dollar invoices)
        if (raw > 1_000_000_000) {
          return (raw / 1e18) * 3000;
        }
        return raw;
      };

      const amountInvested = calculateFinancial(contractInvoice?.amountInvested, metadata?.amount_invested);
      const amountWithdrawn = calculateFinancial(contractInvoice?.amountWithdrawn, metadata?.amount_withdrawn);

      const fundedPercentage = loanAmount > 0 ? Math.round((amountInvested / loanAmount) * 100) : 0;

      // Dates: DB > Contract
      const shippingDate = metadata?.shipping_date
        ? new Date(metadata.shipping_date * 1000).toISOString()
        : (contractInvoice && Number(contractInvoice.shippingDate) > 0)
          ? new Date(Number(contractInvoice.shippingDate) * 1000).toISOString()
          : new Date().toISOString();

      const createdAt = metadata?.created_at
        ? metadata.created_at // already ISO string from Supabase
        : (contractInvoice && Number(contractInvoice.createdAt) > 0)
          ? new Date(Number(contractInvoice.createdAt) * 1000).toISOString()
          : new Date().toISOString();

      // Status: DB (if present) > Contract > Pending
      // If DB says 'pending' but contract says 'funded', contract wins? 
      // For now, let's assume DB status is kept up to date or we prefer it for UI consistency (labels).
      // However, for safety, if contract status exists, it's the 'real' on-chain state.
      // Let's rely on DB for static fields, but maybe map contract status if available?
      // User asked to 'call it from database instead'. So let's stick to DB status if available.
      let displayStatus: Invoice['status'] = 'pending';
      if (metadata?.status) {
        displayStatus = metadata.status.toLowerCase();
      } else if (contractInvoice) {
        displayStatus = statusMap[Number(contractInvoice.status)] || 'pending';
      }

      const invoiceData: Invoice = {
        id: Number(tokenId),
        tokenId: Number(tokenId),
        invoiceNumber: metadata?.invoice_number || `INV-${tokenId}`,
        exporterCompany: exporterProfile?.company_name || metadata?.exporter_wallet || contractInvoice?.exporterCompany || 'Unknown Exporter',
        importerCompany: metadata?.importer_name || contractInvoice?.importerCompany || 'N/A',
        importerAddress: metadata?.importer_address || 'N/A',
        importerCountry: metadata?.importer_country || 'N/A',
        goodsDescription: metadata?.goods_description || 'N/A',
        shippingAmount,
        loanAmount,
        amountInvested,
        amountWithdrawn,
        availableToWithdraw: Number(availableToWithdraw), // use state value we just set
        status: displayStatus,
        shippingDate,
        createdAt,
        fundedPercentage,
        documents: metadata?.documents || {},
        paymentLink,
      };

      setInvoice(invoiceData);
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Failed to load invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Document Loading Logic (Preserved) ---
  useEffect(() => {
    const loadDocuments = async () => {
      if (!invoice?.documents) {
        setLoadingDocs(false);
        return;
      }

      const isEmpty = (Array.isArray(invoice.documents) && invoice.documents.length === 0) ||
        (typeof invoice.documents === 'object' && Object.keys(invoice.documents).length === 0);

      if (isEmpty) {
        setLoadingDocs(false);
        return;
      }

      setLoadingDocs(true);
      const docs: Record<string, { filename: string; fileUrl: string; ipfsHash: string }> = {};

      const documentsToProcess = Array.isArray(invoice.documents)
        ? invoice.documents.reduce((acc: any, doc: any) => {
          if (doc.ipfsHash || doc.image) acc[doc.name || 'document'] = doc;
          return acc;
        }, {})
        : invoice.documents;

      for (const [key, value] of Object.entries(documentsToProcess)) {
        let filename = key;
        let fileUrl = '';
        let ipfsHash = '';

        try {
          if (typeof value === 'string') {
            const metadataUrl = `https://gateway.pinata.cloud/ipfs/${value}`;
            const response = await fetch(metadataUrl);
            const metadataJson = await response.json();

            if (metadataJson.image) {
              const imageUri = metadataJson.image;
              if (imageUri.startsWith('ipfs://')) ipfsHash = imageUri.replace('ipfs://', '');
              else if (imageUri.includes('/ipfs/')) ipfsHash = imageUri.match(/\/ipfs\/([^/?#]+)/)?.[1] || '';
              else ipfsHash = imageUri;

              fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
              filename = metadataJson.original_name || metadataJson.name || key;
            } else {
              fileUrl = metadataUrl;
              ipfsHash = value;
            }
          } else if (typeof value === 'object' && value !== null) {
            const val = value as any;
            filename = val.original_name || val.name || key;
            if (val.image) {
              const imageUri = val.image;
              if (imageUri.startsWith('ipfs://')) ipfsHash = imageUri.replace('ipfs://', '');
              else if (imageUri.includes('/ipfs/')) ipfsHash = imageUri.match(/\/ipfs\/([^/?#]+)/)?.[1] || '';
              else ipfsHash = imageUri;
              fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            }
          }
          if (fileUrl) docs[key] = { filename, fileUrl, ipfsHash };
        } catch (e) { console.error('Doc load error', e); }
      }
      setDocumentData(docs);
      setLoadingDocs(false);
    };
    loadDocuments();
  }, [invoice?.documents]);


  // --- Actions ---
  const handleWithdraw = async () => {
    if (!invoice || availableToWithdraw <= 0) return;
    setIsWithdrawing(true);
    setError('');
    try {
      const result = await withdrawFunds(BigInt(invoiceId));
      if (result.success) await loadInvoiceData();
      else setError(result.error || 'Failed to withdraw');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // --- Rendering Helpers ---
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: Invoice['status']) => {
    const config = {
      pending: { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50' },
      approved: { label: 'Approved', color: 'bg-blue-500/10 text-blue-400 border-blue-500/50' },
      in_pool: { label: 'In Pool', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50' },
      funded: { label: 'Funded', color: 'bg-green-500/10 text-green-400 border-green-500/50' },
      withdrawn: { label: 'Withdrawn', color: 'bg-purple-500/10 text-purple-400 border-purple-500/50' },
      paid: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' },
      completed: { label: 'Completed', color: 'bg-teal-500/10 text-teal-400 border-teal-500/50' },
      rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/50' },
    };
    const { label, color } = config[status];
    return <Badge variant="outline" className={cn("px-3 py-1 font-medium capitalize border", color)}>{label}</Badge>;
  };

  if (!isConnected) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <Card className="w-full max-w-md bg-slate-900 border-slate-800"><CardHeader className="text-center"><CardTitle className="text-white">Connect Wallet</CardTitle></CardHeader></Card></div>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Skeleton className="h-10 w-48 bg-slate-800" />
                <Skeleton className="h-6 w-24 bg-slate-800" />
              </div>
              <Skeleton className="h-4 w-64 bg-slate-800" />
            </div>
            <Skeleton className="h-10 w-32 bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Details Card Skeleton */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <Skeleton className="h-8 w-48 bg-slate-800" />
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-6">
                      <Skeleton className="h-4 w-32 bg-slate-800 mb-2" />
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full bg-slate-800" />
                        <Skeleton className="h-16 w-full bg-slate-800" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <Skeleton className="h-4 w-32 bg-slate-800 mb-2" />
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full bg-slate-800" />
                        <div className="flex gap-2"><Skeleton className="h-4 w-4 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Skeleton */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <Skeleton className="h-8 w-32 bg-slate-800" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full bg-slate-800" />
                  <Skeleton className="h-16 w-full bg-slate-800" />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              {/* Financial Summary Skeleton */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <Skeleton className="h-6 w-40 bg-slate-800" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1 pb-4 border-b border-slate-800">
                    <Skeleton className="h-4 w-32 bg-slate-800 mb-2" />
                    <Skeleton className="h-8 w-48 bg-slate-800" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between"><Skeleton className="h-4 w-24 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                    <Skeleton className="h-24 w-full bg-slate-800" />
                  </div>
                  <Skeleton className="h-10 w-full bg-slate-800" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-slate-500">Invoice not found or failed to load.</div></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">

      {/* Top Navigation */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Created on {format(new Date(invoice.createdAt), 'd MMM yyyy, HH:mm')}
              <span className="text-slate-600">•</span>
              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">#{invoice.tokenId}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {invoice.paymentLink && (
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => window.open(invoice.paymentLink, '_blank')}>
                <Share2 className="w-4 h-4 mr-2" /> Payment Link
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Details Card */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-cyan-400" /> Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      Parties Involved
                    </h3>
                    <div className="grid gap-6">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1">Exporter</span>
                        <p className="text-lg font-medium text-slate-100 truncate" title={invoice.exporterCompany}>{invoice.exporterCompany}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1">Importer</span>
                        <p className="text-lg font-medium text-slate-100 mb-1 truncate" title={invoice.importerCompany}>{invoice.importerCompany}</p>
                        <div className="flex items-center text-sm text-slate-400 gap-1 mb-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{invoice.importerCountry}</span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2" title={invoice.importerAddress}>{invoice.importerAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      Shipment Details
                    </h3>
                    <div className="grid gap-6">
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-2">Goods Description</span>
                        <p className="text-slate-200 text-sm leading-relaxed border-l-2 border-slate-800 pl-4 py-1 break-words">
                          {invoice.goodsDescription}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1">Estimated Ship Date</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-200 font-medium">
                            {format(new Date(invoice.shippingDate), 'd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-purple-400" /> Documents
                </CardTitle>
                <CardDescription className="text-slate-400">Attached proofs and shipping documents</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDocs ? (
                  <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
                ) : Object.keys(documentData).length === 0 ? (
                  <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    No documents attached
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(documentData).map(([key, doc]) => (
                      <div key={key} className="bg-slate-950/50 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-700">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => setExpandedDocs(p => ({ ...p, [key]: !p[key] }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded text-slate-300">
                              {doc.filename.endsWith('.pdf') ? <FileText className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-200">{doc.filename}</p>
                              <p className="text-xs text-slate-500 font-mono">IPFS: {doc.ipfsHash.slice(0, 6)}...{doc.ipfsHash.slice(-4)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank'); }}>
                              <ExternalLink className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedDocs(p => ({ ...p, [key]: !p[key] })); }}>
                              {expandedDocs[key] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                            </Button>
                          </div>
                        </div>
                        {expandedDocs[key] && (
                          <div className="bg-slate-950 border-t border-slate-800 p-4 flex justify-center">
                            {doc.filename.toLowerCase().endsWith('.pdf') ? (
                              <iframe src={`${doc.fileUrl}#view=FitH`} className="w-full h-96 border-0 rounded bg-slate-100" />
                            ) : (
                              <img src={doc.fileUrl} alt={doc.filename} className="max-h-96 rounded object-contain" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">

            {/* Financial Summary */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Stats */}
                <div className="space-y-1 pb-4 border-b border-slate-800">
                  <p className="text-sm text-slate-500">Total Shipping Value</p>
                  <p className="text-2xl font-semibold text-slate-100">{formatCurrency(invoice.shippingAmount)}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Loan Request</span>
                    <span className="font-medium text-slate-100">{formatCurrency(invoice.loanAmount)}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Funded</span>
                      <span className="text-cyan-400 font-mono">{invoice.fundedPercentage}%</span>
                    </div>
                    <Progress value={invoice.fundedPercentage} className="h-2 bg-slate-800 [&>div]:bg-cyan-400" />
                    <div className="mt-2 text-xs text-slate-500 text-right">
                      {formatCurrency(invoice.amountInvested)} raised
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Withdrawn</span>
                    <span className="font-medium text-green-400">{formatCurrency(invoice.amountWithdrawn)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card (Withdraw) */}
            {(invoice.status === 'funded' || invoice.status === 'withdrawn') && availableToWithdraw > 0 && (
              <Card className="bg-slate-900 border-slate-800 shadow-lg shadow-green-900/10">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400 flex items-center gap-2">
                    <Wallet className="h-5 w-5" /> Withdraw Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-2">
                    <span className="text-sm text-slate-500">Available to Withdraw</span>
                    <p className="text-3xl font-bold text-white mt-1">{formatCurrency(availableToWithdraw)}</p>
                  </div>

                  {error && (
                    <Alert className="bg-red-900/20 border-red-800 text-red-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                    size="lg"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>

        </div>
      </div>

      {/* Debug Section */}


    </div>
  );
}