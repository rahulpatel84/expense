/**
 * SignupPage.jsx - User Registration Form
 *
 * WHAT IS THIS PAGE?
 * Allows new users to create an account.
 *
 * FEATURES:
 * - Full name, email, and password fields
 * - Password strength validation
 * - Confirm password field
 * - Real-time validation feedback
 * - Auto-login after successful signup
 * - Redirect to dashboard
 * - Detailed console logging
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  // ============================================================
  // HOOKS
  // ============================================================

  const navigate = useNavigate();
  const { signup, isLoggedIn } = useAuth();

  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  // ============================================================
  // AUTO-REDIRECT IF ALREADY LOGGED IN
  // ============================================================

  useEffect(() => {
    if (isLoggedIn) {
      console.log('ℹ️ [SIGNUP PAGE] User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  // ============================================================
  // PASSWORD STRENGTH CHECKER
  // ============================================================

  /**
   * CHECK PASSWORD STRENGTH
   *
   * Provides real-time feedback on password quality
   *
   * Requirements (from backend):
   * - At least 8 characters
   * - At least one lowercase letter
   * - At least one uppercase letter
   * - At least one number
   * - At least one special character (@$!%*?&)
   */
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }

    let strength = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('at least 8 characters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('one lowercase letter');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('one uppercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('one number');
    }

    // Special character check
    if (/[@$!%*?&]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('one special character (@$!%*?&)');
    }

    // Set strength level
    if (strength === 5) {
      setPasswordStrength('strong');
      console.log('✅ [SIGNUP PAGE] Password strength: Strong');
    } else if (strength >= 3) {
      setPasswordStrength('medium');
      console.log('⚠️ [SIGNUP PAGE] Password strength: Medium - Missing: ' + feedback.join(', '));
    } else {
      setPasswordStrength('weak');
      console.log('❌ [SIGNUP PAGE] Password strength: Weak - Missing: ' + feedback.join(', '));
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  /**
   * HANDLE INPUT CHANGE
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(`📝 [SIGNUP PAGE] Input changed: ${name}`);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check password strength in real-time
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Check if passwords match in real-time
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const pwd = name === 'password' ? value : formData.password;
      const confirmPwd = name === 'confirmPassword' ? value : formData.confirmPassword;

      if (confirmPwd && pwd !== confirmPwd) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  /**
   * VALIDATE FORM
   *
   * Comprehensive client-side validation
   */
  const validateForm = () => {
    console.log('🔍 [SIGNUP PAGE] Validating form...');

    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ [SIGNUP PAGE] Validation failed:', newErrors);
      return false;
    }

    console.log('✅ [SIGNUP PAGE] Form validation passed');
    return true;
  };

  /**
   * HANDLE FORM SUBMIT
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 [SIGNUP PAGE] Signup form submitted');
    console.log('📧 [SIGNUP PAGE] Email:', formData.email);
    console.log('👤 [SIGNUP PAGE] Full Name:', formData.fullName);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 [SIGNUP PAGE] Calling signup function...');

      // Call signup from AuthContext
      await signup(formData.email, formData.password, formData.fullName);

      console.log('✅ [SIGNUP PAGE] Signup successful! Auto-logged in.');

      // Redirect to dashboard (user is now logged in)
      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('❌ [SIGNUP PAGE] Signup failed:', error.message);

      /**
       * HANDLE ERRORS
       *
       * Common errors:
       * - Email already registered
       * - Weak password (shouldn't happen with client validation)
       * - Network error
       */
      if (error.message.includes('Email already registered') || error.message.includes('already exists')) {
        setErrors({ email: 'This email is already registered. Please login instead.' });
      } else if (error.message.includes('password')) {
        setErrors({ password: error.message });
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setErrors({ general: 'Unable to connect to server. Please check your internet connection.' });
      } else {
        setErrors({ general: error.message || 'An error occurred during signup. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PASSWORD STRENGTH INDICATOR STYLING
  // ============================================================

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak':
        return 'w-1/3';
      case 'medium':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
      default:
        return 'w-0';
    }
  };

  // ============================================================
  // LOGGING
  // ============================================================

  console.log('📝 [SIGNUP PAGE] Rendering signup page');

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Create a password"
              />

              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 capitalize min-w-[60px]">
                      {passwordStrength || 'Weak'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Must include: uppercase, lowercase, number, and special character
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-8">
            <Link to="/" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Right - Gradient */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-white">
            <h2 className="text-4xl font-bold mb-4">Start your journey</h2>
            <p className="text-indigo-100 text-lg mb-8">
              Create an account and take control of your financial future today.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Start tracking instantly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

/**
 * ADVANCED FEATURES EXPLAINED:
 *
 * 1. REAL-TIME PASSWORD STRENGTH
 *    - Updates as user types
 *    - Visual feedback with color and progress bar
 *    - Helps users create strong passwords
 *
 * 2. PASSWORD CONFIRMATION
 *    - Prevents typos during signup
 *    - Validates in real-time (as user types)
 *    - Shows error if passwords don't match
 *
 * 3. FIELD-LEVEL ERRORS
 *    - Each field can show its own error
 *    - Errors object: { fullName: '...', email: '...', password: '...' }
 *    - Red border on invalid fields
 *
 * 4. AUTO-LOGIN AFTER SIGNUP
 *    - signup() in AuthContext stores tokens and sets user state
 *    - No need to login again after signup
 *    - Immediate redirect to dashboard
 *
 * 5. EMAIL ALREADY EXISTS HANDLING
 *    - Catches "Email already registered" error
 *    - Shows error on email field
 *    - Suggests user to login instead
 *
 * FLOW EXAMPLE:
 *
 * User fills form and clicks "Create Account"
 *   ↓
 * handleSubmit() called
 *   ↓
 * Validate form (all fields checked)
 *   ↓
 * If invalid: Show field-specific errors, stop
 *   ↓
 * If valid: Set loading = true
 *   ↓
 * Call signup() from AuthContext
 *   ↓
 * AuthContext calls authService.signup()
 *   ↓
 * authService makes POST /auth/signup
 *   ↓
 * Backend validates data again
 *   ↓
 * If email exists: Returns 409 Conflict
 *   ↓
 * If valid:
 *   - Backend hashes password
 *   - Creates user in database
 *   - Generates JWT tokens
 *   - Returns tokens + user data
 *   ↓
 * AuthContext stores tokens in localStorage
 * AuthContext updates user state
 *   ↓
 * SignupPage redirects to /dashboard
 *   ↓
 * User is now logged in! ✅
 */
