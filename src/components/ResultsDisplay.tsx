import React from 'react';
import { CheckCircle, XCircle, Link, ExternalLink } from 'lucide-react';
import { Source } from '../types/answers';

interface ResultsDisplayProps {
  pros: string[];
  cons: string[];
  sources: Source[];
}

export function ResultsDisplay({ pros, cons, sources }: ResultsDisplayProps) {
  if (!pros.length && !cons.length) return null;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-green-600 flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5" />
            Scientific Pros
          </h2>
          <ul className="space-y-3">
            {pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5" />
            Scientific Cons
          </h2>
          <ul className="space-y-3">
            {cons.map((con, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Link className="w-5 h-5" />
            Scientific Sources
          </h2>
          <ul className="space-y-4">
            {sources.map((source, index) => (
              <li key={index} className="text-sm">
                <a
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-blue-600 hover:text-blue-800 flex-1">
                      {source.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                  <p className="text-gray-600 mt-1 line-clamp-2">{source.snippet}</p>
                  <p className="text-gray-400 text-xs mt-1">{source.link}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}