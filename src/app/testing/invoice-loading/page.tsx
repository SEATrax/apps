'use client';

import { useState } from 'react';
import { useSEATrax } from '@/hooks/useSEATrax';
import { usePanna } from '@/hooks/usePanna';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestInvoiceLoading() {
  const { getInvoice, getExporterInvoices } = useSEATrax();
  const { address, isConnected } = usePanna();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetInvoice = async (invoiceId: number) => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log(`🔍 Testing getInvoice(${invoiceId})...`);
      const invoice = await getInvoice(BigInt(invoiceId));
      
      if (invoice) {
        console.log('✅ Invoice loaded:', invoice);
        setResult({
          tokenId: invoice.tokenId.toString(),
          exporter: invoice.exporter,
          exporterCompany: invoice.exporterCompany,
          importerCompany: invoice.importerCompany,
          loanAmount: `${Number(invoice.loanAmount) / 100} USD`,
          shippingAmount: `${Number(invoice.shippingAmount) / 100} USD`,
          amountInvested: `${Number(invoice.amountInvested) / 1e18} ETH`,
          status: invoice.status,
          ipfsHash: invoice.ipfsHash,
          createdAt: new Date(Number(invoice.createdAt) * 1000).toISOString(),
        });
      } else {
        setError('Invoice not found or error occurred');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const testGetExporterInvoices = async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log(`🔍 Testing getExporterInvoices(${address})...`);
      const invoiceIds = await getExporterInvoices(address);
      
      console.log('✅ Invoice IDs:', invoiceIds);
      setResult({
        exporterAddress: address,
        totalInvoices: invoiceIds.length,
        invoiceIds: invoiceIds.map(id => id.toString()),
      });
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <Card className="max-w-4xl mx-auto bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-100">
            🧪 Test Invoice Loading (Fixed ABI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Status */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-400">Wallet Status</p>
            <p className="text-slate-100 font-mono text-sm mt-1">
              {isConnected ? `✅ Connected: ${address?.slice(0, 10)}...${address?.slice(-8)}` : '❌ Not connected'}
            </p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <div>
              <p className="text-slate-300 mb-2">Test Individual Invoice:</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => testGetInvoice(1)}
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Load Invoice #1
                </Button>
                <Button 
                  onClick={() => testGetInvoice(2)}
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Load Invoice #2
                </Button>
              </div>
            </div>

            <div>
              <p className="text-slate-300 mb-2">Test Exporter Invoices:</p>
              <Button 
                onClick={testGetExporterInvoices}
                disabled={loading || !isConnected}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Load My Invoices
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <p className="text-blue-300">⏳ Loading...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-300">❌ {error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-300 mb-2">✅ Success!</p>
              <pre className="text-slate-300 text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-slate-800 rounded-lg">
            <p className="text-slate-300 text-sm mb-2">📋 Test Instructions:</p>
            <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
              <li>Connect your wallet</li>
              <li>Click "Load Invoice #1" or #2</li>
              <li>Check browser console for detailed logs</li>
              <li>Verify no "InvalidParameterError" appears</li>
              <li>Check that invoice data is displayed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
