'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Filter, TrendingUp, Clock, Target, Eye, ArrowRight } from 'lucide-react';

export default function PoolsPage() {
  const router = useRouter();
  const activeAccount = useActiveAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock data - will be replaced with real contract calls
  const pools = [
    {
      id: 1,
      name: 'Southeast Asia Export Pool #12',
      description: 'Diversified pool of electronics and textile exports to ASEAN markets',
      totalLoanAmount: '25.5',
      totalShippingAmount: '30.2',
      amountInvested: '18.7',
      startDate: '2024-01-01',
      endDate: '2024-04-01',
      invoiceCount: 8,
      expectedYield: '4.2%',
      riskCategory: 'Medium',
      status: 'Fundraising',
      fundingProgress: 73
    },
    {
      id: 2,
      name: 'Maritime Trade Pool #8',
      description: 'Specialized pool for maritime equipment and shipping supplies',
      totalLoanAmount: '18.3',
      totalShippingAmount: '22.1',
      amountInvested: '18.3',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      invoiceCount: 5,
      expectedYield: '4.1%',
      riskCategory: 'Low',
      status: 'Funded',
      fundingProgress: 100
    },
    {
      id: 3,
      name: 'Electronics Export Pool #15',
      description: 'High-tech electronics and components for international markets',
      totalLoanAmount: '42.8',
      totalShippingAmount: '51.4',
      amountInvested: '12.8',
      startDate: '2024-01-20',
      endDate: '2024-05-20',
      invoiceCount: 12,
      expectedYield: '4.3%',
      riskCategory: 'High',
      status: 'Open',
      fundingProgress: 30
    }
  ];

  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'open' && pool.status === 'Open') ||
                         (selectedFilter === 'fundraising' && pool.status === 'Fundraising') ||
                         (selectedFilter === 'funded' && pool.status === 'Funded');
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Fundraising': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Funded': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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
          <div>Total Value: {pools.reduce((sum, pool) => sum + parseFloat(pool.totalLoanAmount), 0).toFixed(1)} ETH</div>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFilter === filter
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
        {filteredPools.map((pool) => (
          <Card key={pool.id} className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-all hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-white text-lg leading-tight">{pool.name}</CardTitle>
                <Badge className={`${getStatusColor(pool.status)} text-xs`}>
                  {pool.status}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mt-2">{pool.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Target Amount</div>
                  <div className="text-white font-medium">{pool.totalLoanAmount} ETH</div>
                </div>
                <div>
                  <div className="text-gray-400">Expected Yield</div>
                  <div className="text-cyan-400 font-medium">{pool.expectedYield}</div>
                </div>
                <div>
                  <div className="text-gray-400">Invoices</div>
                  <div className="text-white font-medium">{pool.invoiceCount} invoices</div>
                </div>
                <div>
                  <div className="text-gray-400">Risk Level</div>
                  <div className={`font-medium ${getRiskColor(pool.riskCategory)}`}>{pool.riskCategory}</div>
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
                  <span>{pool.amountInvested} ETH raised</span>
                  <span>{pool.totalLoanAmount} ETH target</span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{pool.startDate} - {pool.endDate}</span>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => router.push(`/investor/pools/${pool.id}`)}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 group-hover:scale-105 transition-all"
                disabled={pool.status === 'Funded'}
              >
                {pool.status === 'Funded' ? (
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
        ))}
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