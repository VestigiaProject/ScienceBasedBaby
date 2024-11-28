import React, { useState, useEffect } from 'react';

const loadingStates = [
  "Searching scientific databases...",
  "Analyzing research papers...",
  "Summarizing findings...",
  "Organizing evidence..."
];

export function LoadingMessage() {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (currentState < loadingStates.length - 1) {
      const interval = setInterval(() => {
        setCurrentState(prev => prev + 1);
      }, 3500); // Increased from 2000ms to 3500ms

      return () => clearInterval(interval);
    }
  }, [currentState]);

  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
      <span className="text-gray-600">{loadingStates[currentState]}</span>
    </div>
  );
}