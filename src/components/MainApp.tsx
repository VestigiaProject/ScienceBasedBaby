import React, { useState } from 'react';
import { LogOut, AlertCircle, Menu, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBox } from './SearchBox';
import { ResultsDisplay } from './ResultsDisplay';
import { ErrorDisplay } from './ErrorDisplay';
import { LoadingMessage } from './LoadingMessage';
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
      const response = await queryPerplexity(query);
      setResults(response);
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <div className="md:hidden">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
            <span className="text-gray-600">{user?.email}</span>
          </div>
          <div className="hidden md:flex md:items-center md:gap-4">
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
        </nav>

        {showMenu && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
            <div className="flex flex-col gap-2">
              <span className="text-gray-600 truncate">{user?.email}</span>
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

        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <Logo className="w-36 h-36 md:w-44 md:h-44" />
          </div>

          <div className="text-center max-w-2xl">
            <p className="text-xl text-gray-600 mb-8">
              Get clear, unbiased answers to your parenting and pregnancy questions,
              supported by the latest scientific research.
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
            <LoadingMessage />
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

        <footer className="mt-12 text-center space-y-3">
          <p className="flex items-center justify-center gap-2 text-gray-600">
            made with <Heart className="w-4 h-4 text-blue-500 fill-current" /> for parents, by parents
          </p>
          <Link to="/terms-privacy" className="text-xs text-gray-400 hover:text-gray-600">
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