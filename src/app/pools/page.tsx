'use client';

import { useState } from 'react';
import { 
  Layers, 
  Search, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePanna } from '@/hooks/usePanna';
import { formatEther, formatDate, getStatusColor } from '@/lib/utils';
import { appConfig } from '@/config';

// Mock data - replace with actual contract data
const mockPools = [
  {
    poolId: 1n,
    name: 'Asia Pacific Trade Pool',
    description: 'Diversified pool of shipping invoices from APAC region exporters.',
    totalValue: 500000n * 10n ** 18n,
    totalInvested: 350000n * 10n ** 18n,
    investorCount: 24,
    status: 'open',
    invoiceCount: 8,
    targetYield: 4,
    maturityDate: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60,
  },
  {
    poolId: 2n,
    name: 'European Export Fund',
    description: 'Premium European exporters with verified trade history.',
    totalValue: 750000n * 10n ** 18n,
    totalInvested: 750000n * 10n ** 18n,
    investorCount: 42,
    status: 'closed',
    invoiceCount: 12,
    targetYield: 4,
    maturityDate: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
  },
  {
    poolId: 3n,
    name: 'Emerging Markets Pool',
    description: 'High-growth emerging market trade finance opportunities.',
    totalValue: 300000n * 10n ** 18n,
    totalInvested: 180000n * 10n ** 18n,
    investorCount: 18,
    status: 'open',
    invoiceCount: 5,
    targetYield: 4.5,
    maturityDate: Math.floor(Date.now() / 1000) + 120 * 24 * 60 * 60,
  },
];

export default function PoolsPage() {
  const { isConnected } = usePanna();
  const [searchQuery, setSearchQuery] = useState('');

  const calculateFundingPercentage = (invested: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return Number((invested * 100n) / total);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view and invest in pools.
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
          <h1 className="text-3xl font-bold">Investment Pools</h1>
          <p className="text-muted-foreground mt-1">
            Invest in curated bundles of shipping invoices
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockPools.length}</p>
                <p className="text-sm text-muted-foreground">Active Pools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appConfig.platform.investorYield}%</p>
                <p className="text-sm text-muted-foreground">Target Yield</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">84</p>
                <p className="text-sm text-muted-foreground">Total Investors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">25</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pools Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {mockPools.map((pool) => {
          const fundingPercentage = calculateFundingPercentage(
            pool.totalInvested,
            pool.totalValue
          );

          return (
            <Card key={pool.poolId.toString()} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{pool.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {pool.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(pool.status)}>
                    {pool.status === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Pool Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatEther(pool.totalValue, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Value (ETH)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pool.investorCount}</p>
                    <p className="text-xs text-muted-foreground">Investors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">
                      {pool.targetYield}%
                    </p>
                    <p className="text-xs text-muted-foreground">Expected Yield</p>
                  </div>
                </div>

                {/* Funding Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-medium">{fundingPercentage}%</span>
                  </div>
                  <Progress 
                    value={fundingPercentage}
                    className="h-2"
                    indicatorClassName={
                      fundingPercentage >= 100 
                        ? 'bg-emerald-500' 
                        : fundingPercentage >= 70 
                        ? 'bg-blue-500' 
                        : ''
                    }
                  />
                </div>

                {/* Pool Details */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
                  <span>{pool.invoiceCount} invoices in pool</span>
                  <span>Matures: {formatDate(pool.maturityDate)}</span>
                </div>

                {/* Action */}
                <Button 
                  className="w-full gap-2" 
                  disabled={pool.status !== 'open'}
                >
                  {pool.status === 'open' ? (
                    <>
                      Invest Now
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    'Pool Closed'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
