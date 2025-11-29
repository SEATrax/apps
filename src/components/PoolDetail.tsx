import { useState } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle, FileText, Download, DollarSign, Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PoolDetailProps {
  poolId: string;
  onInvest: () => void;
  onBack: () => void;
}

export default function PoolDetail({ poolId, onInvest, onBack }: PoolDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'performance' | 'documents'>('overview');

  // REVISED: Pool data dengan durasi 5 hari dan status pool
  const poolInfo = {
    id: poolId,
    name: 'Mixed Commodities Pool',
    poolStatus: 'funded', // REVISED: Changed from 'status' to 'poolStatus' with values: open, funded, active, completed
    funded: 212500,
    target: 250000,
    remaining: 37500,
    yieldRate: 4.0,
    duration: '5 days', // REVISED: Changed from 30 days to 5 days
    minInvestment: 5000,
    maxInvestment: 50000,
    totalInvestors: 12, // REVISED: Anonymous count instead of showing individual investors
  };

  // REVISED: Added claimStatus to track if exporter has withdrawn funds
  const invoices = [
    { id: 'INV-2025-001', exporter: 'PT Export Indonesia', amount: 125000, dueDate: '2025-03-15', poolFundingPct: 85, claimStatus: 'claimed', claimDate: '2025-01-15' },
    { id: 'INV-2025-002', exporter: 'Manila Traders', amount: 85000, dueDate: '2025-03-20', poolFundingPct: 85, claimStatus: 'unclaimed', claimDate: null },
    { id: 'INV-2025-003', exporter: 'Vietnam Agri Co', amount: 40000, dueDate: '2025-03-25', poolFundingPct: 85, claimStatus: 'claimed', claimDate: '2025-01-16' },
  ];

  // REVISED: Sector data instead of investor distribution (for privacy)
  const sectorData = [
    { name: 'Agriculture', value: 40 },
    { name: 'Commodities', value: 35 },
    { name: 'Manufacturing', value: 25 },
  ];

  // REVISED: Updated cash flow for 5-day duration
  const cashFlowData = [
    { day: 'Day 0', inflow: 212500, outflow: 0 },
    { day: 'Day 2', inflow: 0, outflow: 0 },
    { day: 'Day 5', inflow: 0, outflow: 220833 }, // Principal + 4% APR pro-rated for 5 days
  ];

  const COLORS = ['#22d3ee', '#14b8a6', '#06b6d4'];

  // REVISED: Pool status color coding
  const getPoolStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'funded': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'active': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'completed': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getPoolStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'funded': return 'Funded';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  // REVISED: Claim status color coding
  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'unclaimed': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getClaimStatusText = (status: string) => {
    switch (status) {
      case 'claimed': return 'Claimed';
      case 'unclaimed': return 'Unclaimed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 mb-4 hover-scale-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5 hover-bounce" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl text-white">{poolInfo.name}</h1>
                {/* REVISED: Pool Status instead of generic status */}
                <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getPoolStatusColor(poolInfo.poolStatus)}`}>
                  Status: {getPoolStatusText(poolInfo.poolStatus)}
                </span>
              </div>
              <p className="text-slate-400">Pool ID: {poolInfo.id}</p>
            </div>
            <button 
              onClick={onInvest}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 hover-scale transition-all"
            >
              Invest Now
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Funding Progress</span>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl text-white mb-2">
              {Math.round((poolInfo.funded / poolInfo.target) * 100)}%
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/50 transition-all"
                style={{ width: `${(poolInfo.funded / poolInfo.target) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">
              ${poolInfo.funded.toLocaleString()} / ${poolInfo.target.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Expected Return</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl text-white mb-1">{poolInfo.yieldRate}% APR</div>
            <div className="text-sm text-slate-400">{poolInfo.duration} duration</div>
          </div>

          {/* REVISED: Removed Risk Level, replaced with Pool Status info */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Investors</span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl text-white mb-1">{poolInfo.totalInvestors}</div>
            <div className="text-sm text-slate-400">Anonymous</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Invoices</span>
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-2xl text-white mb-1">{invoices.length}</div>
            <div className="text-sm text-slate-400">
              <span className="text-emerald-400">{invoices.filter(inv => inv.claimStatus === 'claimed').length} claimed</span>
              {' • '}
              <span className="text-orange-400">{invoices.filter(inv => inv.claimStatus === 'unclaimed').length} unclaimed</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800">
          <div className="border-b border-slate-800">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 border-b-2 transition-all whitespace-nowrap hover-scale-sm ${
                  activeTab === 'overview'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-4 border-b-2 transition-all whitespace-nowrap hover-scale-sm ${
                  activeTab === 'invoices'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-6 py-4 border-b-2 transition-all whitespace-nowrap hover-scale-sm ${
                  activeTab === 'performance'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-4 border-b-2 transition-all whitespace-nowrap hover-scale-sm ${
                  activeTab === 'documents'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Documents
              </button>
            </div>
          </div>

          {/* Overview Tab - REVISED: Removed Investor Distribution */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pool Summary */}
                <div>
                  <h3 className="text-lg text-white mb-4">Pool Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Amount:</span>
                      <span className="text-white">${poolInfo.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Raised:</span>
                      <span className="text-white">${poolInfo.funded.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remaining:</span>
                      <span className="text-emerald-400">${poolInfo.remaining.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Min Investment:</span>
                      <span className="text-white">${poolInfo.minInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Investment:</span>
                      <span className="text-white">${poolInfo.maxInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-cyan-400">{poolInfo.duration}</span>
                    </div>
                  </div>

                  {/* REVISED: Privacy Notice instead of Investor Distribution */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-cyan-400 mb-1">Privacy Protected</h4>
                        <p className="text-sm text-cyan-300/80">
                          Investor information is kept confidential. Only aggregate pool statistics are displayed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg text-white mb-4">Pool Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Investors:</span>
                      <span className="text-white">{poolInfo.totalInvestors} investors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Funding Percentage:</span>
                      <span className="text-emerald-400">{Math.round((poolInfo.funded / poolInfo.target) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pool Status:</span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getPoolStatusColor(poolInfo.poolStatus)}`}>
                        {getPoolStatusText(poolInfo.poolStatus)}
                      </span>
                    </div>
                  </div>

                  {/* REVISED: Claim Status Summary */}
                  <h3 className="text-lg text-white mb-4 mt-6">Claim Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Claimed Invoices</span>
                        <span className="text-emerald-400">
                          {invoices.filter(inv => inv.claimStatus === 'claimed').length} / {invoices.length}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50 transition-all"
                          style={{ width: `${(invoices.filter(inv => inv.claimStatus === 'claimed').length / invoices.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Claimed Amount:</span>
                      <span className="text-emerald-400">
                        ${invoices.filter(inv => inv.claimStatus === 'claimed').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Unclaimed Amount:</span>
                      <span className="text-orange-400">
                        ${invoices.filter(inv => inv.claimStatus === 'unclaimed').reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sector Composition */}
                <div>
                  <h3 className="text-lg text-white mb-4">Sector Composition</h3>
                  <div style={{ width: '100%', height: '300px' }} className="mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sectorData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            color: '#fff'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* REVISED: Timeline for 5 days */}
                  <h3 className="text-lg text-white mb-4">Expected Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="w-0.5 h-12 bg-slate-700"></div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="text-white mb-1">Today - Pool Opening</div>
                        <div className="text-sm text-slate-400">Pool is accepting investments</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="w-0.5 h-12 bg-slate-700"></div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="text-white mb-1">Day 2-3 - Mid-term</div>
                        <div className="text-sm text-slate-400">Funds distributed to exporters</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-white mb-1">Day 5 - Maturity</div>
                        <div className="text-sm text-slate-400">Returns distributed to investors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab - REVISED: Added Claim Status */}
          {activeTab === 'invoices' && (
            <div>
              {/* Info Banner */}
              <div className="p-4 bg-cyan-500/10 border-b border-cyan-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-cyan-400 text-sm mb-1">About Claim Status</h4>
                  <p className="text-xs text-cyan-300/80">
                    <span className="text-emerald-400">Claimed</span> means the exporter has withdrawn the funds from this pool. 
                    <span className="text-orange-400"> Unclaimed</span> means funds are available but not yet withdrawn by the exporter.
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Exporter</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Pool Funding %</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{invoice.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{invoice.exporter}</td>
                      <td className="px-6 py-4 text-sm text-white">${invoice.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{invoice.dueDate}</td>
                      <td className="px-6 py-4 text-sm text-cyan-400">{invoice.poolFundingPct}%</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${getClaimStatusColor(invoice.claimStatus)}`}>
                            {invoice.claimStatus === 'claimed' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {getClaimStatusText(invoice.claimStatus)}
                          </span>
                          {invoice.claimStatus === 'claimed' && invoice.claimDate && (
                            <div className="text-xs text-slate-500 mt-1">
                              Claimed: {invoice.claimDate}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="p-6">
              <h3 className="text-lg text-white mb-4">Expected Cash Flow (5 Days)</h3>
              <div style={{ width: '100%', height: '300px' }} className="mb-8">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '0.5rem',
                        color: '#fff'
                      }}
                    />
                    <Line type="monotone" dataKey="inflow" stroke="#22d3ee" strokeWidth={3} name="Inflow" dot={{ fill: '#22d3ee', r: 5 }} />
                    <Line type="monotone" dataKey="outflow" stroke="#14b8a6" strokeWidth={3} name="Outflow" dot={{ fill: '#14b8a6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* REVISED: Return projection for 5 days */}
              <h3 className="text-lg text-white mb-4">Return Projection</h3>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Investment Amount</div>
                    <div className="text-2xl text-white">$10,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Expected Interest (4% APR)</div>
                    <div className="text-2xl text-emerald-400">+$5.48</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Total Return</div>
                    <div className="text-2xl text-white">$10,005.48</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-400">
                  * Based on 5-day investment period. Interest calculated pro-rata: (4% APR / 365) × 5 days = 0.0548%
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="p-6">
              <h3 className="text-lg text-white mb-4">Pool Documents</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg hover:bg-slate-800/30 transition-all hover-lift">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">Pool Terms and Conditions</div>
                      <div className="text-sm text-slate-500">PDF • 245 KB</div>
                    </div>
                  </div>
                  <button className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded hover-scale-sm transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg hover:bg-slate-800/30 transition-all hover-lift">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">Risk Disclosure Statement</div>
                      <div className="text-sm text-slate-500">PDF • 128 KB</div>
                    </div>
                  </div>
                  <button className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded hover-scale-sm transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg hover:bg-slate-800/30 transition-all hover-lift">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-white">Exporter Verification Reports</div>
                      <div className="text-sm text-slate-500">PDF • 1.2 MB</div>
                    </div>
                  </div>
                  <button className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded hover-scale-sm transition-all">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 mb-1">Important Notice</h4>
                    <p className="text-sm text-yellow-300/80">
                      All documents are confidential and for investor review only. Sharing these documents with third parties is prohibited.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
