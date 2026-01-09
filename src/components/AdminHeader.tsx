'use client';

import { LoginButton, liskSepolia } from 'panna-sdk';
import { useWalletSession } from '@/hooks/useWalletSession';
import { Building2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminHeader() {
  const { isLoaded, isConnected, account, wasConnected } = useWalletSession();
  const router = useRouter();

  // Immediate logout detection - if was connected but now disconnected
  useEffect(() => {
    if (isLoaded && wasConnected && !isConnected) {
      router.push('/');
    }
  }, [isLoaded, wasConnected, isConnected, router]);

  // Fallback redirect for users who never connected and try to access admin pages
  useEffect(() => {
    if (isLoaded && !isConnected && !wasConnected) {
      router.push('/');
    }
  }, [isLoaded, isConnected, wasConnected, router]);

  return (
    <div className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 backdrop-blur-md bg-slate-950/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-white">SEATrax</span>
              <div className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
                ADMIN
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/admin/roles"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Role Manager
            </Link>
            <Link
              href="/admin/exporters"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Exporters
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
          </nav>

          {/* Admin Info & Logout */}
          <div className="flex items-center space-x-4">
            {/* Admin Badge */}
            {account && (
              <div className="flex items-center space-x-2 text-sm bg-slate-900 rounded-lg px-3 py-2">
                <Settings className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">
                  Admin
                </span>
                <div className="w-2 h-2 bg-red-500 rounded-full" title="Admin Access"></div>
              </div>
            )}

            {/* Panna SDK Login/Logout Button */}
            <div className="flex items-center">
              <LoginButton chain={liskSepolia} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}