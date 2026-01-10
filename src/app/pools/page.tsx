'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Copy, ChevronDown, LogOut, User, ExternalLink } from 'lucide-react';
import { useActiveAccount, LoginButton, liskSepolia } from 'panna-sdk';
import { appConfig } from '@/config';
import { formatAddress } from '@/lib/utils';
import AddInvestment from '@/components/AddInvestment';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

export default function PoolsPage() {
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const pannaConfigured = !!(appConfig.panna.clientId && appConfig.panna.partnerId);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handlePoolSelect = (poolId: string) => {
    router.push(`/pools/${poolId}`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navbar for unauthenticated state */}
        <header className="bg-[#0f172a] border-b border-cyan-500/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Logo variant="navbar" size="md" href="/" className="hover-scale hover-glow cursor-pointer" />
              
              <div className="flex items-center gap-3">
                {pannaConfigured && (
                  <div className="panna-login-button sr-only" aria-hidden="true">
                    <LoginButton chain={liskSepolia} />
                  </div>
                )}
                
                {pannaConfigured ? (
                  <button
                    className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 hover-scale-sm hover-shine transition-all border border-cyan-400 flex items-center gap-2"
                    onClick={() => {
                      const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                      if (loginBtn) loginBtn.click();
                    }}
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </button>
                ) : (
                  <button className="px-6 py-2 bg-gray-500 text-gray-300 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Configure Panna
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <Wallet className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to view available investment pools.
            </p>
            {pannaConfigured && (
              <button
                className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 transition-all font-medium flex items-center gap-2 mx-auto"
                onClick={() => {
                  const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                  if (loginBtn) loginBtn.click();
                }}
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-[#0f172a] border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo variant="navbar" size="md" href="/" className="hover-scale hover-glow cursor-pointer" />
            
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Dashboard</Link>
              <Link href="/pools" className="text-cyan-400 hover:text-cyan-300 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-cyan-400">Pools</Link>
              <Link href="/investments" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Investments</Link>
              <Link href="/returns" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Returns</Link>
            </nav>
            
            <div className="flex items-center gap-3">
              {pannaConfigured && (
                <div className="panna-login-button sr-only" aria-hidden="true">
                  <LoginButton chain={liskSepolia} />
                </div>
              )}
              
              <div className="relative flex items-center gap-2">
                <div
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-slate-800/50 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700/50 cursor-pointer transition-colors"
                  onClick={() => setMenuOpen((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((v) => !v)}
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">{formatAddress(activeAccount?.address || '')}</span>
                  <span className="sm:hidden">Wallet</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigator.clipboard.writeText(activeAccount?.address || '')}
                  onKeyDown={(e) => e.key === 'Enter' && navigator.clipboard.writeText(activeAccount?.address || '')}
                  aria-label="Copy wallet address"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cyan-400/30 bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer text-white"
                >
                  <Copy className="h-4 w-4" />
                </div>
                <a
                  href={`${appConfig.chain.blockExplorer}/address/${activeAccount?.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cyan-400/30 bg-slate-800/50 hover:bg-slate-700/50 text-white"
                  aria-label="Open in block explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-cyan-400/30 bg-slate-800 shadow-lg animate-slide-down z-50">
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:bg-slate-700/50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </div>
                    <div className="border-t border-cyan-400/20"></div>
                    <div className="p-2">
                      <p className="text-xs text-gray-400 px-3 py-1 mb-1">Manage wallet</p>
                      <div
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white border border-cyan-400/30 bg-slate-700/50 hover:bg-slate-600/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setMenuOpen(false);
                          setTimeout(() => {
                            const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                            if (loginBtn) loginBtn.click();
                          }, 100);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setMenuOpen(false);
                            setTimeout(() => {
                              const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                              if (loginBtn) loginBtn.click();
                            }, 100);
                          }
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Manage Wallet
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Pools Content */}
      <AddInvestment />

      {/* Footer */}
      <footer className="bg-[#0f172a] text-gray-400 py-12 border-t border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo variant="footer" size="sm" className="mb-4" />
              <p className="text-gray-400 max-w-md">
                Empowering global trade through blockchain-based invoice funding. 
                Connect exporters with investors for secure, transparent financing.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-cyan-400 transition-colors">How it Works</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Pools</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Documentation</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Security</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-cyan-400 transition-colors">Help Center</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Contact Us</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2025 SeaTrax. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
