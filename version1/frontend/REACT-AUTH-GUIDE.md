# React Authentication with JWT - Step by Step Guide

## What You'll Learn

1. How to store JWT tokens in React
2. How to send tokens with every API request
3. How to handle token expiration
4. How to build login/signup forms
5. How to protect routes (only logged-in users can access)

---

## Part 1: Understanding Token Storage

### Where to Store Tokens?

**Three options:**

#### Option 1: localStorage (Simple, but less secure)
```javascript
// Store
localStorage.setItem('accessToken', token);

// Retrieve
const token = localStorage.getItem('accessToken');

// Remove
localStorage.removeItem('accessToken');
```

**Pros:**
- ✅ Survives page refresh
- ✅ Easy to implement
- ✅ Accessible from any component

**Cons:**
- ❌ Vulnerable to XSS (Cross-Site Scripting) attacks
- ❌ JavaScript can access it

**When to use:** Simple apps, learning projects (like ours!)

---

#### Option 2: Memory (More secure, but lost on refresh)
```javascript
let accessToken = null;

// Store
accessToken = token;

// Retrieve
const token = accessToken;

// Remove
accessToken = null;
```

**Pros:**
- ✅ Not accessible to XSS attacks
- ✅ More secure

**Cons:**
- ❌ Lost on page refresh
- ❌ Need refresh token to restore

**When to use:** Production apps with refresh tokens

---

#### Option 3: HttpOnly Cookies (Most secure, backend sets it)
```javascript
// Backend sets cookie:
res.cookie('accessToken', token, {
  httpOnly: true,  // JavaScript can't access
  secure: true,    // Only sent over HTTPS
  sameSite: 'strict'
});

// Browser automatically sends cookie with every request!
// No JavaScript needed
```

**Pros:**
- ✅ Most secure (JavaScript can't access)
- ✅ Automatic inclusion in requests
- ✅ Protected from XSS

**Cons:**
- ❌ Requires backend changes
- ❌ CSRF protection needed

**When to use:** Production banking apps, high-security apps

---

**For this tutorial, we'll use localStorage (simple and easy to learn)**

---

## Part 2: Creating the Auth Service

This is a file that handles all authentication logic.

### File: `src/services/authService.js`

```javascript
/**
 * authService.js - Handles all authentication API calls
 *
 * This file is like a "helper" that talks to the backend
 * It handles signup, login, logout, and token management
 */

const API_URL = 'http://localhost:3001'; // Backend URL

/**
 * ========================================
 * SIGNUP - Create new user account
 * ========================================
 */
export const signup = async (email, password, fullName) => {
  console.log('📝 Signing up user:', email);

  try {
    // Make POST request to /auth/signup
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
      }),
    });

    // Parse JSON response
    const data = await response.json();

    // Check if request failed
    if (!response.ok) {
      // Backend returned error (400, 409, etc.)
      throw new Error(data.message || 'Signup failed');
    }

    /**
     * SUCCESS! Backend returned:
     * {
     *   accessToken: "eyJhbGc...",
     *   refreshToken: "eyJhbGc...",
     *   user: { id, email, fullName, emailVerified }
     * }
     */
    console.log('✅ Signup successful!');

    // Store tokens in localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    // Store user info
    localStorage.setItem('user', JSON.stringify(data.user));

    return data; // Return to component
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error; // Re-throw so component can handle it
  }
};

/**
 * ========================================
 * LOGIN - Authenticate existing user
 * ========================================
 */
export const login = async (email, password) => {
  console.log('🔐 Logging in user:', email);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('✅ Login successful!');

    // Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

/**
 * ========================================
 * LOGOUT - Clear all tokens
 * ========================================
 */
export const logout = () => {
  console.log('👋 Logging out user');

  // Remove tokens from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Redirect to login page
  window.location.href = '/login';
};

/**
 * ========================================
 * GET CURRENT USER - From localStorage
 * ========================================
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return null; // Not logged in
  }

  try {
    return JSON.parse(userStr); // Convert string back to object
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * ========================================
 * CHECK IF LOGGED IN
 * ========================================
 */
export const isLoggedIn = () => {
  const token = localStorage.getItem('accessToken');
  return !!token; // Convert to boolean (!! means "convert to boolean")
};

/**
 * ========================================
 * MAKE AUTHENTICATED REQUEST
 * ========================================
 *
 * This function adds the access token to any API request
 * Use this for all protected endpoints!
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get access token from localStorage
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('No access token found. Please login.');
  }

  // Add Authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`, // "Bearer" is the standard format
  };

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    // If token expired (401 Unauthorized)
    if (response.status === 401) {
      console.log('⚠️ Access token expired, trying to refresh...');

      // Try to refresh token
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry original request with new token
        return fetchWithAuth(url, options);
      } else {
        // Refresh failed, logout user
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

/**
 * ========================================
 * REFRESH ACCESS TOKEN
 * ========================================
 *
 * Called when access token expires
 * Uses refresh token to get new access token
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    console.log('❌ No refresh token found');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.log('❌ Refresh token expired or invalid');
      return false;
    }

    const data = await response.json();

    // Store new access token
    localStorage.setItem('accessToken', data.accessToken);

    console.log('✅ Access token refreshed!');
    return true;
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return false;
  }
};
```

---

## Part 3: Creating Auth Context (React Hook)

This provides authentication state to all components.

### File: `src/contexts/AuthContext.jsx`

```javascript
/**
 * AuthContext.jsx - Global authentication state
 *
 * This makes user info and auth functions available to ALL components
 * Components can use: const { user, login, logout } = useAuth();
 */

import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

// Create context
const AuthContext = createContext(null);

/**
 * AuthProvider - Wraps your entire app
 *
 * Usage in App.jsx:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * On app load, check if user is already logged in
   */
  useEffect(() => {
    const currentUser = authService.getCurrentUser();

    if (currentUser) {
      setUser(currentUser);
    }

    setLoading(false);
  }, []);

  /**
   * SIGNUP FUNCTION
   */
  const signup = async (email, password, fullName) => {
    const data = await authService.signup(email, password, fullName);
    setUser(data.user); // Update state
    return data;
  };

  /**
   * LOGIN FUNCTION
   */
  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user); // Update state
    return data;
  };

  /**
   * LOGOUT FUNCTION
   */
  const logout = () => {
    authService.logout();
    setUser(null); // Clear state
  };

  /**
   * VALUE TO PROVIDE
   *
   * Any component can access:
   * - user: Current user object or null
   * - login: Function to login
   * - signup: Function to signup
   * - logout: Function to logout
   * - loading: Boolean (true while checking localStorage)
   */
  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * CUSTOM HOOK - useAuth()
 *
 * Usage in any component:
 * const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
```

---

## Part 4: Creating Login Page

### File: `src/pages/LoginPage.jsx`

```javascript
/**
 * LoginPage.jsx - Login form component
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    // Clear previous error
    setError('');

    // Validate
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Call login function from AuthContext
      await login(email, password);

      // Success! Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Show error message
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        {/* Email field */}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>

        {/* Password field */}
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            disabled={loading}
          />
        </div>

        {/* Error message */}
        {error && <div className="error">{error}</div>}

        {/* Submit button */}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Link to signup */}
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
```

---

## Part 5: Creating Signup Page

### File: `src/pages/SignupPage.jsx`

```javascript
/**
 * SignupPage.jsx - Signup form component
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, fullName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Full Name:</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            disabled={loading}
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={loading}
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, uppercase, lowercase, number, special char"
            disabled={loading}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
```

---

## Part 6: Protected Routes

Only logged-in users can access these routes.

### File: `src/components/ProtectedRoute.jsx`

```javascript
/**
 * ProtectedRoute.jsx - Prevents unauthenticated access
 *
 * Usage:
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  // Still checking localStorage
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → show protected page
  return children;
}
```

---

## Part 7: Example Dashboard (Using Token)

### File: `src/pages/Dashboard.jsx`

```javascript
/**
 * Dashboard.jsx - Protected page that shows user info
 */

import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../services/authService';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  /**
   * Fetch user profile using access token
   * (This would be a protected endpoint on backend)
   */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // This automatically includes Authorization header!
        const response = await fetchWithAuth('/user/profile');
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div>
        <h2>Welcome, {user.fullName}!</h2>
        <p>Email: {user.email}</p>
        <p>Account status: {user.emailVerified ? 'Verified ✅' : 'Not verified ❌'}</p>
      </div>

      {profile && (
        <div>
          <h3>Full Profile:</h3>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Part 8: App Setup

### File: `src/App.jsx`

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

## Summary: How It All Works Together

### 1. **User signs up:**
```
SignupPage → useAuth().signup() → authService.signup()
  → POST /auth/signup
  → Backend returns tokens
  → Store in localStorage
  → Update React state
  → Navigate to dashboard
```

### 2. **User logs in:**
```
LoginPage → useAuth().login() → authService.login()
  → POST /auth/login
  → Backend returns tokens
  → Store in localStorage
  → Update React state
  → Navigate to dashboard
```

### 3. **User accesses protected page:**
```
Dashboard → fetchWithAuth('/user/profile')
  → Get token from localStorage
  → Add "Authorization: Bearer <token>" header
  → Send request to backend
  → Backend verifies token
  → Return data
```

### 4. **Token expires:**
```
fetchWithAuth() → 401 Unauthorized
  → Call refreshAccessToken()
  → POST /auth/refresh with refreshToken
  → Get new accessToken
  → Retry original request
```

### 5. **User logs out:**
```
Dashboard → useAuth().logout()
  → Remove tokens from localStorage
  → Clear React state
  → Redirect to login
```

---

Next, I'll show you how to build the **Refresh Token Endpoint** on the backend! Ready?
