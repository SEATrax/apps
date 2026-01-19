'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { usePoolMetadata } from '@/hooks/usePoolMetadata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const activeAccount = useActiveAccount();
  const { getAllOpenPools, getPool, getPoolFundingPercentage } = useSEATrax();
  const { getPoolsMetadata, getDefaultMetadata, formatRiskCategory } = usePoolMetadata();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [pools, setPools] = useState<PoolWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  // Fetch pools from smart contract
  useEffect(() => {
    const fetchPools = async () => {
      if (!activeAccount) return;

      try {
        setLoading(true);
        setError(null);

        // Get all open pool IDs
        const poolIds = await getAllOpenPools();

        // Fetch full pool data for each ID
        const poolsData: PoolWithMetadata[] = [];

        // Collect pool IDs for batch metadata fetch
        const poolIdNumbers: number[] = [];

        for (const poolId of poolIds) {
          const poolData = await getPool(poolId);
          if (poolData) {
            // Calculate funding progress
            const fundingProgress = Number(poolData.totalLoanAmount) > 0
              ? Math.min(100, Math.round((Number(poolData.amountInvested) / Number(poolData.totalLoanAmount)) * 100))
              : 0;

            poolsData.push({
              id: poolData.poolId,
              ...poolData,
              fundingProgress,
              // Placeholder - will be updated with Supabase metadata below
              description: '',
              riskCategory: 'Medium',
              expectedYield: '4.0%'
            });

            poolIdNumbers.push(Number(poolData.poolId));
          }
        }

        // Fetch metadata for all pools from Supabase
        const metadataMap = await getPoolsMetadata(poolIdNumbers);

        // Merge metadata with pool data
        for (const pool of poolsData) {
          const metadata = metadataMap.get(Number(pool.id));
          if (metadata) {
            pool.description = metadata.description || 'Diversified pool of export trade financing opportunities';
            pool.riskCategory = formatRiskCategory(metadata.risk_category);
            pool.expectedYield = metadata.target_yield ? `${metadata.target_yield}%` : '4.0%';
          } else {
            // Use defaults if no metadata found
            const defaults = getDefaultMetadata(Number(pool.id), pool.name);
            pool.description = defaults.description || 'Diversified pool of export trade financing opportunities';
            pool.riskCategory = formatRiskCategory(defaults.risk_category);
            pool.expectedYield = '4.0%';
          }
        }

        setPools(poolsData);

      } catch (err) {
        console.error('Failed to fetch pools:', err);
        setError('Failed to load pools');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [activeAccount, getAllOpenPools, getPool]);

  const getPoolStatus = (status: number): string => {
    switch (status) {
      case 0: return 'Open';
      case 1: return 'Fundraising';
      case 2: return 'Partially Funded';
      case 3: return 'Funded';
      default: return 'Unknown';
    }
  };

  const filteredPools = pools.filter(pool => {
    const poolStatus = getPoolStatus(pool.status);
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = selectedFilter === 'all' ||
      (selectedFilter === 'open' && pool.status === 0) ||
      (selectedFilter === 'fundraising' && (pool.status === 1 || pool.status === 2)) ||
      (selectedFilter === 'funded' && pool.status === 3);
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

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
            <div className="flex gap-2">
              {['all', 'open', 'fundraising', 'funded'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700'
                    }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPools.map((pool) => {
          const totalLoanUSD = Number(pool.totalLoanAmount) / 1e18 * 3000; // Wei to USD
          const amountInvestedUSD = Number(pool.amountInvested) / 1e18 * 3000;
          const startDateFormatted = new Date(Number(pool.startDate) * 1000).toLocaleDateString();
          const endDateFormatted = new Date(Number(pool.endDate) * 1000).toLocaleDateString();

          return (
            <Card key={Number(pool.id)} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-white text-lg leading-tight">{pool.name}</CardTitle>
                  <Badge className={`${getStatusColor(pool.status)} text-xs`}>
                    {getPoolStatus(pool.status)}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm mt-2">{pool.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                <div className="space-y-2">
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
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{startDateFormatted} - {endDateFormatted}</span>
                </div>

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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredPools.length === 0 && (
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
      )}
    </div>
  );
}