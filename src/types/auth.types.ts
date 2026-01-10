// Authentication Types
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_id: number;
  contact?: string;
  timezone?: string;
  created_at?: string;
  account?: Account;
}

export interface Account {
  id: number;
  client_name: string;
  client_status: 'onboarding' | 'active' | 'inactive';
  client_logo_url?: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  account_code: string;
  contact?: string;
  timezone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  authToken: string;
  user_id: number;
  account_id?: number;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  payload?: Record<string, unknown>;
}

