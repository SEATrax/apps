'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  ExternalLink,
  Loader2
} from 'lucide-react'

interface ImporterPaymentProps {
  invoiceId: string
}

interface PaymentData {
  invoice: {
    id: string;
    amount: number;
    amountFormatted: string;
    exporter: string;
    importer: string;
    invoiceNumber?: string;
    goodsDescription?: string;
    shippingDate: number;
    status: string;
  };
  payment: {
    status: string;
    dueDate: string;
    paymentLink: string;
    isPaid: boolean;
  };
}

export default function ImporterPayment({ invoiceId }: ImporterPaymentProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'crypto' | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/payment/${invoiceId}`)
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load payment information')
        }
        
        setPaymentData(data)
      } catch (err: any) {
        console.error('Payment data fetch error:', err)
        setError(err.message || 'Failed to load payment information')
      } finally {
        setIsLoading(false)
      }
    }

    if (invoiceId) {
      fetchPaymentData()
    }
  }, [invoiceId])

  const handlePayment = async () => {
    if (!paymentMethod || !paymentData) return
    
    try {
      setIsProcessing(true)
      
      // Submit dummy payment
      const response = await fetch(`/api/payment/${invoiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          amount: paymentData.invoice.amount,
          paymentReference: `PAY-${Date.now()}`,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment submission failed')
      }
      
      setPaymentSubmitted(true)
    } catch (err: any) {
      console.error('Payment submission error:', err)
      setError(err.message || 'Payment submission failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      'pending': { color: 'bg-yellow-600', icon: Clock, label: 'Payment Pending' },
      'link_generated': { color: 'bg-blue-600', icon: Info, label: 'Payment Due' },
      'pending_confirmation': { color: 'bg-orange-600', icon: Clock, label: 'Confirming Payment' },
      'paid': { color: 'bg-green-600', icon: CheckCircle, label: 'Payment Completed' }
    }
    
    const config = configs[status as keyof typeof configs] || configs['pending']
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-white font-semibold mb-2">Loading Payment Information</h2>
            <p className="text-slate-400">Please wait while we fetch your invoice details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-md">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Payment Information Unavailable</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!paymentData) {
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

  // Payment completed state
  if (paymentData.payment.isPaid || paymentSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {paymentSubmitted ? 'Payment Submitted!' : 'Payment Completed'}
            </h1>
            <p className="text-slate-400 text-lg mb-6">
              {paymentSubmitted 
                ? 'Your payment has been submitted and is awaiting admin confirmation.'
                : 'Thank you! Your payment has been successfully processed.'
              }
            </p>
            <div className="bg-slate-800/30 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Invoice Number</p>
                  <p className="text-white font-medium">{paymentData.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400">Amount Paid</p>
                  <p className="text-white font-medium">{paymentData.invoice.amountFormatted}</p>
                </div>
                <div>
                  <p className="text-slate-400">Exporter</p>
                  <p className="text-white font-medium">{paymentData.invoice.exporter}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <div>{getStatusBadge(paymentSubmitted ? 'pending_confirmation' : 'paid')}</div>
                </div>
              </div>
            </div>
            {paymentSubmitted && (
              <Alert className="bg-orange-600/20 border-orange-600 mb-6">
                <Info className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  Your payment is pending admin confirmation. You will be notified once it's verified.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main payment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Invoice Payment</h1>
          <p className="text-slate-400">Complete your payment for the shipping invoice</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Invoice Details */}
          <div>
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium">{paymentData.invoice.invoiceNumber}</h3>
                    <p className="text-slate-400 text-sm">{paymentData.invoice.goodsDescription}</p>
                  </div>
                  {getStatusBadge(paymentData.payment.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-slate-400 text-sm">Exporter</p>
                    <p className="text-white font-medium">{paymentData.invoice.exporter}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Importer</p>
                    <p className="text-white font-medium">{paymentData.invoice.importer}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Due Date</p>
                    <p className="text-white">{new Date(paymentData.payment.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Shipping Date</p>
                    <p className="text-white">{new Date(paymentData.invoice.shippingDate).toLocaleDateString()}</p>
                  </div>
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
                      {paymentData.invoice.amountFormatted}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Full shipping invoice amount
                  </div>
                </div>

                {error && (
                  <Alert className="bg-red-600/20 border-red-600">
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

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
                      Pay {paymentData.invoice.amountFormatted}
                    </Button>
                  </>
                )}

                {isProcessing && (
                  <div className="text-center py-6">
                    <Loader2 className="w-8 h-8 text-cyan-600 mx-auto mb-4 animate-spin" />
                    <p className="text-white font-medium">Processing Payment...</p>
                    <p className="text-slate-400 text-sm">Please wait while we process your payment</p>
                  </div>
                )}

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• This is a dummy payment system for demonstration</p>
                  <p>• Payment will be submitted for admin confirmation</p>
                  <p>• You will receive confirmation once verified</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}