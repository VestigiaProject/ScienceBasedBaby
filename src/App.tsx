import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { PricingPage } from './components/PricingPage';
import { PrivateRoute } from './components/PrivateRoute';
import { MainApp } from './components/MainApp';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();

  // Show loading state while either auth or subscription status is being checked
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