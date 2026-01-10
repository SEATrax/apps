'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ArrowUpRight,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Eye,
  Wallet
} from 'lucide-react'
import { 
  mockPools, 
  mockInvestments, 
  mockInvoices, 
  getInvestmentsByInvestor,
  getReturnsByInvestor 
} from '@/data/mockData'
import { useDemoContext } from '@/contexts/DemoContext'

interface InvestorSimulationProps {
  walletAddress: string
}

export default function InvestorSimulation({ walletAddress }: InvestorSimulationProps) {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'pools' | 'investments' | 'returns' | 'payments'>('dashboard')
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  
  const { pools, investInPool, addNotification } = useDemoContext()
  // Use demo wallet address if needed
  const demoWalletAddress = walletAddress || '0x947d35Cc6139C94532c5f3a9d3Bb4c8f8E4c7Dc5'
  const investorInvestments = getInvestmentsByInvestor(demoWalletAddress)
  const investorReturns = getReturnsByInvestor(demoWalletAddress)
  
  const stats = {
    totalInvested: investorInvestments.reduce((sum, inv) => sum + inv.amount, 0),
    activeInvestments: investorInvestments.filter(inv => inv.status === 'ACTIVE').length,
    totalReturns: investorReturns.reduce((sum, ret) => sum + ret.amount, 0),
    portfolioValue: investorInvestments.reduce((sum, inv) => sum + inv.amount, 0) + 
                   investorReturns.reduce((sum, ret) => sum + ret.amount, 0)
  }

  const getPoolStatusBadge = (status: string) => {
    const statusConfig = {
      'OPEN': { color: 'bg-blue-100 text-blue-800', label: 'Open for Investment' },
      'FUNDED': { color: 'bg-green-100 text-green-800', label: 'Fully Funded' },
      'COMPLETED': { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['OPEN']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getRiskBadge = (risk: string) => {
    const riskConfig = {
      'LOW': { color: 'bg-green-100 text-green-800', label: 'Low Risk' },
      'MEDIUM': { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' },
      'HIGH': { color: 'bg-red-100 text-red-800', label: 'High Risk' }
    }
    const config = riskConfig[risk as keyof typeof riskConfig] || riskConfig['MEDIUM']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const [isInvesting, setIsInvesting] = useState(false)
  
  const handleInvest = async (pool: any) => {
    const amount = parseFloat(investmentAmount)
    if (amount < 1000) {
      alert('Minimum investment is $1,000')
      return
    }
    
    if (amount > (pool.total_loan_amount - pool.amount_invested)) {
      alert(`Maximum available investment: $${(pool.total_loan_amount - pool.amount_invested).toLocaleString()}`)
      return
    }
    
    setIsInvesting(true)
    
    // Simulate transaction processing
    setTimeout(() => {
      investInPool(pool.id, amount, walletAddress)
      setInvestmentAmount('')
      setSelectedPool(null)
      setIsInvesting(false)
    }, 2000)
  }

  const calculateAPY = (pool: any) => {
    // Simulate APY calculation based on pool characteristics
    const baseAPY = 4 // 4% base return
    const riskMultiplier = pool.risk_category === 'HIGH' ? 1.5 : pool.risk_category === 'LOW' ? 0.8 : 1
    return (baseAPY * riskMultiplier).toFixed(1)
  }

  if (selectedTab === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Investor Dashboard</h1>
            <p className="text-slate-400">Manage your investment portfolio</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setSelectedTab('investments')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Wallet className="w-4 h-4 mr-2" />
              My Investments
            </Button>
            <Button 
              onClick={() => setSelectedTab('returns')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Returns
            </Button>
            <Button 
              onClick={() => setSelectedTab('payments')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payments
            </Button>
            <Button 
              onClick={() => setSelectedTab('pools')}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Target className="w-4 h-4 mr-2" />
              Browse Pools
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Invested</p>
                  <p className="text-2xl font-bold text-white">${stats.totalInvested.toLocaleString()}</p>
                </div>
                <Wallet className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Investments</p>
                  <p className="text-2xl font-bold text-white">{stats.activeInvestments}</p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Returns</p>
                  <p className="text-2xl font-bold text-white">${stats.totalReturns.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">${stats.portfolioValue.toLocaleString()}</p>
                </div>
                <PieChart className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Pools */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Featured Investment Pools</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedTab('pools')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                View All Pools
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pools.filter(pool => pool.status === 'OPEN').slice(0, 2).map((pool) => (
                <div key={pool.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-white font-medium mb-1">{pool.name}</h4>
                      <p className="text-slate-400 text-sm">{pool.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {getPoolStatusBadge(pool.status)}
                      {getRiskBadge(pool.risk_category)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-slate-400 text-xs">Target Amount</p>
                      <p className="text-white font-medium">${pool.total_loan_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Funded</p>
                      <p className="text-white font-medium">
                        {Math.round((pool.amount_invested / pool.total_loan_amount) * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Expected APY</p>
                      <p className="text-green-400 font-medium">{calculateAPY(pool)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Duration</p>
                      <p className="text-white font-medium">
                        {Math.round((new Date(pool.end_date).getTime() - new Date(pool.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 mr-4">
                      <div 
                        className="bg-cyan-400 h-2 rounded-full transition-all"
                        style={{ width: `${(pool.amount_invested / pool.total_loan_amount) * 100}%` }}
                      />
                    </div>
                    <Button 
                      onClick={() => setSelectedPool(pool)}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      Invest Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {investorInvestments.slice(0, 3).map((investment) => {
                  const pool = pools.find(p => p.id === investment.pool_id)
                  return (
                    <div key={investment.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{pool?.name}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(investment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${investment.amount.toLocaleString()}</p>
                        <Badge className={investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {investment.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {investorReturns.slice(0, 3).map((returnItem) => {
                  const pool = mockPools.find(p => p.id === returnItem.pool_id)
                  return (
                    <div key={returnItem.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{pool?.name}</p>
                        <p className="text-slate-400 text-sm">
                          {new Date(returnItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">+${returnItem.amount.toLocaleString()}</p>
                        <p className="text-slate-400 text-sm">Return</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Modal */}
        {selectedPool && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Invest in {selectedPool.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm font-medium">Investment Amount (USD)</label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder="10000"
                    min="1000"
                  />
                  <p className="text-slate-400 text-xs mt-1">Minimum investment: $1,000</p>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected APY:</span>
                    <span className="text-green-400 font-medium">{calculateAPY(selectedPool)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Investment Period:</span>
                    <span className="text-white">
                      {Math.round((new Date(selectedPool.end_date).getTime() - new Date(selectedPool.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Level:</span>
                    <span className="text-white">{selectedPool.risk_category}</span>
                  </div>
                </div>

                {isInvesting ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-white font-medium">Processing Investment...</p>
                    <p className="text-slate-400 text-sm">Please wait while we confirm your transaction</p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleInvest(selectedPool)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                      disabled={!investmentAmount || parseFloat(investmentAmount) < 1000}
                    >
                      Confirm Investment
                    </Button>
                    <Button 
                      onClick={() => setSelectedPool(null)}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (selectedTab === 'pools') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setSelectedTab('dashboard')}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Investment Pools</h1>
            <p className="text-slate-400">Browse and invest in curated invoice pools</p>
          </div>
        </div>

        <div className="grid gap-6">
          {pools.map((pool) => (
            <Card key={pool.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-3">
                      {pool.name}
                      {getPoolStatusBadge(pool.status)}
                      {getRiskBadge(pool.risk_category)}
                    </CardTitle>
                    <p className="text-slate-400 text-sm mt-1">{pool.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">{calculateAPY(pool)}% APY</p>
                    <p className="text-slate-400 text-sm">Expected Return</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Target Amount</p>
                    <p className="text-white font-medium">${pool.total_loan_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Amount Raised</p>
                    <p className="text-white font-medium">${pool.amount_invested.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Invoices</p>
                    <p className="text-white font-medium">{pool.invoice_ids.length} invoices</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Duration</p>
                    <p className="text-white font-medium">
                      {Math.round((new Date(pool.end_date).getTime() - new Date(pool.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">Funding Progress</span>
                    <span className="text-white text-sm">
                      {Math.round((pool.amount_invested / pool.total_loan_amount) * 100)}%
                    </span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-cyan-400 h-3 rounded-full transition-all"
                      style={{ width: `${(pool.amount_invested / pool.total_loan_amount) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                  
                  {pool.status === 'OPEN' && (
                    <Button 
                      onClick={() => setSelectedPool(pool)}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Invest Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (selectedTab === 'investments') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setSelectedTab('dashboard')}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">My Investments</h1>
            <p className="text-slate-400">Track your active and completed investments</p>
          </div>
        </div>

        <div className="grid gap-6">
          {investorInvestments.map((investment) => {
            const pool = pools.find(p => p.id === investment.pool_id)
            if (!pool) return null
            
            return (
              <Card key={investment.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{pool.name}</CardTitle>
                      <p className="text-slate-400 text-sm mt-1">{pool.description}</p>
                    </div>
                    <Badge className={investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {investment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">My Investment</p>
                      <p className="text-white font-medium">${investment.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">My Share</p>
                      <p className="text-white font-medium">{investment.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Expected Return</p>
                      <p className="text-green-400 font-medium">${(investment.amount * 0.04).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Investment Date</p>
                      <p className="text-white font-medium">
                        {new Date(investment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Pool Funding Progress</span>
                      <span className="text-white text-sm">
                        {Math.round((pool.amount_invested / pool.total_loan_amount) * 100)}%
                      </span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-cyan-400 h-2 rounded-full transition-all"
                        style={{ width: `${(pool.amount_invested / pool.total_loan_amount) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (selectedTab === 'returns') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setSelectedTab('dashboard')}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Investment Returns</h1>
            <p className="text-slate-400">View your earned returns and profit distributions</p>
          </div>
        </div>

        <div className="grid gap-6">
          {investorReturns.length > 0 ? (
            investorReturns.map((returnItem) => {
              const pool = pools.find(p => p.id === returnItem.pool_id)
              if (!pool) return null
              
              return (
                <Card key={returnItem.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-semibold">{pool.name}</h3>
                        <p className="text-slate-400 text-sm">Return Payment</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">+${returnItem.amount.toLocaleString()}</p>
                        <p className="text-slate-400 text-sm">4.0% Return</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm">Payment Date</p>
                        <p className="text-white font-medium">
                          {new Date(returnItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Pool Status</p>
                        <Badge className="bg-gray-100 text-gray-800">COMPLETED</Badge>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Payment Status</p>
                        <Badge className="bg-green-100 text-green-800">
                          AVAILABLE
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Original Investment</p>
                        <p className="text-white font-medium">${(returnItem.amount * 25).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-slate-400 text-sm">Transaction</p>
                        <p className="text-cyan-400 text-sm font-mono">0x1234...5678</p>
                      </div>
                      {true && (
                        <Button 
                          onClick={() => {
                            addNotification({
                              title: 'Returns Claimed Successfully',
                              message: `$${returnItem.amount.toLocaleString()} has been transferred to your wallet`,
                              type: 'success'
                            })
                            // Here you would normally update the returnItem.claimed status
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Claim ${returnItem.amount.toLocaleString()}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">No Returns Yet</h3>
                <p className="text-slate-400">
                  Your investment returns will appear here once pools are completed and profits are distributed.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (selectedTab === 'payments') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button 
            onClick={() => setSelectedTab('dashboard')}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Payments & Withdrawals</h1>
            <p className="text-slate-400">Manage your investment returns and withdrawal history</p>
          </div>
        </div>

        {/* Payment Summary */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Total Returns Earned</p>
                <p className="text-2xl font-bold text-green-400">${stats.totalReturns.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Available to Claim</p>
                <p className="text-2xl font-bold text-cyan-400">$8,240</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Already Withdrawn</p>
                <p className="text-2xl font-bold text-white">${(stats.totalReturns * 0.6).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400 text-sm">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-400">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4">Quick Withdrawal</h3>
              <p className="text-slate-400 text-sm mb-4">
                Withdraw all available returns to your connected wallet
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Wallet className="w-4 h-4 mr-2" />
                Withdraw All Available Returns
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4">Payment History</h3>
              <p className="text-slate-400 text-sm mb-4">
                View detailed history of all your investment returns and withdrawals
              </p>
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setSelectedTab('returns')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Payment History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <div className="text-white">Tab {selectedTab} not implemented</div>
}