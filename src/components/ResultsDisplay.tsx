import React from 'react';
import { CheckCircle, XCircle, Link } from 'lucide-react';

interface Citation {
  id: number;
  text: string;
  url?: string;
}

interface ResultsDisplayProps {
  pros: string[];
  cons: string[];
  citations: Citation[];
}

export function ResultsDisplay({ pros, cons, citations }: ResultsDisplayProps) {
  if (!pros.length && !cons.length) return null;

  const renderText = (text: string) => {
    // Replace citation numbers [n] with linked superscript
    return text.split(/(\[\d+\])/).map((part, index) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationId = parseInt(citationMatch[1], 10);
        const citation = citations.find(c => c.id === citationId);
        if (citation) {
          return (
            <sup key={index} className="ml-0.5">
              <a
                href={citation.url || '#citations'}
                className="text-blue-600 hover:text-blue-800"
                target={citation.url ? "_blank" : undefined}
                rel={citation.url ? "noopener noreferrer" : undefined}
              >
                [{citationId}]
              </a>
            </sup>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-green-600 flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5" />
            Scientific Evidence Supporting
          </h2>
          <ul className="space-y-3">
            {pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>{renderText(pro)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5" />
            Scientific Concerns
          </h2>
          <ul className="space-y-3">
            {cons.map((con, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 mt-1">•</span>
                <span>{renderText(con)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {citations.length > 0 && (
        <div id="citations" className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Link className="w-5 h-5" />
            Scientific Citations
          </h2>
          <ol className="space-y-2 list-decimal list-inside">
            {citations.map((citation) => (
              <li key={citation.id} className="text-sm text-gray-600">
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    {citation.text}
                  </a>
                ) : (
                  citation.text
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}