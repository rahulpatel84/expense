/**
 * ForgotPasswordPage.jsx - Password Reset Request
 *
 * WHAT IS THIS PAGE?
 * Allows users who forgot their password to request a reset link via email.
 *
 * HOW IT WORKS:
 * 1. User enters their email address
 * 2. Backend sends password reset email with token
 * 3. User clicks link in email (goes to ResetPasswordPage)
 * 4. User creates new password
 *
 * SECURITY NOTE:
 * - Backend returns same message whether email exists or not
 * - This prevents email enumeration attacks
 * - Attacker can't discover which emails are registered
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordPage = () => {
  // ============================================================
  // HOOKS
  // ============================================================

  const { forgotPassword } = useAuth();

  // ============================================================
  // FORM STATE
  // ============================================================

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  /**
   * HANDLE INPUT CHANGE
   */
  const handleChange = (e) => {
    setEmail(e.target.value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * VALIDATE FORM
   */
  const validateForm = () => {
    console.log('🔍 [FORGOT PASSWORD] Validating email...');

    if (!email) {
      setError('Email is required');
      console.log('❌ [FORGOT PASSWORD] Validation failed: Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      console.log('❌ [FORGOT PASSWORD] Validation failed: Invalid email format');
      return false;
    }

    console.log('✅ [FORGOT PASSWORD] Email validation passed');
    return true;
  };

  /**
   * HANDLE FORM SUBMIT
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🚀 [FORGOT PASSWORD] Form submitted');
    console.log('📧 [FORGOT PASSWORD] Email:', email);

    // Validate
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📧 [FORGOT PASSWORD] Calling forgotPassword function...');

      // Call forgotPassword from AuthContext
      await forgotPassword(email);

      console.log('✅ [FORGOT PASSWORD] Request successful');

      // Show success message
      setSuccess(true);

    } catch (error) {
      console.error('❌ [FORGOT PASSWORD] Request failed:', error.message);

      /**
       * IMPORTANT: Backend should return same message whether email exists or not
       * This prevents attackers from discovering which emails are registered
       */
      if (error.message.includes('network') || error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        setError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOGGING
  // ============================================================

  console.log('📧 [FORGOT PASSWORD] Rendering forgot password page');

  // ============================================================
  // RENDER
  // ============================================================

  /**
   * SUCCESS STATE
   *
   * After successful submission, show success message
   * User should check their email for reset link
   */
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
                Check your email
              </h2>
              <p className="text-gray-600">
                We've sent password reset instructions to
              </p>
              <p className="font-medium text-gray-900 mt-1">{email}</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-indigo-900 mb-2">
                Next steps:
              </p>
              <ol className="text-sm text-indigo-700 space-y-1.5 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>Create your new password</li>
                <li>Sign in with your new password</li>
              </ol>
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              <p>Didn't receive the email?</p>
              <button
                onClick={() => setSuccess(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium mt-1"
              >
                Try again
              </button>
            </div>

            <Link to="/login" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
          <span className="text-xl font-semibold text-gray-900">ExpenseTracker</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-soft">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
            <p className="text-gray-600 mt-2">
              Enter your email and we'll send you reset instructions
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg shadow-sm disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPasswordPage;

/**
 * PASSWORD RESET FLOW EXPLAINED:
 *
 * STEP 1: USER REQUESTS RESET (This Page)
 * ----------------------------------------
 * User enters: john@example.com
 * Click: "Send Reset Link"
 *   ↓
 * Frontend: POST /auth/forgot-password
 *   Body: { "email": "john@example.com" }
 *   ↓
 * Backend:
 *   1. Find user by email
 *   2. If found: Generate random token (crypto.randomBytes)
 *   3. Hash token with bcrypt
 *   4. Store hashed token in password_resets table
 *      - user_id: user's ID
 *      - token: hashed token
 *      - expires_at: 1 hour from now
 *   5. Send email with reset link:
 *      https://yourapp.com/reset-password?token=original-unhashed-token
 *   6. Return: "If email exists, reset link sent" (same message always!)
 *   ↓
 * Frontend: Show success message
 *   ↓
 * User receives email with link
 *
 * STEP 2: USER CLICKS EMAIL LINK (ResetPasswordPage)
 * ---------------------------------------------------
 * User clicks: https://yourapp.com/reset-password?token=abc123
 *   ↓
 * Browser opens ResetPasswordPage
 * Page extracts token from URL: token = "abc123"
 *   ↓
 * User enters new password: "NewSecure456@"
 * Click: "Reset Password"
 *   ↓
 * Frontend: POST /auth/reset-password
 *   Body: { "token": "abc123", "newPassword": "NewSecure456@" }
 *   ↓
 * Backend:
 *   1. Hash provided token
 *   2. Find password_reset record by hashed token
 *   3. Check if expired
 *   4. If valid:
 *      - Hash new password
 *      - Update user's password_hash
 *      - Delete password_reset record (one-time use)
 *   5. Return success
 *   ↓
 * Frontend: Show success, redirect to login
 *   ↓
 * User logs in with new password ✅
 *
 * SECURITY FEATURES:
 *
 * 1. SAME MESSAGE ALWAYS
 *    - "If email exists, reset link sent"
 *    - Even if email doesn't exist in database
 *    - Prevents attackers from discovering registered emails
 *
 * 2. TOKEN EXPIRATION
 *    - Tokens expire after 1 hour
 *    - Prevents old tokens from being used
 *
 * 3. ONE-TIME USE
 *    - Token deleted after successful reset
 *    - Can't reuse same link multiple times
 *
 * 4. TOKEN HASHING
 *    - Actual token sent via email (unhashed)
 *    - Stored in database as hash
 *    - If database leaked, tokens can't be used
 *
 * 5. RATE LIMITING
 *    - Backend should limit reset requests per IP/email
 *    - Prevents spam and abuse
 */
