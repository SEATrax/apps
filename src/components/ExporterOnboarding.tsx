import { useState } from 'react';
import { ArrowLeft, ArrowRight, Upload, Check, HelpCircle, Sparkles } from 'lucide-react';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useActiveAccount } from 'panna-sdk';
import { toast } from 'sonner';
import { generateExporterOnboardingData } from '@/lib/auto-fill-data';

interface ExporterOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function ExporterOnboarding({ onComplete, onBack }: ExporterOnboardingProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const activeAccount = useActiveAccount();
  const { createProfile } = useExporterProfile();
  const { registerExporter } = useSEATrax();
  
  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    taxId: '',
    businessType: '',
    email: '',
    phone: '',
    picName: '',
    address: '',
    exportLicense: '',
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    license: false,
    registration: false,
    bankVerification: false,
    idCard: false,
    selfie: false,
  });

  const countries = ['Indonesia', 'Thailand', 'Vietnam', 'Malaysia', 'Philippines', 'Singapore'];
  const businessTypes = ['Manufacturing', 'Agriculture', 'Commodities', 'Textiles', 'Electronics', 'Others'];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final submission
      await handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    if (!activeAccount?.address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 1. Self-register as exporter on-chain
      const result = await registerExporter();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to register on-chain');
      }
      
      // 2. Create exporter profile in Supabase
      await createProfile({
        company_name: formData.companyName,
        tax_id: formData.taxId,
        country: formData.country,
        export_license: formData.exportLicense,
        phone: formData.phone,
        address: formData.address,
      });
      
      toast.success('✅ Registration successful! You can now create invoices. Admin will verify your account.');
      onComplete();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
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
      return formData.companyName && formData.country && formData.taxId && formData.email && formData.phone;
    }
    if (step === 2) {
      return uploadedDocs.license && uploadedDocs.registration;
    }
    if (step === 3) {
      return formData.picName && uploadedDocs.idCard;
    }
    return false;
  };

  const handleAutoFill = () => {
    const randomData = generateExporterOnboardingData();
    setFormData({
      ...formData,
      companyName: randomData.companyName,
      country: randomData.country,
      taxId: randomData.taxId,
      businessType: randomData.businessType,
      email: randomData.email,
      phone: randomData.phone,
      picName: randomData.picName,
      address: randomData.address,
      exportLicense: randomData.exportLicense,
    });
    
    // Auto-check required documents to bypass validation
    setUploadedDocs({
      license: true,
      registration: true,
      bankVerification: true,
      idCard: true,
      selfie: true,
    });
    
    toast.success('🎲 Form auto-filled with test data. Review and submit!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 hover-color hover-scale-sm"
            >
              <ArrowLeft className="w-5 h-5 hover-bounce" />
              Back
            </button>
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 rounded-lg hover-lift transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Auto-fill Test Data
            </button>
          </div>
          <h1 className="text-3xl text-white mb-2">Exporter Registration</h1>
          <p className="text-slate-400">Complete your profile to start receiving funding</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Step {step} of 3</span>
            <span className="text-sm text-cyan-400">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500 shadow-lg shadow-cyan-500/50"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl shadow-xl border border-slate-800 p-6 md:p-8 hover-lift">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl text-white mb-4">Basic Information</h2>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="Enter your company name"
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
                <label className="block text-slate-300 mb-2 flex items-center gap-2">
                  Tax ID / NPWP <span className="text-red-400">*</span>
                  <button className="text-slate-500 hover:text-cyan-400 hover-bounce transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="Enter your tax identification number"
                />
                <p className="text-sm text-slate-500 mt-1">Your company's tax registration number</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all"
                >
                  <option value="" className="bg-slate-800">Select business type</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type} className="bg-slate-800">{type}</option>
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
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl text-white mb-2">Business Verification</h2>
                <p className="text-slate-400">Upload your business documents for verification</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Import/Export License <span className="text-red-400">*</span>
                </label>
                <div 
                  onClick={() => setUploadedDocs({ ...uploadedDocs, license: true })}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover-lift ${
                    uploadedDocs.license ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {uploadedDocs.license ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span>License document uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 hover-bounce" />
                      <p className="text-slate-300">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Business Registration Certificate <span className="text-red-400">*</span>
                </label>
                <div 
                  onClick={() => setUploadedDocs({ ...uploadedDocs, registration: true })}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover-lift ${
                    uploadedDocs.registration ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {uploadedDocs.registration ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span>Registration document uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 hover-bounce" />
                      <p className="text-slate-300">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Bank Account Verification Letter
                </label>
                <div 
                  onClick={() => setUploadedDocs({ ...uploadedDocs, bankVerification: true })}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover-lift ${
                    uploadedDocs.bankVerification ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {uploadedDocs.bankVerification ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span>Bank verification uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 hover-bounce" />
                      <p className="text-slate-300">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-1">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: KYC Verification */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl text-white mb-2">KYC Verification</h2>
                <p className="text-slate-400">Verify your identity to complete registration</p>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Full Name (Person in Charge) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.picName}
                  onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover-border-glow transition-all placeholder:text-slate-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  ID Card Upload <span className="text-red-400">*</span>
                </label>
                <div 
                  onClick={() => setUploadedDocs({ ...uploadedDocs, idCard: true })}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover-lift ${
                    uploadedDocs.idCard ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {uploadedDocs.idCard ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span>ID card uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 hover-bounce" />
                      <p className="text-slate-300">Upload KTP / SIM / Passport</p>
                      <p className="text-sm text-slate-500 mt-1">JPG, PNG (max 3MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">
                  Selfie Verification
                </label>
                <div 
                  onClick={() => setUploadedDocs({ ...uploadedDocs, selfie: true })}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover-lift ${
                    uploadedDocs.selfie ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-cyan-500'
                  }`}
                >
                  {uploadedDocs.selfie ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <Check className="w-5 h-5" />
                      <span>Selfie uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 hover-bounce" />
                      <p className="text-slate-300">Upload a selfie holding your ID card</p>
                      <p className="text-sm text-slate-500 mt-1">JPG, PNG (max 3MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-sm text-cyan-300">
                  📸 <strong>Selfie Instructions:</strong> Hold your ID card next to your face, ensure both are clearly visible and well-lit.
                </p>
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
              disabled={!isStepValid() || submitting}
              className={`flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                isStepValid() && !submitting
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover-scale'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registering...
                </>
              ) : (
                <>
                  {step === 3 ? 'Complete Registration' : 'Continue'}
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
