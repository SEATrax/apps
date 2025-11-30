'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  DollarSign, 
  PieChart, 
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Settings,
  Activity,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react'
import { 
  mockExporters, 
  mockInvestors, 
  mockInvoices, 
  mockPools,
  mockPayments
} from '@/data/mockData'
import { useDemoContext } from '@/contexts/DemoContext'

interface AdminSimulationProps {
  walletAddress: string
}

// Sample pool templates for auto-fill
const poolTemplates = [
  {
    name: 'Southeast Asia Agricultural Pool',
    description: 'Diversified pool focusing on premium agricultural exports including coffee, spices, and organic products from verified Indonesian and Philippine exporters',
    risk_category: 'LOW',
    theme: 'agricultural'
  },
  {
    name: 'High-Tech Electronics & Components Pool',
    description: 'Premium technology exports including semiconductors, electronics, and precision components from established Asian manufacturers',
    risk_category: 'MEDIUM',
    theme: 'technology'
  },
  {
    name: 'Traditional Crafts & Textiles Pool',
    description: 'Curated collection of handcrafted products, textiles, furniture, and traditional art pieces from certified artisan exporters',
    risk_category: 'LOW',
    theme: 'crafts'
  },
  {
    name: 'Medical & Healthcare Supplies Pool',
    description: 'Essential medical equipment, pharmaceutical supplies, and healthcare products from ISO-certified exporters',
    risk_category: 'MEDIUM',
    theme: 'medical'
  },
  {
    name: 'Sustainable & Eco-Friendly Products Pool',
    description: 'Environmentally conscious exports including bamboo products, organic textiles, and renewable materials from green-certified suppliers',
    risk_category: 'LOW',
    theme: 'sustainable'
  }
]

const generatePoolAutoFill = (approvedInvoices: any[]) => {
  if (approvedInvoices.length === 0) return null
  
  const template = poolTemplates[Math.floor(Math.random() * poolTemplates.length)]
  
  // Smart invoice selection based on pool theme and diversification
  const shuffledInvoices = [...approvedInvoices].sort(() => Math.random() - 0.5)
  const optimalPoolSize = Math.min(Math.max(2, Math.floor(approvedInvoices.length * 0.6)), 4)
  const selectedInvoices = shuffledInvoices.slice(0, optimalPoolSize)
  
  return {
    name: template.name + ` #${Math.floor(Math.random() * 99) + 1}`,
    description: template.description,
    risk_category: template.risk_category,
    selected_invoices: selectedInvoices.map(inv => inv.id)
  }
}

export default function AdminSimulation({ walletAddress }: AdminSimulationProps) {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'exporters' | 'invoices' | 'pools' | 'payments'>('dashboard')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [newPool, setNewPool] = useState({
    name: '',
    description: '',
    risk_category: 'MEDIUM',
    selected_invoices: [] as number[]
  })
  
  const { invoices, pools, payments, approveInvoice, rejectInvoice, createPool, markInvoicePaid, addNotification } = useDemoContext()
  
  const stats = {
    totalExporters: mockExporters.length,
    verifiedExporters: mockExporters.filter(exp => exp.is_verified).length,
    pendingInvoices: invoices.filter(inv => inv.status === 'PENDING').length,
    activePools: pools.filter(pool => pool.status === 'OPEN').length,
    totalValueLocked: pools.reduce((sum, pool) => sum + pool.amount_invested, 0),
    pendingPayments: payments.filter(payment => payment.status === 'SENT').length
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'APPROVED': { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      'REJECTED': { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      'IN_POOL': { color: 'bg-purple-100 text-purple-800', label: 'In Pool' },
      'FUNDED': { color: 'bg-green-100 text-green-800', label: 'Funded' },
      'PAID': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
      'COMPLETED': { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      'OPEN': { color: 'bg-blue-100 text-blue-800', label: 'Open' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleApproveInvoice = (invoice: any) => {
    approveInvoice(invoice.id)
    setSelectedInvoice(null)
  }

  const handleRejectInvoice = (invoice: any) => {
    rejectInvoice(invoice.id)
    setSelectedInvoice(null)
  }

  const handleVerifyExporter = (exporter: any) => {
    alert(`Exporter ${exporter.company_name} has been verified!`)
  }

  const handleAutoFillPool = () => {
    const approvedInvoices = invoices.filter(inv => inv.status === 'APPROVED')
    const autoFillData = generatePoolAutoFill(approvedInvoices)
    
    if (autoFillData) {
      setNewPool(autoFillData)
      addNotification({
        title: 'Pool Auto-filled',
        message: `Pool "${autoFillData.name}" has been auto-filled with ${autoFillData.selected_invoices.length} invoices. Review and create!`,
        type: 'info'
      })
    } else {
      addNotification({
        title: 'No Approved Invoices',
        message: 'Please approve some invoices first before creating a pool.',
        type: 'warning'
      })
    }
  }

  const handleCreatePool = () => {
    if (newPool.selected_invoices.length > 0 && newPool.name) {
      const selectedInvoices = invoices.filter(inv => newPool.selected_invoices.includes(inv.id))
      const totalLoanAmount = selectedInvoices.reduce((sum, inv) => sum + inv.loan_amount, 0)
      const totalShippingAmount = selectedInvoices.reduce((sum, inv) => sum + inv.shipping_amount, 0)
      
      createPool({
        pool_id: pools.length + 1,
        name: newPool.name,
        description: newPool.description,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoice_ids: newPool.selected_invoices,
        total_loan_amount: totalLoanAmount,
        total_shipping_amount: totalShippingAmount,
        status: 'OPEN' as const,
        risk_category: newPool.risk_category,
        expected_yield: 4.0,
        duration_days: 90,
        investors: []
      })
      
      setNewPool({
        name: '',
        description: '',
        risk_category: 'MEDIUM',
        selected_invoices: []
      })
    } else {
      alert('Please provide a pool name and select at least one approved invoice.')
    }
  }

  const handleMarkPaid = (payment: any) => {
    alert(`Payment for Invoice ${payment.invoice_id} marked as paid!`)
  }

  if (selectedTab === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Manage platform operations and user activities</p>
          </div>
          <Button 
            onClick={() => setSelectedTab('pools')}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Pool
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Exporters</p>
                  <p className="text-xl font-bold text-white">{stats.totalExporters}</p>
                </div>
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Verified</p>
                  <p className="text-xl font-bold text-white">{stats.verifiedExporters}</p>
                </div>
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Pending</p>
                  <p className="text-xl font-bold text-white">{stats.pendingInvoices}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Active Pools</p>
                  <p className="text-xl font-bold text-white">{stats.activePools}</p>
                </div>
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">TVL</p>
                  <p className="text-lg font-bold text-white">${(stats.totalValueLocked / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs">Payments</p>
                  <p className="text-xl font-bold text-white">{stats.pendingPayments}</p>
                </div>
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={() => setSelectedTab('exporters')}
            variant="outline"
            className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex-col"
          >
            <Users className="w-8 h-8 mb-2" />
            Manage Exporters
          </Button>
          <Button 
            onClick={() => setSelectedTab('invoices')}
            variant="outline"
            className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex-col"
          >
            <FileText className="w-8 h-8 mb-2" />
            Review Invoices
          </Button>
          <Button 
            onClick={() => setSelectedTab('pools')}
            variant="outline"
            className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex-col"
          >
            <PieChart className="w-8 h-8 mb-2" />
            Manage Pools
          </Button>
          <Button 
            onClick={() => setSelectedTab('payments')}
            variant="outline"
            className="h-20 border-slate-600 text-slate-300 hover:bg-slate-700 flex-col"
          >
            <DollarSign className="w-8 h-8 mb-2" />
            Track Payments
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Invoices */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Pending Invoice Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.filter(inv => inv.status === 'PENDING').slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{invoice.invoice_number}</p>
                      <p className="text-slate-400 text-sm">{invoice.exporter_company}</p>
                      <p className="text-slate-300 text-sm">${invoice.loan_amount.toLocaleString()}</p>
                    </div>
                    <Button 
                      onClick={() => setSelectedInvoice(invoice)}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unverified Exporters */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Unverified Exporters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockExporters.filter(exp => !exp.is_verified).slice(0, 3).map((exporter) => (
                  <div key={exporter.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{exporter.company_name}</p>
                      <p className="text-slate-400 text-sm">{exporter.country}</p>
                      <p className="text-slate-300 text-sm">Tax ID: {exporter.tax_id}</p>
                    </div>
                    <Button 
                      onClick={() => handleVerifyExporter(exporter)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Verify
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Review Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-white">Review Invoice: {selectedInvoice.invoice_number}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-sm">Exporter Company</label>
                    <p className="text-white font-medium">{selectedInvoice.exporter_company}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Importer Company</label>
                    <p className="text-white font-medium">{selectedInvoice.importer_company}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Goods Description</label>
                    <p className="text-white font-medium">{selectedInvoice.goods_description}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Shipping Date</label>
                    <p className="text-white font-medium">
                      {new Date(selectedInvoice.shipping_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Shipping Amount</label>
                    <p className="text-white font-medium">${selectedInvoice.shipping_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm">Loan Amount Requested</label>
                    <p className="text-white font-medium">${selectedInvoice.loan_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-slate-800/30 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Risk Assessment</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Loan-to-Shipping Ratio</p>
                      <p className="text-white">
                        {Math.round((selectedInvoice.loan_amount / selectedInvoice.shipping_amount) * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Exporter History</p>
                      <p className="text-green-400">Good Standing</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Document Status</p>
                      <p className="text-green-400">Complete</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleApproveInvoice(selectedInvoice)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleRejectInvoice(selectedInvoice)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    onClick={() => setSelectedInvoice(null)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (selectedTab === 'pools') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setSelectedTab('dashboard')}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Pool Management</h1>
              <p className="text-slate-400">Create and manage investment pools</p>
            </div>
          </div>
        </div>

        {/* Create New Pool */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create New Investment Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Pool Name</label>
                <input
                  type="text"
                  value={newPool.name}
                  onChange={(e) => setNewPool({...newPool, name: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="Q4 2024 Export Pool"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Risk Category</label>
                <select
                  value={newPool.risk_category}
                  onChange={(e) => setNewPool({...newPool, risk_category: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium">Description</label>
              <textarea
                value={newPool.description}
                onChange={(e) => setNewPool({...newPool, description: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white h-20"
                placeholder="Diversified pool of verified export invoices from established traders..."
              />
            </div>

            {/* Pool Preview Statistics */}
            {newPool.selected_invoices.length > 0 && (
              <div className="bg-slate-800/30 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Pool Preview</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Total Invoices</p>
                    <p className="text-white font-medium">{newPool.selected_invoices.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Loan Amount</p>
                    <p className="text-cyan-400 font-medium">
                      ${invoices.filter(inv => newPool.selected_invoices.includes(inv.id))
                        .reduce((sum, inv) => sum + inv.loan_amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Expected Yield</p>
                    <p className="text-green-400 font-medium">4.0% APR</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-300 text-sm font-medium">
                Select Approved Invoices ({newPool.selected_invoices.length} selected)
              </label>
              <div className="mt-2 max-h-40 overflow-y-auto bg-slate-800/30 rounded-lg p-3">
                {invoices.filter(inv => inv.status === 'APPROVED').map((invoice) => (
                  <div key={invoice.id} className="flex items-center gap-3 p-2 hover:bg-slate-700/30 rounded">
                    <input
                      type="checkbox"
                      checked={newPool.selected_invoices.includes(invoice.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPool({
                            ...newPool, 
                            selected_invoices: [...newPool.selected_invoices, invoice.id]
                          })
                        } else {
                          setNewPool({
                            ...newPool,
                            selected_invoices: newPool.selected_invoices.filter(id => id !== invoice.id)
                          })
                        }
                      }}
                      className="rounded border-slate-600"
                    />
                    <div className="flex-1">
                      <p className="text-white text-sm">{invoice.invoice_number}</p>
                      <p className="text-slate-400 text-xs">
                        {invoice.exporter_company} - ${invoice.loan_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleCreatePool}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                disabled={newPool.selected_invoices.length === 0 || !newPool.name}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Investment Pool
              </Button>
              <Button 
                onClick={handleAutoFillPool}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                🎲 Auto Fill Pool
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Pools */}
        <div className="grid gap-4">
          {pools.map((pool) => (
            <Card key={pool.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white flex items-center gap-3">
                      {pool.name}
                      {getStatusBadge(pool.status)}
                    </CardTitle>
                    <p className="text-slate-400 text-sm">{pool.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${pool.amount_invested.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">of ${pool.total_loan_amount.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Invoices</p>
                    <p className="text-white font-medium">{pool.invoice_ids.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Funded</p>
                    <p className="text-white font-medium">
                      {Math.round((pool.amount_invested / pool.total_loan_amount) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Start Date</p>
                    <p className="text-white font-medium">
                      {new Date(pool.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">End Date</p>
                    <p className="text-white font-medium">
                      {new Date(pool.end_date).toLocaleDateString()}
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
                    variant="outline" 
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (selectedTab === 'payments') {
    // Sample payment data with more entries
    const samplePayments = [
      {
        id: 1,
        invoice_id: 1,
        invoice_number: "INV-2024-11-001",
        importer_company: "US Trade Partners LLC",
        exporter_company: "PT Sinar Jaya Export",
        amount_usd: 104000,
        payment_link: "/pay/1",
        status: "SENT",
        sent_at: "2024-11-21",
        due_date: "2024-12-05",
        created_at: "2024-11-21"
      },
      {
        id: 2,
        invoice_id: 2,
        invoice_number: "INV-2024-11-002",
        importer_company: "European Textile Imports",
        exporter_company: "PT Sinar Jaya Export",
        amount_usd: 70720,
        payment_link: "/pay/2",
        status: "PENDING",
        sent_at: null,
        due_date: "2024-12-10",
        created_at: "2024-11-24"
      },
      {
        id: 3,
        invoice_id: 3,
        invoice_number: "INV-2024-11-003",
        importer_company: "Tech Solutions Ltd (UK)",
        exporter_company: "Manila Trading Corp",
        amount_usd: 208000,
        payment_link: "/pay/3",
        status: "PAID",
        sent_at: "2024-11-20",
        paid_at: "2024-11-28",
        due_date: "2024-12-04",
        created_at: "2024-11-25"
      },
      {
        id: 4,
        invoice_id: 4,
        invoice_number: "INV-2024-11-004",
        importer_company: "Spice World Distribution (CA)",
        exporter_company: "PT Sinar Jaya Export",
        amount_usd: 79040,
        payment_link: "/pay/4",
        status: "SENT",
        sent_at: "2024-11-25",
        due_date: "2024-12-09",
        created_at: "2024-11-26"
      },
      {
        id: 5,
        invoice_id: 5,
        invoice_number: "INV-2024-11-005",
        importer_company: "Furniture Plus (AU)",
        exporter_company: "Manila Trading Corp",
        amount_usd: 149760,
        payment_link: "/pay/5",
        status: "OVERDUE",
        sent_at: "2024-11-15",
        due_date: "2024-11-29",
        created_at: "2024-11-20"
      },
      {
        id: 6,
        invoice_id: 6,
        invoice_number: "INV-2024-11-006",
        importer_company: "Fashion Forward Inc (DE)",
        exporter_company: "PT Sinar Jaya Export",
        amount_usd: 54080,
        payment_link: "/pay/6",
        status: "PAID",
        sent_at: "2024-11-22",
        paid_at: "2024-11-26",
        due_date: "2024-12-06",
        created_at: "2024-11-27"
      }
    ]

    const getPaymentStatusBadge = (status: string) => {
      const statusConfig = {
        'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
        'SENT': { color: 'bg-blue-100 text-blue-800', label: 'Payment Sent' },
        'PAID': { color: 'bg-green-100 text-green-800', label: 'Paid' },
        'OVERDUE': { color: 'bg-red-100 text-red-800', label: 'Overdue' }
      }
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
      return <Badge className={config.color}>{config.label}</Badge>
    }

    const handleSendPaymentLink = (payment: any) => {
      addNotification({
        title: 'Payment Link Sent',
        message: `Payment link sent to ${payment.importer_company}`,
        type: 'success'
      })
    }

    const handleMarkAsPaid = (payment: any) => {
      addNotification({
        title: 'Payment Confirmed',
        message: `Payment of $${payment.amount_usd.toLocaleString()} confirmed for ${payment.invoice_number}`,
        type: 'success'
      })
    }

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
            <h1 className="text-2xl font-bold text-white">Payment Tracking</h1>
            <p className="text-slate-400">Monitor and manage importer payments for funded invoices</p>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm">Total Payments Due</p>
              <p className="text-2xl font-bold text-white">
                ${samplePayments.reduce((sum, p) => sum + p.amount_usd, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-400">
                {samplePayments.filter(p => p.status === 'PAID').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {samplePayments.filter(p => p.status === 'PENDING' || p.status === 'SENT').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6 text-center">
              <p className="text-slate-400 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-400">
                {samplePayments.filter(p => p.status === 'OVERDUE').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Table */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Payment Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-slate-300 p-3">Invoice</th>
                    <th className="text-left text-slate-300 p-3">Importer</th>
                    <th className="text-left text-slate-300 p-3">Amount</th>
                    <th className="text-left text-slate-300 p-3">Status</th>
                    <th className="text-left text-slate-300 p-3">Due Date</th>
                    <th className="text-left text-slate-300 p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="p-3">
                        <div>
                          <p className="text-white font-medium">{payment.invoice_number}</p>
                          <p className="text-slate-400 text-sm">{payment.exporter_company}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-white">{payment.importer_company}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-white font-medium">${payment.amount_usd.toLocaleString()}</p>
                      </td>
                      <td className="p-3">
                        {getPaymentStatusBadge(payment.status)}
                      </td>
                      <td className="p-3">
                        <p className="text-white">{new Date(payment.due_date).toLocaleDateString()}</p>
                        {payment.status === 'OVERDUE' && (
                          <p className="text-red-400 text-xs">Overdue</p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {payment.status === 'PENDING' && (
                            <Button 
                              onClick={() => handleSendPaymentLink(payment)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Send Link
                            </Button>
                          )}
                          {(payment.status === 'SENT' || payment.status === 'OVERDUE') && (
                            <Button 
                              onClick={() => window.open(payment.payment_link, '_blank')}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}
                          {payment.status !== 'PAID' && (
                            <Button 
                              onClick={() => handleMarkAsPaid(payment)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <div>{selectedTab} management interface coming soon...</div>
}