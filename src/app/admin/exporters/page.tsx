'use client';

import { useState, useEffect } from 'react';
import { useMetaMaskAdmin } from '@/hooks/useMetaMaskAdmin';
import { useSEATrax } from '@/hooks/useSEATrax';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Building2, 
  FileText, 
  Globe,
  Search,
  Filter,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { supabase, type Database } from '@/lib/supabase';

type Exporter = Database['public']['Tables']['exporters']['Row'];

export default function ExporterVerificationPage() {
  const { isConnected, address } = useMetaMaskAdmin();
  const { verifyExporter, isLoading } = useSEATrax();
  const router = useRouter();
  
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [filteredExporters, setFilteredExporters] = useState<Exporter[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingExporters, setLoadingExporters] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch exporters from Supabase when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchExporters();
    }
  }, [isConnected, address]);

  // Filter exporters based on selected filter and search term
  useEffect(() => {
    let filtered = exporters;

    // Apply status filter
    if (filter === 'pending') {
      filtered = filtered.filter(exp => !exp.is_verified);
    } else if (filter === 'verified') {
      filtered = filtered.filter(exp => exp.is_verified);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExporters(filtered);
  }, [exporters, filter, searchTerm]);

  const fetchExporters = async () => {
    try {
      setLoadingExporters(true);
      const { data, error } = await supabase
        .from('exporters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExporters(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load exporters: ' + error.message });
    } finally {
      setLoadingExporters(false);
    }
  };

  const handleApproveExporter = async (exporter: Exporter) => {
    try {
      setApprovingId(exporter.id);
      setMessage(null);

      // 1. Verify exporter via smart contract
      const result = await verifyExporter(exporter.wallet_address);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to verify exporter on-chain');
      }

      // 2. Update verification status in database
      const { error } = await supabase
        .from('exporters')
        .update({ is_verified: true })
        .eq('id', exporter.id);

      if (error) throw error;

      // 3. Update local state
      setExporters(prev => prev.map(exp => 
        exp.id === exporter.id 
          ? { ...exp, is_verified: true }
          : exp
      ));

      setMessage({ 
        type: 'success', 
        text: `Successfully verified ${exporter.company_name}` 
      });

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to approve exporter' 
      });
    } finally {
      setApprovingId(null);
    }
  };

  const getFilterStats = () => {
    const pending = exporters.filter(exp => !exp.is_verified).length;
    const verified = exporters.filter(exp => exp.is_verified).length;
    return { pending, verified, total: exporters.length };
  };

  const stats = getFilterStats();

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-950">
        <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Exporter Verification
          </h1>
          <p className="text-gray-400">
            Review and approve exporter registrations to grant platform access
          </p>
        </div>
        
        {/* Self-Registration Notice */}
        <Alert className="mb-6 bg-blue-900/20 border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>Note:</strong> Exporters now self-register on-chain. Your role is to verify their credentials and approve them for creating invoices.
          </AlertDescription>
        </Alert>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Exporters</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Verified</p>
                  <p className="text-2xl font-bold text-green-400">{stats.verified}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Approval Rate</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Filter Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  All ({stats.total})
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                  className={filter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Pending ({stats.pending})
                </Button>
                <Button
                  variant={filter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('verified')}
                  className={filter === 'verified' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified ({stats.verified})
                </Button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company, country, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exporters List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Exporters ({filteredExporters.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              {filter === 'pending' && 'Exporters awaiting verification'}
              {filter === 'verified' && 'Approved exporters with platform access'}
              {filter === 'all' && 'All registered exporters'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingExporters ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-slate-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredExporters.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {filter === 'pending' && 'No pending exporters'}
                  {filter === 'verified' && 'No verified exporters'}
                  {filter === 'all' && 'No exporters found'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Exporters will appear here once they register.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExporters.map((exporter) => (
                  <div
                    key={exporter.id}
                    className="border border-slate-700 rounded-lg p-6 bg-slate-750"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Exporter Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Building2 className="h-5 w-5 text-cyan-400" />
                          <h3 className="text-lg font-semibold text-white">
                            {exporter.company_name}
                          </h3>
                          <Badge 
                            variant={exporter.is_verified ? 'default' : 'secondary'}
                            className={
                              exporter.is_verified 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }
                          >
                            {exporter.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Tax ID</p>
                            <p className="text-white font-medium">{exporter.tax_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Country</p>
                            <p className="text-white font-medium flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              {exporter.country}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Export License</p>
                            <p className="text-white font-medium flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {exporter.export_license}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 text-sm">
                          <p className="text-gray-400">Wallet Address</p>
                          <code className="text-cyan-400 font-mono">
                            {exporter.wallet_address}
                          </code>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Registered: {new Date(exporter.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="lg:ml-6">
                        {!exporter.is_verified ? (
                          <Button
                            onClick={() => handleApproveExporter(exporter)}
                            disabled={approvingId === exporter.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {approvingId === exporter.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                        ) : (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminAuthGuard>
  );
}