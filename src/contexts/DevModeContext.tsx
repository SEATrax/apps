'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  devRole: 'admin' | 'exporter' | 'investor' | null;
  setDevRole: (role: 'admin' | 'exporter' | 'investor' | null) => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);
  const [devRole, setDevRole] = useState<'admin' | 'exporter' | 'investor' | null>(null);

  // Load dev mode state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('devMode');
      const storedRole = localStorage.getItem('devRole');
      
      if (stored === 'true') {
        setIsDevMode(true);
      }
      
      if (storedRole) {
        setDevRole(storedRole as 'admin' | 'exporter' | 'investor');
      }
    }
  }, []);

  const toggleDevMode = () => {
    const newValue = !isDevMode;
    setIsDevMode(newValue);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('devMode', String(newValue));
      
      if (!newValue) {
        // Clear dev role when disabling dev mode
        setDevRole(null);
        localStorage.removeItem('devRole');
      }
    }

    console.log(`🔧 Dev Mode: ${newValue ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleSetDevRole = (role: 'admin' | 'exporter' | 'investor' | null) => {
    setDevRole(role);
    
    if (typeof window !== 'undefined') {
      if (role) {
        localStorage.setItem('devRole', role);
        console.log(`👤 Dev Role set to: ${role.toUpperCase()}`);
      } else {
        localStorage.removeItem('devRole');
      }
    }
  };

  return (
    <DevModeContext.Provider value={{
      isDevMode,
      toggleDevMode,
      devRole,
      setDevRole: handleSetDevRole,
    }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
}
