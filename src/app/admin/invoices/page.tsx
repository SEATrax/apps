'use client';

import { useState, useEffect, useRef } from 'react';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax, INVOICE_STATUS } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Eye,
  Building2,
  Clock,
  X,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/types';

// Invoice status mapping for numbers
const INVOICE_STATUS_MAP: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Pending Review', color: 'text-yellow-400', bgColor: 'bg-yellow-600' },
  1: { label: 'Approved', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  2: { label: 'In Pool', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  3: { label: 'Funded', color: 'text-green-400', bgColor: 'bg-green-600' },
  4: { label: 'Withdrawn', color: 'text-purple-400', bgColor: 'bg-purple-600' },
  5: { label: 'Paid', color: 'text-emerald-400', bgColor: 'bg-emerald-600' },
  6: { label: 'Completed', color: 'text-teal-400', bgColor: 'bg-teal-600' },
  7: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-600' },
};

// Status mapping for string values from hook
const STATUS_STRING_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  'pending': { label: 'Pending Review', color: 'text-yellow-400', bgColor: 'bg-yellow-600' },
  'approved': { label: 'Approved', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  'in_pool': { label: 'In Pool', color: 'text-cyan-400', bgColor: 'bg-cyan-600' },
  'funded': { label: 'Funded', color: 'text-green-400', bgColor: 'bg-green-600' },
  'withdrawn': { label: 'Withdrawn', color: 'text-purple-400', bgColor: 'bg-purple-600' },
  'paid': { label: 'Paid', color: 'text-emerald-400', bgColor: 'bg-emerald-600' },
  'completed': { label: 'Completed', color: 'text-teal-400', bgColor: 'bg-teal-600' },
  'rejected': { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-600' },
};

// Helper function to get status info
const getStatusInfo = (status: InvoiceStatus | number) => {
  return typeof status === 'string' ? 
    STATUS_STRING_MAP[status] || STATUS_STRING_MAP['pending'] :
    INVOICE_STATUS_MAP[Number(status)] || INVOICE_STATUS_MAP[0];
};

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

export default function AdminInvoicesPage() {
  const { 
    isConnected, 
    address, 
    connect, 
    disconnect,
    switchToLiskSepolia,
    isCorrectNetwork,
    isMetaMaskInstalled,
    error: metaMaskError 
  } = useMetaMaskAdmin();
  const { checkUserRoles, getAllPendingInvoices, getAllApprovedInvoices, getAllOpenPools, getPool, getInvoice, isLoading } = useSEATrax();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithMetadata[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'in_pool' | 'funded' | 'withdrawn' | 'paid' | 'completed' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRoles, setUserRoles] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check admin role when wallet connects
  useEffect(() => {
    if (!isConnected || !address) {
      setCheckingRole(false);
      setUserRoles(null);
      return;
    }

    // Check if on correct network
    if (!isCorrectNetwork) {
      setCheckingRole(false);
      setAccessDenied(true);
      return;
    }

    // Check admin role
    console.log('🔍 Checking admin role for MetaMask address:', address);
    setCheckingRole(true);
    
    checkUserRoles(address).then((roles) => {
      console.log('✅ Role check completed:', roles);
      setUserRoles(roles);
      setCheckingRole(false);
      
      if (!roles?.isAdmin) {
        console.warn('❌ Access denied: User is not admin');
        console.log('📋 Current address:', address);
        console.log('💡 To grant admin role, run:');
        console.log(`   NEW_ADMIN_ADDRESS=${address} npx hardhat run scripts/grant-admin.js --network lisk-sepolia`);
        setAccessDenied(true);
      }
    }).catch(err => {
      console.error('❌ Error checking roles:', err);
      setCheckingRole(false);
      setAccessDenied(true);
    });
  }, [isConnected, address, isCorrectNetwork, checkUserRoles]);

  // Fetch invoices when admin role is confirmed
  useEffect(() => {
    if (userRoles?.isAdmin) {
      fetchInvoices();
    }
  }, [userRoles]);

  // Filter invoices based on selected filter and search term
  useEffect(() => {
    let filtered = invoices;

    // Apply status filter (invoice.status is a number from contract)
    if (filter !== 'all') {
      const statusMap: Record<string, number> = {
        'pending': INVOICE_STATUS.PENDING,
        'approved': INVOICE_STATUS.APPROVED,
        'in_pool': INVOICE_STATUS.IN_POOL,
        'funded': INVOICE_STATUS.FUNDED,
        'withdrawn': INVOICE_STATUS.WITHDRAWN,
        'paid': INVOICE_STATUS.PAID,
        'completed': INVOICE_STATUS.COMPLETED,
        'rejected': INVOICE_STATUS.REJECTED,
      };
      
      const targetStatus = statusMap[filter];
      if (targetStatus !== undefined) {
        filtered = filtered.filter(inv => Number(inv.status) === targetStatus);
      }
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.metadata?.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.metadata?.importer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.metadata?.invoice_number || `Invoice #${inv.tokenId}`).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [invoices, filter, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      
      // 1. Get invoices that are not in pools yet
      const [pendingIds, approvedIds] = await Promise.all([
        getAllPendingInvoices(),
        getAllApprovedInvoices()
      ]);
      
      // 2. Get all pools and extract invoice IDs from them
      const poolIds = await getAllOpenPools();
      const invoicesInPools: bigint[] = [];
      
      console.log(`📊 Found ${poolIds.length} pools to check for invoices`);
      
      for (const poolId of poolIds) {
        try {
          const poolData = await getPool(poolId);
          if (poolData && poolData.invoiceIds && poolData.invoiceIds.length > 0) {
            console.log(`   Pool ${poolId}: ${poolData.invoiceIds.length} invoices`);
            invoicesInPools.push(...poolData.invoiceIds);
          }
        } catch (error) {
          console.error(`Failed to fetch pool ${poolId}:`, error);
        }
      }
      
      // 3. Combine and deduplicate all invoice IDs
      const allInvoiceIds = [...new Set([
        ...pendingIds,
        ...approvedIds,
        ...invoicesInPools
      ])];
      
      console.log(`📋 Total invoices found:`);
      console.log(`   - Pending (not in pool): ${pendingIds.length}`);
      console.log(`   - Approved (not in pool): ${approvedIds.length}`);
      console.log(`   - In pools: ${invoicesInPools.length}`);
      console.log(`   - Total unique: ${allInvoiceIds.length}`);
      
      // 4. Get full invoice data from blockchain
      const invoicesWithData: InvoiceWithMetadata[] = [];
      
      for (const invoiceId of allInvoiceIds) {
        try {
          const invoiceData = await getInvoice(invoiceId);
          if (invoiceData) {
            // Try to enrich with Supabase metadata
            const { data: metadata } = await supabase
              .from('invoice_metadata')
              .select('*')
              .eq('token_id', Number(invoiceId))
              .single();
            
            invoicesWithData.push({
              ...invoiceData,
              metadata: metadata ? {
                invoice_number: metadata.invoice_number,
                importer_name: metadata.importer_name || 'Unknown',
                goods_description: metadata.goods_description || '',
                created_at: metadata.created_at,
              } : undefined
            });
          }
        } catch (error) {
          console.error(`Failed to fetch invoice ${invoiceId}:`, error);
        }
      }

      // Sort by creation date (newest first)
      invoicesWithData.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      
      setInvoices(invoicesWithData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load invoices: ' + error.message });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const getFilterStats = () => {
    return {
      all: invoices.length,
      pending: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.PENDING).length,
      approved: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.APPROVED).length,
      in_pool: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.IN_POOL).length,
      funded: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.FUNDED).length,
      withdrawn: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.WITHDRAWN).length,
      paid: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.PAID).length,
      completed: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.COMPLETED).length,
      rejected: invoices.filter(inv => Number(inv.status) === INVOICE_STATUS.REJECTED).length,
    };
  };

  const stats = getFilterStats();

  // Show loading while checking roles
  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Checking admin permissions...</div>
        </div>
      </div>
    );
  }

  // Show access denied error instead of redirecting
  if (accessDenied || !isConnected || (isConnected && !userRoles?.isAdmin)) {
    // MetaMask not installed
    if (!isMetaMaskInstalled) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-red-500 max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <CardTitle className="text-white text-2xl">MetaMask Required</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Admin panel requires MetaMask browser extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-500 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">Install MetaMask</p>
                  <p className="text-sm">
                    Admin pages use MetaMask for direct EOA access (no account abstraction).
                  </p>
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Install MetaMask
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Wrong network
    if (isConnected && !isCorrectNetwork) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-yellow-500 max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-8 w-8 text-yellow-400" />
                <CardTitle className="text-white text-2xl">Wrong Network</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Please switch to Lisk Sepolia network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-blue-500 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="text-sm">
                    Admin panel requires Lisk Sepolia Testnet network.
                  </p>
                </AlertDescription>
              </Alert>
              <Button onClick={switchToLiskSepolia} className="w-full bg-cyan-600 hover:bg-cyan-700">
                Switch to Lisk Sepolia
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Wallet not connected
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-orange-500 max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-8 w-8 text-orange-400" />
                <CardTitle className="text-white text-2xl">Connect MetaMask</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Connect your MetaMask wallet to access admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {metaMaskError && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {metaMaskError}
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="border-blue-500 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">Admin Access with MetaMask</p>
                  <p className="text-sm">
                    Admin pages use MetaMask for direct EOA connection.
                    This allows you to use your existing admin role without account abstraction.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-white font-semibold mb-3">After connecting:</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                  <li>MetaMask will request connection approval</li>
                  <li>Your address will be verified for admin role</li>
                  <li>If you have admin role → access granted</li>
                  <li>If you don't have admin role → see grant instructions</li>
                </ol>
              </div>

              <Button 
                onClick={connect}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Wallet connected but not admin
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-red-500 max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <CardTitle className="text-white text-2xl">Access Denied</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              You don't have admin permissions to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-2">
                  <p className="font-semibold">Your wallet address:</p>
                  <code className="block bg-yellow-100 p-2 rounded text-sm break-all">
                    {address || 'Not available'}
                  </code>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-slate-700 p-4 rounded-lg">
              <p className="text-white font-semibold mb-3">To grant admin role to this address:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                <li>Open terminal in project directory</li>
                <li>Run the following command:</li>
              </ol>
              <code className="block bg-slate-900 p-3 rounded mt-2 text-cyan-400 text-xs break-all">
                NEW_ADMIN_ADDRESS={address} npx hardhat run scripts/grant-admin.js --network lisk-sepolia
              </code>
              <p className="text-gray-400 text-xs mt-3">
                Or use the check-admin-role.js script to verify if role was already granted:
              </p>
              <code className="block bg-slate-900 p-3 rounded mt-2 text-cyan-400 text-xs break-all">
                node check-admin-role.js {address}
              </code>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                Go to Home
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Retry After Granting Role
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Invoice Review
          </h1>
          <p className="text-gray-400">
            Review and approve invoice submissions for funding pool inclusion
          </p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{stats.all}</p>
                </div>
                <FileText className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Funded</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.funded}</p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All ({stats.all})
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                  className={filter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending ({stats.pending})
                </Button>
                <Button
                  variant={filter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('approved')}
                  className={filter === 'approved' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved ({stats.approved})
                </Button>
                <Button
                  variant={filter === 'in_pool' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('in_pool')}
                  className={filter === 'in_pool' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  In Pool ({stats.in_pool})
                </Button>
                <Button
                  variant={filter === 'funded' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('funded')}
                  className={filter === 'funded' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Funded ({stats.funded})
                </Button>
                <Button
                  variant={filter === 'withdrawn' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('withdrawn')}
                  className={filter === 'withdrawn' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdrawn ({stats.withdrawn})
                </Button>
                <Button
                  variant={filter === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('paid')}
                  className={filter === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Paid ({stats.paid})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                  className={filter === 'completed' ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed ({stats.completed})
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('rejected')}
                  className={filter === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejected ({stats.rejected})
                </Button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, importer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Invoices ({filteredInvoices.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filter === 'all' && 'All invoices across all statuses in the platform'}
              {filter === 'pending' && 'Invoices awaiting admin review and approval'}
              {filter === 'approved' && 'Approved invoices ready for pool inclusion'}
              {filter === 'in_pool' && 'Invoices currently in investment pools'}
              {filter === 'funded' && 'Invoices that have received funding from pools'}
              {filter === 'withdrawn' && 'Invoices with funds withdrawn by exporters'}
              {filter === 'paid' && 'Invoices that have been paid by importers'}
              {filter === 'completed' && 'Invoices with profits distributed to investors'}
              {filter === 'rejected' && 'Invoices that have been rejected by admin'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvoices ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {filter === 'pending' && 'No pending invoices'}
                  {filter === 'approved' && 'No approved invoices'}
                  {filter === 'rejected' && 'No rejected invoices'}
                  {filter === 'funded' && 'No funded invoices'}
                  {filter === 'all' && 'No invoices found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Invoices will appear here once submitted by exporters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => {
                  const statusInfo = getStatusInfo(invoice.status);
                  
                  return (
                    <div
                      key={invoice.tokenId.toString()}
                      className="border border-slate-700 rounded-lg p-6 bg-slate-750 hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Invoice Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="h-5 w-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold text-white">
                              {invoice.metadata?.invoice_number || `Invoice #${invoice.tokenId}`}
                            </h3>
                            <Badge 
                              className={`${statusInfo.bgColor} text-white`}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Exporter</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                Exporter: {invoice.metadata?.invoice_number || `#${invoice.tokenId}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Importer</p>
                              <p className="text-white font-medium">
                                {invoice.metadata?.importer_name || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Shipping Date</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(Number(invoice.shippingDate) * 1000)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-gray-400">Shipping Amount</p>
                              <p className="text-white font-medium">
                                {formatCurrency(Number(invoice.shippingAmount) / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Loan Amount</p>
                              <p className="text-cyan-400 font-bold">
                                {formatCurrency(Number(invoice.loanAmount) / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Amount Invested</p>
                              <p className="text-green-400 font-medium">
                                {formatCurrency(Number(invoice.amountInvested) / 1e18 * 3000)}
                              </p>
                            </div>
                          </div>

                          {invoice.metadata?.goods_description && (
                            <div className="mt-3 text-sm">
                              <p className="text-gray-400">Goods Description</p>
                              <p className="text-white">{invoice.metadata.goods_description}</p>
                            </div>
                          )}

                          <div className="mt-2 text-xs text-gray-500">
                            Created: {invoice.metadata?.created_at ? new Date(invoice.metadata.created_at).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="lg:ml-6">
                          <Link href={`/admin/invoices/${invoice.tokenId}`}>
                            <Button variant="outline" className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}