'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminHeader from '@/components/AdminHeader';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Activity,
  Database,
  Link2,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2
} from 'lucide-react';
import { useWalletSession } from '@/hooks/useWalletSession';
import { useSEATrax } from '@/hooks/useSEATrax';
import { useRouter } from 'next/navigation';
import type { ConsistencyIssue, ValidationResult } from '@/lib/consistency';

export default function DataHealthPage() {
  const { address } = useWalletSession();
  const { checkUserRoles } = useSEATrax();
  const router = useRouter();

  const [userRoles, setUserRoles] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Check admin role
  useEffect(() => {
    const checkRole = async () => {
      if (address) {
        const roles = await checkUserRoles(address);
        if (!roles?.isAdmin) {
          router.push('/');
          return;
        }
        setUserRoles(roles);
      }
    };
    checkRole();
  }, [address, checkUserRoles, router]);

  // Run consistency check
  const runCheck = async () => {
    setIsLoading(true);
    try {
      // Import and run consistency check
      const { runPeriodicConsistencyCheck } = await import('@/lib/consistency');
      const result = await runPeriodicConsistencyCheck();
      
      setValidationResult(result);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Consistency check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-heal issues
  const healIssues = async () => {
    if (!validationResult) return;

    setIsHealing(true);
    try {
      const { consistencyService } = await import('@/lib/consistency');
      const healableIssues = validationResult.issues.filter(issue => issue.autoHealable);
      
      const result = await consistencyService.autoHealIssues(healableIssues);
      
      // Re-run check after healing
      await runCheck();
      
      alert(`Healing completed!\n✅ Healed: ${result.healed}\n❌ Failed: ${result.failed}`);
    } catch (error) {
      console.error('Auto-heal failed:', error);
      alert('Auto-heal failed. Please check console for details.');
    } finally {
      setIsHealing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userRoles?.hasAdminRole) {
      runCheck();
    }
  }, [userRoles]);

  if (!address || !userRoles?.hasAdminRole) {
    return (
      <>
        <AdminHeader />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Admin Access Required</h2>
              <p className="text-slate-400">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      low: { variant: 'default', icon: Info, color: 'text-blue-400' },
      medium: { variant: 'secondary', icon: AlertTriangle, color: 'text-yellow-400' },
      high: { variant: 'destructive', icon: XCircle, color: 'text-orange-400' },
      critical: { variant: 'destructive', icon: XCircle, color: 'text-red-400' },
    };

    const config = variants[severity] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-8 h-8 text-green-400" />;
    if (score >= 70) return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
    return <XCircle className="w-8 h-8 text-red-400" />;
  };

  return (
    <>
      <AdminHeader />
      <div className="min-h-screen bg-slate-950">
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  Data Health Monitor
                </h1>
                <p className="text-slate-400 mt-1">
                  Monitor and maintain data consistency between smart contracts and database
                </p>
              </div>
              <Button
                onClick={runCheck}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Check
                  </>
                )}
              </Button>
            </div>
            {lastUpdate && (
              <p className="text-slate-500 text-sm mt-2">Last updated: {lastUpdate}</p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Health Score Card */}
          {validationResult && (
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-4">
                    {getHealthIcon(validationResult.healthScore)}
                    <div>
                      <p className="text-slate-400 text-sm">Health Score</p>
                      <p className={`text-3xl font-bold ${getHealthColor(validationResult.healthScore)}`}>
                        {validationResult.healthScore}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Database className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Total Invoices</p>
                      <p className="text-2xl font-bold text-slate-100">{validationResult.invoiceCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Issues Found</p>
                      <p className="text-2xl font-bold text-slate-100">{validationResult.issues.length}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {validationResult.isConsistent ? (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <p className="text-slate-400 text-sm">Status</p>
                      <p className="text-lg font-semibold text-slate-100">
                        {validationResult.isConsistent ? 'Consistent' : 'Issues Detected'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues List */}
          {validationResult && validationResult.issues.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-100">Detected Issues</CardTitle>
                    <CardDescription>Data consistency problems that require attention</CardDescription>
                  </div>
                  {validationResult.issues.some(i => i.autoHealable) && (
                    <Button
                      onClick={healIssues}
                      disabled={isHealing}
                      variant="outline"
                      className="border-green-700 text-green-400 hover:bg-green-900/20"
                    >
                      {isHealing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Healing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Auto-Heal Issues
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.issues.map((issue, index) => (
                    <Alert key={index} className="bg-slate-800/50 border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getSeverityBadge(issue.severity)}
                            <Badge variant="outline" className="text-slate-400">
                              Token #{issue.tokenId}
                            </Badge>
                            <Badge variant="outline" className="text-slate-400">
                              {issue.type.replace(/_/g, ' ')}
                            </Badge>
                            {issue.autoHealable && (
                              <Badge className="bg-green-900/20 text-green-400 border-green-700">
                                Auto-Healable
                              </Badge>
                            )}
                          </div>
                          <AlertDescription className="text-slate-300">
                            {issue.description}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Issues */}
          {validationResult && validationResult.issues.length === 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-100 mb-2">All Systems Healthy!</h2>
                <p className="text-slate-400">
                  No consistency issues detected. Your data is perfectly synchronized.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !validationResult && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-semibold text-slate-100 mb-2">Running Consistency Check...</h2>
                <p className="text-slate-400">
                  Validating data integrity across smart contracts and database
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}