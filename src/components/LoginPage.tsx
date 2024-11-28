import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { ExampleQueryDisplay } from './ExampleQueryDisplay';
import { ArrowRight, Heart } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <Logo className="w-48 h-48" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Parent smarter, not harder
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trusted answers to everyday parenting and pregnancy dilemmas, grounded in real research — not grandma's anecdotes.
            </p>
          </div>
          <button
            onClick={handleLogin}
            className="inline-flex items-center justify-center gap-3 bg-white px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 shadow-sm"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>

        {/* Problem/Solution Statement */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Parenting is hard.<br />
              Bad advice makes it harder.
            </h2>
            <p className="text-gray-600">
              Every parent wants the best for their baby, but it's tough to navigate the sea of conflicting advice. Sleep training? Baby-led weaning? Screen time? The internet is full of noise and relatives give contradictory info.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-blue-600">
              That's where Science Based Baby steps in.
            </h2>
            <p className="text-gray-600">
              We simplify real, serious studies into bite-sized pros and cons you can actually use, and give you the sources to check for yourself.
            </p>
          </div>
        </div>

        {/* Example Query Display */}
        <ExampleQueryDisplay />

        {/* How it Works */}
        <div className="space-y-12">
          <h2 className="text-3xl font-bold text-center text-gray-900">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-5xl font-bold text-blue-600">1</div>
              <h3 className="text-xl font-semibold">Type a parenting dilemma</h3>
              <p className="text-gray-600">
                From sleep methods to feeding schedules, we cover every common or less common parenting debates.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-blue-600">2</div>
              <h3 className="text-xl font-semibold">See the evidence</h3>
              <p className="text-gray-600">
                We fetch and summarize real studies—pros, cons, and outcomes — so <em>you</em> can decide what's best.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-blue-600">3</div>
              <h3 className="text-xl font-semibold">Parent with confidence</h3>
              <p className="text-gray-600">
                Make informed decisions, feel good about them.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
          <div className="relative h-32">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentTestimonial ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <p className="text-xl text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                <p className="text-gray-500">– {testimonial.author}</p>
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
        <footer className="text-center space-y-4">
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