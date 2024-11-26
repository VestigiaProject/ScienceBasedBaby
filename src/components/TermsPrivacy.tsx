import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPrivacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Terms of Service & Privacy Policy</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Terms of Service</h2>
            <div className="prose text-gray-600">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
              <ul className="list-disc pl-5 mt-4">
                <li>Service usage terms</li>
                <li>User responsibilities</li>
                <li>Subscription terms</li>
                <li>Cancellation policy</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy Policy</h2>
            <div className="prose text-gray-600">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Data Collection</h3>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Data Usage</h3>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Your Rights</h3>
              <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}