// Mock data untuk demo SEATrax
export const mockExporters = [
  {
    id: 1,
    wallet_address: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    company_name: "PT Sinar Jaya Export",
    country: "Indonesia",
    export_license: "EXP-2024-001",
    tax_id: "12.345.678.9-001.000",
    is_verified: true,
    created_at: "2024-11-01",
    total_exports: 15,
    total_value: 2850000
  },
  {
    id: 2,
    wallet_address: "0x742d35Cc6175C06c06B756daee142f8CCb34332A",
    company_name: "Manila Trading Corp",
    country: "Philippines",
    export_license: "EXP-2024-002",
    tax_id: "98-7654321",
    is_verified: true,
    created_at: "2024-11-02",
    total_exports: 8,
    total_value: 1420000
  }
];

export const mockInvestors = [
  {
    id: 1,
    wallet_address: "0x8ba1f109551bD432803012645Hac136c12c00854",
    name: "Budi Investor",
    address: "Jakarta, Indonesia",
    total_invested: 500000,
    active_investments: 3,
    total_returns: 22500,
    created_at: "2024-10-15"
  },
  {
    id: 2,
    wallet_address: "0x9ca2e110552cE543904123756Iac247d13d00965",
    name: "Sarah Investment Fund",
    address: "Singapore",
    total_invested: 1200000,
    active_investments: 7,
    total_returns: 54000,
    created_at: "2024-10-20"
  }
];

export const mockInvoices = [
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
    shipping_amount: 125000, // USD
    loan_amount: 100000, // USD (80% of shipping)
    amount_invested: 100000, // Fully funded
    amount_withdrawn: 100000,
    shipping_date: "2024-12-15",
    status: "FUNDED", // PENDING, APPROVED, IN_POOL, FUNDED, WITHDRAWN, PAID, COMPLETED
    pool_id: 1,
    documents: [
      { name: "Commercial Invoice", url: "/docs/invoice_001.pdf" },
      { name: "Bill of Lading", url: "/docs/bol_001.pdf" },
      { name: "Export License", url: "/docs/license_001.pdf" }
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
    loan_amount: 68000, // 80% of shipping
    amount_invested: 48000, // 70% funded
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
    importer_company: "Tokyo Food Distributors",
    importer_license: "IMP-JP-2024-3456",
    goods_description: "Dried Mangoes - Premium Quality",
    shipping_amount: 95000,
    loan_amount: 76000,
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
  }
];

export const mockPools = [
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
    amount_invested: 100000, // Fully funded
    amount_distributed: 100000,
    fee_paid: 1000,
    status: "FUNDED", // OPEN, FUNDRAISING, FUNDED, COMPLETED
    risk_category: "Medium",
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
    amount_invested: 48000, // 70% funded
    amount_distributed: 0,
    fee_paid: 0,
    status: "FUNDRAISING",
    risk_category: "Low",
    expected_yield: 4.0,
    duration_days: 85,
    investors: [
      { wallet: "0x8ba1f109551bD432803012645Hac136c12c00854", amount: 30000, percentage: 44.1 },
      { wallet: "0x9ca2e110552cE543904123756Iac247d13d00965", amount: 18000, percentage: 26.5 }
    ],
    created_at: "2024-11-18"
  }
];

export const mockPayments = [
  {
    id: 1,
    invoice_id: 1,
    invoice_number: "INV-2024-11-001",
    importer_company: "US Trade Partners LLC",
    amount_usd: 104000, // loan + 4% yield
    payment_link: "https://seatrax.com/pay/1",
    status: "PAID", // PENDING, SENT, PAID
    sent_at: "2024-11-21",
    paid_at: "2024-12-16",
    created_at: "2024-11-21"
  },
  {
    id: 2,
    invoice_id: 2,
    invoice_number: "INV-2024-11-002",
    importer_company: "European Textile Imports",
    amount_usd: 70720, // loan + 4% yield
    payment_link: "https://seatrax.com/pay/2",
    status: "SENT",
    sent_at: "2024-11-22",
    paid_at: null,
    created_at: "2024-11-22"
  }
];

export const mockTransactions = [
  {
    id: 1,
    type: "INVOICE_CREATED",
    invoice_id: 1,
    user_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    amount: 100000,
    tx_hash: "0x1234567890abcdef1234567890abcdef12345678",
    timestamp: "2024-11-15T10:30:00Z"
  },
  {
    id: 2,
    type: "POOL_INVESTMENT",
    pool_id: 1,
    user_wallet: "0x8ba1f109551bD432803012645Hac136c12c00854",
    amount: 60000,
    tx_hash: "0x2345678901bcdef12345678901bcdef123456789",
    timestamp: "2024-11-16T14:15:00Z"
  },
  {
    id: 3,
    type: "FUNDS_WITHDRAWN",
    invoice_id: 1,
    user_wallet: "0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4",
    amount: 100000,
    tx_hash: "0x3456789012cdef123456789012cdef1234567890",
    timestamp: "2024-11-20T09:45:00Z"
  }
];

// Utility functions untuk demo
export const getInvoicesByExporter = (walletAddress: string) => {
  return mockInvoices.filter(invoice => invoice.exporter_wallet === walletAddress);
};

export const getPoolsByStatus = (status: string) => {
  return mockPools.filter(pool => pool.status === status);
};

export const getInvestmentsByWallet = (walletAddress: string) => {
  return mockPools.filter(pool => 
    pool.investors.some(investor => investor.wallet === walletAddress)
  ).map(pool => ({
    ...pool,
    my_investment: pool.investors.find(inv => inv.wallet === walletAddress)
  }));
};

export const getExporterByWallet = (walletAddress: string) => {
  return mockExporters.find(exp => exp.wallet_address === walletAddress);
};

export const getInvestorByWallet = (walletAddress: string) => {
  return mockInvestors.find(inv => inv.wallet_address === walletAddress);
};

// Mock investment data for investors
export const mockInvestments = [
  {
    id: 1,
    investor_wallet: "0x8ba1f109551bD432803012645Hac136c12c00854",
    pool_id: 1,
    amount: 60000,
    percentage: 60,
    status: "ACTIVE",
    created_at: "2024-11-16"
  },
  {
    id: 2,
    investor_wallet: "0x8ba1f109551bD432803012645Hac136c12c00854",
    pool_id: 2,
    amount: 30000,
    percentage: 44.1,
    status: "ACTIVE",
    created_at: "2024-11-18"
  },
  {
    id: 3,
    investor_wallet: "0x9ca2e110552cE543904123756Iac247d13d00965",
    pool_id: 1,
    amount: 40000,
    percentage: 40,
    status: "COMPLETED",
    created_at: "2024-11-16"
  },
  {
    id: 4,
    investor_wallet: "0x9ca2e110552cE543904123756Iac247d13d00965",
    pool_id: 2,
    amount: 18000,
    percentage: 26.5,
    status: "ACTIVE",
    created_at: "2024-11-18"
  }
];

// Mock returns data for investors
export const mockReturns = [
  {
    id: 1,
    investor_wallet: "0x9ca2e110552cE543904123756Iac247d13d00965",
    pool_id: 1,
    amount: 1600, // 4% of 40000
    created_at: "2024-12-16"
  },
  {
    id: 2,
    investor_wallet: "0x8ba1f109551bD432803012645Hac136c12c00854",
    pool_id: 1,
    amount: 2400, // 4% of 60000
    created_at: "2024-12-16"
  }
];

export const getInvestmentsByInvestor = (walletAddress: string) => {
  return mockInvestments.filter(investment => investment.investor_wallet === walletAddress);
};

export const getReturnsByInvestor = (walletAddress: string) => {
  return mockReturns.filter(returnItem => returnItem.investor_wallet === walletAddress);
};

export const getUserRole = (walletAddress: string): 'admin' | 'exporter' | 'investor' | null => {
  // Admin addresses
  const adminAddresses = ['0xAd5f292F75D22996E7A4DD277083c75aB29ff45C'];
  if (adminAddresses.includes(walletAddress)) return 'admin';
  
  // Check exporter
  if (mockExporters.some(exp => exp.wallet_address === walletAddress)) return 'exporter';
  
  // Check investor
  if (mockInvestors.some(inv => inv.wallet_address === walletAddress)) return 'investor';
  
  return null;
};