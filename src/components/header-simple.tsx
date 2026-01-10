'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Wallet, Copy, ChevronDown, LogOut, User, Sun, Moon, ExternalLink } from 'lucide-react';
import { LoginButton, useActiveAccount, liskSepolia } from 'panna-sdk';
import { appConfig } from '@/config';
import { formatAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';

const navLinks = [
  { label: 'Invoices', href: '/invoices' },
  { label: 'Pools', href: '/pools' },
  { label: 'Dashboard', href: '/dashboard' },
];

export function HeaderSimple() {
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const pannaConfigured = !!(appConfig.panna.clientId && appConfig.panna.partnerId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

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
    const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const systemDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
    const shouldBeDark = theme ? theme === 'dark' : systemDark;
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Logo variant="navbar" size="sm" href="/" />

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="hidden sm:flex"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {/* Hidden LoginButton always mounted to reliably trigger modal */}
            {pannaConfigured && (
              <div className="panna-login-button sr-only" aria-hidden="true">
                <LoginButton chain={liskSepolia} />
              </div>
            )}
            
              {/* Auth controls: show our styled address button when connected, otherwise show LoginButton */}
              {isConnected && activeAccount ? (
              <div ref={menuRef} className="relative flex items-center gap-2">
                <div
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  onClick={() => setMenuOpen((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((v) => !v)}
                >
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">{formatAddress(activeAccount.address)}</span>
                  <span className="sm:hidden">Wallet</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigator.clipboard.writeText(activeAccount.address)}
                    onKeyDown={(e) => e.key === 'Enter' && navigator.clipboard.writeText(activeAccount.address)}
                    aria-label="Copy wallet address"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <Copy className="h-4 w-4" />
                  </div>
                  <a
                    href={`${appConfig.chain.blockExplorer}/address/${activeAccount.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-accent"
                    aria-label="Open in block explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg animate-slide-down z-50">
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </div>
                      <div className="border-t border-border"></div>
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground px-3 py-1 mb-1">Manage wallet</p>
                        <div
                          role="button"
                          tabIndex={0}
                          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                          onClick={() => {
                            setMenuOpen(false);
                            setTimeout(() => {
                              // Temporarily suppress Thirdweb nested button hydration warnings while modal opens
                              const originalError = console.error as any;
                              console.error = function (...args: unknown[]) {
                                const msg = typeof args[0] === 'string' ? args[0] : '';
                                if (msg.includes('<button> cannot be a descendant of <button>') || msg.includes('button cannot contain a nested')) {
                                  return;
                                }
                                return originalError.apply(console, args as any);
                              };
                              const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                              if (loginBtn) loginBtn.click();
                              // Restore console after a short delay
                              setTimeout(() => {
                                console.error = originalError as any;
                              }, 2000);
                            }, 100);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setMenuOpen(false);
                              setTimeout(() => {
                                const originalError = console.error as any;
                                console.error = function (...args: unknown[]) {
                                  const msg = typeof args[0] === 'string' ? args[0] : '';
                                  if (msg.includes('<button> cannot be a descendant of <button>') || msg.includes('button cannot contain a nested')) {
                                    return;
                                  }
                                  return originalError.apply(console, args as any);
                                };
                                const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement;
                                if (loginBtn) loginBtn.click();
                                setTimeout(() => {
                                  console.error = originalError as any;
                                }, 2000);
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
                  <Button
                    className="gap-2"
                    onClick={() => {
                      const loginBtn = document.querySelector('.panna-login-button button') as HTMLButtonElement | null;
                      if (loginBtn) loginBtn.click();
                    }}
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                ) : (
                  <Button className="gap-2" disabled>
                    <Wallet className="h-4 w-4" />
                    Configure Panna in .env
                  </Button>
                )
              )}
          </div>
        </div>
      </div>
    </header>
  );
}
