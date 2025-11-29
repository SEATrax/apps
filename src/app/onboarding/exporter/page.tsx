'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usePanna } from '@/hooks/usePanna';
import { createExporter } from '@/lib/supabase';
import { useToast } from '@/components/ui';
import { ExporterOnboardingForm } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ExporterOnboardingPage() {
  const { address, isConnected } = usePanna();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ExporterOnboardingForm>();
  const { show } = useToast();
  const onSubmit = async (data: ExporterOnboardingForm) => {
    const addr = address;
    if (!addr) return;
    try {
      await createExporter({
        wallet_address: addr,
        company_name: data.companyName,
        tax_id: data.taxId,
        country: data.country,
        export_license: data.exportLicense,
        is_verified: false,
      });
      show({ title: 'Profile Created', description: 'Exporter profile saved', variant: 'success' });
      router.replace('/invoices');
    } catch (e) {
      console.error('Failed to create exporter profile', e);
      show({ title: 'Create Failed', description: 'Could not save exporter', variant: 'error' });
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Connect wallet first.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Exporter Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register('companyName', { required: 'Required' })} />
              {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" {...register('taxId', { required: 'Required' })} />
              {errors.taxId && <p className="text-xs text-red-500">{errors.taxId.message}</p>}
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register('country', { required: 'Required' })} />
              {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
            </div>
            <div>
              <Label htmlFor="exportLicense">Export License</Label>
              <Input id="exportLicense" {...register('exportLicense', { required: 'Required' })} />
              {errors.exportLicense && <p className="text-xs text-red-500">{errors.exportLicense.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Create Exporter Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
