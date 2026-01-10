'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { usePanna } from '@/hooks/usePanna';
import { createInvestor } from '@/lib/supabase';
import { useToast } from '@/components/ui';
import { InvestorOnboardingForm } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InvestorOnboardingPage() {
  const { address, isConnected } = usePanna();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InvestorOnboardingForm>();
  const { show } = useToast();
  const onSubmit = async (data: InvestorOnboardingForm) => {
    const addr = address;
    if (!addr) return;
    try {
      await createInvestor({
        wallet_address: addr,
        name: data.name,
        address: data.address,
      });
      show({ title: 'Profile Created', description: 'Investor profile saved', variant: 'success' });
      router.replace('/pools');
    } catch (e) {
      console.error('Failed to create investor profile', e);
      show({ title: 'Create Failed', description: 'Could not save investor', variant: 'error' });
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
          <CardTitle>Investor Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name', { required: 'Required' })} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address', { required: 'Required' })} />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Create Investor Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
