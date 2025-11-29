export const ROUTE_BY_ROLE: Record<string, string> = {
  admin: '/dashboard',
  exporter: '/invoices',
  investor: '/pools',
};

export const APP_NAV = [
  { href: '/invoices', label: 'Invoices', roles: ['exporter','admin'] },
  { href: '/pools', label: 'Investment Pools', roles: ['investor','admin','exporter'] },
  { href: '/dashboard', label: 'Dashboard', roles: ['admin'] },
];
