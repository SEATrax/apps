'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { usePoolNFT } from '@/hooks/usePoolNFT';
import { usePoolFunding } from '@/hooks/usePoolFunding';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingUp, Clock, Target, AlertTriangle, DollarSign, FileText, Building, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatETH, formatUSD, getStatusColor, parseEther } from '@/lib/utils';

export default function PoolDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activeAccount = useActiveAccount();
  const { getPool, getPoolsByStatus } = usePoolNFT();
  const { investInPool, getPoolFundingPercentage } = usePoolFunding();
  const { getInvoice } = useInvoiceNFT();
  
  const [pool, setPool] = useState<any>(null);
  const [poolInvoices, setPoolInvoices] = useState<any[]>([]);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const poolId = params.id;

  // Fetch pool data from smart contract
  useEffect(() => {
    const fetchPoolData = async () => {
      if (!poolId || !activeAccount) return;
      
      try {
        setLoading(true);
        
        // For development, use mock data
        // TODO: Implement real contract integration when types are fixed
        setPool(mockPool);
        setPoolInvoices(mockInvoices);
      } catch (error) {
        console.error('Failed to fetch pool data:', error);
        // Fallback to mock data
        setPool(mockPool);
        setPoolInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [poolId, activeAccount, getPool, getPoolFundingPercentage, getInvoice]);

  // Helper functions
  const getInvoiceStatus = (status: number) => {
    const statuses = ['Pending', 'Finalized', 'Fundraising', 'Funded', 'Paid', 'Cancelled'];
    return statuses[status] || 'Unknown';
  };

  const getPoolStatus = (status: number) => {
    const statuses = ['Open', 'Fundraising', 'PartiallyFunded', 'Funded', 'Settling', 'Completed'];
    return statuses[status] || 'Unknown';
  };

  // Mock data for fallback
  const mockPool = {
    id: 1,
    name: 'Southeast Asia Export Pool #12',
    description: 'Diversified pool of electronics and textile exports to ASEAN markets. This pool focuses on established exporters with strong track records in the electronics manufacturing and textile industries.',
    totalLoanAmount: '25.5',
    totalShippingAmount: '30.2',
    amountInvested: '18.7',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    invoiceCount: 8,
    expectedYield: '4.2%',
    riskCategory: 'Medium',
    status: 'Fundraising',
    fundingProgress: 73,
    minimumInvestment: '0.1',
    maximumInvestment: '10.0',
    averageInvoiceValue: '3.2',
    averageLoanTerm: '90 days'
  };

  const mockInvoices = [
    {
      id: 1,
      exporterCompany: 'TechCorp Electronics',
      importerCompany: 'Global Distribution Ltd',
      shippingAmount: '4.2',
      loanAmount: '3.4',
      destination: 'Singapore',
      goods: 'Consumer Electronics',
      shippingDate: '2024-01-15',
      status: 'Approved'
    },
    {
      id: 2,
      exporterCompany: 'Textile Innovations Inc',
      importerCompany: 'Fashion Retailers Asia',
      shippingAmount: '3.8',
      loanAmount: '3.0',
      destination: 'Thailand',
      goods: 'Textile Products',
      shippingDate: '2024-01-20',
      status: 'Approved'
    },
    {
      id: 3,
      exporterCompany: 'Digital Components Co',
      importerCompany: 'Tech Solutions Malaysia',
      shippingAmount: '5.1',
      loanAmount: '4.1',
      destination: 'Malaysia',
      goods: 'Electronic Components',
      shippingDate: '2024-01-25',
      status: 'Approved'
    }
  ];

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  const handleInvest = async () => {
    if (!investmentAmount || parseFloat(investmentAmount) < parseFloat(pool.minimumInvestment)) {
      toast.error(`Minimum investment is ${pool.minimumInvestment} ETH`);
      return;
    }

    if (parseFloat(investmentAmount) > parseFloat(pool.maximumInvestment)) {
      toast.error(`Maximum investment is ${pool.maximumInvestment} ETH`);
      return;
    }

    setIsInvesting(true);
    
    try {
      // Convert amount to Wei for smart contract
      const amountInWei = parseEther(investmentAmount);
      
      // Call smart contract investment function
      await investInPool(pool.id, amountInWei);
      
      toast.success(`Successfully invested ${formatETH(investmentAmount)} in ${pool.name}`);
      
      // Refresh pool data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Investment failed:', error);
      toast.error('Investment failed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

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
      {/* Back Button */}
      <Button 
        onClick={() => router.push('/investor/pools')}
        variant="ghost" 
        className="text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Pools
      </Button>

      {/* Pool Header */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl text-white">{pool.name}</CardTitle>
                <Badge className={`${getStatusColor(pool.status)}`}>
                  {pool.status}
                </Badge>
              </div>
              <p className="text-gray-300 leading-relaxed">{pool.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl text-cyan-400 font-bold">{pool.expectedYield}</div>
              <div className="text-sm text-gray-400">Expected Yield</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Funding Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Funding Progress</span>
              <span className="text-white font-medium">{pool.fundingProgress}%</span>
            </div>
            <Progress value={pool.fundingProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>{pool.amountInvested} ETH raised</span>
              <span>{pool.totalLoanAmount} ETH target</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl text-white font-bold">{pool.invoiceCount}</div>
              <div className="text-sm text-gray-400">Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white font-bold">{pool.averageInvoiceValue} ETH</div>
              <div className="text-sm text-gray-400">Avg. Invoice</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white font-bold">{pool.averageLoanTerm}</div>
              <div className="text-sm text-gray-400">Avg. Term</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskColor(pool.riskCategory)}`}>{pool.riskCategory}</div>
              <div className="text-sm text-gray-400">Risk Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Form */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800 sticky top-24">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Make Investment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-gray-300">Investment Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.1"
                  min={pool.minimumInvestment}
                  max={pool.maximumInvestment}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Min: ${pool.minimumInvestment} ETH`}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Min: {pool.minimumInvestment} ETH</span>
                  <span>Max: {pool.maximumInvestment} ETH</span>
                </div>
              </div>

              {investmentAmount && parseFloat(investmentAmount) > 0 && (
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Investment:</span>
                    <span className="text-white">{investmentAmount} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expected Return:</span>
                    <span className="text-cyan-400">
                      {(parseFloat(investmentAmount) * 1.042).toFixed(3)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Profit:</span>
                    <span className="text-green-400">
                      +{(parseFloat(investmentAmount) * 0.042).toFixed(3)} ETH
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="text-xs text-yellow-300">
                    <div className="font-medium mb-1">Investment Risk Notice</div>
                    <div>All investments carry risk. Returns are not guaranteed and you may lose some or all of your investment.</div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleInvest}
                disabled={!investmentAmount || parseFloat(investmentAmount) < parseFloat(pool.minimumInvestment) || isInvesting}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50"
              >
                {isInvesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Investing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Invest Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pool Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pool Information */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Pool Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Pool Duration</div>
                <div className="text-white font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {pool.startDate} - {pool.endDate}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Total Shipping Value</div>
                <div className="text-white font-medium">{pool.totalShippingAmount} ETH</div>
              </div>
              <div>
                <div className="text-gray-400">Target Loan Amount</div>
                <div className="text-white font-medium">{pool.totalLoanAmount} ETH</div>
              </div>
              <div>
                <div className="text-gray-400">Current Investment</div>
                <div className="text-cyan-400 font-medium">{pool.amountInvested} ETH</div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Invoices in this Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInvoices.map((invoice) => (
                  <div key={invoice.id} className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-white font-medium">{invoice.exporterCompany}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span>to {invoice.destination}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {invoice.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Shipping Value</div>
                        <div className="text-white font-medium">{invoice.shippingAmount} ETH</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Loan Amount</div>
                        <div className="text-cyan-400 font-medium">{invoice.loanAmount} ETH</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Goods</div>
                        <div className="text-white font-medium">{invoice.goods}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Ship Date</div>
                        <div className="text-white font-medium">{invoice.shippingDate}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}