import { TrendingUp, Users, Clock, DollarSign, FileText, ArrowRight, CheckCircle, Shield, Globe, Eye, Lock, Wallet, Copy, ChevronDown, LogOut, User, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LoginButton, useActiveAccount, liskSepolia } from 'panna-sdk';
import { appConfig } from '@/config';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const pannaConfigured = !!(appConfig.panna.clientId && appConfig.panna.partnerId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Dark Theme */}
      <header className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] backdrop-blur-sm border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Logo variant="navbar" size="sm" className="hover-scale hover-glow cursor-pointer" />
            
            {/* Navigation */}
            {/* <nav className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Platform</a>
              <a href="#solutions" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Solutions</a>
              <a href="#developers" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Developers</a>
              <a href="#about" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">About Us</a>
            </nav> */}
            
            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {/* Auth controls: show wallet dropdown when connected, otherwise show connect/signup */}
              {isConnected && activeAccount ? (
                <div ref={menuRef} className="relative flex items-center gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-slate-800/50 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => setMenuOpen((v) => !v)}
                    onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((v) => !v)}
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">{formatAddress(activeAccount.address)}</span>
                    <span className="sm:hidden">Wallet</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigator.clipboard.writeText(activeAccount.address)}
                    onKeyDown={(e) => e.key === 'Enter' && navigator.clipboard.writeText(activeAccount.address)}
                    aria-label="Copy wallet address"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cyan-400/30 bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </div>
                  <a
                    href={`${appConfig.chain.blockExplorer}/address/${activeAccount.address}`}
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
                          href="/dashboard"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:bg-slate-700/50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Dashboard
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
              ) : (
                pannaConfigured ? (
                  <div className="flex items-center gap-3">
                    <Link 
                      href="/demo"
                      className="px-4 py-2 text-cyan-400 border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-all"
                    >
                      Try Demo
                    </Link>
                    <div className="panna-login-button sr-only" aria-hidden="true">
                      <LoginButton chain={liskSepolia} />
                    </div>
                    <div
                      className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 hover-scale hover-shine transition-all border border-cyan-400 flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                        if (loginBtn) loginBtn.click();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                          if (loginBtn) loginBtn.click();
                        }
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </div>
                    <style jsx global>{`
                      /* Style the Panna LoginButton */
                      .panna-login-button button,
                      button[data-testid*="login"],
                      button[class*="login"] {
                        background: #22d3ee !important;
                        color: #0f172a !important;
                        border: 1px solid #22d3ee !important;
                        border-radius: 8px !important;
                        padding: 8px 24px !important;
                        font-weight: 500 !important;
                        font-size: 14px !important;
                        transition: all 0.2s ease !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 8px !important;
                      }
                      .panna-login-button button:hover,
                      button[data-testid*="login"]:hover,
                      button[class*="login"]:hover {
                        background: #67e8f9 !important;
                        transform: scale(1.02) !important;
                      }
                    `}</style>
                  </div>
                ) : (
                  <button className="px-6 py-2 bg-gray-500 text-gray-300 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Configure Panna
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Dark Theme with Ocean Background */}
      <section className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
        {/* Ocean Wave Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' stroke='%2322d3ee' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' stroke='%2322d3ee' fill='none' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            animation: 'wave 20s linear infinite',
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          {/* Main Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative hover-bounce cursor-pointer">
              <Logo variant="full" size="xl" />
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white mb-6">
            Shipping Invoice <span className="text-cyan-400">Funding Platform</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Blockchain-powered trade finance connecting exporters and investors for transparent, fast invoice funding
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={() => {
                const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                if (loginBtn) loginBtn.click();
              }}
              className="px-8 py-4 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 hover-scale hover-shine transition-all text-lg shadow-lg shadow-cyan-500/30 border-2 border-cyan-400"
            >
              Explore Platform
            </button>
            <Link 
              href="/demo"
              className="px-8 py-4 bg-transparent text-white rounded-lg hover:bg-white/10 hover-scale hover-border-glow transition-all text-lg border-2 border-white/30 text-center"
            >
              Try Interactive Demo
            </Link>
          </div>

          {/* Platform Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">70%</div>
              <div className="text-gray-300">Funding Threshold</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">4%</div>
              <div className="text-gray-300">Investor Returns</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">100%</div>
              <div className="text-gray-300">Blockchain Secure</div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#f8f9fa"/>
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, transparent, and fast financing for your export business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">1. Submit Invoice</h3>
              <p className="text-gray-600 text-sm">
                Exporters tokenize shipping invoices as NFTs with document verification
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">2. Admin Review</h3>
              <p className="text-gray-600 text-sm">
                Platform admin verifies and approves invoices for investment pools
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">3. Investor Fund</h3>
              <p className="text-gray-600 text-sm">
                Investors browse pools and fund invoices to earn 4% returns
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">4. Get Funded</h3>
              <p className="text-gray-600 text-sm">
                Exporters withdraw funds at 70% threshold, importers settle invoices
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-slate-900 mb-4">
              Key Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 group-hover:scale-110 transition-all duration-300">
                <FileText className="w-8 h-8 text-cyan-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">Invoice Tokenization</h3>
              <p className="text-sm text-gray-600">Convert export invoices into tradeable digital assets</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 group-hover:scale-110 transition-all duration-300">
                <DollarSign className="w-8 h-8 text-cyan-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">Instant Liquidity</h3>
              <p className="text-sm text-gray-600">Access working capital within hours</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 group-hover:scale-110 transition-all duration-300">
                <TrendingUp className="w-8 h-8 text-cyan-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">4% Returns</h3>
              <p className="text-sm text-gray-600">Guaranteed yields for investors on successful settlements</p>
            </div>

            <div className="text-center group cursor-pointer">
              <div className="w-16 h-16 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-200 group-hover:scale-110 transition-all duration-300">
                <CheckCircle className="w-8 h-8 text-cyan-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">Full Transparency</h3>
              <p className="text-sm text-gray-600">Track every transaction on blockchain</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-slate-900 mb-4">
              Why Choose SEATrax?
            </h2>
            <p className="text-xl text-gray-600">
              Blockchain-powered platform built for modern trade finance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift-lg cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-slate-900">Budi Santoso</div>
                  <div className="text-sm text-gray-600">PT Export Indonesia</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Invoice tokenization as NFTs ensures transparency and immutability. Every transaction is verifiable on-chain."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift-lg cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-slate-900">Fast Funding</div>
                  <div className="text-sm text-gray-600">Platform Feature</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Withdraw funds when invoices reach 70% funding threshold. No need to wait for 100% pool completion."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift-lg cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-slate-900">Secure & Transparent</div>
                  <div className="text-sm text-gray-600">Blockchain Technology</div>
                </div>
              </div>
              <p className="text-gray-600">
                "Smart contracts automate fund distribution and profit sharing. Built on Lisk Sepolia for reliability."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-500 to-cyan-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl text-white mb-4">
            Ready to Transform Your Export Finance?
          </h2>
          <p className="text-xl text-cyan-50 mb-8">
            Join hundreds of exporters and investors already using SEATrax
          </p>
          <button 
            onClick={() => {
              const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
              if (loginBtn) loginBtn.click();
            }}
            className="px-8 py-4 bg-white text-cyan-600 rounded-lg hover:bg-gray-50 hover-scale hover-shine text-lg shadow-lg transition-all"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer - Dark Theme */}
      <footer className="bg-[#0f172a] text-gray-400 py-12 border-t border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => {
                      const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                      if (loginBtn) loginBtn.click();
                    }}
                    className="hover:text-cyan-400 transition-colors text-left"
                  >
                    For Exporters
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                      if (loginBtn) loginBtn.click();
                    }}
                    className="hover:text-cyan-400 transition-colors text-left"
                  >
                    For Investors
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Technology</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://lisk.com/chain/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Smart Contracts</a></li>
                <li><a href="https://sepolia-blockscout.lisk.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Lisk Explorer</a></li>
                <li><a href="https://github.com/LiskHQ/panna-sdk" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Panna SDK</a></li>
                <li><a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Pinata</a></li>
                <li><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Supabase</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-cyan-400 transition-colors">Try Demo</Link></li>
                <li><a href="https://github.com/seatrax/apps/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="https://sepolia-faucet.lisk.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Get Testnet ETH</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Connect</h3>
              <div className="flex gap-4">
                <a href="https://instagram.com/seatrax.corner" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-cyan-400/10 rounded-lg flex items-center justify-center hover:bg-cyan-400/20 hover-scale transition-all" aria-label="Follow us on Instagram">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://github.com/SEATrax" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-cyan-400/10 rounded-lg flex items-center justify-center hover:bg-cyan-400/20 hover-scale transition-all" aria-label="Follow us on GitHub">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <Logo variant="footer" size="md" />
                <div className="text-xs text-gray-500 mt-2">© 2026 SEATrax. All rights reserved.</div>
              </div>
              <p className="text-sm text-gray-500">
                Developed by SEATrax Team
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
