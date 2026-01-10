import { apiClient, handleApiError } from './api.service';
import { API_CONFIG } from '../config/api';
import type { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  User 
} from '../types/auth.types';

// Auth Service - Single Responsibility: Handle all authentication operations
class AuthService {
  private readonly endpoints = API_CONFIG.endpoints.auth;

  async signup(data: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(this.endpoints.signup, data);
      this.setAuthData(response.data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(this.endpoints.login, data);
      this.setAuthData(response.data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>(this.endpoints.me);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.get(this.endpoints.requestReset, { params: { email } });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

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
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setAuthData(data: AuthResponse): void {
    localStorage.setItem('authToken', data.authToken);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  }
}

export const authService = new AuthService();

