import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  error: string | null;
  debugInfo: any; // For debugging
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      console.log('No user, clearing subscription state');
      setHasActiveSubscription(false);
      setLoading(false);
      setError(null);
      setDebugInfo(null);
      return;
    }

    console.log('Checking subscription for user:', user.uid);
    try {
      const token = await user.getIdToken(true);
      const response = await fetch('/.netlify/functions/check-subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check subscription status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Subscription check response:', data);
      
      setHasActiveSubscription(data.hasActiveSubscription);
      setDebugInfo(data);
      setError(null);

      // Log detailed subscription state
      console.log('Updated subscription state:', {
        hasActiveSubscription: data.hasActiveSubscription,
        subscriptionStatus: data.subscriptionStatus,
        currentPeriodEnd: data.currentPeriodEnd,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify subscription');
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshSubscription = async () => {
    console.log('Manually refreshing subscription');
    setLoading(true);
    await checkSubscription();
  };

  useEffect(() => {
    console.log('SubscriptionProvider mounted or user changed');
    checkSubscription();

    const intervalId = setInterval(() => {
      console.log('Running periodic subscription check');
      checkSubscription();
    }, REFRESH_INTERVAL);

    return () => {
      console.log('Cleaning up subscription check interval');
      clearInterval(intervalId);
    };
  }, [user, checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ 
      hasActiveSubscription, 
      loading, 
      refreshSubscription,
      error,
      debugInfo
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}