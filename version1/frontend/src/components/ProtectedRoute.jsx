/**
 * ProtectedRoute.jsx - Route Protection Component
 *
 * WHAT IS THIS FILE?
 * This component wraps routes that require authentication (like Dashboard).
 * If user is NOT logged in → Redirect to login page
 * If user IS logged in → Show the protected content
 *
 * WHAT IS A HIGHER-ORDER COMPONENT (HOC)?
 * A component that wraps another component to add functionality.
 * This is a HOC that adds "authentication checking" to routes.
 *
 * PROBLEM WITHOUT PROTECTED ROUTES:
 * - User types /dashboard in URL
 * - Dashboard shows even if not logged in
 * - User can see protected data! ❌
 *
 * SOLUTION WITH PROTECTED ROUTES:
 * - User types /dashboard in URL
 * - ProtectedRoute checks: Is user logged in?
 * - No → Redirect to /login ✅
 * - Yes → Show dashboard ✅
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * PROTECTED ROUTE COMPONENT
 *
 * Usage in routing:
 *
 * WITHOUT ProtectedRoute (anyone can access):
 * <Route path="/dashboard" element={<Dashboard />} />
 *
 * WITH ProtectedRoute (only logged-in users):
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 *
 * @param {React.ReactNode} children - The component to protect (e.g., <Dashboard />)
 */
const ProtectedRoute = ({ children }) => {
  // ============================================================
  // GET AUTH STATE
  // ============================================================

  /**
   * useAuth() gets current auth state from AuthContext
   * - isLoggedIn: Boolean (true if user exists, false otherwise)
   * - loading: Boolean (true while checking localStorage on mount)
   */
  const { isLoggedIn, loading } = useAuth();

  /**
   * useLocation() gets current URL location
   * Used to save where user was trying to go, so we can redirect back after login
   *
   * Example:
   * - User tries to access /dashboard
   * - Not logged in → Redirect to /login?redirect=/dashboard
   * - User logs in → Redirect back to /dashboard ✅
   */
  const location = useLocation();

  // ============================================================
  // LOADING STATE
  // ============================================================

  /**
   * WHY CHECK LOADING?
   *
   * Without this check:
   * 1. App loads → AuthContext is checking localStorage (loading = true, isLoggedIn = false)
   * 2. ProtectedRoute sees isLoggedIn = false
   * 3. Redirects to login! ❌
   * 4. Then AuthContext finishes → Finds user (isLoggedIn = true)
   * 5. Too late! Already redirected!
   *
   * With this check:
   * 1. App loads → AuthContext is checking localStorage (loading = true)
   * 2. ProtectedRoute sees loading = true
   * 3. Shows loading spinner, waits...
   * 4. AuthContext finishes → Finds user (isLoggedIn = true, loading = false)
   * 5. ProtectedRoute sees isLoggedIn = true
   * 6. Shows protected content! ✅
   */
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Checking authentication...
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATION CHECK
  // ============================================================

  /**
   * NOT LOGGED IN → REDIRECT TO LOGIN
   *
   * Navigate component from react-router-dom redirects user
   *
   * state={{ from: location }} saves where user was trying to go
   * Login page can access this and redirect back after successful login
   *
   * Example:
   * User tries to access /dashboard/settings
   * → Redirects to /login
   * → After login, redirect to /dashboard/settings (saved in state.from)
   */
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ============================================================
  // AUTHENTICATED → SHOW PROTECTED CONTENT
  // ============================================================

  // User is logged in, show the protected content!
  return children;
};

export default ProtectedRoute;

/**
 * COMPLETE ROUTING EXAMPLE:
 *
 * import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
 * import ProtectedRoute from './components/ProtectedRoute';
 * import LandingPage from './pages/LandingPage';
 * import LoginPage from './pages/LoginPage';
 * import SignupPage from './pages/SignupPage';
 * import Dashboard from './pages/Dashboard';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           // Public routes (anyone can access)
 *           <Route path="/" element={<LandingPage />} />
 *           <Route path="/login" element={<LoginPage />} />
 *           <Route path="/signup" element={<SignupPage />} />
 *           <Route path="/forgot-password" element={<ForgotPasswordPage />} />
 *           <Route path="/reset-password" element={<ResetPasswordPage />} />
 *
 *           // Protected routes (only authenticated users)
 *           <Route path="/dashboard" element={
 *             <ProtectedRoute>
 *               <Dashboard />
 *             </ProtectedRoute>
 *           } />
 *
 *           <Route path="/profile" element={
 *             <ProtectedRoute>
 *               <ProfilePage />
 *             </ProtectedRoute>
 *           } />
 *
 *           <Route path="/settings" element={
 *             <ProtectedRoute>
 *               <SettingsPage />
 *             </ProtectedRoute>
 *           } />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 *
 * FLOW EXAMPLES:
 *
 * Example 1: Logged-in user accesses /dashboard
 * 1. User navigates to /dashboard
 * 2. ProtectedRoute checks: isLoggedIn = true
 * 3. Shows <Dashboard /> ✅
 *
 * Example 2: Logged-out user tries to access /dashboard
 * 1. User navigates to /dashboard
 * 2. ProtectedRoute checks: isLoggedIn = false
 * 3. Redirects to /login ✅
 * 4. location.state.from = "/dashboard" (saved for after login)
 *
 * Example 3: User logs in from redirect
 * 1. User was redirected from /dashboard to /login
 * 2. User enters credentials, clicks Login
 * 3. Login successful
 * 4. Check location.state.from
 * 5. Redirect to location.state.from (/dashboard) ✅
 *
 * Example 4: User logs in directly (not from redirect)
 * 1. User navigates directly to /login
 * 2. User enters credentials, clicks Login
 * 3. Login successful
 * 4. No location.state.from (user came directly)
 * 5. Redirect to default page (/dashboard) ✅
 *
 * SECURITY NOTES:
 *
 * 1. CLIENT-SIDE PROTECTION ONLY
 *    - This protects the UI (what user sees)
 *    - Does NOT protect the API!
 *    - Backend MUST verify JWT token on every request
 *    - Never trust the client!
 *
 * 2. TOKEN STORAGE
 *    - Access token in localStorage
 *    - Check if token exists → isLoggedIn
 *    - Backend verifies token is valid
 *
 * 3. AUTOMATIC REFRESH
 *    - authService.fetchWithAuth() handles token refresh
 *    - If access token expires → Auto-refresh with refresh token
 *    - If refresh fails → Auto-logout, redirect to login
 *
 * 4. ROUTE PROTECTION LEVELS
 *    - Public routes: No protection needed
 *    - Authenticated routes: Use ProtectedRoute (logged in)
 *    - Role-based routes: Add role checking to ProtectedRoute
 *      Example: <ProtectedRoute requiredRole="admin">
 */
