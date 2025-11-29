'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useActiveAccount } from 'panna-sdk'
import { formatAddress } from '@/lib/utils'
import Link from 'next/link'
import { appConfig } from '@/config'
import { useEffect, useState } from 'react'
import { getExporterByWallet, getInvestorByWallet, getUserRole } from '@/lib/supabase'

export default function ProfilePage() {
  const account = useActiveAccount()
  const [role, setRole] = useState<'admin' | 'exporter' | 'investor' | null>(null)
  const [exporter, setExporter] = useState<any>(null)
  const [investor, setInvestor] = useState<any>(null)
  const supaConfigured = !!(appConfig.supabase.url && appConfig.supabase.anonKey)

  useEffect(() => {
    async function load() {
      try {
        if (!account?.address) return
        if (!supaConfigured) return
        const addr = account.address
        const r = await getUserRole(addr)
        setRole(r)
        if (r === 'exporter') {
          const e = await getExporterByWallet(addr)
          setExporter(e)
        } else if (r === 'investor') {
          const i = await getInvestorByWallet(addr)
          setInvestor(i)
        }
      } catch (err: any) {
        console.error('Profile load error:', err?.message || err)
      }
    }
    load()
  }, [account?.address, supaConfigured])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {!appConfig.supabase.url || !appConfig.supabase.anonKey ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
          Supabase is not configured. Off-chain profile data may be unavailable.
        </div>
      ) : null}
      <Card className="max-w-xl">
        <CardContent className="p-6 space-y-4">
          {account ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-lg">{account.address}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{formatAddress(account.address)}</Badge>
                  {role && <Badge>{role}</Badge>}
                </div>
              </div>
              {role === 'exporter' && exporter && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Exporter</p>
                  <div className="text-sm">
                    <div>Company: {exporter.company_name}</div>
                    <div>Country: {exporter.country}</div>
                    <div>License: {exporter.export_license}</div>
                    <div>
                      Status: {exporter.is_verified ? (
                        <span className="text-emerald-600">Verified</span>
                      ) : (
                        <span className="text-amber-600">Pending Verification</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href="/exporter/invoices">
                      <Button variant="secondary">Invoices</Button>
                    </Link>
                    <Link href="/exporter/payments">
                      <Button variant="secondary">Payments</Button>
                    </Link>
                  </div>
                </div>
              )}
              {role === 'investor' && investor && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Investor</p>
                  <div className="text-sm">
                    <div>Name: {investor.name}</div>
                    <div>Address: {investor.address}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href="/pools">
                      <Button variant="secondary">Pools</Button>
                    </Link>
                    <Link href="/investor/investments">
                      <Button variant="secondary">Investments</Button>
                    </Link>
                    <Link href="/investor/returns">
                      <Button variant="secondary">Returns</Button>
                    </Link>
                  </div>
                </div>
              )}
              {role === 'admin' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Admin</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href="/admin/exporters">
                      <Button variant="secondary">Verify Exporters</Button>
                    </Link>
                    <Link href="/admin/invoices">
                      <Button variant="secondary">Review Invoices</Button>
                    </Link>
                    <Link href="/admin/pools">
                      <Button variant="secondary">Manage Pools</Button>
                    </Link>
                    <Link href="/admin/payments">
                      <Button variant="secondary">Payments</Button>
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(account.address)}
                >
                  Copy Address
                </Button>
                <a
                  href={`${appConfig.chain.blockExplorer}/address/${account.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md border hover:bg-accent text-sm"
                >
                  Open in Explorer
                </a>
                <Button
                  onClick={() => {
                    // Switching/disconnect handled by Panna modal; suggest using header button
                  }}
                >
                  Manage Connection
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Not connected. Use the Sign In button in the header.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
