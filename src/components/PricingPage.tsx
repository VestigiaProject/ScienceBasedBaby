import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Shield, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const plans = [
  {
    name: 'Monthly',
    price: '$9.99',
    interval: 'month',
    priceId: 'price_live_H5ggYwtDq4fbrJ',
    features: [
      'Evidence-based answers',
      'Scientific citations',
      'Unlimited questions',
      'Access to all features'
    ]
  },
  {
    name: 'Annual',
    price: '$99.99',
    interval: 'year',
    priceId: 'price_live_H5ggYwtDq4fbrK',
    features: [
      'Everything in Monthly',
      '2 months free',
      'Priority support',
      'Early access to new features'
    ]
  }
];

export function PricingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(priceId);
      setError(null);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user?.uid,
          userEmail: user?.email,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start subscription');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-2 text-3xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="mt-4 text-xl text-gray-600">
            Get evidence-based answers to your parenting questions
          </p>
        </div>

        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.priceId}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/{plan.interval}</span>
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={!!isLoading}
                  className={`mt-8 w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isLoading === plan.priceId ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading === plan.priceId ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}