import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorDisplay({ message, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="w-full max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-700">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}