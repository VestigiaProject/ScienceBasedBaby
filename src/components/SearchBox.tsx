import React, { useState } from 'react';
import { Search, Lightbulb } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const exampleQuestions = [
  "Is screen time harmful for babies under 2?",
  "Should I absolutely breastfeed?",
  "Can I eat cheese when breastfeeding?"
];

export function SearchBox({ onSearch, isLoading }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleExampleClick = (question: string) => {
    setQuery(question);
    onSearch(question);
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your pregnancy or parenting question..."
            className="w-full px-4 py-3 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-500 disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {!isLoading && !query && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lightbulb className="w-4 h-4" />
            <span>Try these examples:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(question)}
                className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors duration-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}