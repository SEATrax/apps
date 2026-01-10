'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

interface MobileNavProps {
  links: {
    href: string;
    label: string;
    icon?: React.ReactNode;
  }[];
  currentPath?: string;
}

/**
 * Mobile Navigation Component
 * Responsive hamburger menu for mobile devices
 */
export function MobileNav({ links, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Logo variant="navbar" size="sm" />
                <button
                  onClick={closeMenu}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                  {links.map((link) => {
                    const isActive = currentPath === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={closeMenu}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                            isActive
                              ? 'bg-cyan-50 text-cyan-600 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          {link.icon && (
                            <span className="flex-shrink-0">{link.icon}</span>
                          )}
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Bottom Tab Navigation - Alternative mobile pattern
 */
export function BottomTabNav({ links, currentPath }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
      <nav className="flex justify-around items-center h-16 px-2">
        {links.slice(0, 5).map((link) => {
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-cyan-600'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {link.icon && (
                <span className={cn('flex-shrink-0', isActive && 'scale-110')}>
                  {link.icon}
                </span>
              )}
              <span className="text-xs font-medium truncate max-w-full px-1">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
