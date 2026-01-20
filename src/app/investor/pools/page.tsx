'use client';

import { getMarketplacePools } from '@/lib/supabase';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { usePoolMetadata } from '@/hooks/usePoolMetadata';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, TrendingUp, Clock, Target, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { formatETH, formatUSD, getStatusColor, formatDateRelative, formatEther } from '@/lib/utils';

interface PoolData {
  id: bigint;
  name: string;
  totalLoanAmount: bigint;
  totalShippingAmount: bigint;
  amountInvested: bigint;
  amountDistributed: bigint;
  feePaid: bigint;
  startDate: bigint;
  endDate: bigint;
  invoiceIds: bigint[];
  status: number; // 0=OPEN, 1=FUNDRAISING, 2=PARTIALLYFUNDED, 3=FUNDED
}

interface PoolWithMetadata extends PoolData {
  description?: string;
  riskCategory?: string;
  expectedYield?: string;
  fundingProgress: number;
}

export default function PoolsPage() {
  const router = useRouter();
  const account = useActiveAccount(); // Corrected usage
  const { getAllOpenPools, getPool, getPoolFundingPercentage } = useSEATrax();
  const { getPoolsMetadata, getDefaultMetadata, formatRiskCategory } = usePoolMetadata();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all', 'Low', 'Medium', 'High'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'yield_high', 'yield_low', 'progress_high'

  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      router.push('/');
      return;
    }
  }, [account, router]);

  // Fetch pools from Database (Fast)
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from Database (High Performance)
        const dbPools = await getMarketplacePools();

        // Map DB structure to UI structure
        // Map DB structure to UI structure
        const formattedPools = dbPools.map(p => ({
          // Keep raw data first so formatted values overwrite it
          ...p,
          uuid: p.id, // Use DB UUID for React Key
          id: p.pool_id,
          name: p.name || `Pool #${p.pool_id}`,
          description: p.description || 'Investment pool for Southeast Asian export financing.',
          status: mapStatusStringToInt(p.status),
          startDate: p.start_date || Math.floor(Date.now() / 1000),
          endDate: p.end_date || Math.floor(Date.now() / 1000) + 86400 * 30,
          totalLoanAmount: p.total_loan_amount || 0,
          amountInvested: p.amount_invested || 0,
          expectedYield: '12-15%', // Placeholder
          invoiceIds: p.invoice_metadata?.map((inv: any) => inv.id) || [],
          riskCategory: p.risk_category || 'Low',
          fundingProgress: calculateProgress(p.amount_invested || 0, p.total_loan_amount || 1),
        }));

        setPools(formattedPools);
      } catch (err) {
        console.error('Failed to fetch pools:', err);
        setError('Failed to load pools');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  function mapStatusStringToInt(status: string | number | null) {
    if (status === null || status === undefined) return 0;

    // Handle number input
    if (typeof status === 'number') return status;

    const lowStatus = status.toString().toLowerCase();

    // Handle numeric strings from DB
    if (lowStatus === '0') return 0;
    if (lowStatus === '1') return 1;
    if (lowStatus === '2') return 2;
    if (lowStatus === '3') return 3;
    if (lowStatus === '4') return 4;

    switch (lowStatus) {
      case 'open': return 0;
      case 'fundraising': return 1;
      case 'partially funded': return 2;
      case 'active': return 2;
      case 'funded': return 3;
      case 'closed': return 4;
      default: return 0; // Default to Open
    }
  }

  function calculateProgress(invested: number, total: number) {
    if (!total || total === 0) return 0;
    return Math.min(Math.round((invested / total) * 100), 100);
  }

  const getPoolStatus = (status: number): string => {
    switch (status) {
      case 0: return 'Open';
      case 1: return 'Fundraising';
      case 2: return 'Partially Funded';
      case 3: return 'Funded';
      case 4: return 'Closed';
      default: return 'Unknown';
    }
  };

  const filteredPools = pools.filter(pool => {
    // 1. Search
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // 2. Status Filter
    const matchesStatus = selectedFilter === 'all' ||
      (selectedFilter === 'open' && pool.status === 0) ||
      (selectedFilter === 'fundraising' && (pool.status === 1 || pool.status === 2)) ||
      (selectedFilter === 'funded' && pool.status === 3);

    // 3. Risk Filter
    const matchesRisk = riskFilter === 'all' ||
      (pool.riskCategory?.toLowerCase() === riskFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesRisk;
  }).sort((a, b) => {
    // 4. Sorting
    switch (sortBy) {
      case 'yield_high':
        // Simplify for now, assuming string "XX%"
        return parseFloat(b.expectedYield) - parseFloat(a.expectedYield);
      case 'yield_low':
        return parseFloat(a.expectedYield) - parseFloat(b.expectedYield);
      case 'progress_high':
        return b.fundingProgress - a.fundingProgress;
      case 'newest':
      default:
        return 0; // DB order
    }
  });

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-500/20 text-green-400 border-green-500/30'; // OPEN
      case 1:
      case 2: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'; // FUNDRAISING/PARTIALLYFUNDED
      case 3: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // FUNDED
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-white mb-2">Investment Pools</h1>
          <p className="text-gray-300">
            Discover and invest in curated pools of export trade financing opportunities
          </p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <div>Total Available: {pools.length} pools</div>
          <div>Total Value: ${pools.reduce((sum, pool) => sum + (Number(pool.totalLoanAmount) / 1e18 * 3000), 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search pools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {['all', 'open', 'fundraising', 'funded'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedFilter === filter
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Risk Filter */}
            <div className="flex items-center space-x-2">
              <select
                title="Risk Level"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="h-10 px-3 rounded-md bg-slate-900/50 border border-slate-800 text-sm focus:ring-cyan-500/20 focus:border-cyan-500 text-gray-300"
              >
                <option value="all">Risk: All</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center space-x-2">
              <select
                title="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 px-3 rounded-md bg-slate-900/50 border border-slate-800 text-sm focus:ring-cyan-500/20 focus:border-cyan-500 text-gray-300"
              >
                <option value="newest">Newest First</option>
                <option value="yield_high">Yield: High to Low</option>
                <option value="yield_low">Yield: Low to High</option>
                <option value="progress_high">Progress: High to Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton Loading State
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800 flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-6 w-[60%] bg-slate-800" />
                  <Skeleton className="h-5 w-20 bg-slate-800 shrink-0" />
                </div>
                <Skeleton className="h-4 w-full bg-slate-800 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Skeleton className="h-3 w-20 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                  <div className="space-y-1"><Skeleton className="h-3 w-20 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                  <div className="space-y-1"><Skeleton className="h-3 w-20 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                  <div className="space-y-1"><Skeleton className="h-3 w-20 bg-slate-800" /><Skeleton className="h-4 w-24 bg-slate-800" /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between"><Skeleton className="h-3 w-24 bg-slate-800" /><Skeleton className="h-3 w-10 bg-slate-800" /></div>
                  <Skeleton className="h-2 w-full bg-slate-800" />
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Skeleton className="h-10 w-full bg-slate-800" />
              </CardFooter>
            </Card>
          ))
        ) : filteredPools.length > 0 ? (
          filteredPools.map((pool) => {
            const totalLoanUSD = Number(pool.totalLoanAmount) / 1e18 * 3000; // Wei to USD
            const amountInvestedUSD = Number(pool.amountInvested) / 1e18 * 3000;
            const startDateFormatted = new Date(Number(pool.startDate) * 1000).toLocaleDateString();
            const endDateFormatted = new Date(Number(pool.endDate) * 1000).toLocaleDateString();

            return (
              <Card key={pool.uuid} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105 group flex flex-col h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-white text-lg leading-tight line-clamp-1">{pool.name}</CardTitle>
                    <Badge className={`${getStatusColor(pool.status)} text-xs shrink-0`}>
                      {getPoolStatus(pool.status)}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2 h-10">{pool.description}</p>
                </CardHeader>

                <CardContent className="space-y-4 flex flex-col flex-1">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm h-32">
                    <div>
                      <div className="text-gray-400">Target Amount</div>
                      <div className="text-white font-medium">${totalLoanUSD.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Expected Yield</div>
                      <div className="text-cyan-400 font-medium">{pool.expectedYield}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Invoices</div>
                      <div className="text-white font-medium">{pool.invoiceIds.length} invoices</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Risk Level</div>
                      <div className={`font-medium ${getRiskColor(pool.riskCategory || 'Medium')}`}>{pool.riskCategory}</div>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Funding Progress</span>
                      <span className="text-white">{pool.fundingProgress}%</span>
                    </div>
                    <Progress value={pool.fundingProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>${amountInvestedUSD.toLocaleString()} raised</span>
                      <span>${totalLoanUSD.toLocaleString()} target</span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 pt-2">
                    <Clock className="w-4 h-4" />
                    <span>{startDateFormatted} - {endDateFormatted}</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  {/* Action Button */}
                  <Button
                    onClick={() => router.push(`/investor/pools/${pool.id}`)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 group-hover:scale-105 transition-all"
                    disabled={pool.status === 3}
                  >
                    {pool.status === 3 ? (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Fully Funded
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchTerm ? 'No pools match your search criteria' : 'No pools available at the moment'}
                </div>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}