'use client';

import { 
  FileText, 
  Coins, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePanna } from '@/hooks/usePanna';
import { formatEther, formatAddress, formatDate } from '@/lib/utils';

// Mock data - replace with actual user data
const mockUserData = {
  role: 'investor' as const,
  totalInvested: 25000n * 10n ** 18n,
  totalReturns: 1250n * 10n ** 18n,
  activeInvestments: 3,
  pendingReturns: 500n * 10n ** 18n,
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'investment',
    description: 'Invested in Asia Pacific Trade Pool',
    amount: 5000n * 10n ** 18n,
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    status: 'completed',
  },
  {
    id: 2,
    type: 'return',
    description: 'Returns from European Export Fund',
    amount: 250n * 10n ** 18n,
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    status: 'completed',
  },
  {
    id: 3,
    type: 'investment',
    description: 'Invested in Emerging Markets Pool',
    amount: 10000n * 10n ** 18n,
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    status: 'completed',
  },
];

const mockInvestments = [
  {
    poolId: 1n,
    poolName: 'Asia Pacific Trade Pool',
    invested: 5000n * 10n ** 18n,
    expectedReturn: 5200n * 10n ** 18n,
    progress: 65,
    maturityDate: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  },
  {
    poolId: 2n,
    poolName: 'European Export Fund',
    invested: 10000n * 10n ** 18n,
    expectedReturn: 10400n * 10n ** 18n,
    progress: 90,
    maturityDate: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
  },
  {
    poolId: 3n,
    poolName: 'Emerging Markets Pool',
    invested: 10000n * 10n ** 18n,
    expectedReturn: 10450n * 10n ** 18n,
    progress: 40,
    maturityDate: Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60,
  },
];

export default function DashboardPage() {
  const { isConnected, address } = usePanna();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {formatAddress(address || '', 6)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold mt-1">
                  {formatEther(mockUserData.totalInvested, 2)} ETH
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold mt-1">
                  {formatEther(mockUserData.totalReturns, 2)} ETH
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
              <span>5% yield achieved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Investments</p>
                <p className="text-2xl font-bold mt-1">
                  {mockUserData.activeInvestments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span>Across 3 pools</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Returns</p>
                <p className="text-2xl font-bold mt-1">
                  {formatEther(mockUserData.pendingReturns, 2)} ETH
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span>Available to claim</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Investments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
              <CardDescription>
                Your current pool investments and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockInvestments.map((investment) => (
                  <div 
                    key={investment.poolId.toString()}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{investment.poolName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Matures: {formatDate(investment.maturityDate)}
                        </p>
                      </div>
                      <Badge variant="info">
                        {investment.progress}% Complete
                      </Badge>
                    </div>
                    
                    <Progress value={investment.progress} className="h-2 mb-4" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Invested</p>
                        <p className="font-medium">
                          {formatEther(investment.invested, 2)} ETH
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Return</p>
                        <p className="font-medium text-emerald-500">
                          {formatEther(investment.expectedReturn, 2)} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'investment' 
                        ? 'bg-primary/10' 
                        : 'bg-emerald-500/10'
                    }`}>
                      {activity.type === 'investment' ? (
                        <ArrowUpRight className={`h-4 w-4 ${
                          activity.type === 'investment' 
                            ? 'text-primary' 
                            : 'text-emerald-500'
                        }`} />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm font-medium ${
                      activity.type === 'return' 
                        ? 'text-emerald-500' 
                        : ''
                    }`}>
                      {activity.type === 'return' ? '+' : '-'}
                      {formatEther(activity.amount, 2)} ETH
                    </p>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
