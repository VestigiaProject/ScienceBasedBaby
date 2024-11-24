import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { PricingPage } from './components/PricingPage';
import { PrivateRoute } from './components/PrivateRoute';
import { MainApp } from './components/MainApp';
import { useAuth } from './contexts/AuthContext';
import { useSubscription } from './contexts/SubscriptionContext';

export default function App() {
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/pricing" /> : <LoginPage />} 
      />
      <Route
        path="/pricing"
        element={
          <PrivateRoute>
            {hasActiveSubscription ? <Navigate to="/" /> : <PricingPage />}
          </PrivateRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            {hasActiveSubscription ? <MainApp /> : <Navigate to="/pricing" />}
          </PrivateRoute>
        }
      />
    </Routes>
  );
}