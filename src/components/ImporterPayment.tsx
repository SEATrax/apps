'use client'

import { useState, useEffect } from 'react'
import { useSEATrax } from '@/hooks/useSEATrax'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Info,
  ExternalLink,
  Loader2,
  Copy
} from 'lucide-react'
import { getContract, prepareContractCall, sendTransaction, waitForReceipt, toWei } from 'thirdweb'
import { liskSepolia } from 'panna-sdk'
import { CONTRACT_ADDRESS } from '@/lib/contract'
import { DEV_MODE, DEV_PAYMENT_AMOUNT } from '@/lib/env'
import { useToast } from '@/hooks/use-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

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
  dataSource?: 'contract' | 'database' | 'hybrid' | 'mock';
  warnings?: string[];
}

export default function ImporterPayment({ invoiceId }: ImporterPaymentProps) {
  const { getInvoice } = useSEATrax()
  const { toast } = useToast()

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string>('')

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        let tokenId: bigint = BigInt(0)

        // 1. Try Supabase First
        let metadata: any = null
        let exporterProfile: any = null

        // Dynamic import logic or simple check if we had imported it


        if (isSupabaseConfigured) {
          // Check if invoiceId is UUID or Numeric
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId)

          let query = supabase.from('invoice_metadata').select('*')

          if (isUUID) {
            query = query.eq('id', invoiceId)
          } else {
            query = query.eq('token_id', Number(invoiceId))
          }

          const { data, error } = await query.single()

          if (!error && data) {
            metadata = data
            tokenId = BigInt(data.token_id)

            // Fetch Exporter Name
            if (data.exporter_wallet) {
              const { data: exporterData } = await supabase
                .from('exporters')
                .select('company_name')
                .eq('wallet_address', data.exporter_wallet.toLowerCase())
                .single()
              exporterProfile = exporterData
            }
          }
        }

        // Fallback for legacy numeric IDs if Supabase lookup failed or wasn't used
        if (tokenId === BigInt(0) && !isNaN(Number(invoiceId))) {
          tokenId = BigInt(invoiceId)
        }

        // 2. Blockchain Fetch (Fallback or Supplement)
        let contractInvoice: any = null
        try {
          contractInvoice = await getInvoice(tokenId)
        } catch (e) {
          console.warn('Blockchain fetch failed:', e)
        }

        if (!metadata && !contractInvoice) {
          throw new Error('Invoice not found')
        }

        // 3. Map Data (Prioritize DB)
        const statusMap: Record<number, string> = {
          0: 'pending', 1: 'approved', 2: 'in_pool', 3: 'funded',
          4: 'withdrawn', 5: 'paid', 6: 'completed', 7: 'rejected'
        }

        // Helper: DB value > Contract Value > Default
        // Shipping Amount logic
        const rawShippingAmount = metadata?.shipping_amount ?? (contractInvoice ? Number(contractInvoice.shippingAmount) / 100 : 0)

        const status = metadata?.status?.toLowerCase() || (contractInvoice ? statusMap[Number(contractInvoice.status)] : 'pending')

        const isPaid = status === 'paid' || status === 'completed' || (contractInvoice && Number(contractInvoice.status) >= 5)

        // Exporter Name Logic
        const exporterName = exporterProfile?.company_name
          || metadata?.exporter_wallet
          || contractInvoice?.exporterCompany
          || 'Unknown Exporter'

        // Date Logic (DB > Blockchain > Now)
        const shippingDate = metadata?.shipping_date
          ? metadata.shipping_date
          : (contractInvoice && Number(contractInvoice.shippingDate) > 0 ? Number(contractInvoice.shippingDate) : Date.now() / 1000)

        setPaymentData({
          invoice: {
            id: invoiceId,
            amount: rawShippingAmount,
            amountFormatted: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawShippingAmount),
            exporter: exporterName,
            importer: metadata?.importer_name || contractInvoice?.importerCompany || 'N/A',
            invoiceNumber: metadata?.invoice_number || `INV-${invoiceId}`,
            goodsDescription: metadata?.goods_description || 'Shipping Invoice',
            shippingDate: Number(shippingDate),
            status: status,
          },
          payment: {
            status: isPaid ? 'paid' : 'pending',
            dueDate: new Date(Number(shippingDate) * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paymentLink: `/pay/${invoiceId}`,
            isPaid,
          },
        })

      } catch (err: any) {
        console.error('Invoice fetch error:', err)
        setError(err.message || 'Failed to load invoice information')
      } finally {
        setIsLoading(false)
      }
    }

    if (invoiceId) {
      fetchInvoiceData()
    }
  }, [invoiceId, getInvoice])

  const handleContactExporter = () => {
    if (!paymentData) return

    // Copy email for contact
    const message = `Hello ${paymentData.invoice.exporter},\n\nI would like to arrange payment for Invoice #${paymentData.invoice.invoiceNumber}.\n\nAmount due: ${paymentData.invoice.amountFormatted}\nShipping date: ${new Date(paymentData.invoice.shippingDate * 1000).toLocaleDateString()}\n\nPlease provide payment instructions.\n\nThank you.`

    navigator.clipboard.writeText(message)

    toast({
      title: 'Message Copied',
      description: 'Payment inquiry message copied to clipboard. Please contact the exporter via email.',
    })
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

  // Check if payment is completed
  const isPaid = paymentData?.payment.isPaid || false

  // Main payment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Invoice Payment</h1>
          <p className="text-slate-400">Complete your payment for the shipping invoice</p>
        </div>

        {/* Onramp Info Banner */}
        <div className="max-w-6xl mx-auto mb-6">
          <Alert className="bg-blue-900/20 border-blue-700">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <strong>💡 Coming Soon:</strong> Onramp payment gateway integration will allow you to pay with credit card/bank transfer without needing a crypto wallet.
              For now, please contact the exporter for payment instructions.
            </AlertDescription>
          </Alert>
        </div>

        {/* Payment Success Alert */}
        {isPaid && (
          <div className="max-w-6xl mx-auto mb-6">
            <Alert className="bg-green-900/20 border-green-700">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                <strong>✅ Payment Completed!</strong> This invoice has been paid successfully.
                {txHash && (
                  <>
                    <br />
                    <span className="text-xs">TX: </span>
                    <a
                      href={`https://sepolia-blockscout.lisk.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-300 hover:text-green-200 underline text-xs break-all"
                    >
                      {txHash}
                    </a>
                  </>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

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
                  <DollarSign className="w-5 h-5" />
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

                {/* Payment Instructions */}
                <div className="space-y-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Amount Due</p>
                    <p className="text-3xl font-bold text-white">
                      {paymentData.invoice.amountFormatted}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Total shipping value</p>
                  </div>

                  <Alert className="bg-blue-900/20 border-blue-700">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200 text-sm">
                      <strong>Payment Instructions:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                        <li>Contact the exporter for payment details (bank account, etc.)</li>
                        <li>Make payment via bank transfer or agreed method</li>
                        <li>Provide proof of payment to the exporter</li>
                        <li>Admin will verify and mark invoice as paid</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleContactExporter}
                    size="lg"
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Contact Message
                  </Button>
                </div>

                <div className="text-xs text-slate-400 space-y-1 mt-4">
                  <p>ℹ️ Payment is processed off-chain (bank transfer)</p>
                  <p>ℹ️ Invoice status will be updated after admin verification</p>
                  <p>ℹ️ Contact exporter for specific payment instructions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}