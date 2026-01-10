import { useState } from 'react';
import { ArrowLeft, Wallet, Building2, Smartphone, Check, AlertCircle, Clock } from 'lucide-react';

interface ExporterWithdrawalProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function ExporterWithdrawal({ onComplete, onBack }: ExporterWithdrawalProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bank' | 'crypto' | 'ewallet'>('bank');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const availableBalance = 85500;
  const pendingWithdrawals = [
    { id: 'WD-001', amount: 50000, method: 'Bank Transfer', status: 'Processing', date: '2025-02-25', estimatedCompletion: '2025-02-27' },
    { id: 'WD-002', amount: 30000, method: 'Bank Transfer', status: 'Completed', date: '2025-02-20', estimatedCompletion: '2025-02-22' },
  ];

  const withdrawalMethods = [
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Direct to your registered bank account',
      fee: 0,
      processingTime: '1-3 business days',
      icon: Building2,
      color: 'blue',
    },
    {
      id: 'crypto',
      name: 'Crypto Wallet',
      description: 'USDC, USDT (Instant)',
      fee: 0.5,
      processingTime: 'Instant',
      icon: Wallet,
      color: 'purple',
    },
    {
      id: 'ewallet',
      name: 'E-Wallet',
      description: 'GoPay, OVO, Dana',
      fee: 1,
      processingTime: '15-30 minutes',
      icon: Smartphone,
      color: 'green',
    },
  ];

  const calculateFee = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    const method = withdrawalMethods.find(m => m.id === withdrawalMethod);
    const fee = (amount * (method?.fee || 0)) / 100;
    return {
      amount,
      fee,
      netAmount: amount - fee,
    };
  };

  const calculation = calculateFee();

  const isAmountValid = () => {
    const amount = parseFloat(withdrawalAmount) || 0;
    return amount > 0 && amount <= availableBalance;
  };

  const handleSendOTP = () => {
    setOtpSent(true);
  };

  const handleSubmit = () => {
    // Simulate submission
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl text-gray-900 mb-2">Withdraw Funds</h1>
          <p className="text-gray-600">Transfer your available balance to your account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              {/* Available Balance */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="text-sm text-blue-700 mb-1">Available Balance</div>
                <div className="text-3xl text-blue-900">${availableBalance.toLocaleString()}</div>
              </div>

              {/* Withdrawal Amount */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Withdrawal Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-600 text-xl">$</span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="w-full px-12 py-4 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    max={availableBalance}
                  />
                </div>
                
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setWithdrawalAmount((availableBalance * 0.25).toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setWithdrawalAmount((availableBalance * 0.5).toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setWithdrawalAmount((availableBalance * 0.75).toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setWithdrawalAmount(availableBalance.toString())}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Max
                  </button>
                </div>

                {!isAmountValid() && withdrawalAmount && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      Amount cannot exceed available balance
                    </div>
                  </div>
                )}
              </div>

              {/* Withdrawal Method */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-3">
                  Withdrawal Method <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-3">
                  {withdrawalMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setWithdrawalMethod(method.id as any)}
                        className={`w-full p-4 border-2 rounded-lg text-left hover:border-blue-500 transition-colors ${
                          withdrawalMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${method.color}-100 rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 text-${method.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-900 mb-1">{method.name}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-900">{method.fee}% fee</div>
                            <div className="text-xs text-gray-600">{method.processingTime}</div>
                          </div>
                          {withdrawalMethod === method.id && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fee Calculation */}
              {withdrawalAmount && isAmountValid() && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-gray-900 mb-4">Withdrawal Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Withdrawal Amount:</span>
                      <span className="text-gray-900">${calculation.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee ({withdrawalMethods.find(m => m.id === withdrawalMethod)?.fee}%):</span>
                      <span className="text-gray-900">-${calculation.fee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="text-gray-900">You will receive:</span>
                      <span className="text-xl text-green-600">${calculation.netAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OTP Verification */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  OTP Verification
                </label>
                {!otpSent ? (
                  <button
                    onClick={handleSendOTP}
                    disabled={!isAmountValid()}
                    className={`w-full px-6 py-3 rounded-lg ${
                      isAmountValid()
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Send OTP to registered phone
                  </button>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                    />
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      <span>OTP sent to +62 812-3456-7890</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isAmountValid() || !otpSent || otp.length !== 6}
                className={`w-full px-6 py-4 rounded-lg ${
                  isAmountValid() && otpSent && otp.length === 6
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Submit Withdrawal Request
              </button>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-900 mb-1 text-sm">Processing Time</h4>
                    <p className="text-xs text-yellow-800">
                      {withdrawalMethods.find(m => m.id === withdrawalMethod)?.processingTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg text-gray-900 mb-4">Recent Withdrawals</h2>
              
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{withdrawal.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                    <div className="text-lg text-gray-900 mb-2">
                      ${withdrawal.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{withdrawal.method}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Requested: {withdrawal.date}</span>
                      </div>
                      {withdrawal.status === 'Processing' && (
                        <div className="text-yellow-600">
                          Est. completion: {withdrawal.estimatedCompletion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm text-gray-700 mb-2">Need Help?</h3>
                <p className="text-xs text-gray-600 mb-3">
                  If you have any questions about your withdrawal, contact our support team.
                </p>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
