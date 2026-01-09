export const ROUTE_BY_ROLE: Record<string, string> = {
  admin: '/dashboard',
  exporter: '/exporter',
  investor: '/investor',
};

export const PROTECTED_ROUTES = [
  '/exporter',
  '/exporter/invoices',
  '/exporter/payments', 
  '/investor',
  '/investor/pools',
  '/investor/investments',
  '/investor/returns',
  '/admin',
  '/admin/roles',
  '/admin/exporters',
  '/admin/invoices',
  '/admin/pools',
  '/admin/payments',
  '/select-role',
];

export const APP_NAV = [
  { href: '/invoices', label: 'Invoices', roles: ['exporter','admin'] },
  { href: '/pools', label: 'Investment Pools', roles: ['investor','admin','exporter'] },
  { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
  { href: '/demo', label: 'Demo', roles: [] },
];
