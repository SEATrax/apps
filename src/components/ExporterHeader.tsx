'use client';

import { LoginButton, liskSepolia } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useWalletSession } from '@/hooks/useWalletSession';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

export default function ExporterHeader() {
  const { isLoaded, isConnected, account, wasConnected } = useWalletSession();
  const { profile } = useExporterProfile();
  const router = useRouter();

  // Immediate logout detection - if was connected but now disconnected
  useEffect(() => {
    if (isLoaded && wasConnected && !isConnected) {
      router.push('/');
    }
  }, [isLoaded, wasConnected, isConnected, router]);

  // Fallback redirect for users who never connected and try to access exporter pages
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
            <Link href="/exporter" className="flex items-center space-x-3">
              <Logo variant="navbar" size="sm" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              href="/exporter"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/exporter/invoices"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Invoices
            </Link>
            <Link
              href="/exporter/payments"
              className="text-slate-300 hover:text-cyan-400 px-3 py-2 text-sm font-medium transition-colors"
            >
              Payments
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {/* Company Profile Info */}
            {profile && (
              <div className="flex items-center space-x-2 text-sm bg-slate-900 rounded-lg px-3 py-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-300">
                  {profile.company_name}
                </span>
                {profile.is_verified && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Verified Company"></div>
                )}
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