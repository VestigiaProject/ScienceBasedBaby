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
          
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Privacy Policy</h2>
            <div className="prose text-gray-600 max-w-none">
              <p className="text-sm text-gray-500 mb-4">Last updated: 28/11/2024</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">1. Introduction</h3>
              <p>Science Based Baby ("we," "our," "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data when you use our web app.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">2. Information We Collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account Information: Name, email address, and any other details you provide during sign-up.</li>
                <li>Usage Data: Information about how you interact with our app (e.g., pages visited, features used).</li>
                <li>Device Data: Device type, browser, operating system, and IP address.</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">3. How We Use Your Information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>To provide and improve the web app.</li>
                <li>To personalize your experience.</li>
                <li>To analyze usage and performance.</li>
                <li>To communicate with you about updates or relevant information.</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">4. Sharing Your Information</h3>
              <p>We do not sell or share your personal information with third parties, except:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>When required by law.</li>
                <li>With service providers who help us operate the app (e.g., analytics or hosting services).</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">5. Cookies</h3>
              <p>We use cookies to enhance your experience. You can disable cookies in your browser settings, but some features of the app may not work as intended.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">6. Data Security</h3>
              <p>We use industry-standard security measures to protect your data, but no system is 100% secure. Use the app at your own risk.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">7. Your Rights</h3>
              <p>Depending on your location, you may have rights to access, update, or delete your data. Contact us at contact@sciencebasedbaby.com for requests.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">8. Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. Continued use of the app after changes are made indicates your acceptance of the updated policy.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">9. Contact Us</h3>
              <p>For questions about this Privacy Policy, email us at contact@sciencebasedbaby.com.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Terms of Service</h2>
            <div className="prose text-gray-600 max-w-none">
              <p className="text-sm text-gray-500 mb-4">Last updated: 28/11/2024</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">1. Acceptance of Terms</h3>
              <p>By using Science Based Baby, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">2. Eligibility</h3>
              <p>You must be 18 years or older to use this app. By using it, you confirm that you meet this requirement.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">3. Use of the App</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>You may use the app only for personal, non-commercial purposes.</li>
                <li>Do not misuse the app (e.g., attempting to hack, scrape, or distribute harmful content).</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">4. Intellectual Property</h3>
              <p>All content, design, and features of the app, other than referenced articles, are owned by Science Based Baby. You may not copy, reproduce, or distribute any part of the app without our permission.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">5. Disclaimer</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>The app provides informational summaries based on research. It is not medical advice. Always consult a healthcare professional for personal guidance.</li>
                <li>We make no guarantees about the accuracy or completeness of the information provided.</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">6. Limitation of Liability</h3>
              <p>We are not liable for any direct, indirect, or incidental damages resulting from your use of the app.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">7. Account Termination</h3>
              <p>We reserve the right to suspend or terminate your account if you violate these Terms of Service.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">8. Changes to Terms</h3>
              <p>We may update these Terms of Service. Continued use of the app after changes are made indicates your acceptance of the updated terms.</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">9. Contact Us</h3>
              <p>For questions about these Terms of Service, email us at contact@sciencebasedbaby.com.</p>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">11. Subscriptions and Cancellations</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Subscriptions are billed on a recurring basis (e.g., monthly or annually), as specified at the time of purchase.</li>
                <li>You may cancel your subscription at any time through your account settings. Your access will continue until the end of the current billing cycle.</li>
                <li>No refunds will be provided for any unused portion of the subscription period.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}