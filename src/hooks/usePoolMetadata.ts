import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Pool metadata from Supabase
export interface PoolMetadata {
    id: string;
    pool_id: number;
    name?: string;
    description: string | null;
    risk_category: string | null;
    target_yield?: number;
    admin_wallet?: string;
    created_at: string;
}

// Map of pool_id to metadata for quick lookup
export type PoolMetadataMap = Map<number, PoolMetadata>;

/**
 * Hook to fetch pool metadata from Supabase
 * Used to enhance blockchain pool data with descriptions and risk categories
 */
export const usePoolMetadata = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch metadata for a single pool
     */
    const getPoolMetadata = useCallback(async (poolId: number): Promise<PoolMetadata | null> => {
        if (!isSupabaseConfigured) {
            return null;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('pool_metadata')
                .select('*')
                .eq('pool_id', poolId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Failed to fetch pool metadata:', fetchError);
                return null;
            }

            return data;
        } catch (err) {
            console.error('Error fetching pool metadata:', err);
            return null;
        }
    }, []);

    /**
     * Fetch metadata for multiple pools at once
     * Returns a Map for quick O(1) lookup by pool_id
     */
    const getPoolsMetadata = useCallback(async (poolIds: number[]): Promise<PoolMetadataMap> => {
        const metadataMap: PoolMetadataMap = new Map();

        if (!isSupabaseConfigured || poolIds.length === 0) {
            return metadataMap;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('pool_metadata')
                .select('*')
                .in('pool_id', poolIds);

            if (fetchError) {
                console.error('Failed to fetch pools metadata:', fetchError);
                setError('Failed to load pool details');
                return metadataMap;
            }

            // Build map for quick lookup
            if (data) {
                for (const metadata of data) {
                    metadataMap.set(metadata.pool_id, metadata);
                }
            }

            return metadataMap;
        } catch (err) {
            console.error('Error fetching pools metadata:', err);
            setError('Failed to load pool details');
            return metadataMap;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get default metadata when pool is not in Supabase
     */
    const getDefaultMetadata = useCallback((poolId: number, poolName?: string): PoolMetadata => {
        return {
            id: `default-${poolId}`,
            pool_id: poolId,
            name: poolName,
            description: 'Diversified pool of export trade financing opportunities',
            risk_category: 'medium',
            target_yield: 4.0,
            created_at: new Date().toISOString()
        };
    }, []);

    /**
     * Format risk category for display
     */
    const formatRiskCategory = useCallback((category: string | null): string => {
        if (!category) return 'Medium';
        return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    }, []);

    /**
     * Get risk color for styling
     */
    const getRiskColor = useCallback((category: string | null): string => {
        const risk = (category || 'medium').toLowerCase();
        switch (risk) {
            case 'low': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'high': return 'text-red-400';
            default: return 'text-gray-400';
        }
    }, []);

    return {
        loading,
        error,
        getPoolMetadata,
        getPoolsMetadata,
        getDefaultMetadata,
        formatRiskCategory,
        getRiskColor
    };
};
