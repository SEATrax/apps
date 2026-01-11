'use client';

import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { Building2, Settings, Wallet, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

export default function AdminHeader() {
  const { isConnected, address, disconnect } = useMetaMaskAdmin();
  const router = useRouter();

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 backdrop-blur-md bg-slate-950/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Logo variant="navbar" size="sm" />
              <div className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
                ADMIN
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/admin"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link

              href="/admin/invoices"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Invoices
            </Link>
            <Link
              href="/admin/pools"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Pools
            </Link>
            <Link
              href="/admin/roles"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Grant Admin
            </Link>
          </nav>

          {/* Admin Info & Wallet */}
          <div className="flex items-center space-x-4">
            {isConnected && address ? (
              <>
                {/* Admin Badge with Address */}
                <div className="flex items-center space-x-2 text-sm bg-slate-900 rounded-lg px-3 py-2">
                  <Wallet className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-300 font-mono">
                    {shortenAddress(address)}
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Admin Connected"></div>
                </div>

                {/* Disconnect Button */}
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="text-slate-300 hover:text-red-400 border-slate-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2 text-sm bg-slate-900 rounded-lg px-3 py-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">
                  Not Connected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}