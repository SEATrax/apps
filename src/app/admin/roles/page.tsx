'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePanna } from '@/hooks/usePanna';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Shield, UserPlus, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDevMode } from '@/contexts/DevModeContext';
import AdminHeader from '@/components/AdminHeader';

export default function RoleManagementPage() {
  const router = useRouter();
  const { isConnected, address } = usePanna();
  const { grantAdminRole, isLoading } = useSEATrax();
  const { isAdmin, loading: rolesLoading } = useRoleCheck();
  const { isDevMode, devRole } = useDevMode();
  const { toast } = useToast();

  const [targetAddress, setTargetAddress] = useState('');
  const [copied, setCopied] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Admin Roles Page State:', {
      isConnected,
      address,
      rolesLoading,
      isAdmin,
      isDevMode,
      devRole,
    });
  }, [isConnected, address, rolesLoading, isAdmin, isDevMode, devRole]);

  // Redirect ONLY if user is confirmed not admin (after loading completes)
  useEffect(() => {
    // DISABLED AUTO-REDIRECT - Show "Access Denied" page instead
    // This allows users to see their wallet address and copy it
    
    // Don't do anything until roles are fully loaded
    if (rolesLoading) {
      console.log('⏳ Still loading roles, not redirecting yet');
      return;
    }

    // If dev mode is active, allow access
    if (isDevMode && devRole === 'admin') {
      console.log('🔧 Dev mode active as admin, allowing access');
      return;
    }

    // Show access denied page instead of redirecting
    if (isConnected && !isAdmin) {
      console.log('❌ Connected but not admin. Showing access denied page. Address:', address);
      // Don't redirect - let the component render "Access Denied" UI
    }
  }, [isConnected, isAdmin, rolesLoading, router, address, isDevMode, devRole]);

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

  const handleGrantRole = async (role: 'admin' | 'exporter' | 'investor') => {
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
        description: 'You need to connect your wallet to grant roles (blockchain transaction required)',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (role !== 'admin') {
        toast({
          title: 'Notice',
          description: 'Exporters and Investors self-register. Only admin roles can be granted here.',
          variant: 'default',
        });
        return;
      }
      
      const result = await grantAdminRole(targetAddress);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to grant admin role');
      }

      toast({
        title: 'Success',
        description: 'Admin role granted successfully!',
      });

      setTargetAddress('');
    } catch (error: any) {
      console.error('Error granting role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to grant role',
        variant: 'destructive',
      });
    }
  };

  // Show loading state
  if (rolesLoading) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-4 text-cyan-400">Checking permissions...</p>
          </div>
        </div>
      </>
    );
  }

  // Not connected - show connect wallet UI ONLY if not in dev mode
  if (!isConnected && !isDevMode) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4 text-gray-400 hover:text-white"
            >
              ← Back to Home
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-cyan-500/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-cyan-400" />
              </div>
              <CardTitle className="text-white text-2xl">Admin Role Management</CardTitle>
              <CardDescription>Connect your wallet to access this page</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-400">
                This page is restricted to administrators only. Please connect your wallet to continue.
              </p>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="text-amber-400 font-semibold mb-2">💡 Quick Access Options:</h4>
                <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside text-left">
                  <li>Connect your Panna wallet from the homepage</li>
                  <li>Or enable Dev Mode (⚙️ button, bottom right) and select "Admin" role</li>
                  <li>Then navigate back to this page</li>
                </ol>
              </div>

              <Button
                onClick={() => router.push('/')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Go to Homepage to Connect
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // Connected but not admin (or dev mode but wrong role)
  if (!isAdmin && !rolesLoading) {
    console.log('🚫 Not admin. isAdmin:', isAdmin, 'address:', address, 'isDevMode:', isDevMode);
    
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4 text-gray-400 hover:text-white"
            >
              ← Back to Home
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-red-500/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-red-400" />
              </div>
              <CardTitle className="text-white text-2xl">Access Denied</CardTitle>
              <CardDescription className="text-red-400">You are not authorized to access this page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-gray-300 mb-2">
                  <strong>Your wallet address:</strong>
                </p>
                <code className="block bg-slate-900 text-cyan-400 p-3 rounded font-mono text-sm break-all">
                  {address || 'Not connected'}
                </code>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="text-amber-400 font-semibold mb-2">💡 To get admin access:</h4>
                <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside text-left">
                  <li>Copy your wallet address above</li>
                  <li>Add it to <code className="bg-slate-900 px-2 py-1 rounded text-xs">ADMIN_ADDRESSES</code> in <code className="bg-slate-900 px-2 py-1 rounded text-xs">.env.local</code></li>
                  <li>Restart the dev server: <code className="bg-slate-900 px-2 py-1 rounded text-xs">Ctrl+C</code> then <code className="bg-slate-900 px-2 py-1 rounded text-xs">npm run dev</code></li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                      toast({
                        title: 'Address Copied',
                        description: 'Paste it in your .env.local file',
                      });
                    }
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  disabled={!address}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy My Address
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  console.log('✅ Rendering admin roles page. isAdmin:', isAdmin);

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            ← Back to Admin Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Role Management</h1>
          </div>
          <p className="text-gray-400">Grant roles to wallet addresses for testing and development</p>
        </div>

        {/* Your Address Card */}
        {address && (
          <Card className="mb-6 bg-slate-800/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Your Wallet Address</CardTitle>
              <CardDescription>This is your current wallet address</CardDescription>
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

        {/* Dev Mode Indicator */}
        {isDevMode && (
          <Card className="mb-6 bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-amber-400 font-semibold">Dev Mode Active</p>
                  <p className="text-amber-300/70 text-sm">
                    You can access this page without wallet, but granting roles requires wallet connection.
                  </p>
                </div>
              </div>
              {!isConnected && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded p-3 mt-3">
                  <p className="text-amber-200 text-sm">
                    ⚠️ <strong>Wallet not connected</strong> - To grant roles (blockchain transaction), please connect your wallet from the homepage.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grant Role Card */}
        <Card className="bg-slate-800/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Grant Role to Address
            </CardTitle>
            <CardDescription>
              Enter a wallet address and grant it a specific role. You can use your own address for testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  type="text"
                  placeholder="0x..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="flex-1 bg-slate-900 border-slate-700 text-white"
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
              {!address && isDevMode && (
                <p className="text-xs text-amber-400">
                  💡 In dev mode without wallet: Enter any address to grant roles for testing
                </p>
              )}
            </div>

            {/* Role Buttons */}
            <div className="space-y-3">
              <Label className="text-white">Select Role to Grant</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => handleGrantRole('admin')}
                  disabled={isLoading || !targetAddress}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Grant Admin
                </Button>
                
                <Button
                  onClick={() => handleGrantRole('exporter')}
                  disabled={isLoading || !targetAddress}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Grant Exporter
                </Button>
                
                <Button
                  onClick={() => handleGrantRole('investor')}
                  disabled={isLoading || !targetAddress}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Grant Investor
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
              <h4 className="text-cyan-400 font-semibold mb-2">💡 Testing Guide</h4>
              <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                <li>Connect your wallet from homepage (required for blockchain transactions)</li>
                <li>Enter target address or click &quot;Use My Address&quot;</li>
                <li>Click the role button you want to grant (Admin, Exporter, or Investor)</li>
                <li>Confirm transaction in your wallet</li>
                <li>Navigate to the respective dashboard to test the role</li>
              </ol>
              
              {!isConnected && (
                <div className="mt-3 pt-3 border-t border-cyan-500/20">
                  <p className="text-amber-400 text-sm">
                    <strong>Note:</strong> You&apos;re viewing this page in dev mode. To grant roles, you must connect your wallet first.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
