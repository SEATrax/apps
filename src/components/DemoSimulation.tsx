'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  PlayCircle,
  RotateCcw,
  Info
} from 'lucide-react'
import ExporterSimulation from '@/components/ExporterSimulation'
import InvestorSimulation from '@/components/InvestorSimulation'
import AdminSimulation from '@/components/AdminSimulation'
import DemoNotifications from '@/components/DemoNotifications'
import { DemoProvider, useDemoContext } from '@/contexts/DemoContext'
import { mockExporters, mockInvestors } from '@/data/mockData'

// Reset Demo Button Component
function ResetDemoButton() {
  const { resetDemoData } = useDemoContext()
  
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all demo data? This will clear all invoices, pools, payments, and notifications.')) {
      resetDemoData()
    }
  }
  
  return (
    <Button
      onClick={handleReset}
      variant="outline"
      size="sm"
      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      Reset Demo
    </Button>
  )
}

const DEMO_ROLES = {
  EXPORTER: 'exporter',
  INVESTOR: 'investor', 
  ADMIN: 'admin'
} as const

type DemoRole = typeof DEMO_ROLES[keyof typeof DEMO_ROLES]

interface DemoUser {
  role: DemoRole
  walletAddress: string
  name: string
  description: string
  avatar?: string
}

const DEMO_USERS: DemoUser[] = [
  {
    role: DEMO_ROLES.EXPORTER,
    walletAddress: '0x532280Cb12c00854c6c9decbfbA1C2Ef1153c8b4',
    name: 'PT Sinar Jaya Export',
    description: 'Established coffee exporter with 15+ years experience'
  },
  {
    role: DEMO_ROLES.EXPORTER,
    walletAddress: '0x742d35Cc6175C06c06B756daee142f8CCb34332A',
    name: 'Manila Trading Corp',
    description: 'Electronics and machinery export specialist'
  },
  {
    role: DEMO_ROLES.INVESTOR,
    walletAddress: '0x8ba1f109551bD432803012645Hac136c12c00854',
    name: 'Budi Investor',
    description: 'Individual investor focused on trade finance'
  },
  {
    role: DEMO_ROLES.INVESTOR,
    walletAddress: '0x9ca2e110552cE543904123756Iac247d13d00965',
    name: 'Sarah Investment Fund',
    description: 'Institutional investor with diversified portfolio'
  },
  {
    role: DEMO_ROLES.ADMIN,
    walletAddress: '0xAd5f292F75D22996E7A4DD277083c75aB29ff45C',
    name: 'SEATrax Admin',
    description: 'Platform administrator managing operations'
  }
]

function DemoSimulationContent() {
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const { setCurrentUser } = useDemoContext()
  
  // Update current user when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setCurrentUser(selectedUser.walletAddress)
    }
  }, [selectedUser, setCurrentUser])

  const getRoleColor = (role: DemoRole) => {
    switch (role) {
      case DEMO_ROLES.EXPORTER:
        return 'bg-blue-100 text-blue-800'
      case DEMO_ROLES.INVESTOR:
        return 'bg-green-100 text-green-800'
      case DEMO_ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: DemoRole) => {
    switch (role) {
      case DEMO_ROLES.EXPORTER:
        return <Building2 className="w-5 h-5" />
      case DEMO_ROLES.INVESTOR:
        return <TrendingUp className="w-5 h-5" />
      case DEMO_ROLES.ADMIN:
        return <Shield className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  if (!isIntroComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Demo Introduction */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                SEATrax Platform Demo
              </h1>
              <p className="text-xl text-slate-400 mb-6">
                Experience the complete shipping invoice funding ecosystem
              </p>
              <div className="flex items-center justify-center gap-2 text-cyan-400 mb-8">
                <Info className="w-5 h-5" />
                <span className="text-sm">This demo uses simulated data for demonstration purposes</span>
              </div>
            </div>

            {/* Platform Overview */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-center">How SEATrax Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">1. Exporters Submit</h3>
                    <p className="text-slate-400 text-sm">
                      Exporters submit verified shipping invoices and request funding up to 80% of invoice value
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">2. Investors Fund</h3>
                    <p className="text-slate-400 text-sm">
                      Investors browse curated pools and invest in diversified invoice portfolios with 4% returns
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="bg-purple-600/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">3. Admins Manage</h3>
                    <p className="text-slate-400 text-sm">
                      Admins verify exporters, approve invoices, create investment pools, and manage payments
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardContent className="p-6 text-center">
                  <h4 className="text-white font-semibold mb-2">Complete Workflow</h4>
                  <p className="text-slate-400 text-sm">
                    Experience the full invoice funding lifecycle from submission to payout
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardContent className="p-6 text-center">
                  <h4 className="text-white font-semibold mb-2">Real-time Data</h4>
                  <p className="text-slate-400 text-sm">
                    Interactive dashboards with live funding progress and portfolio tracking
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardContent className="p-6 text-center">
                  <h4 className="text-white font-semibold mb-2">Multi-Role Access</h4>
                  <p className="text-slate-400 text-sm">
                    Switch between exporter, investor, and admin perspectives seamlessly
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                <CardContent className="p-6 text-center">
                  <h4 className="text-white font-semibold mb-2">Blockchain Integration</h4>
                  <p className="text-slate-400 text-sm">
                    Transparent and secure transactions powered by smart contracts
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Start Demo Button */}
            <div className="text-center">
              <Button 
                onClick={() => setIsIntroComplete(true)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-4 text-lg"
              >
                <PlayCircle className="w-6 h-6 mr-3" />
                Start Interactive Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Choose Your Demo Role</h1>
              <p className="text-slate-400 mb-6">
                Select a role to explore the SEATrax platform from different perspectives
              </p>
              <Button 
                onClick={() => setIsIntroComplete(false)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Back to Introduction
              </Button>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEMO_USERS.map((user) => (
                <Card 
                  key={user.walletAddress} 
                  className="bg-slate-900/50 backdrop-blur-xl border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedUser(user)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-2">{user.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{user.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-xs">Wallet Address</p>
                        <p className="text-slate-300 text-xs font-mono">
                          {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Demo Statistics */}
            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 mt-8">
              <CardHeader>
                <CardTitle className="text-white text-center">Demo Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{mockExporters.length}</p>
                    <p className="text-slate-400 text-sm">Exporters</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{mockInvestors.length}</p>
                    <p className="text-slate-400 text-sm">Investors</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">12</p>
                    <p className="text-slate-400 text-sm">Active Invoices</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">4</p>
                    <p className="text-slate-400 text-sm">Investment Pools</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">$2.1M</p>
                    <p className="text-slate-400 text-sm">Total Value Locked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Render selected role simulation
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6">
        {/* Demo Header */}
        <div className="flex items-center justify-between mb-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setSelectedUser(null)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              ← Switch Role
            </Button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor(selectedUser.role)}`}>
                {getRoleIcon(selectedUser.role)}
              </div>
              <div>
                <h2 className="text-white font-semibold">{selectedUser.name}</h2>
                <p className="text-slate-400 text-sm">{selectedUser.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DemoNotifications />
            <ResetDemoButton />
            <Badge className={`${getRoleColor(selectedUser.role)} px-3 py-1`}>
              DEMO MODE - {selectedUser.role.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Role-specific Simulation */}
        {selectedUser.role === DEMO_ROLES.EXPORTER && (
          <ExporterSimulation walletAddress={selectedUser.walletAddress} />
        )}
        {selectedUser.role === DEMO_ROLES.INVESTOR && (
          <InvestorSimulation walletAddress={selectedUser.walletAddress} />
        )}
        {selectedUser.role === DEMO_ROLES.ADMIN && (
          <AdminSimulation walletAddress={selectedUser.walletAddress} />
        )}
      </div>
    </div>
  )
}

export default function DemoSimulation() {
  return (
    <DemoProvider>
      <DemoSimulationContent />
    </DemoProvider>
  )
}