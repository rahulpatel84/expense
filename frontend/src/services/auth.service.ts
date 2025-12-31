import api from './api';
import type { SignupData, LoginData, ForgotPasswordData, ResetPasswordData, User, AuthResponse } from '../types/auth.types';

export type { SignupData, LoginData, ForgotPasswordData, ResetPasswordData, User, AuthResponse };

const authService = {
  // Register new user
  async signup(data: SignupData): Promise<{ message: string; userId: string }> {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  // Login user
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await api.post('/api/auth/forgot-password', data);
    return response.data;
  },

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await api.post('/api/auth/reset-password', data);
    return response.data;
  },

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.get(`/api/auth/verify-email?token=${token}`);
    return response.data;
  },

  // Resend verification email
  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post('/api/auth/resend-verification', { email });
    return response.data;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  // Get stored user from localStorage
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};

export default authService;

