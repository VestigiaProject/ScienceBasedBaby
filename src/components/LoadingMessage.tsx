import React, { useState, useEffect } from 'react';
import { Search, BookOpen, FileText, CheckCircle } from 'lucide-react';

const loadingStates = [
  {
    message: "Searching scientific databases...",
    icon: Search
  },
  {
    message: "Analyzing research papers...",
    icon: BookOpen
  },
  {
    message: "Summarizing findings...",
    icon: FileText
  },
  {
    message: "Organizing evidence...",
    icon: CheckCircle
  }
];

export function LoadingMessage() {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState((prev) => (prev + 1) % loadingStates.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingStates[currentState].icon;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin absolute"></div>
        <CurrentIcon className="w-5 h-5 text-gray-400" />
      </div>
      <span className="text-gray-600">{loadingStates[currentState].message}</span>
    </div>
  );
}