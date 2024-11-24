import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Shield, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = loadStripe('pk_live_51QOikAIBNO0m5vVtnVOFpvGifoIW3rJTRIwKAy2qSoA1CELzLEG28tpBWThjeGFgHmphuKym3muiRiAPGvQVGR5T00lfflno8N');

const plans = [
  {
    name: 'Monthly',
    price: '$9.99',
    interval: 'month',
    priceId: 'prod_RHIMijF5maYYSS',
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
    priceId: 'prod_RHIMCsn4ig0OXa',
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

  const handleSubscribe = async (priceId: string) => {
    try {
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
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Get access to evidence-based parenting advice
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{plan.interval}
                  </span>
                </p>
                <button
                  onClick={() => handleSubscribe(plan.priceId)}
                  className="mt-8 block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition duration-150 ease-in-out"
                >
                  Subscribe
                </button>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h4 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="text-base text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}