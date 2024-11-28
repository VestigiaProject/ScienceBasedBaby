import React, { useState } from 'react';
import { LogOut, AlertCircle, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBox } from './SearchBox';
import { ResultsDisplay } from './ResultsDisplay';
import { ErrorDisplay } from './ErrorDisplay';
import { Logo } from './Logo';
import { queryPerplexity } from '../services/perplexity';
import { NotRelevantError } from '../services/errors';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export function MainApp() {
  const { user, logout } = useAuth();
  const { refreshSubscription, debugInfo } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  const isCancelled = debugInfo?.subscriptionStatus === 'canceled' || 
    (typeof debugInfo?.cancelAtPeriodEnd === 'string' ? 
      debugInfo.cancelAtPeriodEnd === 'true' : 
      !!debugInfo?.cancelAtPeriodEnd);
  
  const cancelButtonText = isCancelled ? 'Subscription Ending' : 'Cancel Subscription';

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setShowMenu(false);
    try {
      console.log('Starting search with query:', query);
      const response = await queryPerplexity(query);
      console.log('Setting results:', response);
      setResults(response);
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof NotRelevantError) {
        setResults({ pros: [], cons: [], citations: [] });
      }
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
        <header className="relative mb-12">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-600 truncate max-w-[200px]">
              {user?.email}
            </span>
          </div>

          {showMenu && (
            <div className="md:hidden absolute top-12 left-0 right-0 bg-white shadow-lg rounded-lg p-4 z-50">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => !isCancelled && setShowCancelConfirm(true)}
                  className={`px-4 py-2 text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCancelled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
          )}

          <div className="flex justify-center">
            <Logo className="w-32 h-32 md:w-48 md:h-48" />
          </div>

          <div className="hidden md:flex md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:items-center md:gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={() => !isCancelled && setShowCancelConfirm(true)}
              className={`px-4 py-2 text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isCancelled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
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
        </header>

        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <div className="text-center max-w-2xl">
            <p className="text-lg text-gray-600">
              Get advice on pregnancy and parenting questions based on scientific studies. 
              We show you the pros and cons, you make your opinion.
            </p>
          </div>

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

          <div className="mt-8 text-center text-sm text-gray-500 max-w-2xl">
            <p>
              We strive to provide accurate and science-based results, but AI can be subject to mistakes or imprecisions. 
              Always check your sources and consult a medical professional if necessary.
            </p>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-gray-400">
          <Link to="/terms-privacy" className="hover:text-gray-600">
            Terms of Service & Privacy Policy
          </Link>
        </footer>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
      </div>
    </div>
  );
}