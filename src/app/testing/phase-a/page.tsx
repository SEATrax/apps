'use client';

import { useState } from 'react';
import { LoginButton, liskSepolia } from 'panna-sdk';
import { usePanna } from '@/hooks/usePanna';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, User, Settings } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function PhaseATestPage() {
  const { address, isConnected, mockUser, switchToMockUser, setMockUser } = usePanna();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Single unified hook for SEATrax contract
  const {
    checkUserRoles,
    getInvoice,
    getExporterInvoices,
    getPool,
    getAllOpenPools,
    getPoolFundingPercentage
  } = useSEATrax();

  const addResult = (test: string, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data }]);
  };

  // Helper function to serialize BigInt values for display
  const serializeForDisplay = (obj: any): string => {
    try {
      if (obj === null || obj === undefined) {
        return 'null';
      }
      
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
          return `${value.toString()}n (BigInt)`;
        }
        if (value instanceof Date) {
          return value.toISOString();
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        return value;
      }, 2);
    } catch (error) {
      console.error('Serialization error:', error);
      return `Error serializing data: ${String(error)}`;
    }
  };

  const runContractTests = async () => {
    if (!isConnected || !address) {
      addResult('Connection', 'error', 'Wallet not connected');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    // Test 1: Role Check - Check user roles
    try {
      addResult('Role Check', 'pending', 'Checking user roles...');
      const roles = await checkUserRoles(address);
      addResult('Role Check', 'success', 'Role check completed', {
        address,
        isAdmin: roles?.isAdmin || false,
        isExporter: roles?.isExporter || false,
        isInvestor: roles?.isInvestor || false,
      });
    } catch (error) {
      addResult('Role Check', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Invoice Data - Get invoices for current user
    try {
      addResult('Invoice Data', 'pending', 'Fetching user invoices...');
      const invoices = await getExporterInvoices(address);
      addResult('Invoice Data', 'success', `Found ${invoices.length} invoices`, { invoices });

      // Test specific invoice if available
      if (invoices.length > 0) {
        const invoice = await getInvoice(invoices[0]);
        addResult('Invoice Detail', 'success', 'Invoice details fetched', { invoice });
      }
    } catch (error) {
      addResult('Invoice Data', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Pool Data - Get open pools
    try {
      addResult('Pool Data', 'pending', 'Fetching open pools...');
      const openPools = await getAllOpenPools();
      addResult('Pool Data', 'success', `Found ${openPools.length} open pools`, { openPools });

      // Test specific pool if available
      if (openPools.length > 0) {
        const pool = await getPool(openPools[0]);
        addResult('Pool Detail', 'success', 'Pool details fetched', { pool });
      }
    } catch (error) {
      addResult('Pool Data', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Pool Funding - Check funding percentage
    try {
      addResult('Pool Funding', 'pending', 'Checking pool funding...');
      const openPools = await getAllOpenPools();
      if (openPools.length > 0) {
        const fundingPercentage = await getPoolFundingPercentage(openPools[0]);
        addResult('Pool Funding', 'success', 'Funding percentage fetched', { 
          poolId: openPools[0].toString(),
          fundingPercentage: fundingPercentage.toString() + '%'
        });
      } else {
        addResult('Pool Funding', 'success', 'No pools available to test funding');
      }
    } catch (error) {
      addResult('Pool Funding', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Contract Integration - Verify all functions work together
    try {
      addResult('Integration Test', 'pending', 'Testing contract integration...');
      const userInvoices = await getExporterInvoices(address);
      const allPools = await getAllOpenPools();
      if (userInvoices.length > 0 && allPools.length > 0) {
        addResult('Integration Test', 'success', 'All contract functions integrated successfully', {
          totalInvoices: userInvoices.length,
          totalPools: allPools.length,
          contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        });
      } else {
        addResult('Integration Test', 'success', 'Contract integration verified (no data yet)');
      }
    } catch (error) {
      addResult('Integration Test', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Navigation */}
      <div className="mb-4">
        <Button variant="outline" asChild>
          <a href="/testing" className="flex items-center gap-2">
            ← Back to Testing Hub
          </a>
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Phase A: Single Contract Integration Tests</h1>
        <p className="text-gray-600">Test unified SEATrax contract to verify integration</p>
      </div>

      <div className="grid gap-6">
        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Network & Connection Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                  {isConnected && (
                    <div className="flex items-center gap-2">
                      {mockUser && <Badge variant="outline" className="text-blue-600">Mock User</Badge>}
                      <span className="text-sm text-gray-600 font-mono">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-green-600">
                  Lisk Sepolia
                </Badge>
              </div>

              {/* Connection Options */}
              {!isConnected ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Real Wallet (Recommended)</h4>
                    <div className="flex gap-2">
                      <LoginButton chain={liskSepolia} />
                      <span className="text-sm text-gray-500 self-center">Connect with Panna SDK</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <h4 className="font-medium mb-2">Mock Users (For Testing)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => switchToMockUser('exporter')}
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Mock Exporter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => switchToMockUser('investor')}
                        className="flex items-center gap-2"
                      >
                        <Wallet className="h-4 w-4" />
                        Mock Investor
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => switchToMockUser('admin')}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Mock Admin
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {mockUser && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-900">{mockUser.name}</p>
                        <p className="text-sm text-blue-600">Role: {mockUser.role}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setMockUser(null)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    onClick={runContractTests} 
                    disabled={!isConnected || isRunning}
                    className="w-full"
                    size="lg"
                  >
                    {isRunning ? 'Running Tests...' : 'Run All Contract Tests'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(result.status)}`} />
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    
                    {result.data && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600">View Data</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {serializeForDisplay(result.data)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>SEATrax (Unified Contract):</strong>
                <br />
                <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
                  {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not configured'}
                </code>
              </div>
              <div className="text-gray-600 text-xs mt-2">
                This single contract replaces the previous 6-contract architecture:
                <ul className="list-disc ml-4 mt-1">
                  <li>AccessControl → checkUserRoles()</li>
                  <li>InvoiceNFT → getInvoice(), getExporterInvoices()</li>
                  <li>PoolNFT → getPool(), getAllOpenPools()</li>
                  <li>PoolFunding → getPoolFundingPercentage()</li>
                  <li>PaymentOracle → Invoice payment tracking</li>
                  <li>PlatformAnalytics → Manual calculation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>🧪 Phase A Testing Instructions:</strong>
            <br />
            <strong>Step 1: Connect Wallet</strong>
            <br />
            • <strong>Real Wallet:</strong> Click "Connect" button above → Use Panna SDK wallet → Ensure Lisk Sepolia network
            <br />
            • <strong>Mock Testing:</strong> Click one of the "Mock [Role]" buttons for quick testing without real wallet
            <br />
            <br />
            <strong>Step 2: Run Contract Tests</strong>
            <br />
            • Click "Run All Contract Tests" to test the unified SEATrax contract
            <br />
            • <strong>✨ Single Contract Architecture!</strong> All functions now in one contract
            <br />
            • Check results for each function: Role Check, Invoice Data, Pool Data, Pool Funding, Integration
            <br />
            <br />
            <strong>Step 3: Verify Integration</strong>
            <br />
            • ✅ Unified contract connects successfully
            <br />
            • ✅ Real blockchain data returns from smart contract
            <br />
            • ✅ UI displays actual contract states and data
            <br />
            • ✅ BigInt values are properly serialized (shown as "123n (BigInt)")
            <br />
            <br />
            <strong>🚀 Current Status:</strong> Single SEATrax contract integration on Lisk Sepolia!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}