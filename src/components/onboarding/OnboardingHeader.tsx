import { ArrowLeft, Ship, Wallet, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActiveAccount, LoginButton, liskSepolia } from 'panna-sdk';
import { formatAddress } from '@/lib/utils';

interface OnboardingHeaderProps {
  role: 'exporter' | 'investor';
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  showProgress?: boolean;
}

export default function OnboardingHeader({ 
  role, 
  step, 
  totalSteps, 
  onBack, 
  showProgress = true 
}: OnboardingHeaderProps) {
  const router = useRouter();
  const activeAccount = useActiveAccount();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/select-role');
    }
  };

  const handleDisconnect = () => {
    router.push('/');
  };

  const progressPercentage = step && totalSteps ? (step / totalSteps) * 100 : 0;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and Logo */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors hover-scale-sm"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                  <Ship className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-lg text-white font-bold tracking-tight hidden sm:inline">
                  SeaTrax
                </span>
              </div>
            </div>

            {/* Center - Progress info */}
            {showProgress && step && totalSteps && (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400">
                    {role === 'exporter' ? 'Exporter' : 'Investor'} Registration
                  </div>
                  <div className="text-xs text-slate-500">
                    Step {step} of {totalSteps}
                  </div>
                </div>
              </div>
            )}

            {/* Right side - Wallet info */}
            <div className="flex items-center gap-3">
              {activeAccount && (
                <div className="hidden sm:flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-500/20">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">
                    {formatAddress(activeAccount.address)}
                  </span>
                </div>
              )}
              
              {/* Disconnect Button */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-cyan-500/20">
                <LoginButton chain={liskSepolia} onDisconnect={handleDisconnect} />
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {showProgress && step && totalSteps && (
            <div className="pb-2">
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-1.5 rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/30"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile progress info */}
      {showProgress && step && totalSteps && (
        <div className="md:hidden bg-slate-900/50 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {role === 'exporter' ? 'Exporter' : 'Investor'} Registration
            </span>
            <span className="text-cyan-400">
              Step {step} of {totalSteps} • {Math.round(progressPercentage)}% Complete
            </span>
          </div>
        </div>
      )}
    </>
  );
}