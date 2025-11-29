import { useState } from 'react';
import { ArrowLeft, ArrowRight, Wallet, CreditCard, Building2 } from 'lucide-react';

interface InvestorOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function InvestorOnboarding({ onComplete, onBack }: InvestorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    country: '',
    email: '',
    phone: '',
    investmentProfile: '',
    riskTolerance: '',
    investmentExperience: '',
    expectedAmount: '',
  });

  const [walletConnected, setWalletConnected] = useState(false);

  const countries = ['Indonesia', 'Thailand', 'Vietnam', 'Malaysia', 'Philippines', 'Singapore', 'United States', 'United Kingdom'];
  const investmentProfiles = ['Individual', 'Family Office', 'Venture Capital', 'Corporate Treasury', 'Asset Manager'];

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.name && formData.country && formData.email && formData.phone;
    }
    if (step === 2) {
      return walletConnected && formData.riskTolerance;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 mb-4 hover-color hover-scale-sm"
          >
            <ArrowLeft className="w-5 h-5 hover-bounce" />
            Back
          </button>
          <h1 className="text-3xl text-white mb-2">Investor Registration</h1>
          <p className="text-slate-400">Set up your account to start investing</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Step {step} of 2</span>
            <span className="text-sm text-cyan-400">{Math.round((step / 2) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500 shadow-lg shadow-cyan-500/50"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl shadow-xl border border-slate-800 p-6 md:p-8 hover-lift">
          {/* Step 1: Personal/Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl text-white mb-4">Personal / Business Information</h2>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Full Name / Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="Enter your full name or company name"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Full Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  rows={3}
                  placeholder="Enter your complete address"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Country <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                >
                  <option value="" className="bg-slate-800">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country} className="bg-slate-800">{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Investment Profile
                </label>
                <select
                  value={formData.investmentProfile}
                  onChange={(e) => setFormData({ ...formData, investmentProfile: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                >
                  <option value="" className="bg-slate-800">Select investment profile</option>
                  {investmentProfiles.map(profile => (
                    <option key={profile} value={profile} className="bg-slate-800">{profile}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Expected Investment Amount
                </label>
                <select
                  value={formData.expectedAmount}
                  onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                >
                  <option value="" className="bg-slate-800">Select range</option>
                  <option value="5k-25k" className="bg-slate-800">$5,000 - $25,000</option>
                  <option value="25k-100k" className="bg-slate-800">$25,000 - $100,000</option>
                  <option value="100k-500k" className="bg-slate-800">$100,000 - $500,000</option>
                  <option value="500k+" className="bg-slate-800">$500,000+</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Wallet & Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl text-white mb-2">Wallet & Verification</h2>
                <p className="text-slate-400">Connect your wallet and complete risk assessment</p>
              </div>

              {/* Wallet Connection */}
              <div>
                <label className="block text-slate-300 mb-3">
                  Payment Method <span className="text-red-400">*</span>
                </label>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setWalletConnected(true)}
                    className={`w-full p-4 border-2 rounded-lg text-left hover-lift transition-all ${
                      walletConnected ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-700 hover:border-cyan-500'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white mb-1">Connect Crypto Wallet</div>
                        <div className="text-sm text-slate-400">MetaMask, Trust Wallet, etc.</div>
                      </div>
                      {walletConnected && (
                        <div className="text-cyan-400 text-sm">Connected</div>
                      )}
                    </div>
                  </button>

                  <button
                    className="w-full p-4 border-2 border-slate-700 rounded-lg text-left hover:border-cyan-500 hover-lift transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white mb-1">Bank Transfer</div>
                        <div className="text-sm text-slate-400">Direct bank deposit (3-5 days)</div>
                      </div>
                    </div>
                  </button>

                  <button
                    className="w-full p-4 border-2 border-slate-700 rounded-lg text-left hover:border-cyan-500 hover-lift transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white mb-1">Credit / Debit Card</div>
                        <div className="text-sm text-slate-400">Instant (2.5% fee)</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <label className="block text-slate-300 mb-3">
                  Risk Profile Assessment <span className="text-red-400">*</span>
                </label>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-300 mb-2">1. What is your risk tolerance?</p>
                    <select
                      value={formData.riskTolerance}
                      onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                    >
                      <option value="" className="bg-slate-800">Select risk tolerance</option>
                      <option value="conservative" className="bg-slate-800">Conservative - Preserve capital</option>
                      <option value="moderate" className="bg-slate-800">Moderate - Balance growth and safety</option>
                      <option value="aggressive" className="bg-slate-800">Aggressive - Maximize returns</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-slate-300 mb-2">2. Investment experience level?</p>
                    <select
                      value={formData.investmentExperience}
                      onChange={(e) => setFormData({ ...formData, investmentExperience: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                    >
                      <option value="" className="bg-slate-800">Select experience level</option>
                      <option value="beginner" className="bg-slate-800">Beginner - Less than 1 year</option>
                      <option value="intermediate" className="bg-slate-800">Intermediate - 1-5 years</option>
                      <option value="advanced" className="bg-slate-800">Advanced - 5+ years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* KYC Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover-lift">
                <h3 className="text-yellow-400 mb-2">⚠️ KYC Verification Required</h3>
                <p className="text-sm text-yellow-300/80">
                  After registration, you'll need to complete identity verification (KYC) before you can invest. This typically takes 24-48 hours.
                </p>
              </div>

              {/* Terms */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 hover-scale-sm transition-transform cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-cyan-500" />
                  <span className="text-sm text-slate-400">
                    I understand that investments carry risk and I may lose some or all of my investment
                  </span>
                </label>
                <label className="flex items-start gap-3 hover-scale-sm transition-transform cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-cyan-500" />
                  <span className="text-sm text-slate-400">
                    I agree to the <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a> and <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover-scale-sm transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                isStepValid()
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover-scale'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {step === 2 ? 'Complete Registration' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
