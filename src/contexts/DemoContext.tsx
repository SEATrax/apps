'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Types for demo state
export interface DemoInvoice {
  id: number
  token_id?: number
  invoice_number: string
  exporter_id: number
  exporter_company: string
  exporter_wallet: string
  importer_company: string
  importer_license: string
  goods_description: string
  shipping_amount: number
  loan_amount: number
  amount_invested: number
  amount_withdrawn: number
  shipping_date: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_POOL' | 'FUNDED' | 'WITHDRAWN' | 'PAID' | 'COMPLETED'
  pool_id?: number | null
  documents: Array<{ name: string; url: string }>
  created_at: string
  approved_at?: string
  funded_at?: string
  paid_at?: string
}

export interface DemoPool {
  id: number
  pool_id: number
  name: string
  description: string
  start_date: string
  end_date: string
  invoice_ids: number[]
  total_loan_amount: number
  total_shipping_amount: number
  amount_invested: number
  amount_distributed: number
  fee_paid: number
  status: 'OPEN' | 'FUNDRAISING' | 'FUNDED' | 'COMPLETED'
  risk_category: string
  expected_yield: number
  duration_days: number
  investors: Array<{ wallet: string; amount: number; percentage: number }>
  created_at: string
}

export interface DemoPayment {
  id: number
  invoice_id: number
  invoice_number: string
  importer_company: string
  amount_usd: number
  payment_link: string
  status: 'PENDING' | 'SENT' | 'PAID'
  sent_at?: string
  paid_at?: string
  created_at: string
}

export interface DemoNotification {
  id: string
  title: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

interface DemoContextType {
  invoices: DemoInvoice[]
  pools: DemoPool[]
  payments: DemoPayment[]
  notifications: DemoNotification[]
  currentUser: string | null
  
  // Actions
  setCurrentUser: (wallet: string | null) => void
  submitInvoice: (invoice: Omit<DemoInvoice, 'id' | 'created_at' | 'status'>) => void
  approveInvoice: (invoiceId: number) => void
  rejectInvoice: (invoiceId: number) => void
  createPool: (pool: Omit<DemoPool, 'id' | 'created_at' | 'amount_invested' | 'amount_distributed' | 'fee_paid'>) => void
  investInPool: (poolId: number, amount: number, investorWallet: string) => void
  markInvoicePaid: (invoiceId: number) => void
  withdrawFunds: (invoiceId: number, amount: number) => void
  addNotification: (notification: Omit<DemoNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  resetDemoData: () => void
}

export const DemoContext = createContext<DemoContextType | undefined>(undefined)

// Initial data
const initialInvoices: DemoInvoice[] = [
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
    status: "FUNDED",
    pool_id: 1,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_001.pdf" },
      { name: "Bill of Lading", url: "/docs/bol_001.pdf" }
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
    amount_invested: 48000,
    amount_withdrawn: 0,
    shipping_date: "2024-12-20",
    status: "IN_POOL",
    pool_id: 2,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_002.pdf" },
      { name: "Packing List", url: "/docs/packing_002.pdf" }
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
    goods_description: "Electronic Components - Semiconductors and Microchips",
    shipping_amount: 250000,
    loan_amount: 200000,
    amount_invested: 0,
    amount_withdrawn: 0,
    shipping_date: "2024-12-25",
    status: "APPROVED",
    pool_id: null,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_003.pdf" },
      { name: "Certificate of Origin", url: "/docs/origin_003.pdf" }
    ],
    created_at: "2024-11-20",
    approved_at: "2024-11-21"
  },
  {
    id: 4,
    token_id: 1004,
    invoice_number: "INV-2024-11-004",
    exporter_id: 1,
    exporter_company: "PT Sinar Jaya Export",
    exporter_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    importer_company: "Spice World Distribution (CA)",
    importer_license: "IMP-CA-2024-7890",
    goods_description: "Indonesian Spices - Nutmeg, Cloves, Black Pepper Mix",
    shipping_amount: 95000,
    loan_amount: 76000,
    amount_invested: 0,
    amount_withdrawn: 0,
    shipping_date: "2024-12-30",
    status: "PENDING",
    pool_id: null,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_004.pdf" },
      { name: "Phytosanitary Certificate", url: "/docs/phyto_004.pdf" }
    ],
    created_at: "2024-11-22"
  },
  {
    id: 5,
    token_id: 1005,
    invoice_number: "INV-2024-11-005",
    exporter_id: 2,
    exporter_company: "Manila Trading Corp",
    exporter_wallet: "0x742d35Cc6175C06c06B756daee142f8CCb34332A",
    importer_company: "Furniture Plus (AU)",
    importer_license: "IMP-AU-2024-2468",
    goods_description: "Rattan Furniture - Chairs, Tables, and Home Decor Sets",
    shipping_amount: 180000,
    loan_amount: 144000,
    amount_invested: 0,
    amount_withdrawn: 0,
    shipping_date: "2025-01-05",
    status: "PENDING",
    pool_id: null,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_005.pdf" },
      { name: "Quality Certificate", url: "/docs/quality_005.pdf" }
    ],
    created_at: "2024-11-25"
  },
  {
    id: 6,
    token_id: 1006,
    invoice_number: "INV-2024-11-006",
    exporter_id: 1,
    exporter_company: "PT Sinar Jaya Export",
    exporter_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    importer_company: "Fashion Forward Inc (DE)",
    importer_license: "IMP-DE-2024-1357",
    goods_description: "Handwoven Bags and Accessories - Eco-friendly Materials",
    shipping_amount: 65000,
    loan_amount: 52000,
    amount_invested: 0,
    amount_withdrawn: 0,
    shipping_date: "2025-01-10",
    status: "APPROVED",
    pool_id: null,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_006.pdf" },
      { name: "Sustainability Certificate", url: "/docs/sustain_006.pdf" }
    ],
    created_at: "2024-11-27",
    approved_at: "2024-11-28"
  }
]

const initialPools: DemoPool[] = [
  {
    id: 1,
    pool_id: 1,
    name: "Southeast Asia Export Pool #1",
    description: "Diversified pool focusing on ASEAN agricultural exports",
    start_date: "2024-11-15",
    end_date: "2025-02-15",
    invoice_ids: [1],
    total_loan_amount: 100000,
    total_shipping_amount: 125000,
    amount_invested: 100000,
    amount_distributed: 100000,
    fee_paid: 1000,
    status: "FUNDED",
    risk_category: "MEDIUM",
    expected_yield: 4.0,
    duration_days: 90,
    investors: [
      { wallet: "0x8ba1f109551bD432803012645Hac136c12c00854", amount: 60000, percentage: 60 },
      { wallet: "0x9ca2e110552cE543904123756Iac247d13d00965", amount: 40000, percentage: 40 }
    ],
    created_at: "2024-11-15"
  },
  {
    id: 2,
    pool_id: 2,
    name: "Textile & Handicraft Pool #2",
    description: "Premium textile and traditional craft exports",
    start_date: "2024-11-18",
    end_date: "2025-02-18",
    invoice_ids: [2],
    total_loan_amount: 68000,
    total_shipping_amount: 85000,
    amount_invested: 48000,
    amount_distributed: 0,
    fee_paid: 0,
    status: "FUNDRAISING",
    risk_category: "LOW",
    expected_yield: 4.0,
    duration_days: 85,
    investors: [
      { wallet: "0x8ba1f109551bD432803012645Hac136c12c00854", amount: 30000, percentage: 44.1 },
      { wallet: "0x9ca2e110552cE543904123756Iac247d13d00965", amount: 18000, percentage: 26.5 }
    ],
    created_at: "2024-11-18"
  },
  {
    id: 3,
    pool_id: 3,
    name: "High-Tech Electronics Pool #3",
    description: "Premium electronics and technology components from verified Asian exporters",
    start_date: "2024-11-21",
    end_date: "2025-02-21",
    invoice_ids: [3],
    total_loan_amount: 200000,
    total_shipping_amount: 250000,
    amount_invested: 0,
    amount_distributed: 0,
    fee_paid: 0,
    status: "OPEN",
    risk_category: "MEDIUM",
    expected_yield: 4.5,
    duration_days: 92,
    investors: [],
    created_at: "2024-11-21"
  },
  {
    id: 4,
    pool_id: 4,
    name: "Traditional Crafts & Furniture Pool #4",
    description: "Indonesian traditional products including furniture, bags, and spices",
    start_date: "2024-11-28",
    end_date: "2025-02-28",
    invoice_ids: [4, 5, 6],
    total_loan_amount: 272000,
    total_shipping_amount: 340000,
    amount_invested: 0,
    amount_distributed: 0,
    fee_paid: 0,
    status: "OPEN",
    risk_category: "LOW",
    expected_yield: 4.0,
    duration_days: 88,
    investors: [],
    created_at: "2024-11-28"
  }
]

const initialPayments: DemoPayment[] = [
  {
    id: 1,
    invoice_id: 1,
    invoice_number: "INV-2024-11-001",
    importer_company: "US Trade Partners LLC",
    amount_usd: 104000,
    payment_link: "https://seatrax.com/pay/1",
    status: "SENT",
    sent_at: "2024-11-21",
    created_at: "2024-11-21"
  },
  {
    id: 2,
    invoice_id: 2,
    invoice_number: "INV-2024-11-002",
    importer_company: "European Textile Imports",
    amount_usd: 70720,
    payment_link: "https://seatrax.com/pay/2",
    status: "PENDING",
    created_at: "2024-11-24"
  },
  {
    id: 3,
    invoice_id: 3,
    invoice_number: "INV-2024-11-003",
    importer_company: "Tech Solutions Ltd (UK)",
    amount_usd: 208000,
    payment_link: "https://seatrax.com/pay/3",
    status: "PENDING",
    created_at: "2024-11-25"
  }
]

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage on initialization
  const loadFromStorage = (key: string, defaultValue: any) => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const stored = localStorage.getItem(`seatrax_demo_${key}`)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const [invoices, setInvoices] = useState<DemoInvoice[]>(() => loadFromStorage('invoices', initialInvoices))
  const [pools, setPools] = useState<DemoPool[]>(() => loadFromStorage('pools', initialPools))
  const [payments, setPayments] = useState<DemoPayment[]>(() => loadFromStorage('payments', initialPayments))
  const [notifications, setNotifications] = useState<DemoNotification[]>(() => loadFromStorage('notifications', []))
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatrax_demo_invoices', JSON.stringify(invoices))
    }
  }, [invoices])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatrax_demo_pools', JSON.stringify(pools))
    }
  }, [pools])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatrax_demo_payments', JSON.stringify(payments))
    }
  }, [payments])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seatrax_demo_notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = (notification: Omit<DemoNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: DemoNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const submitInvoice = (invoiceData: Omit<DemoInvoice, 'id' | 'created_at' | 'status'>) => {
    const newInvoice: DemoInvoice = {
      ...invoiceData,
      id: invoices.length + Date.now(),
      status: 'PENDING',
      created_at: new Date().toISOString()
    }
    
    setInvoices(prev => [...prev, newInvoice])
    
    addNotification({
      title: 'New Invoice Submitted',
      message: `Invoice ${newInvoice.invoice_number} has been submitted for review`,
      type: 'info'
    })
  }

  const approveInvoice = (invoiceId: number) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'APPROVED', approved_at: new Date().toISOString() }
        : invoice
    ))
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      addNotification({
        title: 'Invoice Approved',
        message: `Invoice ${invoice.invoice_number} has been approved and is ready for pool inclusion`,
        type: 'success'
      })
    }
  }

  const rejectInvoice = (invoiceId: number) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'REJECTED' }
        : invoice
    ))
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      addNotification({
        title: 'Invoice Rejected',
        message: `Invoice ${invoice.invoice_number} has been rejected`,
        type: 'warning'
      })
    }
  }

  const createPool = (poolData: Omit<DemoPool, 'id' | 'created_at' | 'amount_invested' | 'amount_distributed' | 'fee_paid'>) => {
    const newPool: DemoPool = {
      ...poolData,
      id: pools.length + Date.now(),
      amount_invested: 0,
      amount_distributed: 0,
      fee_paid: 0,
      investors: [],
      created_at: new Date().toISOString()
    }
    
    setPools(prev => [...prev, newPool])
    
    // Update invoices to be in pool
    setInvoices(prev => prev.map(invoice => 
      poolData.invoice_ids.includes(invoice.id)
        ? { ...invoice, status: 'IN_POOL', pool_id: newPool.id }
        : invoice
    ))
    
    addNotification({
      title: 'Pool Created',
      message: `Investment pool "${newPool.name}" has been created with ${poolData.invoice_ids.length} invoices`,
      type: 'success'
    })
  }

  const investInPool = (poolId: number, amount: number, investorWallet: string) => {
    setPools(prev => prev.map(pool => {
      if (pool.id === poolId) {
        const newInvestors = [...pool.investors]
        const existingInvestorIndex = newInvestors.findIndex(inv => inv.wallet === investorWallet)
        
        if (existingInvestorIndex >= 0) {
          newInvestors[existingInvestorIndex].amount += amount
        } else {
          newInvestors.push({ wallet: investorWallet, amount, percentage: 0 })
        }
        
        const newTotalInvested = pool.amount_invested + amount
        
        // Recalculate percentages
        newInvestors.forEach(investor => {
          investor.percentage = (investor.amount / newTotalInvested) * 100
        })
        
        const updatedPool = {
          ...pool,
          amount_invested: newTotalInvested,
          investors: newInvestors,
          status: newTotalInvested >= pool.total_loan_amount ? 'FUNDED' as const : pool.status
        }
        
        // If pool is now funded, distribute to invoices
        if (updatedPool.status === 'FUNDED' && pool.status !== 'FUNDED') {
          setTimeout(() => {
            setInvoices(prev => prev.map(invoice => 
              pool.invoice_ids.includes(invoice.id)
                ? { 
                    ...invoice, 
                    status: 'FUNDED', 
                    amount_invested: invoice.loan_amount,
                    funded_at: new Date().toISOString()
                  }
                : invoice
            ))
            
            addNotification({
              title: 'Pool Fully Funded',
              message: `Pool "${pool.name}" is now fully funded. Funds have been distributed to exporters.`,
              type: 'success'
            })
          }, 1000)
        }
        
        return updatedPool
      }
      return pool
    }))
    
    addNotification({
      title: 'Investment Made',
      message: `Successfully invested $${amount.toLocaleString()} in pool`,
      type: 'success'
    })
  }

  const withdrawFunds = (invoiceId: number, amount: number) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId
        ? { 
            ...invoice, 
            amount_withdrawn: invoice.amount_withdrawn + amount,
            status: 'WITHDRAWN'
          }
        : invoice
    ))
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      // Create payment record
      const newPayment: DemoPayment = {
        id: payments.length + Date.now(),
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        importer_company: invoice.importer_company,
        amount_usd: invoice.loan_amount * 1.04, // 4% interest
        payment_link: `https://seatrax.com/pay/${invoiceId}`,
        status: 'SENT',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      
      setPayments(prev => [...prev, newPayment])
      
      addNotification({
        title: 'Funds Withdrawn',
        message: `$${amount.toLocaleString()} withdrawn from ${invoice.invoice_number}. Payment link sent to importer.`,
        type: 'success'
      })
    }
  }

  const markInvoicePaid = (invoiceId: number) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId
        ? { ...invoice, status: 'PAID', paid_at: new Date().toISOString() }
        : invoice
    ))
    
    setPayments(prev => prev.map(payment => 
      payment.invoice_id === invoiceId
        ? { ...payment, status: 'PAID', paid_at: new Date().toISOString() }
        : payment
    ))
    
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice) {
      addNotification({
        title: 'Payment Received',
        message: `Payment received for ${invoice.invoice_number}. Returns will be distributed to investors.`,
        type: 'success'
      })
      
      // Check if all invoices in pool are paid
      setTimeout(() => {
        const pool = pools.find(p => p.invoice_ids.includes(invoiceId))
        if (pool) {
          const allInvoicesPaid = pool.invoice_ids.every(id => {
            const inv = invoices.find(i => i.id === id)
            return inv?.status === 'PAID'
          })
          
          if (allInvoicesPaid) {
            setPools(prev => prev.map(p => 
              p.id === pool.id ? { ...p, status: 'COMPLETED' as const } : p
            ))
            
            addNotification({
              title: 'Pool Completed',
              message: `Pool "${pool.name}" completed. Returns are now available for investors.`,
              type: 'success'
            })
          }
        }
      }, 500)
    }
  }

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const resetDemoData = () => {
    setInvoices(initialInvoices)
    setPools(initialPools)
    setPayments(initialPayments)
    setNotifications([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seatrax_demo_invoices')
      localStorage.removeItem('seatrax_demo_pools')
      localStorage.removeItem('seatrax_demo_payments')
      localStorage.removeItem('seatrax_demo_notifications')
    }
  }

  const contextValue: DemoContextType = {
    invoices,
    pools,
    payments,
    notifications,
    currentUser,
    setCurrentUser,
    submitInvoice,
    approveInvoice,
    rejectInvoice,
    createPool,
    investInPool,
    markInvoicePaid,
    withdrawFunds,
    addNotification,
    markNotificationRead,
    clearNotifications,
    resetDemoData
  }

  return (
    <DemoContext.Provider value={contextValue}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoContext() {
  const context = useContext(DemoContext)
  if (context === undefined) {
    throw new Error('useDemoContext must be used within a DemoProvider')
  }
  return context
}