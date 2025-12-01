import { useState, useEffect } from 'react';
import { DollarSign, Wallet, AlertCircle, CheckCircle, ArrowLeft, TrendingUp, Calendar, Target } from 'lucide-react';
import { usePoolNFT } from '@/hooks/usePoolNFT';
import { usePoolFunding } from '@/hooks/usePoolFunding';
import { usePanna } from '@/hooks/usePanna';
import { usdToWei } from '@/lib/currency';

interface AddInvestmentProps {
  onBack?: () => void;
  onComplete?: () => void;
}

export default function AddInvestment({ onBack, onComplete }: AddInvestmentProps) {
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [availablePools, setAvailablePools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);

  // Contract hooks
  const { account, isConnected } = usePanna();
  const { getAllPools } = usePoolNFT();
  const { investInPool, getPoolFundingPercentage } = usePoolFunding();

  // Mock investor balance - in real implementation, get from wallet or contract
  const investorBalance = 150000; // $150,000 available balance

  // Load pools from contract
  useEffect(() => {
    const loadPools = async () => {
      try {
        setLoading(true);
        const pools = await getAllPools();
        
        // Transform contract pools to component format
        const transformedPools = await Promise.all(
          pools.map(async (pool: any) => {
            const fundingPercentage = await getPoolFundingPercentage(pool.id);
            const funded = (pool.totalLoanAmount * fundingPercentage) / 100;
            
            return {
              id: pool.id.toString(),
              name: pool.name,
              duration: '5 days', // Mock - could be calculated from start/end dates
              funded: funded,
              target: pool.totalLoanAmount,
              yieldRate: 4.0, // Fixed 4% yield
              poolStatus: pool.status === 0 ? 'open' : 
                          pool.status === 1 ? 'funded' : 'completed',
              invoiceCount: pool.invoiceIds?.length || 0,
              minInvestment: 5000, // Fixed minimum investment
            };
          })
        );
        
        // Filter only open pools
        setAvailablePools(transformedPools.filter(pool => pool.poolStatus === 'open'));
      } catch (error) {
        console.error('Error loading pools:', error);
        setAvailablePools([]);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      loadPools();
    }
  }, [isConnected, getAllPools, getPoolFundingPercentage]);

  const amount = parseFloat(investmentAmount) || 0;
  const pool = availablePools.find(p => p.id === selectedPool);
  const remaining = pool ? pool.target - pool.funded : 0;

  // Validations
  const isSufficientBalance = amount <= investorBalance;
  const meetsMinimum = pool ? amount >= pool.minInvestment : false;
  const withinPoolCapacity = pool ? amount <= remaining : false;
  const isValidAmount = amount > 0;

  const canInvest = isSufficientBalance && meetsMinimum && withinPoolCapacity && isValidAmount && selectedPool;

  const handleInvest = async () => {
    if (canInvest && isConnected) {
      try {
        setInvesting(true);
        
        // Convert USD amount to Wei for smart contract
        const amountInWei = await usdToWei(amount);
        const poolIdBigint = BigInt(selectedPool);
        
        await investInPool(poolIdBigint, amountInWei);
        setShowConfirmation(true);
      } catch (error) {
        console.error('Error investing in pool:', error);
        // Handle error - could show toast notification
      } finally {
        setInvesting(false);
      }
    }
  };

  const confirmInvestment = () => {
    // Investment already completed, just navigate back
    onComplete?.();
  };

  const getPoolStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'funded': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // Show loading state while pools are loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl text-white mb-2">Loading Available Pools...</h2>
            <p className="text-slate-400">Fetching pool data from blockchain</p>
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-8 border border-slate-800">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl text-white mb-2">Investment Submitted!</h2>
              <p className="text-slate-400 mb-6">
                Your investment of ${amount.toLocaleString()} has been successfully submitted to {pool?.name}.
              </p>
              
              <div className="bg-slate-800/50 rounded-lg p-6 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Investment Amount</div>
                    <div className="text-lg text-white">${amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Expected Return (4%)</div>
                    <div className="text-lg text-emerald-400">${(amount * 1.04).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Pool</div>
                    <div className="text-lg text-white">{pool?.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Duration</div>
                    <div className="text-lg text-white">{pool?.duration}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={onComplete}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 hover-scale transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4 hover-scale-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl text-white mb-2">Add New Investment</h1>
          <p className="text-slate-400">Select a pool and enter your investment amount</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Available Balance Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Available Balance</div>
                  <div className="text-3xl text-white">${investorBalance.toLocaleString()}</div>
                </div>
                <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>

            {/* Pool Selection */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800">
              <h3 className="text-lg text-white mb-4">Select Pool</h3>
              {availablePools.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-400 mb-2">No pools available</p>
                  <p className="text-sm text-slate-500">Check back later for new investment opportunities.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePools.map((pool) => {
                  const fundedPercent = (pool.funded / pool.target) * 100;
                  const remainingAmount = pool.target - pool.funded;
                  
                  return (
                    <div
                      key={pool.id}
                      onClick={() => setSelectedPool(pool.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover-lift ${
                        selectedPool === pool.id
                          ? 'border-cyan-500 bg-cyan-500/5'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white mb-1">{pool.name}</h4>
                          <p className="text-sm text-slate-400">{pool.duration} • {pool.invoiceCount} invoices</p>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getPoolStatusColor(pool.poolStatus)}`}>
                          {pool.poolStatus}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="text-slate-400">Funded</span>
                          <span className="text-cyan-400">{fundedPercent.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all" 
                            style={{ width: `${fundedPercent}%` }} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-slate-400">Target</div>
                          <div className="text-white">${pool.target.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Remaining</div>
                          <div className="text-emerald-400">${remainingAmount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Yield</div>
                          <div className="text-cyan-400">{pool.yieldRate}%</div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Investment Amount */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800">
              <h3 className="text-lg text-white mb-4">Investment Amount</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Enter Amount (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {pool && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setInvestmentAmount(pool.minInvestment.toString())}
                    className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all"
                  >
                    Min: ${pool.minInvestment.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setInvestmentAmount(Math.min(remaining, investorBalance).toString())}
                    className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all"
                  >
                    Max: ${Math.min(remaining, investorBalance).toLocaleString()}
                  </button>
                </div>
              )}

              {/* Validation Messages */}
              <div className="space-y-2">
                {amount > 0 && !isSufficientBalance && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-400">
                      Insufficient balance. You have ${investorBalance.toLocaleString()} available.
                    </span>
                  </div>
                )}
                
                {amount > 0 && pool && !meetsMinimum && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-yellow-400">
                      Minimum investment for this pool is ${pool.minInvestment.toLocaleString()}.
                    </span>
                  </div>
                )}
                
                {amount > 0 && pool && !withinPoolCapacity && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-yellow-400">
                      Pool only needs ${remaining.toLocaleString()} more to reach target.
                    </span>
                  </div>
                )}

                {canInvest && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-emerald-400">
                      Ready to invest! All requirements met.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleInvest}
              disabled={!canInvest || investing}
              className={`w-full px-6 py-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                canInvest && !investing
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover-scale'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {investing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Investment...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Invest ${amount > 0 ? amount.toLocaleString() : '0'}</span>
                </>
              )}
            </button>
          </div>

          {/* Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 sticky top-8">
              <h3 className="text-lg text-white mb-4">Investment Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Pool Selected</div>
                  <div className="text-white">
                    {pool ? pool.name : 'No pool selected'}
                  </div>
                </div>

                {pool && (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-xs text-slate-400">Duration</div>
                        <div className="text-sm text-white">{pool.duration}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs text-slate-400">Expected Yield</div>
                        <div className="text-sm text-emerald-400">{pool.yieldRate}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                      <Target className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-xs text-slate-400">Pool Target</div>
                        <div className="text-sm text-white">${pool.target.toLocaleString()}</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm text-slate-400 mb-1">Your Investment</div>
                  <div className="text-2xl text-white mb-2">
                    ${amount > 0 ? amount.toLocaleString() : '0'}
                  </div>
                  {amount > 0 && (
                    <div className="text-sm text-slate-400">
                      Expected return: <span className="text-emerald-400">${(amount * 1.04).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <div className="text-sm text-slate-400 mb-1">Remaining Balance</div>
                  <div className="text-xl text-white">
                    ${(investorBalance - amount).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
