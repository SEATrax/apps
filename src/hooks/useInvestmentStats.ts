'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'panna-sdk';
import { usePoolFunding } from './usePoolFunding';
import { usePlatformAnalytics } from './usePlatformAnalytics';

export interface InvestmentStats {
  totalInvested: string;
  totalReturns: string;
  activeInvestments: number;
  totalPools: number;
  averageYield: string;
  portfolioValue: string;
  unrealizedGains: string;
  claimableReturns: string;
}

export interface Investment {
  id: number;
  poolId: number;
  poolName: string;
  amount: string;
  investedDate: string;
  status: 'Active' | 'Matured' | 'Paid' | 'Completed';
  currentValue: string;
  expectedYield: string;
  maturityDate?: string;
  paidDate?: string;
}

export const useInvestmentStats = () => {
  const activeAccount = useActiveAccount();
  const { getInvestorReturns } = usePoolFunding();
  const { getInvestorStats } = usePlatformAnalytics();
  
  const [stats, setStats] = useState<InvestmentStats>({
    totalInvested: '0',
    totalReturns: '0',
    activeInvestments: 0,
    totalPools: 0,
    averageYield: '0',
    portfolioValue: '0',
    unrealizedGains: '0',
    claimableReturns: '0'
  });

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockStats: InvestmentStats = {
    totalInvested: '4.8',
    totalReturns: '0.19',
    activeInvestments: 2,
    totalPools: 4,
    averageYield: '4.1',
    portfolioValue: '4.99',
    unrealizedGains: '0.19',
    claimableReturns: '0.06'
  };

  const mockInvestments: Investment[] = [
    {
      id: 1,
      poolId: 12,
      poolName: 'Maritime Electronics Pool #12',
      amount: '2.5',
      investedDate: '2024-03-10',
      status: 'Active',
      currentValue: '2.58',
      expectedYield: '4.2%',
      maturityDate: '2024-04-10'
    },
    {
      id: 2,
      poolId: 11,
      poolName: 'Tech Components Pool #11',
      amount: '1.5',
      investedDate: '2024-03-05',
      status: 'Active',
      currentValue: '1.55',
      expectedYield: '4.0%',
      maturityDate: '2024-04-05'
    },
    {
      id: 3,
      poolId: 8,
      poolName: 'Maritime Trade Pool #8',
      amount: '0.8',
      investedDate: '2024-02-15',
      status: 'Matured',
      currentValue: '0.83',
      expectedYield: '4.1%',
      maturityDate: '2024-03-15'
    }
  ];

  const fetchInvestmentData = async () => {
    if (!activeAccount) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real contract calls
      // const contractStats = await getInvestorStats(activeAccount.address);
      // setStats(contractStats);

      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setStats(mockStats);
      setInvestments(mockInvestments);

    } catch (err) {
      console.error('Failed to fetch investment stats:', err);
      setError('Failed to load investment data');
      
      // Fallback to mock data on error
      setStats(mockStats);
      setInvestments(mockInvestments);
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentsByStatus = (status?: Investment['status']) => {
    if (!status) return investments;
    return investments.filter(inv => inv.status === status);
  };

  const calculatePortfolioPerformance = () => {
    const totalInvestedNum = parseFloat(stats.totalInvested);
    const totalReturnsNum = parseFloat(stats.totalReturns);
    
    if (totalInvestedNum === 0) return 0;
    
    return ((totalReturnsNum / totalInvestedNum) * 100);
  };

  const getRecentInvestments = (limit: number = 3) => {
    return investments
      .sort((a, b) => new Date(b.investedDate).getTime() - new Date(a.investedDate).getTime())
      .slice(0, limit);
  };

  const refreshData = () => {
    fetchInvestmentData();
  };

  useEffect(() => {
    fetchInvestmentData();
  }, [activeAccount]);

  return {
    stats,
    investments,
    loading,
    error,
    getInvestmentsByStatus,
    calculatePortfolioPerformance,
    getRecentInvestments,
    refreshData
  };
};