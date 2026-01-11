'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wallet } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { 
    isConnected, 
    address, 
    connect, 
    switchToLiskSepolia, 
    isCorrectNetwork, 
    isMetaMaskInstalled,
    error: walletError 
  } = useMetaMaskAdmin();
  const { checkUserRoles } = useSEATrax();
  const router = useRouter();

  const [userRoles, setUserRoles] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const handleConnectWallet = async () => {
    await connect();
  };

  useEffect(() => {
    // Don't check role if not connected or wrong network
    if (!isMetaMaskInstalled || !isCorrectNetwork || !isConnected || !address) {
      setCheckingRole(false);
      return;
    }

    setCheckingRole(true);
    
    checkUserRoles(address).then((roles) => {
      setUserRoles(roles);
      setCheckingRole(false);
      
      if (!roles?.isAdmin) {
        setAccessDenied(true);
      }
    }).catch(() => {
      setCheckingRole(false);
      setAccessDenied(true);
    });
  }, [isMetaMaskInstalled, isCorrectNetwork, isConnected, address, checkUserRoles]);

  // Show loading
  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-gray-400">Checking admin permissions...</div>
        </div>
      </div>
    );
  }

  // MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">MetaMask Not Installed</p>
              <p className="text-sm">Admin pages require MetaMask wallet. Please install MetaMask extension first.</p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              className="bg-cyan-600"
            >
              Install MetaMask
            </Button>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Wrong network
  if (isConnected && !isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">Wrong Network</p>
              <p className="text-sm">Please switch to Lisk Sepolia Testnet (Chain ID: 4202)</p>
              <p className="text-sm mt-1">Current address: <code className="bg-orange-100 px-2 py-1 rounded">{address}</code></p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={switchToLiskSepolia} className="bg-cyan-600">
              Switch to Lisk Sepolia
            </Button>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-orange-500 bg-orange-50">
            <Wallet className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-semibold mb-2">MetaMask Wallet Not Connected</p>
              <p className="text-sm">Please connect your MetaMask wallet to access admin pages.</p>
              {walletError && (
                <p className="text-sm mt-2 text-red-600">Error: {walletError}</p>
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleConnectWallet} className="bg-cyan-600">
              <Wallet className="h-4 w-4 mr-2" />
              Connect MetaMask
            </Button>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Access denied - not admin
  if (accessDenied || !userRoles?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold mb-2">Access Denied - Admin Role Required</p>
              <p className="text-sm">Your address: <code className="bg-red-100 px-2 py-1 rounded">{address}</code></p>
              <p className="text-sm mt-2">Run this command to grant admin role:</p>
              <code className="block bg-red-100 p-2 rounded mt-1 text-xs break-all">
                NEW_ADMIN_ADDRESS={address} npx hardhat run scripts/grant-admin.js --network lisk-sepolia
              </code>
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push('/admin')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-cyan-600">
              Retry After Granting Role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
