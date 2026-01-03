/**
 * ResetPasswordPage.jsx - Create New Password
 *
 * WHAT IS THIS PAGE?
 * Allows users to create a new password using the token from their email.
 *
 * HOW USER GETS HERE:
 * 1. User requested password reset on ForgotPasswordPage
 * 2. Backend sent email with reset link
 * 3. User clicks link: https://yourapp.com/reset-password?token=abc123
 * 4. This page opens with token in URL
 *
 * WHAT HAPPENS:
 * 1. Extract token from URL query parameter
 * 2. User enters new password (with confirmation)
 * 3. Send token + new password to backend
 * 4. Backend validates token and updates password
 * 5. Redirect to login page
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordPage = () => {
  // ============================================================
  // HOOKS
  // ============================================================

  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  /**
   * GET TOKEN FROM URL
   *
   * URL example: /reset-password?token=abc123def456
   * searchParams.get('token') returns: "abc123def456"
   */
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  // ============================================================
  // TOKEN VALIDATION ON MOUNT
  // ============================================================

  /**
   * CHECK IF TOKEN EXISTS IN URL
   *
   * If no token → Show error message
   * User probably typed URL manually or link is broken
   */
  useEffect(() => {
    if (!token) {
      console.error('❌ [RESET PASSWORD] No token found in URL');
      setErrors({
        general: 'Invalid reset link. Please request a new password reset.'
      });
    } else {
      console.log('✅ [RESET PASSWORD] Token found in URL');
    }
  }, [token]);

  // ============================================================
  // PASSWORD STRENGTH CHECKER
  // ============================================================

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength('');
      return;
    }

    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;

    if (strength === 5) {
      setPasswordStrength('strong');
    } else if (strength >= 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(`📝 [RESET PASSWORD] Input changed: ${name}`);

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

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }

    // Check if passwords match
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
   */
  const validateForm = () => {
    console.log('🔍 [RESET PASSWORD] Validating form...');

    const newErrors = {};

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ [RESET PASSWORD] Validation failed:', newErrors);
      return false;
    }

    console.log('✅ [RESET PASSWORD] Form validation passed');
    return true;
  };

  /**
   * HANDLE FORM SUBMIT
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 [RESET PASSWORD] Reset password form submitted');

    // Check if token exists
    if (!token) {
      setErrors({
        general: 'Invalid reset link. Please request a new password reset.'
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('🔑 [RESET PASSWORD] Calling resetPassword function...');

      // Call resetPassword from AuthContext
      await resetPassword(token, formData.password);

      console.log('✅ [RESET PASSWORD] Password reset successful!');

      // Show success message
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        console.log('🔄 [RESET PASSWORD] Redirecting to login...');
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('❌ [RESET PASSWORD] Reset failed:', error.message);

      /**
       * HANDLE ERRORS
       *
       * Common errors:
       * - Invalid token
       * - Expired token
       * - Network error
       */
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        setErrors({
          general: 'Reset link is invalid or expired. Please request a new password reset.'
        });
      } else if (error.message.includes('password')) {
        setErrors({ password: error.message });
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        setErrors({
          general: 'Unable to connect to server. Please check your internet connection.'
        });
      } else {
        setErrors({
          general: error.message || 'An error occurred. Please try again.'
        });
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

  console.log('🔑 [RESET PASSWORD] Rendering reset password page');
  console.log('🔑 [RESET PASSWORD] Token present:', !!token);

  // ============================================================
  // RENDER - SUCCESS STATE
  // ============================================================

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-soft">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Password reset successful
              </h2>
              <p className="text-gray-600">
                Your password has been updated successfully.
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-indigo-700">
                Redirecting to sign in page in 3 seconds...
              </p>
            </div>

            <Link
              to="/login"
              className="block w-full text-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
            >
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER - FORM STATE
  // ============================================================

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
          <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-soft">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="text-gray-600 mt-2">Enter your new password below</p>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
              <div className="mt-3">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-red-700 hover:text-red-800"
                >
                  Request new reset link →
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={!!errors.general}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Create a strong password"
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
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={!!errors.general}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!errors.general}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? 'Resetting password...' : 'Reset password'}
            </button>
          </form>

          <div className="mt-8">
            <Link to="/login" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

/**
 * URL QUERY PARAMETERS EXPLAINED:
 *
 * URL: https://yourapp.com/reset-password?token=abc123def456&extra=value
 *
 * useSearchParams() is a React Router hook that parses the query string.
 *
 * const [searchParams] = useSearchParams();
 * searchParams.get('token')  → Returns "abc123def456"
 * searchParams.get('extra')  → Returns "value"
 * searchParams.get('missing') → Returns null
 *
 * COMPLETE FLOW:
 *
 * 1. User clicks email link: /reset-password?token=abc123
 * 2. React Router loads ResetPasswordPage
 * 3. useSearchParams() extracts token from URL
 * 4. Page checks if token exists
 *    - If no token: Show error, disable form
 *    - If token: Enable form
 * 5. User enters new password (twice)
 * 6. Form validates password strength and match
 * 7. Submit: Send token + newPassword to backend
 * 8. Backend verifies token:
 *    - Hash token
 *    - Find in password_resets table
 *    - Check not expired
 *    - Check not used
 * 9. If valid:
 *    - Hash new password
 *    - Update user's password_hash
 *    - Delete password_reset record
 * 10. Frontend shows success, redirects to login
 * 11. User logs in with new password ✅
 *
 * ERROR SCENARIOS:
 *
 * 1. No token in URL
 *    - User typed URL manually
 *    - Show error, disable form
 *    - Link to forgot-password page
 *
 * 2. Invalid token
 *    - Token doesn't exist in database
 *    - Show error, link to request new reset
 *
 * 3. Expired token
 *    - Token > 1 hour old
 *    - Show error, link to request new reset
 *
 * 4. Already used token
 *    - Token was used for previous reset
 *    - Show error, link to request new reset
 *
 * 5. Weak password
 *    - Doesn't meet strength requirements
 *    - Show inline error on password field
 */
