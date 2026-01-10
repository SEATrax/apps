import { useState } from 'react';
import { DollarSign, FileText, Clock, TrendingUp, Plus, Download, Eye, Bell, User, Settings, LogOut, Menu, Home, Upload, Folder, CheckCircle, Circle } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

interface ExporterDashboardProps {
  onCreateInvoice: () => void;
  onWithdraw: () => void;
}

export default function ExporterDashboard({ onCreateInvoice, onWithdraw }: ExporterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'pools'>('active');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // REVISED: Invoice data structure dengan status pencairan dan dana tersedia
  const invoices = [
    { 
      id: 'INV-2025-001', 
      importer: 'ABC Trading USA', 
      amount: 125000, 
      poolFundingPercent: 85, // Pool funded at 85%
      availableToWithdraw: 106250, // 125000 * 0.85
      dueDate: '2025-03-15', 
      withdrawalStatus: 'withdrawn', // 'withdrawn' | 'not-withdrawn'
      withdrawalDate: '2025-01-15'
    },
    { 
      id: 'INV-2025-002', 
      importer: 'Euro Imports GmbH', 
      amount: 85000, 
      poolFundingPercent: 85,
      availableToWithdraw: 72250, // 85000 * 0.85
      dueDate: '2025-03-20', 
      withdrawalStatus: 'not-withdrawn',
      withdrawalDate: null
    },
    { 
      id: 'INV-2025-003', 
      importer: 'Singapore Distributors', 
      amount: 200000, 
      poolFundingPercent: 85,
      availableToWithdraw: 170000, // 200000 * 0.85
      dueDate: '2025-04-01', 
      withdrawalStatus: 'withdrawn',
      withdrawalDate: '2025-01-16'
    },
    { 
      id: 'INV-2025-004', 
      importer: 'Tokyo Trade Co', 
      amount: 150000, 
      poolFundingPercent: 85,
      availableToWithdraw: 127500, // 150000 * 0.85
      dueDate: '2025-04-10', 
      withdrawalStatus: 'not-withdrawn',
      withdrawalDate: null
    },
  ];

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
            <Logo variant="navbar" size="md" />
            <p className="text-sm text-slate-400 mt-2">Exporter Portal</p>
          </div>

          <nav className="p-4 space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 rounded-lg hover-scale-sm transition-all">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <button 
              onClick={onCreateInvoice}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover-scale-sm rounded-lg transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover-scale-sm rounded-lg transition-all">
              <FileText className="w-5 h-5" />
              <span>Pools</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover-scale-sm rounded-lg transition-all">
              <Folder className="w-5 h-5" />
              <span>Documents</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white hover-scale-sm rounded-lg transition-all">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-cyan-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/10 dark:bg-cyan-400/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900 dark:text-white">PT Export Indonesia</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">Verified</div>
              </div>
            </div>
            <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors hover-scale-sm">
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
                <h1 className="text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">Dashboard</h1>
                <p className="text-gray-600 dark:text-slate-400">Welcome back! Here's your export financing overview</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  {/* ThemeToggle */}
                </div>
                <button className="p-2 text-gray-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover-scale relative transition-all">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                <button 
                  onClick={onCreateInvoice}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 hover-scale transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Invoice</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-gray-200 dark:border-slate-800 hover-lift cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Total Funded</span>
                  <DollarSign className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-gray-900 dark:text-white mb-1">$476,000</div>
                <div className="text-sm text-cyan-600 dark:text-cyan-400">+12% from last month</div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-gray-200 dark:border-slate-800 hover-lift cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Available to Withdraw</span>
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-gray-900 dark:text-white mb-1">$199,750</div>
                <button 
                  onClick={onWithdraw}
                  className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline hover-scale-sm"
                >
                  Withdraw now
                </button>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-gray-200 dark:border-slate-800 hover-lift cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Pending Approval</span>
                  <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-gray-900 dark:text-white mb-1">0</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Under review</div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-gray-200 dark:border-slate-800 hover-lift cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-slate-400 text-sm">Avg. Funding Time</span>
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-2xl text-gray-900 dark:text-white mb-1">6 hours</div>
                <div className="text-sm text-gray-600 dark:text-slate-400">Last 30 days</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-lg border border-gray-200 dark:border-slate-800">
            <div className="border-b border-gray-200 dark:border-slate-800">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-6 py-4 border-b-2 transition-all hover-scale-sm ${
                    activeTab === 'active'
                      ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Active Invoices
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-4 border-b-2 transition-all hover-scale-sm ${
                    activeTab === 'history'
                      ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Payment History
                </button>
                <button
                  onClick={() => setActiveTab('pools')}
                  className={`px-6 py-4 border-b-2 transition-all hover-scale-sm ${
                    activeTab === 'pools'
                      ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                      : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Pools
                </button>
              </div>
            </div>

            {/* Active Invoices Table - REVISED */}
            {activeTab === 'active' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-slate-800/50">
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Importer</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Dana Tersedia</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Status Pencairan</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{invoice.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{invoice.importer}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 dark:text-white">${invoice.amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            Pool: {invoice.poolFundingPercent}% funded
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-emerald-600 dark:text-emerald-400">${invoice.availableToWithdraw.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            ${invoice.amount.toLocaleString()} × {invoice.poolFundingPercent}%
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-300">{invoice.dueDate}</td>
                        <td className="px-6 py-4">
                          {invoice.withdrawalStatus === 'withdrawn' ? (
                            <div>
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Sudah Ditarik</span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-500">{invoice.withdrawalDate}</div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Circle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-blue-600 dark:text-blue-400">Belum Ditarik</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded hover-scale-sm transition-all">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded hover-scale-sm transition-all">
                              <Download className="w-4 h-4" />
                            </button>
                            {invoice.withdrawalStatus === 'not-withdrawn' && (
                              <button 
                                onClick={onWithdraw}
                                className="ml-2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-400 text-white text-xs rounded hover-scale transition-all"
                              >
                                Tarik Dana
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-8 text-center text-gray-600 dark:text-slate-400">
                <FileText className="w-12 h-12 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
                <p>No payment history yet</p>
              </div>
            )}

            {/* Pools Tab - REVISED */}
            {activeTab === 'pools' && (
              <div className="p-6">
                <div className="space-y-4">
                  {/* Pool Card dengan status Funded dan durasi 5 hari */}
                  <div className="border border-gray-200 dark:border-slate-800 rounded-lg p-6 hover-lift bg-gray-50 dark:bg-slate-800/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg text-gray-900 dark:text-white mb-1">Pool A - Mixed Commodities</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">5 days duration • Min 70% funding</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getPoolStatusColor('funded')}`}>
                        Status Pool: {getPoolStatusText('funded')}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-600 dark:text-slate-400">Pool Funding Progress</span>
                        <span className="text-cyan-600 dark:text-cyan-400">85%</span>
                      </div>
                      <div className="h-2 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-lg shadow-cyan-500/50 transition-all" style={{ width: '85%' }} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Your Invoices</div>
                        <div className="text-lg text-gray-900 dark:text-white">4 invoices</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Amount</div>
                        <div className="text-lg text-gray-900 dark:text-white">$560,000</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Available to Withdraw</div>
                        <div className="text-lg text-emerald-600 dark:text-emerald-400">$476,000</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Investors</div>
                        <div className="text-lg text-gray-900 dark:text-white">12 investors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
