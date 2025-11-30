import ImporterPayment from '@/components/ImporterPayment'

interface PaymentPageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { invoiceId } = await params
  
  return <ImporterPayment invoiceId={invoiceId} />
}