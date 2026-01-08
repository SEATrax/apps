'use client';

import { useActiveAccount, LoginButton, liskSepolia } from 'panna-sdk';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { Building2 } from 'lucide-react';
import Link from 'next/link';

export default function ExporterHeader() {
  const activeAccount = useActiveAccount();
  const { profile } = useExporterProfile();

  return (
    <div className="bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/exporter" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-white">SEATrax</span>
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
            <LoginButton chain={liskSepolia} />
          </div>
        </div>
      </div>
    </div>
  );
}