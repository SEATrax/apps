import { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Check, HelpCircle, DollarSign, Calendar } from 'lucide-react';

interface InvoiceTokenizationProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function InvoiceTokenization({ onComplete, onBack }: InvoiceTokenizationProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    amount: '',
    currency: 'USD',
    goodsDescription: '',
    importerName: '',
    importerCountry: '',
    fundingAmount: '',
    fundingPercentage: 80,
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    commercialInvoice: false,
    purchaseOrder: false,
    billOfLading: false,
    certificate: false,
  });

  const [poolAssignment, setPoolAssignment] = useState('auto');

  const currencies = ['USD', 'EUR', 'SGD', 'IDR', 'THB', 'VND'];
  const countries = ['United States', 'Germany', 'Singapore', 'Japan', 'China', 'United Kingdom'];

  const calculateFunding = () => {
    const amount = parseFloat(formData.amount) || 0;
    const percentage = formData.fundingPercentage;
    const fundingAmount = (amount * percentage) / 100;
    const platformFee = fundingAmount * 0.01;
    const interest = fundingAmount * 0.04;
    const repayAmount = fundingAmount + platformFee + interest;
    
    return {
      receiveNow: fundingAmount - platformFee,
      platformFee,
      interest,
      repayLater: repayAmount,
    };
  };

  const funding = calculateFunding();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Simulate submission
      setTimeout(() => {
        onComplete();
      }, 2000);
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
      return formData.invoiceNumber && formData.amount && formData.importerName;
    }
    if (step === 2) {
      return uploadedDocs.commercialInvoice && uploadedDocs.purchaseOrder && uploadedDocs.billOfLading;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl text-gray-900 mb-2">Create New Invoice</h1>
          <p className="text-gray-600">Submit your export invoice for funding</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s < step ? 'bg-blue-600 text-white' :
                  s === step ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Invoice Details</span>
            <span>Documents</span>
            <span>Funding</span>
            <span>Review</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Step 1: Invoice Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900 mb-4">Invoice Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INV-2025-001"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Minimum 30 days from today</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Total Invoice Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="125000"
                  />
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Goods Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.goodsDescription}
                  onChange={(e) => setFormData({ ...formData, goodsDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="E.g., 1000 units of organic coffee beans, Grade A"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Importer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.importerName}
                    onChange={(e) => setFormData({ ...formData, importerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABC Trading LLC"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Importer Country
                  </label>
                  <select
                    value={formData.importerCountry}
                    onChange={(e) => setFormData({ ...formData, importerCountry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900 mb-4">Upload Documents</h2>
              <p className="text-gray-600 mb-6">Upload supporting documents for verification</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Commercial Invoice <span className="text-red-500">*</span>
                  </label>
                  <div 
                    onClick={() => setUploadedDocs({ ...uploadedDocs, commercialInvoice: true })}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadedDocs.commercialInvoice ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {uploadedDocs.commercialInvoice ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span>commercial_invoice.pdf uploaded</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Purchase Order <span className="text-red-500">*</span>
                  </label>
                  <div 
                    onClick={() => setUploadedDocs({ ...uploadedDocs, purchaseOrder: true })}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadedDocs.purchaseOrder ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {uploadedDocs.purchaseOrder ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span>purchase_order.pdf uploaded</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Bill of Lading / Packing List <span className="text-red-500">*</span>
                  </label>
                  <div 
                    onClick={() => setUploadedDocs({ ...uploadedDocs, billOfLading: true })}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadedDocs.billOfLading ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {uploadedDocs.billOfLading ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span>bill_of_lading.pdf uploaded</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Certificate of Origin <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div 
                    onClick={() => setUploadedDocs({ ...uploadedDocs, certificate: true })}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploadedDocs.certificate ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {uploadedDocs.certificate ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span>certificate.pdf uploaded</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Funding Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900 mb-4">Funding Preferences</h2>

              <div>
                <label className="block text-gray-700 mb-3">
                  Funding Percentage
                </label>
                <div className="px-2">
                  <input
                    type="range"
                    min="50"
                    max="80"
                    value={formData.fundingPercentage}
                    onChange={(e) => setFormData({ ...formData, fundingPercentage: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>50%</span>
                    <span className="text-blue-600">{formData.fundingPercentage}%</span>
                    <span>80%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-gray-900 mb-4">Funding Calculation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Invoice Amount:</span>
                    <span className="text-gray-900">${parseFloat(formData.amount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Funding Percentage:</span>
                    <span className="text-gray-900">{formData.fundingPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Platform Fee (1%):</span>
                    <span className="text-gray-900">-${funding.platformFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3 flex justify-between">
                    <span className="text-gray-900">You'll Receive Now:</span>
                    <span className="text-xl text-blue-600">${funding.receiveNow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">Interest (4% APR):</span>
                      <span className="text-gray-900">${funding.interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Total Repayment:</span>
                      <span className="text-gray-900">${funding.repayLater.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">
                  Pool Assignment
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="radio"
                      name="pool"
                      value="auto"
                      checked={poolAssignment === 'auto'}
                      onChange={(e) => setPoolAssignment(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">Auto-assign to matching pool (Recommended)</div>
                      <div className="text-sm text-gray-600">Our system will automatically assign your invoice to the best available pool for fastest funding</div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                    <input
                      type="radio"
                      name="pool"
                      value="wait"
                      checked={poolAssignment === 'wait'}
                      onChange={(e) => setPoolAssignment(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 mb-1">Wait for specific pool (Advanced)</div>
                      <div className="text-sm text-gray-600">Choose a specific pool criteria. May result in longer waiting time</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl text-gray-900 mb-4">Review & Submit</h2>

              <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-gray-700 mb-3">Invoice Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Invoice Number:</span>
                      <div className="text-gray-900">{formData.invoiceNumber}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <div className="text-gray-900">${parseFloat(formData.amount || '0').toLocaleString()} {formData.currency}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <div className="text-gray-900">{formData.dueDate || 'Not set'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Importer:</span>
                      <div className="text-gray-900">{formData.importerName}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-gray-700 mb-3">Uploaded Documents</h3>
                  <div className="space-y-2 text-sm">
                    {uploadedDocs.commercialInvoice && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span>Commercial Invoice</span>
                      </div>
                    )}
                    {uploadedDocs.purchaseOrder && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span>Purchase Order</span>
                      </div>
                    )}
                    {uploadedDocs.billOfLading && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        <span>Bill of Lading</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-gray-700 mb-3">Funding Summary</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700">You will receive:</span>
                      <span className="text-xl text-green-600">${funding.receiveNow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">To be repaid when importer pays:</span>
                      <span className="text-gray-900">${funding.repayLater.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-gray-700">
                  I confirm that all information provided is accurate and I have the authority to submit this invoice for funding
                </span>
              </label>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ⏱️ <strong>Next Steps:</strong> Our team will review your invoice within 4-8 hours. You'll receive a notification once approved and funds will be transferred to your account.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
                isStepValid()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === 4 ? 'Submit for Review' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
