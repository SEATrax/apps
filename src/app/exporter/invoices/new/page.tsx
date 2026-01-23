'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Upload, Calendar as CalendarIcon, AlertCircle, CheckCircle,
  Loader2, Sparkles, User, Box, DollarSign, FileText, Check, ChevronRight, ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface InvoiceFormData {
  exporterCompany: string;
  importerCompany: string;
  importerEmail: string;
  importerAddress: string;
  importerCountry: string;
  invoiceNumber: string;
  goodsDescription: string;
  shippingAmount: string;
  loanAmount: string;
  shippingDate: Date | undefined;
  documents: File[];
}

// Sample data for auto-fill
const sampleImporters = [
  { name: 'Global Trade Solutions Inc', email: 'procurement@globaltradesolutions.com', address: '789 Market St, San Francisco, CA 94103', country: 'United States' },
  { name: 'European Import Hub GmbH', email: 'orders@euimports.de', address: 'Friedrichstraße 123, 10117 Berlin', country: 'Germany' },
  { name: 'Asia Pacific Trading Pte Ltd', email: 'trading@apacific.sg', address: '45 Marina Boulevard, Singapore 018987', country: 'Singapore' },
  { name: 'Japanese Import Corporation', email: 'info@jpimportcorp.jp', address: '2-8-1 Nishi-Shinjuku, Tokyo 163-0820', country: 'Japan' },
];

const sampleProducts = [
  { desc: 'Premium Coffee Beans - Single Origin Arabica, 1200kg', basePrice: 95000 },
  { desc: 'Handcrafted Batik Textiles - Traditional Indonesian Patterns, 800 pieces', basePrice: 120000 },
  { desc: 'Electronic Components - Semiconductors, 500 units', basePrice: 280000 },
];

const generateRandomInvoiceData = (exporterCompany: string) => {
  const importer = sampleImporters[Math.floor(Math.random() * sampleImporters.length)];
  const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
  const varianceMultiplier = 0.8 + (Math.random() * 0.4);
  const shippingAmount = Math.round(product.basePrice * varianceMultiplier);
  const loanAmount = Math.floor(shippingAmount * 0.8);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5 + Math.floor(Math.random() * 25));

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  return {
    invoiceNumber,
    importerCompany: importer.name,
    importerEmail: importer.email,
    importerAddress: importer.address,
    importerCountry: importer.country,
    goodsDescription: product.desc,
    shippingAmount: shippingAmount.toString(),
    loanAmount: loanAmount.toString(),
    shippingDate: futureDate
  };
};

// Wizard Steps Configuration
const STEPS = [
  { id: 1, title: "Importer Info", description: "Who are you billing?", icon: User },
  { id: 2, title: "Shipment Details", description: "What are you sending?", icon: Box },
  { id: 3, title: "Financials", description: "Funding requirements", icon: DollarSign },
  { id: 4, title: "Documents", description: "Proof of shipment", icon: FileText },
  { id: 5, title: "Review", description: "Summary & Submit", icon: Check },
];

export default function CreateInvoice() {
  const activeAccount = useActiveAccount();
  const { createInvoice, isLoading: isContractLoading } = useSEATrax();
  const { profile } = useExporterProfile();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InvoiceFormData>({
    exporterCompany: '',
    importerCompany: '',
    importerEmail: '',
    importerAddress: '',
    importerCountry: '',
    invoiceNumber: '',
    goodsDescription: '',
    shippingAmount: '',
    loanAmount: '',
    shippingDate: undefined,
    documents: [],
  });

  // Fill company name from profile
  useEffect(() => {
    if (profile?.company_name) {
      setFormData(prev => ({
        ...prev,
        exporterCompany: profile.company_name
      }));
    }
  }, [profile]);

  const isConnected = !!activeAccount;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleInputChange = (field: keyof InvoiceFormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    if (errors.documents) setErrors(prev => ({ ...prev, documents: '' }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.importerCompany.trim()) newErrors.importerCompany = 'Importer company is required';
      if (!formData.importerEmail.trim()) newErrors.importerEmail = 'Importer email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.importerEmail)) newErrors.importerEmail = 'Invalid email';
      if (!formData.importerAddress.trim()) newErrors.importerAddress = 'Address is required';
      if (!formData.importerCountry) newErrors.importerCountry = 'Country is required';
    }

    if (step === 2) {
      if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = 'Invoice number is required';
      if (!formData.goodsDescription.trim()) newErrors.goodsDescription = 'Description is required';
      if (!formData.shippingDate) newErrors.shippingDate = 'Shipping date is required';
      else if (formData.shippingDate <= new Date()) newErrors.shippingDate = 'Date must be in future';
    }

    if (step === 3) {
      if (!formData.shippingAmount || parseFloat(formData.shippingAmount) <= 0) newErrors.shippingAmount = 'Required';
      if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) newErrors.loanAmount = 'Required';
      if (parseFloat(formData.loanAmount) > parseFloat(formData.shippingAmount)) newErrors.loanAmount = 'Cannot exceed shipping amount';
    }

    if (step === 4) {
      if (formData.documents.length === 0) newErrors.documents = 'At least one document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleAutoFill = () => {
    const randomData = generateRandomInvoiceData(formData.exporterCompany);
    setFormData(prev => ({
      ...prev,
      ...randomData
    }));
    setErrors({});
  };

  const uploadDocuments = async (): Promise<string[]> => {
    // ... Copy implementation from previous file ...
    const ipfsHashes: string[] = [];

    for (let i = 0; i < formData.documents.length; i++) {
      const file = formData.documents[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('name', `invoice-${formData.invoiceNumber}-doc-${i + 1}`);
        uploadFormData.append('description', `Supporting document for invoice ${formData.invoiceNumber}`);
        uploadFormData.append('invoice_number', formData.invoiceNumber);
        uploadFormData.append('exporter_company', formData.exporterCompany);

        const attributes = [
          { trait_type: 'Document Type', value: file.type },
          { trait_type: 'Invoice Number', value: formData.invoiceNumber },
          { trait_type: 'Exporter', value: formData.exporterCompany },
          { trait_type: 'Document Index', value: (i + 1).toString() }
        ];
        uploadFormData.append('attributes', JSON.stringify(attributes));
        uploadFormData.append('created_at', new Date().toISOString());

        const uploadResponse = await fetch('/api/invoice/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}`);
        const result = await uploadResponse.json();
        if (!result.success || !result.data?.metadata_cid) throw new Error(`Upload failed for ${file.name}`);

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        ipfsHashes.push(result.data.metadata_cid);

      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    return ipfsHashes;
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return; // Final verification

    setIsSubmitting(true);
    const { compensationService, checkSystemHealth } = await import('@/lib/compensation');

    const state = {
      warnings: [] as string[],
      contractTxHash: undefined as string | undefined,
      tokenId: undefined as bigint | undefined,
      metadataId: undefined as string | undefined,
      paymentId: undefined as string | undefined,
      ipfsHashes: undefined as string[] | undefined
    };

    try {
      const health = await checkSystemHealth();
      if (health.consensusStatus === 'critical') throw new Error('System critical. Try later.');

      // Phase 1: Upload Docs
      setIsUploadingDocs(true);
      const documentHashes = await uploadDocuments();
      state.ipfsHashes = documentHashes;
      setIsUploadingDocs(false);

      // Phase 2: Create NFT
      const contractResult = await createInvoice(
        formData.exporterCompany,
        formData.importerCompany,
        formData.importerEmail,
        Math.floor(formData.shippingDate!.getTime() / 1000),
        BigInt(Math.floor(parseFloat(formData.shippingAmount) * 100)),
        BigInt(Math.floor(parseFloat(formData.loanAmount) * 100)),
        documentHashes[0] || 'QmPlaceholder'
      );

      if (!contractResult.success) throw new Error(contractResult.error || 'Transaction failed');

      const txHash = contractResult.txHash;
      const tokenId = contractResult.invoiceId;

      if (!tokenId) {
        state.contractTxHash = txHash;
        // Handle edge case where ID not returned immediately but TX valid
        // For now, let's treat as partial success or error if critical
        // But in previous code we threw error. Let's keep consistency.
        throw new Error('Invoice created but ID missing. Check dashboard.');
      }

      state.tokenId = tokenId;
      state.contractTxHash = txHash || 'completed';

      // Phase 3: DB & Pay Link
      const metadataPayload = {
        exporter_wallet: activeAccount?.address || '',
        invoice_number: formData.invoiceNumber,
        goods_description: formData.goodsDescription,
        importer_name: formData.importerCompany,
        importer_license: `${formData.importerAddress}, ${formData.importerCountry}`,
        documents: documentHashes.reduce((acc, hash, index) => {
          acc[formData.documents[index].name] = hash;
          return acc;
        }, {} as Record<string, string>)
      };

      const shippingAmountCents = Math.floor(parseFloat(formData.shippingAmount) * 100);
      const paymentPayload = {
        amount_usd: shippingAmountCents,
        interest_amount: 0,
        total_due: shippingAmountCents,
        payment_link: `/pay/${tokenId}`,
        due_date: new Date(formData.shippingDate!.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (isSupabaseConfigured && health.supabaseConnection) {
        try {
          state.metadataId = await compensationService.saveMetadataWithRetry(tokenId, metadataPayload, 2);
        } catch { state.warnings.push('Metadata sync backgrounded'); }

        try {
          state.paymentId = await compensationService.createPaymentWithRetry(tokenId, paymentPayload, 2);
        } catch { state.warnings.push('Payment link backgrounded'); }
      } else {
        await compensationService.scheduleCompensation({ task_type: 'metadata_sync', token_id: Number(tokenId), payload: metadataPayload, priority: 'high' });
        await compensationService.scheduleCompensation({ task_type: 'payment_link', token_id: Number(tokenId), payload: paymentPayload, priority: 'normal' });
        state.warnings.push('DB Sync scheduled');
      }

      router.push('/exporter/invoices?created=true');

    } catch (error: any) {
      console.error('Submission failed:', error);

      // Cleanup attempt (simplified from previous)
      if (state.ipfsHashes && !state.tokenId) {
        const { compensationService } = await import('@/lib/compensation');
        await compensationService.scheduleCompensation({
          task_type: 'ipfs_cleanup',
          token_id: 0,
          payload: { ipfsHashes: state.ipfsHashes },
          priority: 'low'
        });
      }

      setErrors({ submit: error.message || 'Failed to create invoice' });
    } finally {
      setIsSubmitting(false);
      setIsUploadingDocs(false);
    }
  };

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 animate-in fade-in zoom-in duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Access Required</CardTitle>
            <CardDescription className="text-slate-400">Connect wallet to proceed</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className="w-full"><Button className="w-full bg-cyan-600">Go to Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Render Steps ---

  const renderStep1_Importer = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Company Name *</Label>
          <Input
            value={formData.importerCompany}
            onChange={(e) => handleInputChange('importerCompany', e.target.value)}
            placeholder="e.g. Global Tech Ltd"
            className={cn("bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.importerCompany && "border-red-500")}
          />
          {errors.importerCompany && <p className="text-red-400 text-xs">{errors.importerCompany}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Email *</Label>
          <Input
            value={formData.importerEmail}
            onChange={(e) => handleInputChange('importerEmail', e.target.value)}
            placeholder="purchasing@company.com"
            className={cn("bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.importerEmail && "border-red-500")}
          />
          {errors.importerEmail && <p className="text-red-400 text-xs">{errors.importerEmail}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Country *</Label>
        <Select value={formData.importerCountry} onValueChange={(val) => handleInputChange('importerCountry', val)}>
          <SelectTrigger className={cn("bg-slate-800 border-slate-700 text-slate-100", errors.importerCountry && "border-red-500")}>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
            {['United States', 'China', 'Japan', 'Singapore', 'Indonesia', 'United Kingdom'].map(c => (
              <SelectItem key={c} value={c} className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.importerCountry && <p className="text-red-400 text-xs">{errors.importerCountry}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Full Address *</Label>
        <Textarea
          value={formData.importerAddress}
          onChange={(e) => handleInputChange('importerAddress', e.target.value)}
          placeholder="Street address, City, Zip Code..."
          className={cn("bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.importerAddress && "border-red-500")}
        />
        {errors.importerAddress && <p className="text-red-400 text-xs">{errors.importerAddress}</p>}
      </div>
    </div>
  );

  const renderStep2_Shipment = () => (
    <div className="space-y-4 animate-in slide-in-from-right duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Invoice Number *</Label>
          <Input
            value={formData.invoiceNumber}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
            placeholder="INV-2024-001"
            className={cn("bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.invoiceNumber && "border-red-500")}
          />
          {errors.invoiceNumber && <p className="text-red-400 text-xs">{errors.invoiceNumber}</p>}
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Expected Shipping Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-slate-100",
                  !formData.shippingDate && "text-slate-500",
                  errors.shippingDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.shippingDate ? format(formData.shippingDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
              <Calendar
                mode="single"
                selected={formData.shippingDate}
                onSelect={(date) => handleInputChange('shippingDate', date)}
                disabled={(date) => date! <= new Date()}
                initialFocus
                className="bg-slate-800 text-slate-100"
              />
            </PopoverContent>
          </Popover>
          {errors.shippingDate && <p className="text-red-400 text-xs">{errors.shippingDate}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Goods Description *</Label>
        <Textarea
          value={formData.goodsDescription}
          onChange={(e) => handleInputChange('goodsDescription', e.target.value)}
          placeholder="Itemized list of goods..."
          rows={4}
          className={cn("bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.goodsDescription && "border-red-500")}
        />
        {errors.goodsDescription && <p className="text-red-400 text-xs">{errors.goodsDescription}</p>}
      </div>
    </div>
  );

  const renderStep3_Financials = () => {
    const ltv = (parseFloat(formData.loanAmount) / parseFloat(formData.shippingAmount)) * 100 || 0;
    const isHighRisk = ltv > 80;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-300">Total Shipping Value (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="number"
                value={formData.shippingAmount}
                onChange={(e) => handleInputChange('shippingAmount', e.target.value)}
                className={cn("pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.shippingAmount && "border-red-500")}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Requested Loan (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="number"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                className={cn("pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400", errors.loanAmount && "border-red-500")}
                placeholder="0.00"
              />
            </div>
            {errors.loanAmount && <p className="text-red-400 text-xs">{errors.loanAmount}</p>}
          </div>
        </div>

        {formData.shippingAmount && formData.loanAmount && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Loan to Value (LTV) Ratio</span>
              <span className={cn("font-bold", isHighRisk ? "text-yellow-400" : "text-green-400")}>
                {ltv.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-500", isHighRisk ? "bg-yellow-500" : "bg-green-500")}
                style={{ width: `${Math.min(ltv, 100)}%` }}
              />
            </div>
            {isHighRisk && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> High LTV (80%+) may require extra approval.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep4_Documents = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
        <input
          id="doc-upload"
          type="file"
          multiple
          accept=".pdf,.jpg,.png,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
          <div className="p-4 bg-slate-700 rounded-full mb-4">
            <Upload className="h-8 w-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-1">Click to upload shipping docs</h3>
          <p className="text-slate-400 text-sm">PDF, PNG, JPG or DOC (Max 10MB)</p>
        </label>
      </div>

      {errors.documents && <p className="text-red-400 text-center">{errors.documents}</p>}

      {formData.documents.length > 0 && (
        <div className="space-y-2">
          {formData.documents.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">Remove</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep5_Review = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-800 space-y-4">
        <div className="flex justify-between border-b border-slate-700 pb-4">
          <div>
            <p className="text-sm text-slate-500">Invoice Number</p>
            <p className="text-xl font-bold text-slate-100">{formData.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Shipping Date</p>
            <p className="text-lg text-slate-100">{formData.shippingDate ? format(formData.shippingDate, 'PP') : '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-2">
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Importer</h4>
            <p className="text-slate-100">{formData.importerCompany}</p>
            <p className="text-sm text-slate-400">{formData.importerCountry}</p>
            <p className="text-sm text-slate-400 truncate max-w-[200px]">{formData.importerEmail}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Financials</h4>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Goods Value:</span>
              <span className="text-slate-200">{formatCurrency(formData.shippingAmount)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Loan Request:</span>
              <span className="text-cyan-400 font-medium">{formatCurrency(formData.loanAmount)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">Documents Attached: {formData.documents.length}</p>
        </div>
      </div>

      {errors.submit && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 px-4">

      {/* Header Area */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Create New Invoice</h1>
          <p className="text-slate-400 text-sm">Complete the wizard to submit your invoice for funding</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoFill}
          className="bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
        >
          <Sparkles className="w-4 h-4 mr-2" /> Auto-fill Demo
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-3xl mb-8">
        <div className="flex justify-between relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 -translate-y-1/2" />

          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center bg-slate-950 px-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive ? "border-cyan-500 bg-cyan-950 text-cyan-400 shadow-lg shadow-cyan-900/50" :
                    isCompleted ? "border-cyan-700 bg-cyan-900/20 text-cyan-700" :
                      "border-slate-700 bg-slate-900 text-slate-600"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium transition-colors",
                  isActive ? "text-cyan-400" : isCompleted ? "text-cyan-700" : "text-slate-600"
                )}>{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-3xl bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 to-purple-500 w-full" />
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              {(() => {
                const Icon = STEPS[currentStep - 1].icon;
                return <Icon className="w-6 h-6 text-cyan-400" />;
              })()}
            </div>
            <div>
              <CardTitle className="text-slate-100 text-xl">{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription className="text-slate-400">{STEPS[currentStep - 1].description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator className="bg-slate-800" />

        <CardContent className="p-6">
          {currentStep === 1 && renderStep1_Importer()}
          {currentStep === 2 && renderStep2_Shipment()}
          {currentStep === 3 && renderStep3_Financials()}
          {currentStep === 4 && renderStep4_Documents()}
          {currentStep === 5 && renderStep5_Review()}
        </CardContent>

        <Separator className="bg-slate-800" />

        <CardFooter className="bg-slate-950/30 p-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className="text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={nextStep} className="bg-cyan-600 hover:bg-cyan-700 text-white w-32">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white w-40"
            >
              {isSubmitting || isUploadingDocs ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Submit Invoice</>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

    </div>
  );
}