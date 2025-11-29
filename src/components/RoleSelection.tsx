import { Ship, TrendingUp, ArrowRight } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'exporter' | 'investor') => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      {/* Ocean Wave Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 30, 50 50 T 100 50' stroke='%2322d3ee' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 60 Q 25 40, 50 60 T 100 60' stroke='%2322d3ee' fill='none' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}></div>
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50 hover-glow hover-bounce cursor-pointer">
              <Ship className="w-10 h-10 text-slate-900" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl text-white mb-4 tracking-tight">
            Welcome to SeaTrax
          </h1>
          <p className="text-xl text-gray-300">
            Choose your role to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Exporter Card */}
          <button
            onClick={() => onRoleSelect('exporter')}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-slate-800/70 hover-lift-lg hover-shine transition-all text-left group shadow-xl"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
              <Ship className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl text-white mb-4">
              I'm an Exporter
            </h2>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
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
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-slate-800/70 hover-lift-lg hover-shine transition-all text-left group shadow-xl"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl text-white mb-4">
              I'm an Investor
            </h2>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
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

        <div className="text-center mt-8 space-y-4">
          <p className="text-gray-400">
            Already have an account?{' '}
            <a href="#" className="text-cyan-400 hover:text-cyan-300 hover-color hover-scale-sm inline-block">
              Sign in
            </a>
          </p>
          
          {/* Testing Shortcut */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-gray-500 mb-2">For Testing & Development:</p>
            <a 
              href="/testing" 
              className="inline-block bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-600 hover:border-cyan-400/50"
            >
              🧪 Access Testing Environment
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
