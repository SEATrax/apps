'use client';

import { useState } from 'react';
import { usePanna } from '@/hooks/usePanna';
import { useInvoiceNFT } from '@/hooks/useInvoiceNFT';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadToIPFS } from '@/lib/pinata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, Calendar as CalendarIcon, AlertCircle, CheckCircle } from 'lucide-react';
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
  const { address, isConnected, mockUser, setMockUser } = usePanna();
  const { mintInvoice, isLoading: isContractLoading } = useInvoiceNFT();
  const router = useRouter();
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    exporterCompany: 'Southeast Exports Co', // Pre-fill from user profile
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
        // Update progress to show start
        setUploadProgress(prev => ({ ...prev, [file.name]: 25 }));
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('name', `invoice-doc-${Date.now()}-${i}`);
        uploadFormData.append('type', 'invoice-document');
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
        
        const response = await fetch('/api/upload/document', {
          method: 'POST',
          body: uploadFormData,
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 75 }));
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data?.ipfsHash) {
          throw new Error(`Invalid response for ${file.name}`);
        }
        
        ipfsHashes.push(result.data.ipfsHash);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    try {
      // Upload documents to IPFS
      setIsUploadingDocs(true);
      const documentHashes = await uploadDocuments();
      setIsUploadingDocs(false);

      // Create invoice NFT on blockchain
      const contractResult = await mintInvoice(
        formData.exporterCompany,
        formData.importerCompany,
        parseFloat(formData.shippingAmount),
        parseFloat(formData.loanAmount),
        formData.shippingDate!
      );

      if (!contractResult?.tokenId) {
        throw new Error('Failed to create invoice NFT');
      }

      // Save metadata to Supabase (optional for testing)
      let metadata = null;
      if (isSupabaseConfigured) {
        try {
          const { data, error: supabaseError } = await supabase
            .from('invoice_metadata')
            .insert({
              token_id: parseInt(contractResult.tokenId),
              invoice_number: formData.invoiceNumber,
              goods_description: formData.goodsDescription,
              importer_name: formData.importerCompany,
              importer_license: `${formData.importerAddress}, ${formData.importerCountry}`,
              documents: documentHashes.reduce((acc, hash, index) => {
                acc[formData.documents[index].name] = hash;
                return acc;
              }, {} as Record<string, string>),
            })
            .select()
            .single();

          if (supabaseError) {
            console.warn('Supabase metadata save failed (non-critical for testing):', supabaseError);
          } else {
            metadata = data;
            console.log('Supabase metadata saved successfully');
          }
        } catch (dbError) {
          console.warn('Database operation failed (continuing with mock data):', dbError);
        }
      } else {
        console.info('Supabase not configured, skipping metadata save (using mock data)');
      }

      console.log('Invoice created successfully:', {
        tokenId: contractResult.tokenId,
        txHash: contractResult.txHash,
        metadata
      });

      // Redirect to invoice list
      router.push('/exporter/invoices?created=true');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setErrors({ submit: error.message || 'Failed to create invoice. Please try again.' });
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Access Required</CardTitle>
            <CardDescription className="text-slate-400">
              Connect your wallet or use the testing environment to create invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Debug Info */}
            <div className="text-xs text-slate-500 p-2 bg-slate-800 rounded">
              Debug: isConnected={isConnected.toString()}, address={address || 'none'}, mockUser={mockUser?.name || 'none'}
            </div>
            
            {/* Quick Test Login */}
            <Button 
              onClick={() => setMockUser({
                id: 'exporter-1',
                name: 'Southeast Exports Co',
                role: 'exporter',
                address: '0xExporter123...',
                verified: true
              })}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Quick Login as Exporter (Test)
            </Button>
            
            <Link href="/login" className="w-full">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                Go to Login
              </Button>
            </Link>
            <Link href="/testing" className="w-full">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-700">
                Use Testing Environment
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
  );
}