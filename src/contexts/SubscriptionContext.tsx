import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasActiveSubscription(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/check-subscription', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ hasActiveSubscription, loading }}>
      {!loading && children}
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