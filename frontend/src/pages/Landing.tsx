import { useNavigate } from 'react-router-dom';
import { IoTrendingUp, IoShieldCheckmark, IoSpeedometer, IoAnalytics } from 'react-icons/io5';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <IoTrendingUp className="text-5xl text-primary-500" />,
      title: 'Track Expenses',
      description: 'Monitor your spending effortlessly with intelligent categorization',
    },
    {
      icon: <IoAnalytics className="text-5xl text-secondary-500" />,
      title: 'Smart Analytics',
      description: 'Get insights with AI-powered expense analysis and predictions',
    },
    {
      icon: <IoShieldCheckmark className="text-5xl text-cyan-500" />,
      title: 'Secure & Private',
      description: 'Bank-level security with encrypted data storage',
    },
    {
      icon: <IoSpeedometer className="text-5xl text-emerald-500" />,
      title: 'Real-time Sync',
      description: 'Access your data anywhere, anytime with instant synchronization',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-500">ExpenseAI</h1>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 border-2 border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Smart Expense Tracking
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Take control of your finances with AI-powered insights and intuitive expense management
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-primary-500 text-white text-lg font-semibold rounded-lg hover:bg-primary-600 transition-colors shadow-lg"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-primary-500 text-primary-500 text-lg font-semibold rounded-lg hover:bg-primary-50 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything you need
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Powerful features to manage your expenses effortlessly
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 text-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-500 rounded-2xl p-12 my-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users managing their finances smarter
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-primary-500 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center opacity-80">
            © 2025 ExpenseAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
