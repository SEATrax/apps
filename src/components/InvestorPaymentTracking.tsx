import { useState } from 'react';
import { ArrowLeft, Check, Clock, DollarSign, TrendingUp, Download, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InvestorPaymentTrackingProps {
  onBack?: () => void;
  onViewInvestment?: (poolId: string) => void;
}

export default function InvestorPaymentTracking({ onBack, onViewInvestment }: InvestorPaymentTrackingProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

  const payments = [
    {
      id: 'PAY-001',
      poolId: 'POOL-A-2025',
      invoiceId: 'INV-2025-001',
      exporter: 'PT Export Indonesia',
      importer: 'ABC Trading USA',
      invoiceAmount: 125000,
      yourInvestment: 50000,
      paymentDate: '2025-02-20',
      amountReceived: 50667,
      platformFee: 167,
      interest: 833,
      netReturn: 50667,
      status: 'paid',
    },
    {
      id: 'PAY-002',
      poolId: 'POOL-A-2025',
      invoiceId: 'INV-2025-003',
      exporter: 'Vietnam Agri Co',
      importer: 'Euro Imports GmbH',
      invoiceAmount: 40000,
      yourInvestment: 20000,
      paymentDate: '2025-03-15',
      amountReceived: 0,
      platformFee: 0,
      interest: 333,
      netReturn: 20333,
      status: 'pending',
    },
    {
      id: 'PAY-003',
      poolId: 'POOL-B-2025',
      invoiceId: 'INV-2025-002',
      exporter: 'Manila Traders',
      importer: 'Singapore Distributors',
      invoiceAmount: 85000,
      yourInvestment: 30000,
      paymentDate: '2025-02-15',
      amountReceived: 30500,
      platformFee: 100,
      interest: 500,
      netReturn: 30500,
      status: 'paid',
    },
    {
      id: 'PAY-004',
      poolId: 'POOL-C-2025',
      invoiceId: 'INV-2025-004',
      exporter: 'Thailand Export Ltd',
      importer: 'Tokyo Trade Co',
      invoiceAmount: 150000,
      yourInvestment: 20000,
      paymentDate: '2025-04-10',
      amountReceived: 0,
      platformFee: 0,
      interest: 267,
      netReturn: 20267,
      status: 'pending',
    },
  ];

  const cashFlowData = [
    { month: 'Jan', inflow: 45000, outflow: 40000 },
    { month: 'Feb', inflow: 81167, outflow: 80000 },
    { month: 'Mar', inflow: 0, outflow: 20000 },
    { month: 'Apr', inflow: 20333, outflow: 0 },
    { month: 'May', inflow: 0, outflow: 30000 },
    { month: 'Jun', inflow: 30500, outflow: 0 },
  ];

  const filteredPayments = payments.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const totalStats = {
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netReturn, 0),
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netReturn, 0),
    totalInterestEarned: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.interest, 0),
    totalPlatformFee: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.platformFee, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return null;
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
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl text-white mb-2">Payment Tracking</h1>
              <p className="text-slate-400">Monitor your investment returns and cash flow</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover-scale-sm transition-all">
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Paid Out</span>
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl text-white mb-1">${totalStats.totalPaid.toLocaleString()}</div>
            <div className="text-sm text-slate-400">{payments.filter(p => p.status === 'paid').length} payments</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Pending Payments</span>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-2xl text-white mb-1">${totalStats.totalPending.toLocaleString()}</div>
            <div className="text-sm text-slate-400">{payments.filter(p => p.status === 'pending').length} upcoming</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Interest Earned</span>
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl text-white mb-1">${totalStats.totalInterestEarned.toLocaleString()}</div>
            <div className="text-sm text-emerald-400">+{((totalStats.totalInterestEarned / totalStats.totalPaid) * 100).toFixed(2)}% ROI</div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg p-6 border border-slate-800 hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Platform Fees</span>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl text-white mb-1">${totalStats.totalPlatformFee.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total deducted</div>
          </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6 mb-8 hover-lift">
          <h2 className="text-xl text-white mb-4">Cash Flow Timeline</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
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
                <Area type="monotone" dataKey="inflow" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.6} name="Inflow" />
                <Area type="monotone" dataKey="outflow" stackId="2" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} name="Outflow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-cyan-500 rounded"></div>
              <span className="text-slate-300">Inflow (Returns)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <span className="text-slate-300">Outflow (Investments)</span>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl text-white">Payment History</h2>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent hover-scale-sm transition-all"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Exporter</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Your Investment</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Interest</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Net Return</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Payment Date</th>
                  <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{payment.id}</div>
                      <div className="text-xs text-slate-500">{payment.poolId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{payment.invoiceId}</div>
                      <div className="text-xs text-slate-500">${payment.invoiceAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{payment.exporter}</div>
                      <div className="text-xs text-slate-500">{payment.importer}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      ${payment.yourInvestment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-emerald-400">
                        +${payment.interest.toLocaleString()}
                      </div>
                      {payment.platformFee > 0 && (
                        <div className="text-xs text-slate-500">
                          Fee: ${payment.platformFee}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      ${payment.netReturn.toLocaleString()}
                      {payment.status === 'paid' && (
                        <div className="text-xs text-emerald-400">
                          Paid: ${payment.amountReceived.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {payment.paymentDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        {payment.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p>No payments found with the selected filter</p>
            </div>
          )}
        </div>

        {/* Payment Distribution Breakdown */}
        <div className="mt-8 bg-slate-900/50 backdrop-blur-xl rounded-lg border border-slate-800 p-6">
          <h2 className="text-xl text-white mb-4">Understanding Your Returns</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-800 rounded-lg p-4 hover-lift">
              <h3 className="text-white mb-2 text-sm">When Importer Pays</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">1. Principal to Exporter:</span>
                  <span className="text-white">~95%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">2. Platform Fee:</span>
                  <span className="text-white">1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">3. Yield to Investors:</span>
                  <span className="text-emerald-400">4%</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg p-4 hover-lift">
              <h3 className="text-white mb-2 text-sm">Auto-Withdrawal</h3>
              <p className="text-sm text-slate-400 mb-3">
                Set up automatic withdrawal of returns to your wallet or bank account as soon as payments are received.
              </p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 text-sm hover-scale transition-all">
                Enable Auto-Withdrawal
              </button>
            </div>

            <div className="border border-slate-800 rounded-lg p-4 hover-lift">
              <h3 className="text-white mb-2 text-sm">Reinvestment Option</h3>
              <p className="text-sm text-slate-400 mb-3">
                Automatically reinvest your returns into new pools to compound your earnings.
              </p>
              <button className="w-full px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm hover-scale-sm transition-all">
                Configure Reinvestment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
