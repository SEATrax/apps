'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Eye,
  Download
} from 'lucide-react'
import { mockInvoices, mockPools, getInvoicesByExporter } from '@/data/mockData'
import { useDemoContext } from '@/contexts/DemoContext'

interface ExporterSimulationProps {
  walletAddress: string
}

// Random sample data for auto-fill
const sampleImporters = [
  { name: 'Global Trade Solutions (US)', license: 'IMP-US-2024-8901', country: 'US' },
  { name: 'European Import Hub (DE)', license: 'IMP-DE-2024-2345', country: 'DE' },
  { name: 'Asia Pacific Trading (SG)', license: 'IMP-SG-2024-6789', country: 'SG' },
  { name: 'Canadian Distribution Co (CA)', license: 'IMP-CA-2024-4567', country: 'CA' },
  { name: 'UK Premium Imports (UK)', license: 'IMP-UK-2024-7890', country: 'UK' },
  { name: 'Australian Trade Partners (AU)', license: 'IMP-AU-2024-1234', country: 'AU' },
  { name: 'Japanese Import Corp (JP)', license: 'IMP-JP-2024-5555', country: 'JP' },
  { name: 'Nordic Trade Solutions (NO)', license: 'IMP-NO-2024-9999', country: 'NO' }
]

const sampleProducts = [
  { desc: 'Premium Coffee Beans - Single Origin Arabica, 1200kg', basePrice: 95000 },
  { desc: 'Handcrafted Batik Textiles - Traditional Indonesian Patterns, 800 pieces', basePrice: 120000 },
  { desc: 'Electronic Components - Semiconductors and Microprocessors, 500 units', basePrice: 280000 },
  { desc: 'Indonesian Spices Mix - Nutmeg, Cloves, Cinnamon, 600kg premium grade', basePrice: 75000 },
  { desc: 'Rattan Furniture Set - Eco-friendly outdoor dining collection, 45 pieces', basePrice: 165000 },
  { desc: 'Traditional Wood Carvings - Handmade decorative art pieces, 120 items', basePrice: 88000 },
  { desc: 'Organic Coconut Products - Oil, flour, and dried coconut, 2000kg', basePrice: 55000 },
  { desc: 'Smartphone Accessories - Cases, chargers, and screen protectors, 3000 units', basePrice: 145000 },
  { desc: 'Premium Sarongs and Scarves - Silk blend traditional wear, 600 pieces', basePrice: 92000 },
  { desc: 'Medical Grade Latex Gloves - ISO certified, 50,000 pieces', basePrice: 210000 },
  { desc: 'Bamboo Kitchenware Set - Sustainable utensils and containers, 800 sets', basePrice: 67000 },
  { desc: 'Traditional Jewelry Collection - Silver with precious stones, 200 pieces', basePrice: 195000 }
]

const generateRandomInvoiceData = () => {
  const importer = sampleImporters[Math.floor(Math.random() * sampleImporters.length)]
  const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)]
  const varianceMultiplier = 0.8 + (Math.random() * 0.4) // 80-120% of base price
  const shippingAmount = Math.round(product.basePrice * varianceMultiplier)
  const loanAmount = Math.floor(shippingAmount * 0.8) // Always use floor to ensure it's within limit
  
  // Generate future shipping date (5-30 days from now)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 5 + Math.floor(Math.random() * 25))
  const shippingDate = futureDate.toISOString().split('T')[0]
  
  return {
    invoice_number: '', // Will be auto-generated
    importer_company: importer.name,
    importer_license: importer.license,
    goods_description: product.desc,
    shipping_amount: shippingAmount.toString(),
    loan_amount: loanAmount.toString(),
    shipping_date: shippingDate
  }
}

export default function ExporterSimulation({ walletAddress }: ExporterSimulationProps) {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'invoices' | 'new-invoice' | 'payments'>('dashboard')
  const [newInvoice, setNewInvoice] = useState(() => {
    if (typeof window === 'undefined') return {
      invoice_number: '',
      importer_company: '',
      importer_license: '',
      goods_description: '',
      shipping_amount: '',
      loan_amount: '',
      shipping_date: ''
    }
    
    try {
      const saved = localStorage.getItem('seatrax_draft_invoice')
      return saved ? JSON.parse(saved) : {
        invoice_number: '',
        importer_company: '',
        importer_license: '',
        goods_description: '',
        shipping_amount: '',
        loan_amount: '',
        shipping_date: ''
      }
    } catch {
      return {
        invoice_number: '',
        importer_company: '',
        importer_license: '',
        goods_description: '',
        shipping_amount: '',
        loan_amount: '',
        shipping_date: ''
      }
    }
  })
  
  // Auto-save draft invoice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatrax_draft_invoice', JSON.stringify(newInvoice))
    }
  }, [newInvoice])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  
  const { invoices, payments, submitInvoice, withdrawFunds, addNotification } = useDemoContext()
  const exporterInvoices = invoices.filter(invoice => invoice.exporter_wallet === walletAddress)
  
  const stats = {
    totalInvoices: exporterInvoices.length,
    totalFunded: exporterInvoices.filter(inv => inv.status === 'FUNDED').length,
    totalValue: exporterInvoices.reduce((sum, inv) => sum + inv.loan_amount, 0),
    availableWithdrawal: exporterInvoices
      .filter(inv => inv.amount_invested >= inv.loan_amount * 0.7)
      .reduce((sum, inv) => sum + (inv.amount_invested - inv.amount_withdrawn), 0)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      'APPROVED': { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      'IN_POOL': { color: 'bg-purple-100 text-purple-800', label: 'In Pool' },
      'FUNDED': { color: 'bg-green-100 text-green-800', label: 'Funded' },
      'WITHDRAWN': { color: 'bg-cyan-100 text-cyan-800', label: 'Withdrawn' },
      'PAID': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
      'COMPLETED': { color: 'bg-gray-100 text-gray-800', label: 'Completed' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING']
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleAutoFill = () => {
    const randomData = generateRandomInvoiceData()
    setNewInvoice(randomData)
    
    // Save to localStorage
    localStorage.setItem('seatrax_draft_invoice', JSON.stringify(randomData))
    
    addNotification({
      title: 'Form Auto-filled',
      message: 'Invoice form has been filled with sample data. Review and submit!',
      type: 'info'
    })
  }

  const handleSubmitInvoice = () => {
    if (!newInvoice.importer_company || !newInvoice.shipping_amount) {
      alert('Please fill all required fields (Importer Company and Shipping Amount)')
      return
    }

    const shippingAmount = parseFloat(newInvoice.shipping_amount)
    const loanAmount = newInvoice.loan_amount ? parseFloat(newInvoice.loan_amount) : Math.floor(shippingAmount * 0.8)
    const maxLoanAllowed = Math.floor(shippingAmount * 0.8)

    if (loanAmount > maxLoanAllowed) {
      alert(`Loan amount cannot exceed 80% of shipping value (Max: $${maxLoanAllowed.toLocaleString()})`)
      return
    }

    // Auto-generate invoice number if not provided
    const invoiceNumber = newInvoice.invoice_number || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    submitInvoice({
      invoice_number: invoiceNumber,
      exporter_id: 1,
      exporter_company: 'PT Sinar Jaya Export',
      exporter_wallet: walletAddress,
      importer_company: newInvoice.importer_company,
      importer_license: newInvoice.importer_license,
      goods_description: newInvoice.goods_description,
      shipping_amount: shippingAmount,
      loan_amount: loanAmount,
      amount_invested: 0,
      amount_withdrawn: 0,
      shipping_date: newInvoice.shipping_date,
      pool_id: null,
      documents: [
        { name: 'Commercial Invoice', url: '/docs/sample.pdf' },
        { name: 'Bill of Lading', url: '/docs/sample.pdf' }
      ]
    })

    const clearedInvoice = {
      invoice_number: '',
      importer_company: '',
      importer_license: '',
      goods_description: '',
      shipping_amount: '',
      loan_amount: '',
      shipping_date: ''
    }
    
    setNewInvoice(clearedInvoice)
    
    // Clear draft from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seatrax_draft_invoice')
    }
    
    setSelectedTab('invoices')
  }

  const handleWithdraw = (invoice: any) => {
    const amount = parseFloat(withdrawAmount)
    const available = invoice.amount_invested - invoice.amount_withdrawn
    if (amount > 0 && amount <= available) {
      withdrawFunds(invoice.id, amount)
      setWithdrawAmount('')
      setSelectedInvoice(null)
    } else {
      alert(`Invalid withdrawal amount. Available: $${available.toLocaleString()}`)
    }
  }

  if (selectedTab === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Exporter Dashboard</h1>
            <p className="text-slate-400">Manage your export invoices and funding</p>
          </div>
          <Button 
            onClick={() => setSelectedTab('new-invoice')}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{stats.totalInvoices}</p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Funded</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFunded}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Value</p>
                  <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Available</p>
                  <p className="text-2xl font-bold text-white">${stats.availableWithdrawal.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Recent Invoices</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedTab('invoices')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exporterInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium">{invoice.invoice_number}</h4>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-slate-400 text-sm">{invoice.importer_company}</p>
                    <p className="text-slate-300 text-sm">${invoice.loan_amount.toLocaleString()} requested</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${invoice.amount_invested.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">
                      {Math.round((invoice.amount_invested / invoice.loan_amount) * 100)}% funded
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button 
            onClick={() => setSelectedTab('new-invoice')}
            className="h-16 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <FileText className="w-5 h-5 mr-3" />
            Create New Invoice
          </Button>
          <Button 
            onClick={() => setSelectedTab('invoices')}
            variant="outline" 
            className="h-16 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Eye className="w-5 h-5 mr-3" />
            Manage Invoices
          </Button>
          <Button 
            onClick={() => setSelectedTab('payments')}
            variant="outline" 
            className="h-16 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <DollarSign className="w-5 h-5 mr-3" />
            Payment History
          </Button>
        </div>
      </div>
    )
  }

  if (selectedTab === 'new-invoice') {
    return (
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">Create New Invoice</h1>
            <p className="text-slate-400">Submit your export invoice for funding</p>
          </div>
        </div>

        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Invoice Number</label>
                <input
                  type="text"
                  value={newInvoice.invoice_number}
                  onChange={(e) => setNewInvoice({...newInvoice, invoice_number: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="INV-2024-11-004"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Shipping Date</label>
                <input
                  type="date"
                  value={newInvoice.shipping_date}
                  onChange={(e) => setNewInvoice({...newInvoice, shipping_date: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium">Importer Company</label>
              <input
                type="text"
                value={newInvoice.importer_company}
                onChange={(e) => setNewInvoice({...newInvoice, importer_company: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                placeholder="ABC Trading Ltd"
              />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium">Goods Description</label>
              <textarea
                value={newInvoice.goods_description}
                onChange={(e) => setNewInvoice({...newInvoice, goods_description: e.target.value})}
                className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white h-20"
                placeholder="Premium coffee beans - Arabica variety"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Shipping Amount (USD) *</label>
                <input
                  type="number"
                  value={newInvoice.shipping_amount}
                  onChange={(e) => {
                    const shippingValue = e.target.value
                    const currentLoan = parseFloat(newInvoice.loan_amount || '0')
                    const newMaxLoan = Math.floor(parseFloat(shippingValue || '0') * 0.8)
                    
                    // Auto-adjust loan amount if it exceeds new maximum
                    const adjustedLoan = currentLoan > newMaxLoan ? newMaxLoan.toString() : newInvoice.loan_amount
                    
                    setNewInvoice({
                      ...newInvoice, 
                      shipping_amount: shippingValue,
                      loan_amount: shippingValue ? (adjustedLoan || newMaxLoan.toString()) : ''
                    })
                  }}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder="100000"
                  min="1000"
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Requested Loan Amount (USD)</label>
                <input
                  type="number"
                  value={newInvoice.loan_amount}
                  onChange={(e) => {
                    const loanValue = e.target.value
                    const shippingValue = parseFloat(newInvoice.shipping_amount || '0')
                    const maxLoan = Math.floor(shippingValue * 0.8)
                    
                    if (parseFloat(loanValue) > maxLoan && shippingValue > 0) {
                      // Auto-correct to max allowed
                      setNewInvoice({...newInvoice, loan_amount: maxLoan.toString()})
                    } else {
                      setNewInvoice({...newInvoice, loan_amount: loanValue})
                    }
                  }}
                  className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                  placeholder={newInvoice.shipping_amount ? Math.floor(parseFloat(newInvoice.shipping_amount) * 0.8).toString() : '80000'}
                  max={newInvoice.shipping_amount ? Math.floor(parseFloat(newInvoice.shipping_amount) * 0.8) : undefined}
                />
                <p className="text-slate-400 text-xs mt-1">
                  Maximum 80% of shipping amount
                  {newInvoice.shipping_amount && ` (Max: $${Math.floor(parseFloat(newInvoice.shipping_amount) * 0.8).toLocaleString()})`}
                </p>
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium">Upload Documents</label>
              <div className="mt-2 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">
                  Upload commercial invoice, bill of lading, and export license
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Choose Files
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSubmitInvoice}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                disabled={!newInvoice.importer_company || !newInvoice.goods_description || !newInvoice.shipping_amount}
              >
                <FileText className="w-4 h-4 mr-2" />
                Submit Invoice
              </Button>
              <Button 
                onClick={handleAutoFill}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                🎲 Auto Fill
              </Button>
              <Button 
                onClick={() => setSelectedTab('dashboard')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedTab === 'invoices') {
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
            <h1 className="text-2xl font-bold text-white">Manage Invoices</h1>
            <p className="text-slate-400">Track and manage your export invoices</p>
          </div>
        </div>

        <div className="grid gap-6">
          {exporterInvoices.map((invoice) => (
            <Card key={invoice.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-3">
                      {invoice.invoice_number}
                      {getStatusBadge(invoice.status)}
                    </CardTitle>
                    <p className="text-slate-400 text-sm mt-1">{invoice.importer_company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${invoice.loan_amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Requested</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Goods</p>
                    <p className="text-white">{invoice.goods_description}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Shipping Date</p>
                    <p className="text-white">{new Date(invoice.shipping_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Funding Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-cyan-400 h-2 rounded-full transition-all"
                          style={{ width: `${(invoice.amount_invested / invoice.loan_amount) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">
                        {Math.round((invoice.amount_invested / invoice.loan_amount) * 100)}%
                      </span>
                    </div>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Documents
                    </Button>
                  </div>
                  
                  {invoice.amount_invested >= invoice.loan_amount * 0.7 && 
                   invoice.amount_withdrawn < invoice.amount_invested && (
                    <Button 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Withdraw Funds
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Withdrawal Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white">Withdraw Funds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">Invoice: {selectedInvoice.invoice_number}</p>
                  <p className="text-white font-medium">Available: ${(selectedInvoice.amount_invested - selectedInvoice.amount_withdrawn).toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium">Withdrawal Amount (USD)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full mt-1 p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    placeholder={(selectedInvoice.amount_invested - selectedInvoice.amount_withdrawn).toString()}
                    max={selectedInvoice.amount_invested - selectedInvoice.amount_withdrawn}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleWithdraw(selectedInvoice)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Confirm Withdrawal
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



  if (selectedTab === 'payments') {
    return (
      <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-white">Payment History</h1>
            <p className="text-slate-400">Track payment status of your invoices</p>
          </div>
        </div>
        
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Payment Tracking</h3>
            <p className="text-slate-400">
              Payment history and tracking will be implemented in the next phase.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <div className="text-white">{selectedTab} Coming Soon...</div>
}