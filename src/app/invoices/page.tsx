'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePanna } from '@/hooks/usePanna';
import { formatEther, formatDate, getStatusColor } from '@/lib/utils';

// Mock data - replace with actual contract data
const mockInvoices = [
  {
    tokenId: 1n,
    invoiceNumber: 'INV-2024-001',
    exporterName: 'ABC Exports Ltd',
    buyerCountry: 'Singapore',
    fundingAmount: 50000n * 10n ** 18n,
    currentFunding: 35000n * 10n ** 18n,
    status: 'funding',
    dueDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  },
  {
    tokenId: 2n,
    invoiceNumber: 'INV-2024-002',
    exporterName: 'XYZ Trading Co',
    buyerCountry: 'Japan',
    fundingAmount: 75000n * 10n ** 18n,
    currentFunding: 75000n * 10n ** 18n,
    status: 'funded',
    dueDate: Math.floor(Date.now() / 1000) + 45 * 24 * 60 * 60,
  },
  {
    tokenId: 3n,
    invoiceNumber: 'INV-2024-003',
    exporterName: 'Global Shipping Inc',
    buyerCountry: 'USA',
    fundingAmount: 100000n * 10n ** 18n,
    currentFunding: 0n,
    status: 'pending',
    dueDate: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
  },
];

export default function InvoicesPage() {
  const { isConnected, address } = usePanna();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'funding':
        return <TrendingUp className="h-4 w-4" />;
      case 'funded':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
      case 'defaulted':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const calculateFundingPercentage = (current: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return Number((current * 100n) / total);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view and manage invoices.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track shipping invoice NFTs
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="my">My Invoices</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid gap-4">
            {mockInvoices.map((invoice) => {
              const fundingPercentage = calculateFundingPercentage(
                invoice.currentFunding,
                invoice.fundingAmount
              );

              return (
                <Card key={invoice.tokenId.toString()} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Invoice Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {invoice.invoiceNumber}
                          </h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <span>{invoice.exporterName}</span>
                          <span>Buyer: {invoice.buyerCountry}</span>
                          <span>Due: {formatDate(invoice.dueDate)}</span>
                        </div>
                      </div>

                      {/* Funding Progress */}
                      <div className="w-full lg:w-64">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Funding Progress</span>
                          <span className="font-medium">{fundingPercentage}%</span>
                        </div>
                        <Progress 
                          value={fundingPercentage} 
                          className={`h-2 ${
                            fundingPercentage >= 70 
                              ? 'bg-emerald-500' 
                              : fundingPercentage >= 50 
                              ? 'bg-amber-500' 
                              : 'bg-gray-200'
                          }`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{formatEther(invoice.currentFunding, 0)} ETH</span>
                          <span>{formatEther(invoice.fundingAmount, 0)} ETH</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {invoice.status === 'funding' && (
                          <Button size="sm">
                            Fund
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
