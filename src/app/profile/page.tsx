'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePanna } from '@/hooks/usePanna'
import { formatAddress } from '@/lib/utils'
import { appConfig } from '@/config'
import { getExporterByWallet, getInvestorByWallet, getUserRole } from '@/lib/supabase'
import { 
  User, 
  Wallet, 
  Copy, 
  ExternalLink, 
  Building, 
  MapPin, 
  FileText, 
  CheckCircle, 
  Clock, 
  Shield,
  TrendingUp,
  DollarSign,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { LoginButton, liskSepolia, useActiveAccount } from 'panna-sdk'
import { Logo } from '@/components/common/Logo'

export default function ProfilePage() {
  const { address, isConnected, mockUser, switchToMockUser } = usePanna()
  const activeAccount = useActiveAccount()
  const [role, setRole] = useState<'admin' | 'exporter' | 'investor' | null>(null)
  const [exporter, setExporter] = useState<any>(null)
  const [investor, setInvestor] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const supaConfigured = !!(appConfig.supabase.url && appConfig.supabase.anonKey)
  const pannaConfigured = !!(appConfig.panna.clientId && appConfig.panna.partnerId)

  // Handle menu clicks outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    async function load() {
      try {
        // Handle mock user data
        if (mockUser) {
          setRole(mockUser.role as any)
          if (mockUser.role === 'exporter') {
            setExporter({
              company_name: mockUser.name.replace(' (Mock)', '') + ' Corp',
              country: 'Indonesia',
              export_license: 'EXP-2024-' + Math.floor(Math.random() * 1000),
              is_verified: mockUser.verified
            })
          } else if (mockUser.role === 'investor') {
            setInvestor({
              name: mockUser.name.replace(' (Mock)', ''),
              address: 'Jakarta, Indonesia'
            })
          }
          return
        }

        if (!address || !supaConfigured) return
        
        const r = await getUserRole(address)
        setRole(r)
        if (r === 'exporter') {
          const e = await getExporterByWallet(address)
          setExporter(e)
        } else if (r === 'investor') {
          const i = await getInvestorByWallet(address)
          setInvestor(i)
        }
      } catch (err: any) {
        console.error('Profile load error:', err?.message || err)
      }
    }
    load()
  }, [address, mockUser, supaConfigured])

  const handleCopyAddress = () => {
    const addressToCopy = mockUser?.address || address
    if (addressToCopy) {
      navigator.clipboard.writeText(addressToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const currentAddress = mockUser?.address || address
  const currentRole = role || (mockUser?.role as any)
  const isUserConnected = isConnected || !!mockUser

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Navbar */}
      <header className="bg-[#0f172a] border-b border-cyan-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo variant="navbar" size="md" href="/" className="hover-scale hover-glow cursor-pointer" />
            
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Dashboard</Link>
              <Link href="/pools" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Pools</Link>
              <Link href="/investments" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Investments</Link>
              <Link href="/returns" className="text-gray-300 hover:text-cyan-400 hover-color relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-400 after:transition-all after:duration-300 hover:after:w-full">Returns</Link>
            </nav>
            
            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {/* Hidden LoginButton for Panna SDK */}
              {pannaConfigured && (
                <div className="panna-login-button sr-only" aria-hidden="true">
                  <LoginButton chain={liskSepolia} />
                </div>
              )}
              
              {isUserConnected && (activeAccount || mockUser) ? (
                <div ref={menuRef} className="relative flex items-center gap-2">
                  <div
                    role="button"
                    tabIndex={0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-slate-800/50 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => setMenuOpen((v) => !v)}
                    onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((v) => !v)}
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">{formatAddress(currentAddress || '')}</span>
                    <span className="sm:hidden">Wallet</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                  <div
                    onClick={handleCopyAddress}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cyan-400/30 bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer text-white"
                    aria-label="Copy wallet address"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCopyAddress()}
                  >
                    <Copy className="h-4 w-4" />
                  </div>
                  <a
                    href={`${appConfig.chain.blockExplorer}/address/${currentAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cyan-400/30 bg-slate-800/50 hover:bg-slate-700/50 text-white"
                    aria-label="Open in block explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-cyan-400/30 bg-slate-800 shadow-lg animate-slide-down z-50">
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:bg-slate-700/50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </div>
                      <div className="border-t border-cyan-400/20"></div>
                      <div className="p-2">
                        <p className="text-xs text-gray-400 px-3 py-1 mb-1">Manage wallet</p>
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white border border-cyan-400/30 bg-slate-700/50 hover:bg-slate-600/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setMenuOpen(false);
                            setTimeout(() => {
                              const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                              if (loginBtn) loginBtn.click();
                            }, 100);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setMenuOpen(false);
                              setTimeout(() => {
                                const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                                if (loginBtn) loginBtn.click();
                              }, 100);
                            }
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          Manage Wallet
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                pannaConfigured ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="px-6 py-2 bg-cyan-400 text-slate-900 rounded-lg hover:bg-cyan-300 hover-scale-sm hover-shine transition-all border border-cyan-400 flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                        if (loginBtn) loginBtn.click();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                          if (loginBtn) loginBtn.click();
                        }
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </div>
                    <Link href="/testing">
                      <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all border border-slate-600 text-sm">
                        Test Mode
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="px-6 py-2 bg-gray-500 text-gray-300 rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Configure Panna
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-slate-400">Manage your account information and settings</p>
          </div>

          {!supaConfigured && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 p-4 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Supabase is not configured. Off-chain profile data may be unavailable.
            </div>
          )}

          <div className="grid gap-6 max-w-4xl">
          {/* Wallet Information Card */}
          <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="w-5 h-5 text-cyan-400" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUserConnected ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Wallet Address</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <code className="font-mono text-sm flex-1 text-slate-200">{currentAddress}</code>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCopyAddress}
                        className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono bg-slate-700/50 text-slate-300 border-slate-600">
                        {formatAddress(currentAddress || '')}
                      </Badge>
                      {currentRole && (
                        <Badge 
                          variant={currentRole === 'admin' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {currentRole}
                        </Badge>
                      )}
                      {mockUser && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          Mock User
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a
                      href={`${appConfig.chain.blockExplorer}/address/${currentAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Explorer
                    </a>
                  </div>

                  <Separator />
                </>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Not Connected</h3>
                  <p className="text-slate-400 mb-6">
                    Connect your wallet or use test access to view your profile.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      Connect Wallet
                    </Button>
                    <Button variant="outline" onClick={() => switchToMockUser('exporter')} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                      Test Access
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role-specific Information */}
              {currentRole === 'exporter' && exporter && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Building className="w-5 h-5 text-cyan-400" />
                      Exporter Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Company Name</label>
                        <p className="text-slate-100 mt-1">{exporter.company_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Country</label>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-100">{exporter.country}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Export License</label>
                        <div className="flex items-center gap-1 mt-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-100 font-mono text-sm">{exporter.export_license}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Verification Status</label>
                        <div className="flex items-center gap-1 mt-1">
                          {exporter.is_verified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Verified</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-amber-500" />
                              <span className="text-amber-600 font-medium">Pending Verification</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-700" />
                    
                    <div>
                      <h4 className="font-medium text-white mb-3">Quick Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <Link href="/exporter/invoices">
                          <Button variant="default" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            Manage Invoices
                          </Button>
                        </Link>
                        <Link href="/exporter/invoices/new">
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                            Create New Invoice
                          </Button>
                        </Link>
                        <Link href="/exporter/payments">
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Payment History
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {currentRole === 'investor' && investor && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      Investor Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <p className="text-slate-100 mt-1">{investor.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300">Location</label>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-100">{investor.address}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-700" />
                    
                    <div>
                      <h4 className="font-medium text-white mb-3">Investment Dashboard</h4>
                      <div className="flex flex-wrap gap-2">
                        <Link href="/pools">
                          <Button variant="default" size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Browse Pools
                          </Button>
                        </Link>
                        <Link href="/investments">
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                            My Investments
                          </Button>
                        </Link>
                        <Link href="/returns">
                          <Button variant="outline" size="sm">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Returns & Earnings
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {currentRole === 'admin' && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Admin Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-white">User Management</h4>
                        <div className="flex flex-col gap-2">
                          <Link href="/admin/exporters">
                            <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                              <Building className="w-4 h-4 mr-2" />
                              Verify Exporters
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-white">Operations</h4>
                        <div className="flex flex-col gap-2">
                          <Link href="/admin/invoices">
                            <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                              <FileText className="w-4 h-4 mr-2" />
                              Review Invoices
                            </Button>
                          </Link>
                          <Link href="/admin/pools">
                            <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Manage Pools
                            </Button>
                          </Link>
                          <Link href="/admin/payments">
                            <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Payment Oversight
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mock User Testing Card */}
              {!isUserConnected && (
                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="w-5 h-5 text-cyan-400" />
                      Test Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-400 text-sm">
                      For testing purposes, you can switch between different user roles:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => switchToMockUser('exporter')} 
                        variant="outline" 
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Test as Exporter
                      </Button>
                      <Button 
                        onClick={() => switchToMockUser('investor')} 
                        variant="outline" 
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Test as Investor
                      </Button>
                      <Button 
                        onClick={() => switchToMockUser('admin')} 
                        variant="outline" 
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Test as Admin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-gray-400 py-12 border-t border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo variant="footer" size="sm" className="mb-4" />
              <p className="text-gray-400 max-w-md">
                Empowering global trade through blockchain-based invoice funding. 
                Connect exporters with investors for secure, transparent financing.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Platform</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-cyan-400 transition-colors">How it Works</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Pools</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Documentation</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Security</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <div className="space-y-2">
                <a href="#" className="block hover:text-cyan-400 transition-colors">Help Center</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Contact Us</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-cyan-400 transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2025 SeaTrax. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
