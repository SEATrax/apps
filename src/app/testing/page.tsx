'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, UserCheck, Building, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TestingPage() {
  const [mockUser, setMockUser] = useState<string | null>(null);

  const testUsers = [
    {
      id: 'exporter-1',
      name: 'Southeast Exports Co',
      role: 'exporter',
      address: '0x742d35Cc6C4165CC3201B3fd5b4cd5F2C3c72e87',
      verified: true,
    },
    {
      id: 'investor-1', 
      name: 'Investment Fund Ltd',
      role: 'investor',
      address: '0x8ba1f109551bD432803012645Hac136c34B8A5B2',
      verified: true,
    },
    {
      id: 'admin-1',
      name: 'SEATrax Admin',
      role: 'admin', 
      address: '0x123456789abcdef123456789abcdef1234567890',
      verified: true,
    }
  ];

  const setTestUser = (userId: string) => {
    const user = testUsers.find(u => u.id === userId);
    if (user) {
      setMockUser(userId);
      // Store in localStorage for other pages to use
      localStorage.setItem('mockUser', JSON.stringify(user));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            SEATrax Testing Environment
          </h1>
          <p className="text-slate-400">
            Choose a test user to simulate different roles and permissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testUsers.map((user) => (
            <Card 
              key={user.id}
              className={`bg-slate-900 border-slate-800 cursor-pointer transition-all ${
                mockUser === user.id ? 'ring-2 ring-cyan-500 border-cyan-500' : 'hover:border-slate-700'
              }`}
              onClick={() => setTestUser(user.id)}
            >
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  {user.role === 'exporter' && <Building className="h-5 w-5 text-blue-400" />}
                  {user.role === 'investor' && <Wallet className="h-5 w-5 text-green-400" />}
                  {user.role === 'admin' && <UserCheck className="h-5 w-5 text-purple-400" />}
                  {user.name}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Wallet Address:</p>
                  <p className="text-sm font-mono text-slate-300 break-all">
                    {user.address}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge 
                      variant={user.verified ? 'default' : 'secondary'}
                      className={user.verified ? 'bg-green-600' : 'bg-yellow-600'}
                    >
                      {user.verified ? 'Verified' : 'Pending'}
                    </Badge>
                    {mockUser === user.id && (
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockUser && (
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Testing Navigation
              </CardTitle>
              <CardDescription className="text-slate-400">
                Navigate to different sections based on your selected role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Phase A Test - Available for all users */}
                <Link href="/testing/phase-a">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                    Phase A Tests
                  </Button>
                </Link>
                
                {mockUser.startsWith('exporter') && (
                  <>
                    <Link href="/exporter">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Exporter Dashboard
                      </Button>
                    </Link>
                    <Link href="/exporter/invoices">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        My Invoices
                      </Button>
                    </Link>
                    <Link href="/exporter/invoices/new">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Create Invoice
                      </Button>
                    </Link>
                    <Link href="/exporter/payments">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Payments
                      </Button>
                    </Link>
                  </>
                )}

                {mockUser.startsWith('investor') && (
                  <>
                    <Link href="/dashboard">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Investor Dashboard
                      </Button>
                    </Link>
                    <Link href="/pools">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Browse Pools
                      </Button>
                    </Link>
                    <Link href="/investments">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        My Investments
                      </Button>
                    </Link>
                    <Link href="/returns">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Returns
                      </Button>
                    </Link>
                  </>
                )}

                {mockUser.startsWith('admin') && (
                  <>
                    <Link href="/admin">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Admin Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin/exporters">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Manage Exporters
                      </Button>
                    </Link>
                    <Link href="/admin/invoices">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Review Invoices
                      </Button>
                    </Link>
                    <Link href="/admin/pools">
                      <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                        Manage Pools
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium text-slate-300 mb-2">For Exporter Testing:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Select "Southeast Exports Co" user above</li>
                <li>• Navigate to Exporter Dashboard to see stats and recent invoices</li>
                <li>• Create new invoice using the form (all fields required)</li>
                <li>• View invoice details and test withdrawal functionality</li>
                <li>• Check payment tracking and link management</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-slate-300 mb-2">Mock Data Available:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Sample invoices with different statuses (Pending, Funded, Paid)</li>
                <li>• Financial data and funding progress</li>
                <li>• Payment links and withdrawal history</li>
                <li>• Document upload simulation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-slate-300 mb-2">Features to Test:</h4>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Dashboard overview with statistics</li>
                <li>• Invoice creation form validation</li>
                <li>• Invoice list filtering and search</li>
                <li>• Withdrawal process (when ≥70% funded)</li>
                <li>• Payment link generation and sharing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}