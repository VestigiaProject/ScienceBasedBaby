import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ExampleQueryDisplay } from './ExampleQueryDisplay';
import { Heart, BookOpen, Scale, Brain } from 'lucide-react';

const testimonials = [
  {
    quote: "Finally, a tool that cuts through the noise. I made better choices in weeks.",
    author: "Marie, first-time mom"
  },
  {
    quote: "Science Based Baby saved me HOURS googling about sleep training. 10/10.",
    author: "Alex, sleep-deprived dad"
  }
];

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [currentTestimonial, setCurrentTestimonial] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex justify-end mb-12">
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            Sign in with Google
          </button>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-8">
            <Logo className="w-48 h-48" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Parenting Decisions, <span className="text-blue-600">Backed by Science</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Get clear, unbiased answers to your parenting and pregnancy questions,
            supported by the latest scientific research.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Evidence-Based Answers</h3>
            <p className="text-gray-600">
              All information is backed by peer-reviewed scientific studies and expert consensus.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Scale className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Pros and Cons</h3>
            <p className="text-gray-600">
              Get a balanced view of different approaches, helping you make informed decisions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <Brain className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access to Research</h3>
            <p className="text-gray-600">
              Direct links to scientific papers and studies for those who want to dive deeper.
            </p>
          </div>
        </div>

        {/* Example Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">See it in action</h2>
          <ExampleQueryDisplay />
        </div>

        {/* How it Works */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-5xl font-bold text-blue-600">1</div>
              <h3 className="text-xl font-semibold">Ask Your Question</h3>
              <p className="text-gray-600">
                From sleep methods to feeding schedules, we cover every parenting topic.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl font-bold text-blue-600">2</div>
              <h3 className="text-xl font-semibold">Get Evidence</h3>
              <p className="text-gray-600">
                We analyze real studies and present clear pros and cons.
              </p>
            </div>
            <div className="space-y-3">
              <div className="text-5xl font-bold text-blue-600">3</div>
              <h3 className="text-xl font-semibold">Decide Confidently</h3>
              <p className="text-gray-600">
                Make informed choices backed by science.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 max-w-3xl mx-auto mb-16">
          <div className="relative h-32">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="text-xl text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                <p className="text-gray-600">– {testimonial.author}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center space-y-3">
          <p className="flex items-center justify-center gap-2 text-gray-600">
            made with <Heart className="w-4 h-4 text-blue-500 fill-current" /> for parents, by parents
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <Link to="/terms-privacy#privacy" className="hover:text-gray-700">Privacy Policy</Link>
            <Link to="/terms-privacy#terms" className="hover:text-gray-700">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}