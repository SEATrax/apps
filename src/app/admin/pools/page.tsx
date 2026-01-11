'use client';

import { useState, useEffect } from 'react';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Eye,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/AdminHeader';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Pool, PoolStatus } from '@/types';

// Pool status mapping
const POOL_STATUS_MAP: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Open', color: 'text-blue-400', bgColor: 'bg-blue-600' },
  1: { label: 'Funded', color: 'text-green-400', bgColor: 'bg-green-600' },
  2: { label: 'Completed', color: 'text-gray-400', bgColor: 'bg-gray-600' },
  3: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-600' },
};

interface PoolWithMetadata {
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
  metadata?: {
    description: string;
    risk_category: 'low' | 'medium' | 'high';
  };
  fundingPercentage?: number;
  investorCount?: number;
}

export default function AdminPoolsPage() {
  const { isConnected, address } = useMetaMaskAdmin();
  const { getAllOpenPools, getPool, getPoolFundingPercentage, isLoading } = useSEATrax();
  const router = useRouter();
  
  const [pools, setPools] = useState<PoolWithMetadata[]>([]);
  const [filteredPools, setFilteredPools] = useState<PoolWithMetadata[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'funded' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPools, setLoadingPools] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch pools when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchPools();
    }
  }, [isConnected, address]);

  // Helper function to check pool status (numeric: 0=Open, 1=Fundraising, 2=PartiallyFunded, 3=Funded)
  const isPoolStatus = (status: number, target: string) => {
    const statusMap: Record<number, string> = {
      0: 'OPEN',
      1: 'FUNDRAISING',
      2: 'PARTIALLYFUNDED',
      3: 'FUNDED'
    };
    return statusMap[status] === target;
  };

  // Filter pools based on selected filter and search term
  useEffect(() => {
    let filtered = pools;

    // Apply status filter
    if (filter === 'open') {
      filtered = filtered.filter(pool => isPoolStatus(Number(pool.status), 'OPEN'));
    } else if (filter === 'funded') {
      filtered = filtered.filter(pool => isPoolStatus(Number(pool.status), 'FUNDED'));
    } else if (filter === 'completed') {
      filtered = filtered.filter(pool => isPoolStatus(Number(pool.status), 'COMPLETED'));
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pool => 
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPools(filtered);
  }, [pools, filter, searchTerm]);

  const fetchPools = async () => {
    try {
      setLoadingPools(true);
      
      // Get all open pools from smart contract first (blockchain-first approach)
      const openPoolIds = await getAllOpenPools();
      
      // Filter out invalid pool IDs (0 or negative)
      const validPoolIds = openPoolIds.filter(id => id > 0n);
      
      if (validPoolIds.length === 0) {
        console.log('No valid pool IDs found');
        setPools([]);
        setLoadingPools(false);
        return;
      }
      
      console.log(`Found ${validPoolIds.length} valid pool IDs:`, validPoolIds.map(id => id.toString()));
      
      // Get all pool metadata from Supabase
      const { data: metadataList, error: metadataError } = await supabase
        .from('pool_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (metadataError) {
        console.warn('Metadata fetch error:', metadataError.message);
        // Don't throw - we can still show pools without metadata
      }

      // Get pool data from smart contract for each pool ID
      const poolsWithData: PoolWithMetadata[] = [];
      
      for (const poolId of validPoolIds) {
        try {
          const poolData = await getPool(poolId);
          
          // Skip if pool data is null (pool doesn't exist or error occurred)
          if (!poolData) {
            console.warn(`Pool ${poolId} returned null, skipping...`);
            continue;
          }
          
          // Find metadata for this pool
          const metadata = metadataList?.find(m => m.pool_id === Number(poolId));
          
          // Get funding percentage
          const fundingPercentage = await getPoolFundingPercentage(poolId);
          
          poolsWithData.push({
            ...poolData,
            metadata: metadata ? {
              description: metadata.description || '',
              risk_category: metadata.risk_category || 'medium',
            } : undefined,
            fundingPercentage: Number(fundingPercentage),
            investorCount: 0, // TODO: Get from contract
          });
        } catch (error) {
          console.error(`Failed to fetch pool ${poolId}:`, error);
          // Skip this pool and continue with others
        }
      }

      setPools(poolsWithData);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load pools: ' + error.message });
    } finally {
      setLoadingPools(false);
    }
  };

  // Helper function to get pool status info
  const getPoolStatusInfo = (status: number) => {
    return POOL_STATUS_MAP[status] || POOL_STATUS_MAP[0];
  };

  const getFilterStats = () => {
    const open = pools.filter(pool => isPoolStatus(Number(pool.status), 'OPEN')).length;
    const funded = pools.filter(pool => isPoolStatus(Number(pool.status), 'FUNDED')).length;
    const completed = pools.filter(pool => isPoolStatus(Number(pool.status), 'COMPLETED')).length;
    const totalValue = pools.reduce((sum, pool) => sum + Number(pool.totalLoanAmount || 0), 0);
    
    return { open, funded, completed, total: pools.length, totalValue };
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-600 text-white';
      case 'high': return 'bg-red-600 text-white';
      default: return 'bg-yellow-600 text-white';
    }
  };

  const stats = getFilterStats();

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Investment Pools
              </h1>
              <p className="text-gray-400">
                Manage investment pools and monitor funding progress
              </p>
            </div>
            <Link href="/admin/pools/new">
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create New Pool
              </Button>
            </Link>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Pools</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Funded</p>
                  <p className="text-2xl font-bold text-green-400">{stats.funded}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-400">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {formatCurrency(stats.totalValue / 100)}
                  </p>
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
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All ({stats.total})
                </Button>
                <Button
                  variant={filter === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('open')}
                  className={filter === 'open' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Open ({stats.open})
                </Button>
                <Button
                  variant={filter === 'funded' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('funded')}
                  className={filter === 'funded' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Funded ({stats.funded})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                  className={filter === 'completed' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed ({stats.completed})
                </Button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by pool name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pools List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Investment Pools ({filteredPools.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filter === 'open' && 'Pools currently accepting investments'}
              {filter === 'funded' && 'Fully funded pools'}
              {filter === 'completed' && 'Completed pools with distributed profits'}
              {filter === 'all' && 'All investment pools in the platform'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPools ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {filter === 'open' && 'No open pools'}
                  {filter === 'funded' && 'No funded pools'}
                  {filter === 'completed' && 'No completed pools'}
                  {filter === 'all' && 'No pools found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Create your first investment pool to get started.'}
                </p>
                {!searchTerm && (
                  <Link href="/admin/pools/new">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Pool
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPools.map((pool) => {
                  const statusInfo = getPoolStatusInfo(pool.status);
                  
                  return (
                    <div
                      key={pool.poolId}
                      className="border border-slate-700 rounded-lg p-6 bg-slate-750 hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Pool Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <TrendingUp className="h-5 w-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold text-white">
                              {pool.name}
                            </h3>
                            <Badge className={`${statusInfo.bgColor} text-white`}>
                              {statusInfo.label}
                            </Badge>
                            {pool.metadata?.risk_category && (
                              <Badge className={getRiskBadgeColor(pool.metadata.risk_category)}>
                                {pool.metadata.risk_category.toUpperCase()} RISK
                              </Badge>
                            )}
                          </div>
                          
                          {pool.metadata?.description && (
                            <p className="text-gray-400 mb-3">{pool.metadata.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Start Date</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(Number(pool.startDate))}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">End Date</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(Number(pool.endDate))}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Total Value</p>
                              <p className="text-cyan-400 font-bold">
                                {formatCurrency(Number(pool.totalLoanAmount || 0) / 100)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Invoices</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {pool.invoiceIds?.length || 0}
                              </p>
                            </div>
                          </div>

                          {/* Funding Progress */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-400">Funding Progress</span>
                              <span className="text-sm font-medium text-cyan-400">
                                {pool.fundingPercentage || 0}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(pool.fundingPercentage || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="lg:ml-6">
                          <Link href={`/admin/pools/${pool.poolId}`}>
                            <Button variant="outline" className="border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              Manage
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
    </AdminAuthGuard>
  );
}