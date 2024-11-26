import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { PricingPage } from './components/PricingPage';
import { PrivateRoute } from './components/PrivateRoute';
import { MainApp } from './components/MainApp';
import { TermsPrivacy } from './components/TermsPrivacy';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, loading: subscriptionLoading, debugInfo } = useSubscription();

  // Log state changes
  console.log('App render state:', {
    user: user?.uid,
    authLoading,
    subscriptionLoading,
    hasActiveSubscription,
    debugInfo,
    timestamp: new Date().toISOString()
  });

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to={hasActiveSubscription ? "/" : "/pricing"} replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      <Route
        path="/pricing"
        element={
          <PrivateRoute>
            {hasActiveSubscription ? (
              <Navigate to="/" replace />
            ) : (
              <PricingPage />
            )}
          </PrivateRoute>
        }
      />
      <Route path="/terms-privacy" element={<TermsPrivacy />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            {hasActiveSubscription ? (
              <MainApp />
            ) : (
              <Navigate to="/pricing" replace />
            )}
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}