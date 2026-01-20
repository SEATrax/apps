'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
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
  const { getPool, invest, getInvoice } = useSEATrax();

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

        // Fetch pool data from contract
        const poolData = await getPool(BigInt(poolId as string));

        if (poolData) {
          // Calculate funding progress
          const fundingProgress = Number(poolData.totalLoanAmount) > 0
            ? Math.min(100, Math.round((Number(poolData.amountInvested) / Number(poolData.totalLoanAmount)) * 100))
            : 0;

          // Convert Wei to USD for display (1 ETH = $3000 approx)
          const totalLoanUSD = Number(poolData.totalLoanAmount) / 1e18 * 3000;
          const amountInvestedUSD = Number(poolData.amountInvested) / 1e18 * 3000;

          setPool({
            id: poolData.poolId,
            name: poolData.name,
            description: 'Diversified pool of export trade financing opportunities', // Would come from Supabase
            totalLoanAmount: totalLoanUSD.toFixed(0),
            amountInvested: amountInvestedUSD.toFixed(0),
            startDate: new Date(Number(poolData.startDate) * 1000).toLocaleDateString(),
            endDate: new Date(Number(poolData.endDate) * 1000).toLocaleDateString(),
            invoiceCount: poolData.invoiceIds.length,
            expectedYield: '4.0%',
            riskCategory: 'Medium',
            status: poolData.status === 0 ? 'Open' : poolData.status === 3 ? 'Funded' : 'Fundraising',
            fundingProgress,
            minimumInvestment: '0.30', // ~0.0001 ETH @ $3000/ETH (for testing)
            maximumInvestment: '3000' // ~1 ETH @ $3000/ETH (for testing)
          });

          // Fetch invoice details
          const invoices = [];
          for (const invoiceId of poolData.invoiceIds) {
            const invoiceData = await getInvoice(invoiceId);
            if (invoiceData) {
              invoices.push({
                id: Number(invoiceId),
                exporterCompany: invoiceData.exporterCompany,
                importerCompany: invoiceData.importerCompany,
                shippingAmount: (Number(invoiceData.shippingAmount) / 100).toFixed(0), // cents to USD
                loanAmount: (Number(invoiceData.loanAmount) / 100).toFixed(0),
                destination: 'Southeast Asia', // Would come from metadata
                goods: 'Export Goods', // Would come from metadata
                shippingDate: new Date(Number(invoiceData.shippingDate) * 1000).toLocaleDateString(),
                status: 'Approved'
              });
            }
          }
          setPoolInvoices(invoices);
        }
      } catch (error) {
        console.error('Failed to fetch pool data:', error);
        toast.error('Failed to load pool data');
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [poolId, activeAccount, getPool, getInvoice]);

  useEffect(() => {
    if (!activeAccount) {
      router.push('/');
      return;
    }
  }, [activeAccount, router]);

  const handleInvest = async () => {
    if (!pool) return;

    if (!investmentAmount || parseFloat(investmentAmount) < parseFloat(pool.minimumInvestment)) {
      toast.error(`Minimum investment is $${Number(pool.minimumInvestment).toLocaleString()}`);
      return;
    }

    if (parseFloat(investmentAmount) > parseFloat(pool.maximumInvestment)) {
      toast.error(`Maximum investment is $${Number(pool.maximumInvestment).toLocaleString()}`);
      return;
    }

    setIsInvesting(true);

    try {
      // Convert USD to Wei (assuming 1 ETH = $3000)
      // Use integer math: USD * 10^18 / 3000 = USD * 10^15 / 3
      // We process cents to avoid float: USD * 100
      // Wei = (Cents * 10^18) / (3000 * 100) = Cents * 10^18 / 300000 = Cents * 10^13 / 3
      // But let's just use string parsing for the input to be safe
      const amountUSD = parseFloat(investmentAmount);
      // Fallback to integer math logic:
      // (amountUSD * 1e18) / 3000
      const ethRate = 3000;
      const amountInWei = parseEther((amountUSD / ethRate).toFixed(18)); // Limit decimals to avoid underflow

      // Call invest function with value in transaction options
      const result = await invest(BigInt(pool.id), amountInWei);

      if (result.success) {
        toast.success(`Successfully invested $${investmentAmount} in ${pool.name}`);

        // Refresh pool data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Investment failed');
      }
    } catch (error: any) {
      console.error('Investment failed:', error);
      toast.error(error.message || 'Investment failed. Please try again.');
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading pool details...</div>
        </div>
      </div>
    );
  }

  // Pool not found state
  if (!pool) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => router.push('/investor/pools')}
          variant="ghost"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pools
        </Button>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <div className="text-white text-xl mb-2">Pool Not Found</div>
            <p className="text-gray-400 mb-6">
              The pool you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/investor/pools')}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white"
            >
              Browse Available Pools
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span>${Number(pool.amountInvested).toLocaleString()} raised</span>
              <span>${Number(pool.totalLoanAmount).toLocaleString()} target</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl text-white font-bold">{pool.invoiceCount}</div>
              <div className="text-sm text-gray-400">Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white font-bold">${Number(pool.totalLoanAmount / pool.invoiceCount).toLocaleString()}</div>
              <div className="text-sm text-gray-400">Avg. Invoice</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-white font-bold">{pool.fundingProgress}%</div>
              <div className="text-sm text-gray-400">Funded</div>
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
                <Label htmlFor="amount" className="text-gray-300">Investment Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={pool.minimumInvestment}
                  max={pool.maximumInvestment}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={`Min: $${Number(pool.minimumInvestment).toLocaleString()}`}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Min: ${Number(pool.minimumInvestment).toLocaleString()}</span>
                  <span>Max: ${Number(pool.maximumInvestment).toLocaleString()}</span>
                </div>
              </div>

              {investmentAmount && parseFloat(investmentAmount) > 0 && (
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Investment:</span>
                    <span className="text-white">${Number(investmentAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expected Return:</span>
                    <span className="text-cyan-400">
                      ${(parseFloat(investmentAmount) * 1.04).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Profit (4%):</span>
                    <span className="text-green-400">
                      +${(parseFloat(investmentAmount) * 0.04).toLocaleString()}
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
                <div className="text-gray-400">Target Loan Amount</div>
                <div className="text-white font-medium">${Number(pool.totalLoanAmount).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Current Investment</div>
                <div className="text-cyan-400 font-medium">${Number(pool.amountInvested).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Number of Invoices</div>
                <div className="text-white font-medium">{pool.invoiceCount} invoices</div>
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
                {poolInvoices.map((invoice) => (
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
                        <div className="text-white font-medium">${Number(invoice.shippingAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Loan Amount</div>
                        <div className="text-cyan-400 font-medium">${Number(invoice.loanAmount).toLocaleString()}</div>
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