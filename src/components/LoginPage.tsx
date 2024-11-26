import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Baby } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Baby className="w-16 h-16 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Science-Based Baby</h2>
          <p className="mt-2 text-gray-600">
            Compare evidence-based answers to your pregnancy and parenting questions
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <Link to="/terms-privacy" className="text-blue-600 hover:text-blue-800">
            Terms of Service and Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}