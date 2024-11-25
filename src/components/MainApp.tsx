import React, { useState } from 'react';
import { Baby, LogOut, AlertCircle } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { ResultsDisplay } from './ResultsDisplay';
import { ErrorDisplay } from './ErrorDisplay';
import { queryPerplexity } from '../services/perplexity';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export function MainApp() {
  const { user, logout } = useAuth();
  const { refreshSubscription, debugInfo } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [results, setResults] = useState<{
    pros: string[];
    cons: string[];
    citations: Array<{
      id: number;
      text: string;
      url?: string;
    }>;
  }>({
    pros: [],
    cons: [],
    citations: []
  });

  const isCancelled = debugInfo?.subscriptionStatus === 'canceled' || debugInfo?.cancelAtPeriodEnd;
  const cancelButtonText = isCancelled ? 'Subscription Ending' : 'Cancel Subscription';

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const enhancedQuery = `${query} Only search answers in scientific publications. inurl:pubmed.ncbi.nlm.nih.gov`;
      console.log('Starting search with query:', query);
      const response = await queryPerplexity(enhancedQuery);
      console.log('Setting results:', response);
      setResults(response);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || isCancelled) return;
    
    setCancelLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/.netlify/functions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await refreshSubscription();
      setShowCancelConfirm(false);
      setError('Your subscription will be canceled at the end of the billing period.');
    } catch (err) {
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <Baby className="w-10 h-10 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-800">Science-Based Baby</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={() => !isCancelled && setShowCancelConfirm(true)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cancelLoading || isCancelled}
            >
              {cancelLoading ? 'Canceling...' : cancelButtonText}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription?</h3>
                  <p className="mt-2 text-gray-600">
                    Your subscription will remain active until the end of the current billing period. After that, you'll lose access to the service.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                  disabled={cancelLoading}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Canceling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-8">
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
          
          {error && (
            <ErrorDisplay 
              message={error} 
              onDismiss={() => setError(null)} 
            />
          )}
          
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
              <span className="text-gray-600">Analyzing scientific literature...</span>
            </div>
          ) : (
            results && (results.pros.length > 0 || results.cons.length > 0) && (
              <ResultsDisplay
                pros={results.pros}
                cons={results.cons}
                citations={results.citations}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}