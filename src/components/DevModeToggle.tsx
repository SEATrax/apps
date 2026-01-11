'use client';

import { useDevMode } from '@/contexts/DevModeContext';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export function DevModeToggle() {
  const { isDevMode, toggleDevMode, devRole, setDevRole } = useDevMode();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSelect = (role: 'admin' | 'exporter' | 'investor') => {
    setDevRole(role);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Dev Mode Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all ${
          isDevMode 
            ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' 
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
        title="Developer Mode"
      >
        <Settings className="w-6 h-6 text-white" />
      </button>

      {/* Dev Mode Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <Card className="bg-slate-800 border-cyan-500/30 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Dev Mode
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Testing mode for role switching without blockchain verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Enable Dev Mode</span>
                <button
                  onClick={toggleDevMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isDevMode ? 'bg-amber-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isDevMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Role Selection (only when dev mode is enabled) */}
              {isDevMode && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Select Role:</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        devRole === 'admin'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-semibold">Admin</div>
                      <div className="text-xs opacity-80">Full system access</div>
                    </button>
                    
                    <button
                      onClick={() => handleRoleSelect('exporter')}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        devRole === 'exporter'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-semibold">Exporter</div>
                      <div className="text-xs opacity-80">Create & manage invoices</div>
                    </button>
                    
                    <button
                      onClick={() => handleRoleSelect('investor')}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        devRole === 'investor'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-semibold">Investor</div>
                      <div className="text-xs opacity-80">Browse & invest in pools</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div className="pt-2 border-t border-slate-700">
                <div className="text-xs text-gray-400">
                  Status: {isDevMode ? (
                    <span className="text-amber-400 font-semibold">
                      Dev Mode ({devRole || 'no role'})
                    </span>
                  ) : (
                    <span className="text-gray-500">Production Mode</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
