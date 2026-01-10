import { Ship, TrendingUp, ArrowRight, Wallet } from 'lucide-react';
import { LoginButton, liskSepolia, useActiveAccount } from 'panna-sdk';
import { formatAddress } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';

interface RoleSelectionProps {
  onRoleSelect: (role: 'exporter' | 'investor') => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const activeAccount = useActiveAccount();
  const router = useRouter();
  
  const handleDisconnect = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex flex-col">
      {/* Header with wallet info */}
      <header className="w-full p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-20">
        <div className="flex items-center justify-center sm:justify-start">
          <Logo variant="navbar" size="sm" />
        </div>
        
        <div className="flex items-center justify-center sm:justify-end gap-4">
          {/* Wallet Info */}
          {activeAccount && (
            <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-xs sm:text-sm text-gray-300">{formatAddress(activeAccount.address)}</span>
              </div>
            </div>
          )}
          
          {/* Disconnect Button */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
            <LoginButton chain={liskSepolia} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Ocean Wave Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' stroke='%2322d3ee' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' stroke='%2322d3ee' fill='none' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}></div>
        </div>

        <div className="max-w-5xl w-full relative z-10 animate-fade-in">
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo variant="full" size="lg" className="hover-bounce cursor-pointer animate-float" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-white mb-4 tracking-tight animate-slide-up">
              Welcome to SEATrax
            </h1>
            <p className="text-lg md:text-xl text-gray-300 animate-slide-up animation-delay-200">
              Choose your role to get started
            </p>
            
            {/* Connected wallet indicator */}
            {activeAccount && (
              <div className="mt-6 inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm border border-green-500/30 animate-slide-up animation-delay-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Wallet Connected
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Exporter Card */}
            <button
              onClick={() => onRoleSelect('exporter')}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-slate-800/70 hover-lift-lg hover-shine transition-all text-left group shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 animate-slide-up animation-delay-400"
              aria-label="Select exporter role to get funding for your export invoices"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                <Ship className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-xl md:text-2xl text-white mb-4">
                I'm an Exporter
              </h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">
                Get instant working capital against your export invoices. Upload your documents and receive funding within hours.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Receive up to 80% of invoice value</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Fast approval in 8 hours average</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Simple documentation process</span>
                </li>
              </ul>
              
              <div className="flex items-center gap-2 text-cyan-400 group-hover:gap-4 transition-all">
                <span className="font-medium">Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            {/* Investor Card */}
            <button
              onClick={() => onRoleSelect('investor')}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-slate-800/70 hover-lift-lg hover-shine transition-all text-left group shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 animate-slide-up animation-delay-600"
              aria-label="Select investor role to earn returns by funding export invoices"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-xl md:text-2xl text-white mb-4">
                I'm an Investor
              </h2>
              
              <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">
                Earn predictable returns by funding export invoices. Access transparent data and diversify your portfolio with real trade assets.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Earn 4-8% annual returns</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Short-term investments (30-90 days)</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Full transparency on every deal</span>
                </li>
              </ul>
              
              <div className="flex items-center gap-2 text-cyan-400 group-hover:gap-4 transition-all">
                <span className="font-medium">Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Help text */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              Choose your role to continue with SeaTrax
            </p>
            
            {/* Testing Shortcut for Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">Development Only:</p>
                <a 
                  href="/testing" 
                  className="inline-block bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-600 hover:border-cyan-400/50"
                >
                  🧪 Testing Environment
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
