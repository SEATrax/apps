'use client';

import { useState, useEffect } from 'react';
import { usePanna } from '@/hooks/usePanna';
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
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  status: 'pending' | 'finalized' | 'fundraising' | 'funded' | 'paid' | 'cancelled';
  shippingDate: string;
  createdAt: string;
  fundedPercentage: number;
  documents: Array<{
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
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isConnected && address && invoiceId) {
      loadInvoiceData();
    }
  }, [isConnected, address, invoiceId]);

  const loadInvoiceData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace with actual smart contract calls
      // const invoiceData = await invoiceNFT.getInvoice(tokenId);
      // const availableAmount = await invoiceNFT.getAvailableWithdrawal(tokenId);
      
      // Mock data for now
      const mockInvoice: Invoice = {
        id: parseInt(invoiceId),
        tokenId: 1,
        invoiceNumber: 'INV-2024-001',
        exporterCompany: 'Southeast Exports Co',
        importerCompany: 'Global Trading Ltd',
        importerAddress: '123 Business Street, Commercial District, Singapore 123456',
        importerCountry: 'Singapore',
        goodsDescription: 'Electronic components and accessories for manufacturing',
        shippingAmount: 18000,
        loanAmount: 15000,
        amountInvested: 12750,
        amountWithdrawn: 5000,
        availableToWithdraw: 5500, // Can withdraw when ≥70% funded
        status: 'funded',
        shippingDate: '2024-12-15',
        createdAt: '2024-11-25',
        fundedPercentage: 85,
        documents: [
          { name: 'Commercial Invoice.pdf', hash: 'QmExampleHash1', size: 245760 },
          { name: 'Bill of Lading.pdf', hash: 'QmExampleHash2', size: 189440 },
          { name: 'Packing List.pdf', hash: 'QmExampleHash3', size: 156672 },
        ],
        withdrawalHistory: [
          {
            amount: 5000,
            date: '2024-11-26T10:30:00Z',
            txHash: '0x1234567890abcdef...',
          }
        ],
        paymentLink: invoice?.status === 'funded' && invoice.amountWithdrawn >= invoice.amountInvested ? 
          `/pay/${invoiceId}` : undefined,
      };
      
      setInvoice(mockInvoice);
      setWithdrawAmount(mockInvoice.availableToWithdraw.toString());
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Failed to load invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!invoice || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > invoice.availableToWithdraw) {
      setError('Invalid withdrawal amount');
      return;
    }

    setIsWithdrawing(true);
    setError('');

    try {
      // TODO: Implement smart contract withdrawal
      // const tx = await invoiceNFT.withdrawFunds(invoice.tokenId, ethers.utils.parseEther(amount.toString()));
      // await tx.wait();

      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh invoice data
      await loadInvoiceData();
      setWithdrawAmount('');
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      setError('Failed to withdraw funds. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
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
      {/* Header */}
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

            {/* Documents */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Supporting Documents</CardTitle>
                <CardDescription className="text-slate-400">
                  Documents uploaded for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-100">{doc.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Withdrawal Section */}
            {invoice.status === 'funded' && invoice.availableToWithdraw > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Withdraw Funds
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Available to withdraw: {formatCurrency(invoice.availableToWithdraw)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="withdrawAmount" className="text-slate-300">Withdrawal Amount (USD)</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      step="0.01"
                      max={invoice.availableToWithdraw}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-slate-100"
                    />
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
                    disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isWithdrawing ? 'Processing...' : 'Withdraw Funds'}
                  </Button>
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

            {invoice.status === 'fundraising' && invoice.fundedPercentage < 70 && (
              <Alert className="bg-blue-900/20 border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Your invoice is currently fundraising. You can withdraw funds once it reaches 70% funding.
                </AlertDescription>
              </Alert>
            )}

            {invoice.paymentLink && (
              <Alert className="bg-green-900/20 border-green-800">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Payment link is available for the importer. Share the link to receive payment.
                </AlertDescription>
              </Alert>
            )}

            {/* Withdrawal History */}
            {invoice.withdrawalHistory.length > 0 && (
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
                          href={`https://blockscout.lisk.com/tx/${withdrawal.txHash}`}
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