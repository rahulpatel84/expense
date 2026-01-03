/**
 * AuthContext.jsx - Global Authentication State Management
 *
 * WHAT IS THIS FILE?
 * This creates a React Context that provides authentication state and methods
 * to all components in the application without prop drilling.
 *
 * WHAT IS CONTEXT?
 * Context is React's way to share data across the entire component tree without
 * passing props manually at every level.
 *
 * Example WITHOUT Context:
 * App → Header (user prop) → Navigation (user prop) → UserMenu (finally uses user)
 * Problem: Header and Navigation don't need user, just passing it down!
 *
 * Example WITH Context:
 * App (provides user) → Header → Navigation → UserMenu (consumes user directly)
 * UserMenu can access user without Header/Navigation knowing about it!
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

/**
 * CREATE CONTEXT
 *
 * createContext() creates two components:
 * 1. AuthContext.Provider - Provides the values
 * 2. AuthContext.Consumer - Consumes the values (we'll use useContext instead)
 */
const AuthContext = createContext(null);

/**
 * CUSTOM HOOK - useAuth()
 *
 * This makes it easy for components to access auth state:
 *
 * Usage in any component:
 * import { useAuth } from '../contexts/AuthContext';
 *
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *   return <div>Welcome {user?.fullName}</div>;
 * }
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * AUTH PROVIDER COMPONENT
 *
 * This wraps the entire app and provides authentication state to all children.
 *
 * Usage in main.jsx or App.jsx:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  /**
   * USER STATE
   * Holds current user info: { id, email, fullName }
   * null if not logged in
   */
  const [user, setUser] = useState(null);

  /**
   * LOADING STATE
   * true when checking if user is already logged in (on mount)
   * Prevents flash of login screen if user is actually logged in
   */
  const [loading, setLoading] = useState(true);

  // ============================================================
  // INITIALIZATION - Check if User Already Logged In
  // ============================================================

  /**
   * ON MOUNT: Check localStorage for existing user
   *
   * Why? If user was logged in and refreshes page, we want to restore their session
   *
   * Flow:
   * 1. Component mounts
   * 2. Check localStorage for 'user' and 'accessToken'
   * 3. If found: User is logged in → Set user state
   * 4. If not found: User is logged out → Keep user as null
   * 5. Set loading to false
   */
  useEffect(() => {
    const initializeAuth = () => {
      const isLoggedIn = authService.isLoggedIn();
      if (isLoggedIn) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // ============================================================
  // AUTHENTICATION METHODS
  // ============================================================

  /**
   * LOGIN METHOD
   *
   * What it does:
   * 1. Calls authService.login() (makes API request)
   * 2. If successful: Sets user state
   * 3. Returns user data to component
   *
   * Usage:
   * const { login } = useAuth();
   * await login('john@example.com', 'password123');
   */
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * SIGNUP METHOD
   *
   * What it does:
   * 1. Calls authService.signup() (makes API request)
   * 2. If successful: Sets user state (auto-login after signup)
   * 3. Returns user data to component
   *
   * Usage:
   * const { signup } = useAuth();
   * await signup('john@example.com', 'MySecure123@', 'John Doe');
   */
  const signup = async (email, password, fullName) => {
    try {
      const data = await authService.signup(email, password, fullName);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * LOGOUT METHOD
   *
   * What it does:
   * 1. Calls authService.logout() (clears localStorage, redirects)
   * 2. Clears user state
   *
   * Note: authService.logout() redirects to /login, so state update might not matter
   * But we do it anyway for consistency
   *
   * Usage:
   * const { logout } = useAuth();
   * logout();
   */
  const logout = () => {
    setUser(null);
    authService.logout();
  };

  /**
   * FORGOT PASSWORD METHOD
   *
   * What it does:
   * 1. Calls authService.forgotPassword() (sends reset email)
   * 2. Returns response to component
   *
   * Usage:
   * const { forgotPassword } = useAuth();
   * await forgotPassword('john@example.com');
   */
  const forgotPassword = async (email) => {
    try {
      const data = await authService.forgotPassword(email);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * RESET PASSWORD METHOD
   *
   * What it does:
   * 1. Calls authService.resetPassword() (resets password with token)
   * 2. Returns response to component
   *
   * Usage:
   * const { resetPassword } = useAuth();
   * await resetPassword('reset-token-here', 'NewPassword123@');
   */
  const resetPassword = async (token, newPassword) => {
    try {
      const data = await authService.resetPassword(token, newPassword);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET USER PROFILE METHOD
   *
   * What it does:
   * 1. Calls authService.getUserProfile() (fetches from API)
   * 2. Updates user state with fresh data
   *
   * Usage:
   * const { getUserProfile } = useAuth();
   * await getUserProfile();
   */
  const getUserProfile = async () => {
    try {
      const data = await authService.getUserProfile();
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  /**
   * VALUE OBJECT
   *
   * This object is provided to all children components via context
   *
   * Components can access any of these:
   * - user: Current user object or null
   * - loading: Boolean indicating if we're checking for existing session
   * - isLoggedIn: Boolean for easy logged-in check
   * - login: Function to login
   * - signup: Function to signup
   * - logout: Function to logout
   * - forgotPassword: Function to request password reset
   * - resetPassword: Function to reset password
   * - getUserProfile: Function to fetch fresh user data
   */
  const value = {
    user,
    loading,
    isLoggedIn: !!user, // !! converts user to boolean (null → false, object → true)
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    getUserProfile,
  };

  // ============================================================
  // RENDER
  // ============================================================

  /**
   * LOADING STATE
   *
   * While checking for existing session, show nothing (or a spinner)
   * This prevents flash of wrong UI
   *
   * Without this:
   * 1. App loads → Shows login screen (user is null)
   * 2. useEffect runs → Finds user in localStorage
   * 3. Shows dashboard → User sees flash from login to dashboard!
   *
   * With this:
   * 1. App loads → Shows nothing (loading is true)
   * 2. useEffect runs → Finds user in localStorage
   * 3. Shows dashboard → Smooth! No flash!
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
        Loading...
      </div>
    );
  }

  /**
   * PROVIDE CONTEXT
   *
   * AuthContext.Provider makes the 'value' object available to all children
   * Any component inside <AuthProvider> can call useAuth() to access this value
   */
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * EXAMPLE USAGE IN COMPONENTS:
 *
 * import { useAuth } from '../contexts/AuthContext';
 *
 * function LoginPage() {
 *   const { login, isLoggedIn } = useAuth();
 *   const [email, setEmail] = useState('');
 *   const [password, setPassword] = useState('');
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     try {
 *       await login(email, password);
 *       // Login successful - user state updated automatically!
 *       // Can redirect or let routing handle it
 *     } catch (error) {
 *       alert(error.message);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input value={email} onChange={e => setEmail(e.target.value)} />
 *       <input value={password} onChange={e => setPassword(e.target.value)} />
 *       <button type="submit">Login</button>
 *     </form>
 *   );
 * }
 *
 * function Dashboard() {
 *   const { user, logout } = useAuth();
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.fullName}!</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/login" element={<LoginPage />} />
 *           <Route path="/dashboard" element={<Dashboard />} />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 */

export default AuthProvider;
