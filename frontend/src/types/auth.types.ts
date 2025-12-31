export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  currencyCode: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  currencyCode: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

