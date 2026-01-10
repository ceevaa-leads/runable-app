import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance with default config
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Auth API client
export const apiClient = createApiClient(API_CONFIG.authBaseUrl);

// Leads API client
export const leadsApiClient = createApiClient(API_CONFIG.leadsBaseUrl);

// Outreach API client (for email operations)
export const outreachApiClient = createApiClient(API_CONFIG.outreachBaseUrl);

// Dashboard API client (for statistics)
export const dashboardApiClient = createApiClient(API_CONFIG.dashboardBaseUrl);

// Campaigns API client
export const campaignsApiClient = createApiClient(API_CONFIG.campaignsBaseUrl);

// Generic API response handler
export const handleApiError = (error: unknown): string => {
  console.error('API Error:', error);
  
  if (axios.isAxiosError(error)) {
    // Log full error details for debugging
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
    console.error('Request URL:', error.config?.url);
    
    // Try to extract error message from various response formats
    const data = error.response?.data;
    if (data) {
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (data.payload?.message) return data.payload.message;
    }
    
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }
    
    // HTTP status based errors
    if (error.response?.status === 404) return 'Resource not found';
    if (error.response?.status === 500) return 'Server error. Please try again later.';
    if (error.response?.status === 403) return 'Access denied';
    if (error.response?.status === 401) return 'Invalid credentials';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

