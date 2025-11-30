'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  Info,
  Download,
  ExternalLink
} from 'lucide-react'
import { useDemoContext } from '@/contexts/DemoContext'
import { useContext } from 'react'
import { DemoContext } from '@/contexts/DemoContext'

interface ImporterPaymentProps {
  invoiceId: string
}

// Fallback data for when DemoProvider is not available
const fallbackInvoices = [
  {
    id: 1,
    token_id: 1001,
    invoice_number: "INV-2024-11-001",
    exporter_id: 1,
    exporter_company: "PT Sinar Jaya Export",
    exporter_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    importer_company: "US Trade Partners LLC",
    importer_license: "IMP-US-2024-5678",
    goods_description: "Coffee Beans - Premium Arabica",
    shipping_amount: 125000,
    loan_amount: 100000,
    amount_invested: 100000,
    amount_withdrawn: 100000,
    shipping_date: "2024-12-15",
    status: "FUNDED" as const,
    pool_id: 1,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_001.pdf" }
    ],
    created_at: "2024-11-15",
    approved_at: "2024-11-16",
    funded_at: "2024-11-20"
  },
  {
    id: 2,
    token_id: 1002,
    invoice_number: "INV-2024-11-002", 
    exporter_id: 1,
    exporter_company: "PT Sinar Jaya Export",
    exporter_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    importer_company: "European Textile Imports",
    importer_license: "IMP-EU-2024-9012",
    goods_description: "Batik Textiles - Traditional Indonesian",
    shipping_amount: 85000,
    loan_amount: 68000,
    amount_invested: 68000,
    amount_withdrawn: 68000,
    shipping_date: "2024-12-20",
    status: "FUNDED" as const,
    pool_id: 2,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_002.pdf" }
    ],
    created_at: "2024-11-18",
    approved_at: "2024-11-19"
  },
  {
    id: 3,
    token_id: 1003,
    invoice_number: "INV-2024-11-003",
    exporter_id: 2,
    exporter_company: "Manila Trading Corp", 
    exporter_wallet: "0x742d35Cc6175C06c06B756daee142f8CCb34332A",
    importer_company: "Tech Solutions Ltd (UK)",
    importer_license: "IMP-UK-2024-3456",
    goods_description: "Electronic Components - Semiconductors",
    shipping_amount: 250000,
    loan_amount: 200000,
    amount_invested: 200000,
    amount_withdrawn: 200000,
    shipping_date: "2024-12-25",
    status: "FUNDED" as const,
    pool_id: 3,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_003.pdf" }
    ],
    created_at: "2024-11-20",
    approved_at: "2024-11-21"
  }
]

const fallbackPayments = [
  {
    id: 1,
    invoice_id: 1,
    amount_usd: 104000,
    status: "SENT" as const
  },
  {
    id: 2,
    invoice_id: 2,
    amount_usd: 70720,
    status: "SENT" as const
  },
  {
    id: 3,
    invoice_id: 3,
    amount_usd: 208000,
    status: "SENT" as const
  }
]

export default function ImporterPayment({ invoiceId }: ImporterPaymentProps) {
  // Safe context usage with fallback
  const context = useContext(DemoContext)
  const isDemo = context !== undefined
  
  // Use demo context if available, otherwise use fallback data
  const invoices = isDemo ? context.invoices : fallbackInvoices
  const payments = isDemo ? context.payments : fallbackPayments
  const markInvoicePaid = isDemo ? context.markInvoicePaid : () => {}
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto' | ''>('')
  
  const invoice = invoices.find(inv => inv.id === parseInt(invoiceId))
  const payment = payments.find(pay => pay.invoice_id === parseInt(invoiceId))
  
  if (!invoice || !payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-md">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-slate-400">
              The requested invoice could not be found or is not available for payment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePayment = async () => {
    if (!paymentMethod) return
    
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      markInvoicePaid(invoice.id)
      setIsProcessing(false)
    }, 3000)
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Payment' },
      'SENT': { color: 'bg-blue-100 text-blue-800', icon: Info, label: 'Payment Due' },
      'PAID': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Payment Completed' }
    }
    
    const config = configs[status as keyof typeof configs] || configs['PENDING']
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  if (payment.status === 'PAID') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Payment Completed</h1>
            <p className="text-slate-400 text-lg mb-6">
              Thank you! Your payment has been successfully processed.
            </p>
            <div className="bg-slate-800/30 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Invoice Number</p>
                  <p className="text-white font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-slate-400">Amount Paid</p>
                  <p className="text-white font-medium">${payment.amount_usd.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Payment Date</p>
                  <p className="text-white font-medium">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Transaction ID</p>
                  <p className="text-cyan-400 font-mono text-xs">TXN-{payment.id}-{Date.now()}</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => window.print()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invoice Payment</h1>
          <p className="text-slate-400">Complete your payment for the shipping invoice below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white">Invoice Details</CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Exporter Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-slate-400">Company Name</p>
                        <p className="text-white font-medium">{invoice.exporter_company}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Wallet Address</p>
                        <p className="text-cyan-400 font-mono text-xs">
                          {invoice.exporter_wallet.slice(0, 8)}...{invoice.exporter_wallet.slice(-6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Importer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-slate-400">Company Name</p>
                        <p className="text-white font-medium">{invoice.importer_company}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">License Number</p>
                        <p className="text-white font-medium">{invoice.importer_license}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Shipment Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Invoice Number</p>
                      <p className="text-white font-medium">{invoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Goods Description</p>
                      <p className="text-white font-medium">{invoice.goods_description}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Shipping Date</p>
                      <p className="text-white font-medium">
                        {new Date(invoice.shipping_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Original Shipping Amount</p>
                      <p className="text-white font-medium">${invoice.shipping_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Loan Amount + Interest (4%)</p>
                      <p className="text-white font-medium">${payment.amount_usd.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Supporting Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-white text-sm">{doc.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-400">Total Amount Due</span>
                    <span className="text-2xl font-bold text-white">
                      ${payment.amount_usd.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Includes loan amount + 4% financing fee
                  </div>
                </div>

                {!isProcessing && (
                  <>
                    <div>
                      <h4 className="text-white font-medium mb-3">Select Payment Method</h4>
                      <div className="space-y-3">
                        <div 
                          onClick={() => setPaymentMethod('bank')}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === 'bank' 
                              ? 'border-cyan-500 bg-cyan-500/10' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 border-2 rounded-full ${
                              paymentMethod === 'bank' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                            }`} />
                            <span className="text-white text-sm">Bank Transfer</span>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => setPaymentMethod('crypto')}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            paymentMethod === 'crypto' 
                              ? 'border-cyan-500 bg-cyan-500/10' 
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 border-2 rounded-full ${
                              paymentMethod === 'crypto' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-600'
                            }`} />
                            <span className="text-white text-sm">Cryptocurrency</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handlePayment}
                      disabled={!paymentMethod}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay ${payment.amount_usd.toLocaleString()}
                    </Button>
                  </>
                )}

                {isProcessing && (
                  <div className="text-center py-6">
                    <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">Processing Payment...</p>
                    <p className="text-slate-400 text-sm">Please wait while we confirm your payment</p>
                  </div>
                )}

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Payments are processed securely via blockchain</p>
                  <p>• Transaction confirmation may take a few minutes</p>
                  <p>• You will receive a receipt upon completion</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}