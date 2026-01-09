'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { useExporterProfile } from '@/hooks/useExporterProfile';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import ExporterHeader from '@/components/ExporterHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, Calendar as CalendarIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface InvoiceFormData {
  exporterCompany: string;
  importerCompany: string;
  importerAddress: string;
  importerCountry: string;
  invoiceNumber: string;
  goodsDescription: string;
  shippingAmount: string;
  loanAmount: string;
  shippingDate: Date | undefined;
  documents: File[];
}

export default function CreateInvoice() {
  const activeAccount = useActiveAccount();
  const { mintInvoice, isLoading: isContractLoading } = useInvoiceNFT();
  const { profile } = useExporterProfile();
  const router = useRouter();
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    exporterCompany: '', // Will be filled from profile
    importerCompany: '',
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
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.importerCompany.trim()) {
      newErrors.importerCompany = 'Importer company name is required';
    }

    if (!formData.importerAddress.trim()) {
      newErrors.importerAddress = 'Importer address is required';
    }

    if (!formData.importerCountry) {
      newErrors.importerCountry = 'Importer country is required';
    }

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }

    if (!formData.goodsDescription.trim()) {
      newErrors.goodsDescription = 'Goods description is required';
    }

    if (!formData.shippingAmount || parseFloat(formData.shippingAmount) <= 0) {
      newErrors.shippingAmount = 'Valid shipping amount is required';
    }

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Valid loan amount is required';
    }

    if (parseFloat(formData.loanAmount) > parseFloat(formData.shippingAmount)) {
      newErrors.loanAmount = 'Loan amount cannot exceed shipping amount';
    }

    if (!formData.shippingDate) {
      newErrors.shippingDate = 'Shipping date is required';
    } else if (formData.shippingDate <= new Date()) {
      newErrors.shippingDate = 'Shipping date must be in the future';
    }

    if (formData.documents.length === 0) {
      newErrors.documents = 'At least one supporting document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadDocuments = async (): Promise<string[]> => {
    const ipfsHashes: string[] = [];
    
    for (let i = 0; i < formData.documents.length; i++) {
      const file = formData.documents[i];
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      try {
        // Create FormData for each file
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('name', `invoice-${formData.invoiceNumber}-doc-${i + 1}`);
        uploadFormData.append('description', `Supporting document for invoice ${formData.invoiceNumber}`);
        uploadFormData.append('invoice_number', formData.invoiceNumber);
        uploadFormData.append('exporter_company', formData.exporterCompany);
        
        // Add attributes for document metadata
        const attributes = [
          { trait_type: 'Document Type', value: file.type },
          { trait_type: 'Invoice Number', value: formData.invoiceNumber },
          { trait_type: 'Exporter', value: formData.exporterCompany },
          { trait_type: 'Document Index', value: (i + 1).toString() }
        ];
        uploadFormData.append('attributes', JSON.stringify(attributes));
        uploadFormData.append('created_at', new Date().toISOString());
        
        // Upload to IPFS via API route
        const uploadResponse = await fetch('/api/invoice/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const result = await uploadResponse.json();
        
        if (!result.success || !result.data?.metadata_cid) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // Store the IPFS hash
        ipfsHashes.push(result.data.metadata_cid);
        
        console.log(`✅ Uploaded ${file.name}:`, result.data.metadata_cid);
        
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
    
    return ipfsHashes;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Import compensation utilities
    const { compensationService, checkSystemHealth } = await import('@/lib/compensation');
    const  { TransactionState, MetadataSyncPayload, PaymentLinkPayload } = await import('@/lib/compensation');
    
    // Initialize transaction state for tracking
    const state = {
      warnings: [] as string[],
      contractTxHash: undefined as string | undefined,
      tokenId: undefined as bigint | undefined,
      metadataId: undefined as string | undefined,
      paymentId: undefined as string | undefined,
      ipfsHashes: undefined as string[] | undefined
    };

    try {
      // Check system health before starting
      const health = await checkSystemHealth();
      console.log('🏥 System Health:', health);
      
      if (health.consensusStatus === 'critical') {
        throw new Error('System is experiencing critical issues. Please try again later.');
      }

      // === PHASE 1: IRREVERSIBLE OPERATIONS (Smart Contract) ===
      console.log('🔄 Phase 1: Starting blockchain operations...');
      
      // Upload documents to IPFS
      setIsUploadingDocs(true);
      const documentHashes = await uploadDocuments();
      state.ipfsHashes = documentHashes;
      setIsUploadingDocs(false);
      console.log('📄 Documents uploaded to IPFS:', documentHashes.length);

      // Create invoice NFT on blockchain (PRIMARY OPERATION)
      const contractResult = await mintInvoice(
        formData.exporterCompany,
        formData.importerCompany,
        BigInt(Math.floor(parseFloat(formData.shippingAmount) * 100)), // Convert to cents
        BigInt(Math.floor(parseFloat(formData.loanAmount) * 100)), // Convert to cents
        BigInt(Math.floor(formData.shippingDate!.getTime() / 1000)) // Convert to timestamp
      );

      if (!contractResult) {
        throw new Error('Failed to create invoice NFT - contract transaction failed');
      }

      const tokenId = contractResult;
      state.tokenId = tokenId;
      state.contractTxHash = 'completed'; // We don't have direct access to tx hash from mintInvoice
      console.log('✅ Phase 1 Complete - Invoice NFT created:', tokenId.toString());

      // === PHASE 2: REVERSIBLE OPERATIONS WITH COMPENSATION ===
      console.log('🔄 Phase 2: Starting database synchronization...');
      
      // Prepare metadata payload
      const metadataPayload = {
        exporter_wallet: activeAccount.address!,
        invoice_number: formData.invoiceNumber,
        goods_description: formData.goodsDescription,
        importer_name: formData.importerCompany,
        importer_license: `${formData.importerAddress}, ${formData.importerCountry}`,
        documents: documentHashes.reduce((acc, hash, index) => {
          acc[formData.documents[index].name] = hash;
          return acc;
        }, {} as Record<string, string>)
      };

      // Prepare payment payload
      const shippingAmountCents = Math.floor(parseFloat(formData.shippingAmount) * 100);
      const paymentPayload = {
        amount_usd: shippingAmountCents,
        interest_amount: 0,
        total_due: shippingAmountCents,
        payment_link: `/pay/${tokenId}`,
        due_date: new Date(formData.shippingDate!.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Attempt database operations with compensation
      if (isSupabaseConfigured && health.supabaseConnection) {
        try {
          // Save metadata with retry
          state.metadataId = await compensationService.saveMetadataWithRetry(tokenId, metadataPayload, 2);
          console.log('✅ Metadata saved successfully');
        } catch (metadataError) {
          console.warn('⚠️ Metadata save failed - scheduled for compensation');
          state.warnings.push('Invoice metadata will be synchronized in background');
        }

        try {
          // Create payment link with retry
          state.paymentId = await compensationService.createPaymentWithRetry(tokenId, paymentPayload, 2);
          console.log('✅ Payment link created successfully');
        } catch (paymentError) {
          console.warn('⚠️ Payment link creation failed - scheduled for compensation');
          state.warnings.push('Payment link will be generated in background');
        }
      } else {
        console.info('🔄 Database sync skipped - scheduling for background processing');
        
        // Schedule both operations for background processing
        await compensationService.scheduleCompensation({
          task_type: 'metadata_sync',
          token_id: Number(tokenId),
          payload: metadataPayload,
          priority: 'high'
        });

        await compensationService.scheduleCompensation({
          task_type: 'payment_link',
          token_id: Number(tokenId),
          payload: paymentPayload,
          priority: 'normal'
        });

        state.warnings.push('Database synchronization scheduled for background processing');
      }

      console.log('✅ Phase 2 Complete - Transaction state:', {
        tokenId: tokenId.toString(),
        metadataId: state.metadataId || 'scheduled',
        paymentId: state.paymentId || 'scheduled',
        warnings: state.warnings
      });

      // Show success message with any warnings
      if (state.warnings.length > 0) {
        console.warn('⚠️ Invoice created with warnings:', state.warnings);
        // Could show a toast notification here about background processing
      }

      // Redirect to invoice list
      router.push('/exporter/invoices?created=true');
      
    } catch (error: any) {
      console.error('❌ Invoice creation failed:', error);
      
      // === ERROR RECOVERY AND CLEANUP ===
      try {
        // If we have IPFS hashes but contract failed, schedule cleanup
        if (state.ipfsHashes && !state.tokenId) {
          console.log('🧹 Scheduling IPFS cleanup for failed transaction');
          const { compensationService } = await import('@/lib/compensation');
          await compensationService.scheduleCompensation({
            task_type: 'ipfs_cleanup',
            token_id: 0, // No tokenId for failed contracts
            payload: { ipfsHashes: state.ipfsHashes },
            priority: 'low'
          });
        }

        // If contract succeeded but we have other errors, this is still a success case
        if (state.tokenId) {
          console.warn('⚠️ Contract succeeded but some operations failed - treating as success');
          router.push('/exporter/invoices?created=true&warnings=true');
          return;
        }
      } catch (recoveryError) {
        console.error('Recovery operations failed:', recoveryError);
      }

      // Determine error type for user-friendly message
      let userMessage = 'Failed to create invoice. Please try again.';
      
      if (error.message.includes('wallet') || error.message.includes('connect')) {
        userMessage = 'Wallet connection issue. Please ensure your wallet is connected and try again.';
      } else if (error.message.includes('contract') || error.message.includes('transaction')) {
        userMessage = 'Blockchain transaction failed. Please check your wallet and try again.';
      } else if (error.message.includes('IPFS') || error.message.includes('upload')) {
        userMessage = 'Document upload failed. Please check your documents and try again.';
      } else if (error.message.includes('critical')) {
        userMessage = error.message; // System health message
      }

      setErrors({ submit: userMessage });
    } finally {
      setIsSubmitting(false);
      setIsUploadingDocs(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isConnected) {
    return (
      <>
        <ExporterHeader />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardHeader className="text-center">
              <CardTitle className="text-slate-100">Access Required</CardTitle>
              <CardDescription className="text-slate-400">
                Connect your wallet to create invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ExporterHeader />
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/exporter/invoices" className="mr-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Invoices
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-100">Create New Invoice</h1>
                <p className="text-sm text-slate-400">
                  Submit your shipping invoice for funding consideration
                </p>
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Invoice Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Basic details about your shipping invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exporterCompany" className="text-slate-300">Exporter Company</Label>
                    <Input
                      id="exporterCompany"
                      value={formData.exporterCompany}
                      onChange={(e) => handleInputChange('exporterCompany', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-slate-100"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoiceNumber" className="text-slate-300">Invoice Number *</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      placeholder="INV-2024-001"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    />
                    {errors.invoiceNumber && (
                      <p className="text-red-400 text-sm mt-1">{errors.invoiceNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="goodsDescription" className="text-slate-300">Goods Description *</Label>
                  <Textarea
                    id="goodsDescription"
                    value={formData.goodsDescription}
                    onChange={(e) => handleInputChange('goodsDescription', e.target.value)}
                    placeholder="Describe the goods being shipped..."
                    rows={3}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                  {errors.goodsDescription && (
                    <p className="text-red-400 text-sm mt-1">{errors.goodsDescription}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="shippingDate" className="text-slate-300">Expected Shipping Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-slate-100"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.shippingDate ? (
                          format(formData.shippingDate, 'PPP')
                        ) : (
                          <span className="text-slate-500">Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700 text-slate-100" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.shippingDate}
                        onSelect={(date) => handleInputChange('shippingDate', date)}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                        className="bg-slate-800 text-slate-100 [&_.rdp-day]:text-slate-100 [&_.rdp-day_selected]:bg-cyan-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_today]:bg-slate-700"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.shippingDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.shippingDate}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Importer Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Importer Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Details about the importing company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="importerCompany" className="text-slate-300">Importer Company Name *</Label>
                  <Input
                    id="importerCompany"
                    value={formData.importerCompany}
                    onChange={(e) => handleInputChange('importerCompany', e.target.value)}
                    placeholder="Global Trading Ltd"
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                  {errors.importerCompany && (
                    <p className="text-red-400 text-sm mt-1">{errors.importerCompany}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="importerAddress" className="text-slate-300">Importer Address *</Label>
                  <Textarea
                    id="importerAddress"
                    value={formData.importerAddress}
                    onChange={(e) => handleInputChange('importerAddress', e.target.value)}
                    placeholder="Complete address of the importing company..."
                    rows={2}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                  {errors.importerAddress && (
                    <p className="text-red-400 text-sm mt-1">{errors.importerAddress}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="importerCountry" className="text-slate-300">Importer Country *</Label>
                  <Select value={formData.importerCountry} onValueChange={(value) => handleInputChange('importerCountry', value)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                      <SelectItem value="US" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">United States</SelectItem>
                      <SelectItem value="CN" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">China</SelectItem>
                      <SelectItem value="JP" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Japan</SelectItem>
                      <SelectItem value="KR" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">South Korea</SelectItem>
                      <SelectItem value="SG" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Singapore</SelectItem>
                      <SelectItem value="MY" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Malaysia</SelectItem>
                      <SelectItem value="TH" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Thailand</SelectItem>
                      <SelectItem value="VN" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Vietnam</SelectItem>
                      <SelectItem value="ID" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Indonesia</SelectItem>
                      <SelectItem value="PH" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">Philippines</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.importerCountry && (
                    <p className="text-red-400 text-sm mt-1">{errors.importerCountry}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Financial Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Shipping value and loan amount requested
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingAmount" className="text-slate-300">Total Shipping Amount (USD) *</Label>
                    <Input
                      id="shippingAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shippingAmount}
                      onChange={(e) => handleInputChange('shippingAmount', e.target.value)}
                      placeholder="25000.00"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    />
                    {errors.shippingAmount && (
                      <p className="text-red-400 text-sm mt-1">{errors.shippingAmount}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="loanAmount" className="text-slate-300">Loan Amount Requested (USD) *</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.loanAmount}
                      onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                      placeholder="20000.00"
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
                    />
                    {errors.loanAmount && (
                      <p className="text-red-400 text-sm mt-1">{errors.loanAmount}</p>
                    )}
                  </div>
                </div>

                {formData.shippingAmount && formData.loanAmount && (
                  <Alert className="bg-slate-800 border-slate-700">
                    <AlertCircle className="h-4 w-4 text-cyan-400" />
                    <AlertDescription className="text-slate-300">
                      Loan-to-value ratio: {(parseFloat(formData.loanAmount) / parseFloat(formData.shippingAmount) * 100).toFixed(1)}%
                      {parseFloat(formData.loanAmount) / parseFloat(formData.shippingAmount) > 0.8 && (
                        <span className="text-yellow-400 ml-2">
                          (High ratio - may require additional documentation)
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Supporting Documents</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload invoices, bills of lading, and other shipping documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="documents" className="text-slate-300">Upload Documents *</Label>
                  <div className="mt-2">
                    <input
                      id="documents"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="documents"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-700 rounded-md shadow-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Files
                    </Label>
                  </div>
                  {errors.documents && (
                    <p className="text-red-400 text-sm mt-1">{errors.documents}</p>
                  )}
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Uploaded Files:</Label>
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-md border border-slate-700">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          {uploadProgress[file.name] !== undefined && (
                            <div className="w-32 bg-slate-700 rounded-full h-1 mt-1">
                              <div 
                                className="bg-cyan-600 h-1 rounded-full transition-all" 
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            {errors.submit && (
              <Alert className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4">
              <Link href="/exporter/invoices">
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting || isContractLoading || isUploadingDocs}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isUploadingDocs ? 'Uploading Documents...' : 
                 isContractLoading ? 'Creating NFT...' : 
                 isSubmitting ? 'Saving...' : 'Create Invoice'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}