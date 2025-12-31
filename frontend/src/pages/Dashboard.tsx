import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoLogOut, IoWallet, IoTrendingUp, IoCalendar, IoGrid } from 'react-icons/io5';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = [
    {
      title: 'Total Expenses',
      value: '$0.00',
      icon: <IoWallet className="text-3xl" />,
      color: 'bg-blue-500',
    },
    {
      title: 'This Month',
      value: '$0.00',
      icon: <IoCalendar className="text-3xl" />,
      color: 'bg-green-500',
    },
    {
      title: 'Avg. Daily',
      value: '$0.00',
      icon: <IoTrendingUp className="text-3xl" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Categories',
      value: '0',
      icon: <IoGrid className="text-3xl" />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-500">ExpenseAI</h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <IoLogOut className="text-lg" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋
          </h2>
          <p className="text-lg opacity-90">
            Here's an overview of your finances
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Expenses */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 mb-2">No expenses yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Start tracking your expenses to see them here
              </p>
              <button className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition">
                Add Your First Expense
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Account Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Currency</p>
                <p className="font-medium text-gray-900">{user?.currencyCode || 'USD'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email Verified</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    user?.emailVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {user?.emailVerified ? '✓ Verified' : '⚠ Not Verified'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
