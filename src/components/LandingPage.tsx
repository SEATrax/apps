import { Ship, TrendingUp, Users, Clock, DollarSign, FileText, ArrowRight, CheckCircle, Shield, Globe, Eye, Lock, Wallet, Copy, ChevronDown, LogOut, User, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LoginButton, useActiveAccount, liskSepolia } from 'panna-sdk';
import { appConfig } from '@/config';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

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
      <header className="bg-[#0f172a] border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 hover-scale cursor-pointer">
              <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center hover-glow">
                <Ship className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xl text-white font-bold tracking-tight">SeaTrax</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Platform</a>
              <a href="#solutions" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Solutions</a>
              <a href="#developers" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Developers</a>
              <a href="#about" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">About Us</a>
            </nav>
            
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
                  <div className="flex items-center gap-2">
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
              <div className="w-24 h-24 bg-cyan-400 rounded-2xl flex items-center justify-center transform rotate-12 shadow-2xl shadow-cyan-500/50 hover-glow transition-all duration-300 hover:rotate-6">
                <Ship className="w-14 h-14 text-slate-900 -rotate-12" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-300 rounded-lg transition-all duration-300 hover:scale-110"></div>
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-5xl md:text-7xl text-white mb-4 tracking-tight">
            SeaTrax
          </h1>
          <p className="text-2xl md:text-3xl text-cyan-400 mb-12">
            On-Chain Financing for Exporters
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 hover-scale hover-shine transition-all text-lg shadow-lg shadow-cyan-500/30 border-2 border-cyan-400"
            >
              Explore Platform
            </button>
            <button 
              className="px-8 py-4 bg-transparent text-white rounded-lg hover:bg-white/10 hover-scale hover-border-glow transition-all text-lg border-2 border-white/30"
            >
              Request Demo
            </button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">$24.5M</div>
              <div className="text-gray-300">Total Funded</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">342</div>
              <div className="text-gray-300">Active Exporters</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20 hover-lift hover-border-glow cursor-pointer">
              <div className="text-3xl text-cyan-400 mb-2">8 hours</div>
              <div className="text-gray-300">Avg. Funding Time</div>
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
            {/* Feature Cards - White with subtle shadow */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">Secure Blockchain</h3>
              <p className="text-gray-600 text-sm">
                Faster via upah teknowledgi blockchain trusted
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">Global Trade</h3>
              <p className="text-gray-600 text-sm">
                Flourise finance-regulate local interest
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">Real-time Tracking</h3>
              <p className="text-gray-600 text-sm">
                Di asset intants tersediafund secured via key efficient
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-lg hover-lift-lg border border-gray-100 cursor-pointer group">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl text-slate-900 mb-3">Seamless Integration</h3>
              <p className="text-gray-600 text-sm">
                Fostering enterprise cloud Sea discreet
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
              <h3 className="text-lg text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">4-8% Returns</h3>
              <p className="text-sm text-gray-600">Earn predictable yields for investors</p>
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
              Trusted by Exporters Across ASEAN
            </h2>
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
                "SEATrax helped us secure funding for 5 shipments last month. The process is incredibly fast and transparent."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift-lg cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-slate-900">Maria Santos</div>
                  <div className="text-sm text-gray-600">Manila Commodities</div>
                </div>
              </div>
              <p className="text-gray-600">
                "No more waiting 60-90 days for payment. SEATrax gave us the cash flow we needed to grow."
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover-lift-lg cursor-pointer group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-slate-900">Nguyen Van Hai</div>
                  <div className="text-sm text-gray-600">Vietnam Agri Export</div>
                </div>
              </div>
              <p className="text-gray-600">
                "As a small business, traditional banks wouldn't help us. SEATrax made financing accessible and affordable."
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
            onClick={onGetStarted}
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
              <h3 className="text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">For Exporters</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">For Investors</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white mb-4">Connect</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-cyan-400/10 rounded-lg flex items-center justify-center hover:bg-cyan-400/20 hover-scale transition-all">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-cyan-400/10 rounded-lg flex items-center justify-center hover:bg-cyan-400/20 hover-scale transition-all">
                  <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                  <Ship className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <div className="text-white">SeaTrax</div>
                  <div className="text-xs text-gray-500">© 2025 SeaTrax. All rights reserved.</div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Developed by: Hadyan, Valerie, Agung, Humam
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
