'use client';

import { ReactNode } from 'react';
import { Ship, Target, TrendingUp, Wallet, LogOut } from 'lucide-react';
import { useActiveAccount, LoginButton, liskSepolia } from 'panna-sdk';
import { formatAddress } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface InvestorLayoutProps {
  children: ReactNode;
}

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  const router = useRouter();
  const activeAccount = useActiveAccount();

  const handleDisconnect = () => {
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/investor', icon: Target, current: true },
    { name: 'Investment Pools', href: '/investor/pools', icon: Wallet, current: false },
    { name: 'My Investments', href: '/investor/investments', icon: Target, current: false },
    { name: 'Returns & Claims', href: '/investor/returns', icon: TrendingUp, current: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                <Ship className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-lg text-white font-bold tracking-tight">
                SeaTrax
              </span>
              <span className="text-sm text-gray-400 border-l border-slate-700 pl-3 ml-3">
                Investor
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              {activeAccount && (
                <div className="hidden sm:flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/20">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">
                    {formatAddress(activeAccount.address)}
                  </span>
                </div>
              )}
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
                <LoginButton chain={liskSepolia} onDisconnect={handleDisconnect} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="sticky top-24 space-y-2">
              {navigation.map((item) => {
                const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-teal-400/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-6">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {navigation.map((item) => {
                const isActive = typeof window !== 'undefined' && window.location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-teal-400/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm whitespace-nowrap">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}