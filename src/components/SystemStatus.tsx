'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface SystemStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function SystemStatus({ showDetails = false, className = '' }: SystemStatusProps) {
  const [health, setHealth] = useState<any>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    
    // Re-check health every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const { checkSystemHealth, getDegradedModeBehavior } = await import('@/lib/compensation');
      const healthData = await checkSystemHealth();
      const behaviorData = getDegradedModeBehavior(healthData);
      
      setHealth(healthData);
      setBehavior(behaviorData);
      setIsLoading(false);
      
      // Reset dismiss if status changed
      if (healthData.consensusStatus !== 'healthy') {
        setIsDismissed(false);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setIsLoading(false);
    }
  };

  // Don't show anything if healthy or dismissed
  if (isLoading || !health || !behavior || health.consensusStatus === 'healthy' || isDismissed) {
    return null;
  }

  const getStatusConfig = () => {
    switch (health.consensusStatus) {
      case 'degraded':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-700',
          badgeColor: 'bg-yellow-600'
        };
      case 'critical':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700',
          badgeColor: 'bg-red-600'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-700',
          badgeColor: 'bg-blue-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={className}>
      <Alert className={`${config.bgColor} ${config.borderColor} relative`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={config.badgeColor}>
                {health.consensusStatus.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-300 font-semibold">
                System Status
              </span>
            </div>
            
            <AlertDescription className="text-slate-300">
              <p className="font-medium mb-1">{behavior.warningMessage}</p>
              {behavior.recommendedAction && (
                <p className="text-sm text-slate-400">{behavior.recommendedAction}</p>
              )}
            </AlertDescription>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Database</p>
                    <div className="flex items-center gap-1 mt-1">
                      {health.supabaseConnection ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-slate-300">
                        {health.supabaseConnection ? 'Online' : 'Offline'}
                      </span>
                      {health.details.supabaseLatency > 0 && (
                        <span className="text-slate-500 text-xs">
                          ({health.details.supabaseLatency}ms)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-slate-500">Smart Contract</p>
                    <div className="flex items-center gap-1 mt-1">
                      {health.contractConnection ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-slate-300">
                        {health.contractConnection ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-500">Fallback Mode</p>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {behavior.fallbackMode}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}