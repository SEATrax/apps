'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Shield, UserPlus, Copy, Check, AlertCircle, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import AdminHeader from '@/components/AdminHeader';

export default function RoleManagementPage() {
  const router = useRouter();
  const { 
    isConnected, 
    address, 
    connect, 
    switchToLiskSepolia, 
    isCorrectNetwork, 
    isMetaMaskInstalled,
    error: walletError 
  } = useMetaMaskAdmin();
  const { checkUserRoles, isLoading } = useSEATrax();
  const { toast } = useToast();

  const [targetAddress, setTargetAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [userRoles, setUserRoles] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Function to connect MetaMask
  const handleConnectWallet = async () => {
    const success = await connect();
    if (!success) {
      console.error('Failed to connect MetaMask');
    }
  };

  // Check admin role when MetaMask connected
  useEffect(() => {
    // Don't check role if not connected or wrong network
    if (!isMetaMaskInstalled || !isCorrectNetwork || !isConnected || !address) {
      setCheckingRole(false);
      return;
    }

    // Check admin role
    setCheckingRole(true);
    
    checkUserRoles(address).then((roles) => {
      setUserRoles(roles);
      setCheckingRole(false);
      
      if (!roles?.isAdmin) {
        setAccessDenied(true);
      }
    }).catch(err => {
      console.error('Error checking roles:', err);
      setCheckingRole(false);
      setAccessDenied(true);
    });
  }, [isMetaMaskInstalled, isCorrectNetwork, isConnected, address, checkUserRoles]);

  const handleCopyOwnAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Address Copied',
        description: 'Your wallet address has been copied to clipboard',
      });
    }
  };

  const handleUseSelfAddress = () => {
    if (address) {
      setTargetAddress(address);
      toast({
        title: 'Address Auto-filled',
        description: 'Your wallet address has been filled in',
      });
    }
  };

  const handleGrantRole = async () => {
    if (!targetAddress) {
      toast({
        title: 'Error',
        description: 'Please enter a wallet address',
        variant: 'destructive',
      });
      return;
    }

    // Check if wallet is connected (required for blockchain transaction)
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'You need to connect MetaMask to grant admin role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Use Command Line',
      description: 'Please use the grant-admin.js script from terminal to grant admin role.',
    });
  };

  // Show loading ONLY while checking roles
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
              <p className="text-sm">Please connect your MetaMask wallet to access grant admin page.</p>
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

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-4 text-slate-400 hover:text-white"
          >
            ← Back to Admin Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Grant Admin Role</h1>
          </div>
          <p className="text-slate-400">Use command line to grant admin role to wallet addresses</p>
        </div>

        {/* Your Address Card */}
        {address && (
          <Card className="mb-6 bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Your Admin Wallet Address</CardTitle>
              <CardDescription>This is your current MetaMask EOA address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-900 text-cyan-400 p-3 rounded font-mono text-sm break-all">
                  {address}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyOwnAddress}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grant Admin Role Instructions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              How to Grant Admin Role
            </CardTitle>
            <CardDescription>
              Use the command line script to grant admin role to wallet addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">Target Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  type="text"
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="flex-1 bg-slate-950 border-slate-700 text-white"
                />
                {address && (
                  <Button
                    variant="outline"
                    onClick={handleUseSelfAddress}
                    className="shrink-0"
                  >
                    Use My Address
                  </Button>
                )}
              </div>
            </div>

            {/* Command Instructions */}
            <div className="space-y-3">
              <Label className="text-white">Command to Run:</Label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg p-4">
                <code className="text-cyan-400 text-sm break-all">
                  NEW_ADMIN_ADDRESS={targetAddress || '0xYourTargetAddress'} npx hardhat run scripts/grant-admin.js --network lisk-sepolia
                </code>
              </div>
              <p className="text-slate-400 text-sm">
                Copy this command and run it in your terminal. Make sure you have deployer/admin access.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-cyan-950 border border-cyan-800 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-2">📋 Steps to Grant Admin Role</h4>
              <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
                <li>Enter the target wallet address (or use your own for testing)</li>
                <li>Copy the command above</li>
                <li>Open your terminal in the project directory</li>
                <li>Paste and run the command</li>
                <li>Wait for transaction confirmation</li>
                <li>Refresh this page to verify the new admin can access</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
