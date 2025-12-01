import { useState, useCallback, useEffect } from 'react';
import { usePanna } from './usePanna';
import { ethers } from 'ethers';

// Contract ABI for AccessControl - simplified version
const ACCESS_CONTROL_ABI = [
  // Admin functions
  "function grantExporterRole(address account) external",
  "function grantInvestorRole(address account) external",
  "function revokeExporterRole(address account) external",
  "function revokeInvestorRole(address account) external",
  
  // Role checking functions
  "function hasExporterRole(address account) external view returns (bool)",
  "function hasInvestorRole(address account) external view returns (bool)",
  "function hasAdminRole(address account) external view returns (bool)",
  "function getUserRoles(address account) external view returns (bool hasAdminRole, bool hasExporterRole, bool hasInvestorRole)",
  
  // Role constants
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function EXPORTER_ROLE() external view returns (bytes32)",
  "function INVESTOR_ROLE() external view returns (bytes32)",
  
  // Events
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
];

export interface UserRoles {
  hasAdminRole: boolean;
  hasExporterRole: boolean;
  hasInvestorRole: boolean;
}

export const useAccessControl = () => {
  const { address, isConnected, client, account } = usePanna();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoles>({
    hasAdminRole: false,
    hasExporterRole: false,
    hasInvestorRole: false,
  });

  const getContract = useCallback(() => {
    if (!isConnected || !account) throw new Error('Wallet not connected');
    
    const contractAddress = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || process.env.ACCESS_CONTROL;
    if (!contractAddress) throw new Error('AccessControl contract address not configured');
    
    // TODO: Implement actual contract interaction with Panna SDK
    console.log('Contract call would use:', { contractAddress, account });
    throw new Error('Contract interaction not yet implemented with Panna SDK');
  }, [isConnected, account]);

  const getReadOnlyContract = useCallback(() => {
    if (!client) throw new Error('Client not available');
    
    const contractAddress = process.env.NEXT_PUBLIC_ACCESS_CONTROL_ADDRESS || process.env.ACCESS_CONTROL;
    if (!contractAddress) throw new Error('AccessControl contract address not configured');
    
    // TODO: Implement actual contract reading with Panna SDK
    console.log('Read-only contract call would use:', { contractAddress, client });
    throw new Error('Contract reading not yet implemented with Panna SDK');
  }, [client]);

  // Load user roles when address changes
  useEffect(() => {
    if (address) {
      loadUserRoles(address);
    } else {
      setUserRoles({
        hasAdminRole: false,
        hasExporterRole: false,
        hasInvestorRole: false,
      });
    }
  }, [address]);

  // Grant exporter role (Admin only) - Mock implementation
  const grantExporterRole = async (accountAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement actual contract call with Panna SDK
      console.log('Would grant exporter role to:', accountAddress);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to grant exporter role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Grant investor role (Admin only) - Mock implementation
  const grantInvestorRole = async (accountAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement actual contract call with Panna SDK
      console.log('Would grant investor role to:', accountAddress);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to grant investor role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke exporter role (Admin only) - Mock implementation
  const revokeExporterRole = async (accountAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement actual contract call with Panna SDK
      console.log('Would revoke exporter role from:', accountAddress);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke exporter role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke investor role (Admin only) - Mock implementation
  const revokeInvestorRole = async (accountAddress: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implement actual contract call with Panna SDK
      console.log('Would revoke investor role from:', accountAddress);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000),
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to revoke investor role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if address has exporter role - Mock implementation
  const hasExporterRole = async (accountAddress?: string): Promise<boolean> => {
    try {
      const checkAddress = accountAddress || address;
      
      if (!checkAddress) return false;
      
      // TODO: Implement actual contract call with Panna SDK
      console.log('Would check exporter role for:', checkAddress);
      
      // Mock: return true for demo
      return true;
    } catch (err: any) {
      console.error('Error checking exporter role:', err);
      return false;
    }
  };

  // Check if address has investor role - Mock implementation
  const hasInvestorRole = async (accountAddress?: string): Promise<boolean> => {
    try {
      const checkAddress = accountAddress || address;
      
      if (!checkAddress) return false;
      
      // TODO: Implement actual contract call with Panna SDK
      console.log('Would check investor role for:', checkAddress);
      
      // Mock: return false for demo (user is exporter, not investor)
      return false;
    } catch (err: any) {
      console.error('Error checking investor role:', err);
      return false;
    }
  };

  // Check if address has admin role - Using environment variable
  const hasAdminRole = async (accountAddress?: string): Promise<boolean> => {
    try {
      const checkAddress = accountAddress || address;
      
      if (!checkAddress) return false;
      
      // Check against environment admin addresses
      const adminAddresses = process.env.ADMIN_ADDRESSES?.split(',').map(addr => addr.trim().toLowerCase()) || [];
      const isEnvAdmin = adminAddresses.includes(checkAddress.toLowerCase());
      
      if (isEnvAdmin) return true;
      
      // TODO: Also check contract-based admin role
      console.log('Would check admin role for:', checkAddress);
      
      return false;
    } catch (err: any) {
      console.error('Error checking admin role:', err);
      return false;
    }
  };

  // Get all roles for an address - Mock implementation
  const getUserRoles = async (accountAddress?: string): Promise<UserRoles> => {
    try {
      const checkAddress = accountAddress || address;
      
      if (!checkAddress) {
        return {
          hasAdminRole: false,
          hasExporterRole: false,
          hasInvestorRole: false,
        };
      }
      
      // TODO: Implement actual contract call with Panna SDK
      console.log('Would get user roles for:', checkAddress);
      
      // Mock: return exporter role for demo
      return {
        hasAdminRole: false,
        hasExporterRole: true,
        hasInvestorRole: false,
      };
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
      return {
        hasAdminRole: false,
        hasExporterRole: false,
        hasInvestorRole: false,
      };
    }
  };

  // Load and set user roles for current address
  const loadUserRoles = async (accountAddress?: string) => {
    try {
      const roles = await getUserRoles(accountAddress);
      setUserRoles(roles);
      return roles;
    } catch (err: any) {
      console.error('Error loading user roles:', err);
      setUserRoles({
        hasAdminRole: false,
        hasExporterRole: false,
        hasInvestorRole: false,
      });
    }
  };

  // Refresh current user roles
  const refreshUserRoles = async () => {
    if (address) {
      await loadUserRoles(address);
    }
  };

  // Helper function to get user type for routing
  const getUserType = (): 'admin' | 'exporter' | 'investor' | 'none' => {
    if (userRoles.hasAdminRole) return 'admin';
    if (userRoles.hasExporterRole) return 'exporter';
    if (userRoles.hasInvestorRole) return 'investor';
    return 'none';
  };

  // Check if user can access specific routes
  const canAccessRoute = (requiredRole: 'admin' | 'exporter' | 'investor'): boolean => {
    switch (requiredRole) {
      case 'admin':
        return userRoles.hasAdminRole;
      case 'exporter':
        return userRoles.hasExporterRole || userRoles.hasAdminRole; // Admins can access exporter routes
      case 'investor':
        return userRoles.hasInvestorRole || userRoles.hasAdminRole; // Admins can access investor routes
      default:
        return false;
    }
  };

  // Check if current user is verified (has any role)
  const isUserVerified = (): boolean => {
    return userRoles.hasAdminRole || userRoles.hasExporterRole || userRoles.hasInvestorRole;
  };

  return {
    // State
    isLoading,
    error,
    userRoles,
    
    // Write functions (Admin only)
    grantExporterRole,
    grantInvestorRole,
    revokeExporterRole,
    revokeInvestorRole,
    
    // Read functions
    hasExporterRole,
    hasInvestorRole,
    hasAdminRole,
    getUserRoles,
    loadUserRoles,
    refreshUserRoles,
    
    // Utility functions
    getUserType,
    canAccessRoute,
    isUserVerified,
  };
};