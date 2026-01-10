'use client';

import { useState, useEffect } from 'react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, User, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

export default function AdminRoleManager() {
  const { isLoaded, isConnected, account, address } = useWalletSession();
  const { grantAdminRole, grantExporterRole, grantInvestorRole, getUserRoles, isLoading } = useAccessControl();
  const router = useRouter();
  
  const [targetAddress, setTargetAddress] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [roleCheck, setRoleCheck] = useState<any>(null);

  // Redirect to home if not connected (immediate redirect, no screen shown)
  useEffect(() => {
    if (isLoaded && !isConnected) {
      router.push('/');
    }
  }, [isLoaded, isConnected, router]);

  const handleGrantExporterRole = async () => {
    if (!targetAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a wallet address' });
      return;
    }

    try {
      setIsGranting(true);
      setMessage(null);
      
      await grantExporterRole(targetAddress);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully granted exporter role to ${targetAddress}` 
      });
      
      // Clear form
      setTargetAddress('');
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to grant exporter role' 
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleGrantInvestorRole = async () => {
    if (!targetAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a wallet address' });
      return;
    }

    try {
      setIsGranting(true);
      setMessage(null);
      
      await grantInvestorRole(targetAddress);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully granted investor role to ${targetAddress}` 
      });
      
      // Clear form
      setTargetAddress('');
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to grant investor role' 
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleGrantAdminRole = async () => {
    if (!targetAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a wallet address' });
      return;
    }

    try {
      setIsGranting(true);
      setMessage(null);
      
      await grantAdminRole(targetAddress);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully granted admin role to ${targetAddress}` 
      });
      
      // Clear form
      setTargetAddress('');
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to grant admin role' 
      });
    } finally {
      setIsGranting(false);
    }
  };

  const handleCheckRoles = async () => {
    if (!targetAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a wallet address' });
      return;
    }

    try {
      const roles = await getUserRoles(targetAddress);
      setRoleCheck({ address: targetAddress, roles });
      setMessage(null);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to check roles' 
      });
    }
  };

  // Quick grant for current connected wallet
  const handleGrantSelfExporter = async () => {
    if (!address) {
      setMessage({ type: 'error', text: 'No wallet connected' });
      return;
    }

    try {
      setIsGranting(true);
      await grantExporterRole(address);
      setMessage({ 
        type: 'success', 
        text: `Successfully granted exporter role to your wallet: ${address}` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to grant exporter role' 
      });
    } finally {
      setIsGranting(false);
    }
  };

  // Show loading while wallet is initializing or redirecting
  if (!isLoaded || !isConnected) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardHeader className="text-center">
              <CardTitle className="text-slate-100">Loading...</CardTitle>
              <CardDescription className="text-slate-400">
                {!isLoaded ? 'Initializing wallet connection...' : 'Redirecting...'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminHeader />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Role Manager</h1>
          <p className="text-slate-400">Grant roles to users for accessing platform features</p>
        </div>

        {/* Quick Grant for Self */}
        {address && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Quick Grant (Your Wallet)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Grant exporter role to your connected wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-slate-400">
                  Your Address: <span className="font-mono text-cyan-400">{address}</span>
                </div>
                <Button
                  onClick={handleGrantSelfExporter}
                  disabled={isGranting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGranting ? 'Granting...' : 'Grant Exporter Role to My Wallet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Role Management */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <User className="w-5 h-5" />
              Role Management
            </CardTitle>
            <CardDescription className="text-slate-400">
              Grant roles to specific wallet addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address" className="text-slate-300">Wallet Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleGrantExporterRole}
                disabled={isGranting || !targetAddress.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGranting ? 'Granting...' : 'Grant Exporter Role'}
              </Button>
              
              <Button
                onClick={handleGrantInvestorRole}
                disabled={isGranting || !targetAddress.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGranting ? 'Granting...' : 'Grant Investor Role'}
              </Button>
              
              <Button
                onClick={handleGrantAdminRole}
                disabled={isGranting || !targetAddress.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isGranting ? 'Granting...' : 'Grant Admin Role'}
              </Button>
              
              <Button
                onClick={handleCheckRoles}
                disabled={!targetAddress.trim()}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Check Roles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {message && (
          <Alert className={`${message.type === 'success' ? 'border-green-500 bg-green-950' : 'border-red-500 bg-red-950'}`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Role Check Results */}
        {roleCheck && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">Role Check Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-slate-400">
                  Address: <span className="font-mono text-cyan-400">{roleCheck.address}</span>
                </div>
                <div className="space-y-1">
                  <div className={`text-sm ${roleCheck.roles.hasAdminRole ? 'text-green-400' : 'text-slate-500'}`}>
                    Admin Role: {roleCheck.roles.hasAdminRole ? '✅ Yes' : '❌ No'}
                  </div>
                  <div className={`text-sm ${roleCheck.roles.hasExporterRole ? 'text-green-400' : 'text-slate-500'}`}>
                    Exporter Role: {roleCheck.roles.hasExporterRole ? '✅ Yes' : '❌ No'}
                  </div>
                  <div className={`text-sm ${roleCheck.roles.hasInvestorRole ? 'text-green-400' : 'text-slate-500'}`}>
                    Investor Role: {roleCheck.roles.hasInvestorRole ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>1. <strong>Quick Grant:</strong> Use the quick grant button to give yourself exporter role</p>
            <p>2. <strong>Manual Grant:</strong> Enter any wallet address to grant roles</p>
            <p>3. <strong>Check Roles:</strong> Verify which roles a wallet address has</p>
            <p className="text-yellow-400">⚠️ Only admin wallets can grant roles. Make sure you're connected as admin.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}