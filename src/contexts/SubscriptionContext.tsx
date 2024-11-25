import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setHasActiveSubscription(false);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const token = await user.getIdToken(true); // Force token refresh
      const response = await fetch('/.netlify/functions/check-subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const data = await response.json();
      setHasActiveSubscription(data.hasActiveSubscription);
      setError(null);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify subscription');
      // Don't change hasActiveSubscription state on error to prevent incorrect redirects
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshSubscription = async () => {
    setLoading(true);
    await checkSubscription();
  };

  useEffect(() => {
    checkSubscription();

    // Set up periodic refresh
    const intervalId = setInterval(checkSubscription, REFRESH_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [user, checkSubscription]);

  // Add visibility change listener to refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ 
      hasActiveSubscription, 
      loading, 
      refreshSubscription,
      error 
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