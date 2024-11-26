import React, { useEffect, useState } from 'react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          We use cookies for authentication, analytics, and to provide our services. 
          By using our website, you agree to our use of cookies.
        </p>
        <button
          onClick={acceptCookies}
          className="whitespace-nowrap px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Accept & Close
        </button>
      </div>
    </div>
  );
}