import { useState } from 'react';
import { ArrowLeft, ArrowRight, Wallet, CreditCard, Building2, Check, AlertCircle } from 'lucide-react';

interface InvestmentFlowProps {
  onPoolSelect: (poolId: string) => void;
  onViewPayments: () => void;
}

export default function InvestmentFlow({ onPoolSelect, onViewPayments }: InvestmentFlowProps) {
  const [step, setStep] = useState(1);
  const [investmentAmount, setInvestmentAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'bank' | 'card'>('crypto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const minInvestment = 5000;
  const maxInvestment = 50000;
  const availableBalance = 25000;
  const yieldRate = 4.0;
  const duration = 30; // days

  // Mock active investments data
  const activeInvestments = [
    { poolId: 'POOL-A-2025', funded: 50000, currentValue: 50833, yieldRate: 4.0, maturityDate: '2025-04-15', status: 'active' },
    { poolId: 'POOL-B-2025', funded: 30000, currentValue: 30500, yieldRate: 4.0, maturityDate: '2025-04-20', status: 'active' },
    { poolId: 'POOL-C-2024', funded: 20000, currentValue: 20667, yieldRate: 4.0, maturityDate: '2025-03-10', status: 'active' },
  ];

  const calculateReturns = () => {
    const amount = parseFloat(investmentAmount) || 0;
    const interest = (amount * yieldRate * duration) / (100 * 365);
    const platformFee = interest * 0.01;
    return {
      principal: amount,
      interest: interest,
      platformFee: platformFee,
      total: amount + interest - platformFee,
    };
  };

  const returns = calculateReturns();

  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Crypto Wallet',
      description: 'USDC, USDT (Instant)',
      fee: '0%',
      processingTime: 'Instant',
      icon: Wallet,
      color: 'purple',
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank deposit',
      fee: '0%',
      processingTime: '3-5 business days',
      icon: Building2,
      color: 'blue',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard',
      fee: '2.5%',
      processingTime: 'Instant',
      icon: CreditCard,
      color: 'orange',
    },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Simulate transaction
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep(1);
      }, 3000);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isAmountValid = () => {
    const amount = parseFloat(investmentAmount) || 0;
    return amount >= minInvestment && amount <= maxInvestment && amount <= availableBalance;
  };

  const isStepValid = () => {
    if (step === 1) return isAmountValid();
    if (step === 2) return paymentMethod !== null;
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl text-white mb-2">Investment Portfolio</h1>
          <p className="text-gray-400">Manage your active investments</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all z-10 relative ${
                    s < step ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' :
                    s === step ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' :
                    'bg-gray-700 text-gray-400 border-2 border-gray-600'
                  }`}>
                    {s < step ? <Check className="w-6 h-6" /> : s}
                  </div>
                  <span className={`mt-3 text-sm ${step === s ? 'text-cyan-400 font-semibold' : 'text-gray-300'}`}>
                    {s === 1 && 'Amount'}
                    {s === 2 && 'Payment'}
                    {s === 3 && 'Confirm'}
                  </span>
                </div>
                
                {/* Connecting line between circles - positioned at circle center */}
                {index < 2 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-all ${
                    step > s ? 'bg-cyan-500' : 'bg-gray-600'
                  }`} style={{ marginTop: '-12px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 md:p-8">
          {/* Step 1: Investment Amount */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl text-white mb-6">Investment Amount</h2>

              <div>
                <label className="block text-gray-300 mb-3 text-lg">
                  How much would you like to invest?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-400 text-xl">$</span>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full px-12 py-4 text-xl bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                    placeholder="10000"
                    min={minInvestment}
                    max={maxInvestment}
                  />
                </div>
                
                <div className="mt-6">
                  <input
                    type="range"
                    min={minInvestment}
                    max={maxInvestment}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer 
                             [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                             [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/25"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>${minInvestment.toLocaleString()}</span>
                    <span>${maxInvestment.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Investment:</span>
                    <span className="text-white">${minInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Investment:</span>
                    <span className="text-white">${maxInvestment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Balance:</span>
                    <span className="text-white">${availableBalance.toLocaleString()}</span>
                  </div>
                </div>

                {!isAmountValid() && (
                  <div className="mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-300">
                      {parseFloat(investmentAmount) < minInvestment && `Minimum investment is $${minInvestment.toLocaleString()}`}
                      {parseFloat(investmentAmount) > maxInvestment && `Maximum investment is $${maxInvestment.toLocaleString()}`}
                      {parseFloat(investmentAmount) > availableBalance && 'Amount exceeds available balance'}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-white mb-4 text-lg font-semibold">Estimated Returns</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Investment Amount:</span>
                    <span className="text-white font-semibold">${returns.principal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Interest ({yieldRate}% APR, {duration} days):</span>
                    <span className="text-cyan-400 font-semibold">+${returns.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-3 flex justify-between">
                    <span className="text-white font-semibold">Estimated Total Return:</span>
                    <span className="text-xl text-cyan-400 font-bold">${returns.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl text-white mb-6">Select Payment Method</h2>

              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`w-full p-6 border-2 rounded-xl text-left hover:border-cyan-500 transition-all duration-200 ${
                        paymentMethod === method.id ? 'border-cyan-500 bg-gray-700/50' : 'border-gray-600 bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gray-600 rounded-xl flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 text-cyan-400`} />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold mb-1">{method.name}</div>
                          <div className="text-sm text-gray-300">{method.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-200 font-medium">{method.fee} fee</div>
                          <div className="text-xs text-gray-400">{method.processingTime}</div>
                        </div>
                        {paymentMethod === method.id && (
                          <Check className="w-6 h-6 text-cyan-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'crypto' && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5">
                  <h4 className="text-blue-300 mb-2 font-semibold">Crypto Payment Details</h4>
                  <p className="text-sm text-blue-200">
                    You'll be prompted to connect your wallet and approve the transaction in the next step.
                  </p>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-5">
                  <h4 className="text-blue-300 mb-2 font-semibold">Bank Transfer Instructions</h4>
                  <p className="text-sm text-blue-200 mb-3">
                    You'll receive virtual account details after confirmation. Transfer will be verified within 3-5 business days.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-5">
                  <h4 className="text-orange-300 mb-2 font-semibold">Card Payment</h4>
                  <p className="text-sm text-orange-200">
                    A 2.5% processing fee will be added to your investment amount.
                    Total: ${((parseFloat(investmentAmount) || 0) * 1.025).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-5">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-300 mb-1 font-semibold">Fee Comparison</h4>
                    <p className="text-sm text-yellow-200">
                      Crypto wallet and bank transfer have no additional fees. Credit card payments include a 2.5% processing fee.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl text-white mb-6">Confirm Investment</h2>

              <div className="border border-gray-600 bg-gray-700/50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-gray-200 mb-3 text-lg font-semibold">Investment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool ID:</span>
                      <span className="text-white font-medium">POOL-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment Amount:</span>
                      <span className="text-white font-medium">${parseFloat(investmentAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Return:</span>
                      <span className="text-cyan-400 font-semibold">${returns.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Maturity Date:</span>
                      <span className="text-white font-medium">{new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <h3 className="text-gray-200 mb-3 font-semibold">Payment Method</h3>
                  <div className="flex items-center gap-3">
                    {paymentMethod === 'crypto' && <Wallet className="w-5 h-5 text-cyan-400" />}
                    {paymentMethod === 'bank' && <Building2 className="w-5 h-5 text-cyan-400" />}
                    {paymentMethod === 'card' && <CreditCard className="w-5 h-5 text-cyan-400" />}
                    <span className="text-white font-medium">
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4">
                  <div className="bg-cyan-900/30 border border-cyan-700 p-5 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-200">Total Investment:</span>
                      <span className="text-2xl text-cyan-400 font-bold">
                        ${(paymentMethod === 'card' 
                          ? (parseFloat(investmentAmount) * 1.025) 
                          : parseFloat(investmentAmount)
                        ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {paymentMethod === 'card' && (
                      <div className="text-xs text-gray-400">Includes 2.5% processing fee</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-cyan-500 border-gray-600 bg-gray-700 rounded focus:ring-cyan-500" 
                    required 
                  />
                  <span className="text-sm text-gray-300">
                    I understand that investments carry risk and I may lose some or all of my investment
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 text-cyan-500 border-gray-600 bg-gray-700 rounded focus:ring-cyan-500" 
                    required 
                  />
                  <span className="text-sm text-gray-300">
                    I have read and agree to the pool terms and conditions
                  </span>
                </label>
              </div>

              {isProcessing && (
                <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-5">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                    <div>
                      <div className="text-cyan-300 font-semibold">Processing your investment...</div>
                      <div className="text-sm text-cyan-200">This may take a few moments. Please don't close this window.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-600">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!isStepValid() || isProcessing}
              className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                isStepValid() && !isProcessing
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/25'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  {step === 3 ? 'Confirm Investment' : 'Continue'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
