import React, { useState } from 'react';
import { Baby, LogOut } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { ResultsDisplay } from './ResultsDisplay';
import { ErrorDisplay } from './ErrorDisplay';
import { queryPerplexity } from '../services/perplexity';
import { useAuth } from '../contexts/AuthContext';

export function MainApp() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const enhancedQuery = `${query} Only search answers in scientific publications, only add citations where we can fetch the url. inurl:pubmed.ncbi.nlm.nih.gov`;
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
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

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