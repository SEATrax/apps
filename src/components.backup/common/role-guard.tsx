'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePanna } from '@/hooks/usePanna';
import { getUserRole } from '@/lib/supabase';
import { useToast } from '@/components/ui';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  allowed: UserRole[]; // Roles allowed to access
  redirectTo?: string; // Defaults to login
}

export function RoleGuard({ children, allowed, redirectTo = '/login' }: RoleGuardProps) {
  const { isConnected, address } = usePanna();
  const { show } = useToast();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      if (!isConnected || !address) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      try {
        const role = await getUserRole(address);
        if (role && allowed.includes(role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (e) {
        console.error('Role check failed', e);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    void check();
  }, [isConnected, address, allowed]);

  useEffect(() => {
    if (!loading && !authorized) {
      show({ title: 'Unauthorized', description: 'You do not have access', variant: 'error' });
      router.replace(redirectTo);
    }
  }, [loading, authorized, router]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Authorizing...</div>;
  }
  if (!authorized) return null; // Redirecting
  return <>{children}</>;
}
