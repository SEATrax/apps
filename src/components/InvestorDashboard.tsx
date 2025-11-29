import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, Target, Plus, Eye, Bell, User, Settings, LogOut, Menu, Home, BarChart3, History, Ship } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InvestorDashboardProps {
  onPoolSelect: (poolId: string) => void;
  onViewPayments: () => void;
  onAddInvestment?: () => void;
}

export default function InvestorDashboard({ onPoolSelect, onViewPayments, onAddInvestment }: InvestorDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const performanceData = [
    { month: 'Jan', roi: 3.2 },
    { month: 'Feb', roi: 3.8 },
    { month: 'Mar', roi: 4.1 },
    { month: 'Apr', roi: 4.5 },
    { month: 'May', roi: 4.3 },
    { month: 'Jun', roi: 4.8 },
  ];

  const activeInvestments = [
    { poolId: 'POOL-A-2025', funded: 50000, currentValue: 50833, yieldRate: 4.0, maturityDate: '2025-04-15', status: 'active' },
    { poolId: 'POOL-B-2025', funded: 30000, currentValue: 30500, yieldRate: 4.0, maturityDate: '2025-04-20', status: 'active' },
    { poolId: 'POOL-C-2024', funded: 20000, currentValue: 20667, yieldRate: 4.0, maturityDate: '2025-03-10', status: 'active' },
  ];

  // REVISED: Pool data dengan durasi 5 hari dan status pool (bukan risk level)
  const availablePools = [
    {
      id: 'POOL-D-2025',
      name: 'Mixed Commodities Pool',
      duration: '5 days', // REVISED: Changed from 30 days to 5 days
      funded: 212500,
      target: 250000,
      yieldRate: 4.0,
      poolStatus: 'funded', // REVISED: Changed from 'risk' to 'poolStatus'
      invoiceCount: 4,
    },
    {
      id: 'POOL-E-2025',
      name: 'Electronics Export Pool',
      duration: '5 days', // REVISED: Changed from 45 days to 5 days
      funded: 280000,
      target: 350000,
      yieldRate: 4.0,
      poolStatus: 'active', // REVISED
      invoiceCount: 4,
    },
    {
      id: 'POOL-F-2025',
      name: 'Agriculture Pool',
      duration: '5 days', // REVISED: Changed from 60 days to 5 days
      funded: 120000,
      target: 200000,
      yieldRate: 4.0,
      poolStatus: 'open', // REVISED
      invoiceCount: 5,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'funding': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'matured': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // REVISED: Pool status color coding (replaced getRiskColor)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg text-white">SEATrax</h1>
        <Bell className="w-6 h-6 text-cyan-400" />
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-cyan-500/20 transform transition-transform md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-6 border-b border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-lg flex items-center justify-center hover-glow">
                <Ship className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl text-white">SEATrax</h1>
                <p className="text-sm text-slate-400 mt-0.5">Investor Portal</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-cyan-400/10 text-cyan-400 rounded-lg hover-scale-sm transition-all">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg hover-scale-sm transition-all">
              <Target className="w-5 h-5" />
              <span>Explore Pools</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg hover-scale-sm transition-all">
              <BarChart3 className="w-5 h-5" />
              <span>My Investments</span>
            </a>
            <button 
              onClick={onViewPayments}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg hover-scale-sm transition-all"
            >
              <History className="w-5 h-5" />
              <span>Payment History</span>
            </button>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg hover-scale-sm transition-all">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-cyan-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-400/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">John Investor</div>
                <div className="text-xs text-slate-400">Verified</div>
              </div>
            </div>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors hover-scale-sm">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl text-white mb-2">Investment Dashboard</h1>
                <p className="text-slate-400">Track your portfolio and discover new opportunities</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-slate-400 hover:text-cyan-400 relative hover-scale transition-all">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                <button 
                  onClick={onAddInvestment}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 hover-scale transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Investment</span>
                </button>
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Total Invested</span>
                  <DollarSign className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-white mb-1">$100,000</div>
                <div className="text-sm text-slate-400">Across 3 pools</div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Current Returns</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-white mb-1">$2,000</div>
                <div className="text-sm text-emerald-400">+4.0% ROI</div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Available Balance</span>
                  <Wallet className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-white mb-1">$25,000</div>
                <div className="text-sm text-slate-400">Ready to invest</div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Projected Earnings</span>
                  <Target className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-white mb-1">$333</div>
                <div className="text-sm text-slate-400">Next 30 days</div>
              </div>
            </div>
          </div>

          {/* Performance Chart - REVISED: Removed investor distribution, focus on portfolio performance */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6 mb-8 hover-lift">
            <h2 className="text-xl text-white mb-4">Portfolio Performance</h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                  />
                  <Line type="monotone" dataKey="roi" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Investments */}
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 mb-8">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl text-white">Active Investments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Pool ID</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Funded Amount</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Yield Rate</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {activeInvestments.map((investment) => (
                    <tr key={investment.poolId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{investment.poolId}</td>
                      <td className="px-6 py-4 text-sm text-white">${investment.funded.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-white">${investment.currentValue.toLocaleString()}</div>
                        <div className="text-xs text-emerald-400">
                          +${(investment.currentValue - investment.funded).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{investment.yieldRate}% APR</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{investment.maturityDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getStatusColor(investment.status)}`}>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => onPoolSelect(investment.poolId)}
                          className="p-1 text-cyan-400 hover:bg-cyan-500/10 rounded hover-scale-sm transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Available Pools - REVISED */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-white">Available Investment Pools</h2>
              <a href="#" className="text-cyan-400 hover:text-cyan-300 text-sm hover-scale-sm transition-all">View all →</a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePools.map((pool) => (
                <div key={pool.id} className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6 hover-lift transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white">{pool.name}</h3>
                    {/* REVISED: Status Pool instead of Risk Level */}
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getPoolStatusColor(pool.poolStatus)}`}>
                      {getPoolStatusText(pool.poolStatus)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Funding Progress</span>
                      <span className="text-cyan-400">{Math.round((pool.funded / pool.target) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/50 transition-all"
                        style={{ width: `${(pool.funded / pool.target) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>${pool.funded.toLocaleString()}</span>
                      <span>${pool.target.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Expected Return:</span>
                      <span className="text-emerald-400">{pool.yieldRate}% APR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white">{pool.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Invoices:</span>
                      <span className="text-white">{pool.invoiceCount} invoices</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onPoolSelect(pool.id)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 hover-scale transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
