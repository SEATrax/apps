export const ROUTE_BY_ROLE: Record<string, string> = {
  admin: '/dashboard',
  exporter: '/exporter',
  investor: '/investor',
};

export const PROTECTED_ROUTES = [
  '/exporter',
  '/exporter/invoices',
  '/exporter/invoices/new',
  '/exporter/payments', 
  '/investor',
  '/investor/pools',
  '/investor/pools/[id]',
  '/investor/investments',
  '/investor/returns',
  '/admin',
  '/admin/roles',
  '/admin/exporters',
  '/admin/invoices',
  '/admin/pools',
  '/admin/payments',
  '/select-role',
  '/onboarding/exporter',
  '/onboarding/investor',
];

export const APP_NAV = [
  { href: '/invoices', label: 'Invoices', roles: ['exporter','admin'] },
  { href: '/pools', label: 'Investment Pools', roles: ['investor','admin','exporter'] },
  { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  { href: '/demo', label: 'Demo', roles: [] },
];

// Navigation items for each role
export const INVESTOR_NAV = [
  { href: '/investor', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/investor/pools', label: 'Investment Pools', icon: 'TrendingUp' },
  { href: '/investor/investments', label: 'My Investments', icon: 'Wallet' },
  { href: '/investor/returns', label: 'Returns & Claims', icon: 'DollarSign' },
];

export const EXPORTER_NAV = [
  { href: '/exporter', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/exporter/invoices', label: 'My Invoices', icon: 'FileText' },
  { href: '/exporter/payments', label: 'Payment Tracking', icon: 'CreditCard' },
];

// Role-based default redirects
export const getDefaultRouteForRole = (hasAdminRole: boolean, hasExporterRole: boolean, hasInvestorRole: boolean) => {
  if (hasAdminRole) return '/dashboard';
  if (hasExporterRole) return '/exporter';
  if (hasInvestorRole) return '/investor';
  return '/'; // No role assigned
};
