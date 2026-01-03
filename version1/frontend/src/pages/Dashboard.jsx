/**
 * Dashboard.jsx - Main App Dashboard (Protected Route)
 *
 * WHAT IS THIS PAGE?
 * The main page users see after logging in.
 * Shows user information and app features.
 *
 * WHO CAN ACCESS?
 * - Only authenticated users (protected by ProtectedRoute component)
 * - If not logged in → Redirected to /login
 *
 * FEATURES:
 * - Display user info from context
 * - Logout button
 * - Fetch fresh user profile from API
 * - Automatic token refresh (via fetchWithAuth)
 * - Detailed console logging
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  // ============================================================
  // HOOKS
  // ============================================================

  const { user, logout, getUserProfile } = useAuth();

  // ============================================================
  // STATE
  // ============================================================

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================================
  // FETCH USER PROFILE ON MOUNT
  // ============================================================

  /**
   * LOAD USER PROFILE
   *
   * Why fetch profile when we already have user in context?
   * - Context user comes from localStorage (could be stale)
   * - Fetching from API ensures we have latest data
   * - Also tests that JWT token is valid
   * - Demonstrates automatic token refresh
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (error) {
        setError('Failed to load profile. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [getUserProfile]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (error) {
      setError('Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName || 'Loading...'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || ''}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Track your expenses and manage your financial goals.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8 shadow-soft">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">
              Your Profile
            </h3>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-50 disabled:text-gray-400"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading && !profile ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-2">Loading profile...</p>
            </div>
          ) : profile ? (
            <div className="space-y-4">
              {/* Profile Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="mt-1 text-base text-gray-900">
                    {profile.fullName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email Address
                  </label>
                  <p className="mt-1 text-base text-gray-900">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Account Status
                  </label>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Email Verified
                  </label>
                  <p className="mt-1">
                    {profile.emailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Not Verified
                      </span>
                    )}
                  </p>
                </div>

                {profile.lastLoginAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Last Login
                    </label>
                    <p className="mt-1 text-base text-gray-900">
                      {new Date(profile.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {profile.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      Member Since
                    </label>
                    <p className="mt-1 text-base text-gray-900">
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No profile data available</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0.00</p>
              </div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0.00</p>
              </div>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-soft-lg transition-all duration-300">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Card */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Get started with ExpenseTracker
          </h3>
          <p className="text-gray-600 mb-6">
            Your account is set up and ready. Here are your next steps:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add your first expense</h4>
                <p className="text-sm text-gray-600 mt-0.5">Start tracking your spending</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create categories</h4>
                <p className="text-sm text-gray-600 mt-0.5">Food, Transport, Entertainment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-pink-600 font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set monthly budgets</h4>
                <p className="text-sm text-gray-600 mt-0.5">Control your spending</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-rose-600 font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">View insights</h4>
                <p className="text-sm text-gray-600 mt-0.5">Understand your financial habits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/**
 * DASHBOARD FEATURES EXPLAINED:
 *
 * 1. PROTECTED ROUTE
 *    - Wrapped by <ProtectedRoute> in App.jsx
 *    - Only accessible when user is logged in
 *    - Auto-redirects to /login if not authenticated
 *
 * 2. USER CONTEXT
 *    - useAuth() provides user data from context
 *    - user object comes from localStorage (loaded on mount)
 *    - Fast display, no API call needed initially
 *
 * 3. PROFILE API CALL
 *    - getUserProfile() fetches fresh data from backend
 *    - Uses fetchWithAuth() which handles token refresh
 *    - Validates that JWT token is valid
 *    - Demonstrates automatic token refresh
 *
 * 4. AUTOMATIC TOKEN REFRESH
 *    - Access token expires every 15 minutes
 *    - When API returns 401, fetchWithAuth() automatically:
 *      a. Calls /auth/refresh with refresh token
 *      b. Gets new access token
 *      c. Retries original request
 *    - User never notices! Seamless experience
 *
 * 5. LOGOUT
 *    - Clears localStorage (tokens + user)
 *    - Redirects to /login
 *    - User must login again to access dashboard
 *
 * 6. RESPONSIVE DESIGN
 *    - Mobile-first approach with Tailwind CSS
 *    - Grid layouts adapt to screen size
 *    - Works on all devices
 *
 * TESTING TOKEN REFRESH:
 *
 * To test automatic token refresh:
 * 1. Login to dashboard
 * 2. Wait 15 minutes (or modify JWT_EXPIRES_IN to "30s" in backend .env)
 * 3. Click "Refresh" button
 * 4. Check browser console logs:
 *    - You'll see: "Access token expired, refreshing..."
 *    - Then: "Token refreshed successfully"
 *    - Then: "Profile loaded successfully"
 * 5. No error, no logout! Token refreshed automatically ✅
 *
 * DATA FLOW:
 *
 * Dashboard loads
 *   ↓
 * useEffect runs → Calls getUserProfile()
 *   ↓
 * getUserProfile() → Calls authService.getUserProfile()
 *   ↓
 * authService.getUserProfile() → Calls fetchWithAuth('/user/profile')
 *   ↓
 * fetchWithAuth() → GET /user/profile with Authorization header
 *   ↓
 * Backend JwtAuthGuard verifies token
 *   ↓
 * If token valid:
 *   → Returns user data
 *   → Dashboard displays profile ✅
 *   ↓
 * If token expired (401):
 *   → fetchWithAuth() calls refreshAccessToken()
 *   → POST /auth/refresh with refresh token
 *   → Gets new access token
 *   → Stores in localStorage
 *   → Retries GET /user/profile with new token
 *   → Returns user data
 *   → Dashboard displays profile ✅
 *   → User never noticed the refresh!
 */
