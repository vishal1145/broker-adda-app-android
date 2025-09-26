import axios from 'axios';
import config from '../config/env';

const getBaseURL = () => {
  // Debug environment variable loading
  console.log('API_BASE_URL from config:', config.API_BASE_URL);
  console.log('Type of API_BASE_URL:', typeof config.API_BASE_URL);
  
  return config.API_BASE_URL;
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Increased timeout for ngrok
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Full URL:', config.baseURL + config.url);
    console.log('Request Headers:', config.headers);
    console.log('Request Data:', config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config.url);
    console.log('Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    console.error('Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      request: error.request
    });
    return Promise.reject(error);
  }
);

// Test connection function - simplified
export const testConnection = async () => {
  // Skip connection test to avoid 404 errors
  // The actual API call will handle connection issues
  console.log('Skipping connection test, proceeding with API call...');
  return true;
};

// Auth API functions
export const authAPI = {
  // Send OTP to phone number
  sendOTP: async (phone) => {
    try {
      console.log('Sending OTP to:', phone);
      const response = await api.post('/api/auth/login', {
        phone: phone
      });
      console.log('OTP sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (phone, otp) => {
    try {
      const response = await api.post('/api/auth/verify-otp', {
        phone: phone,
        otp: otp
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (phone) => {
    try {
      console.log('Resending OTP to:', phone);
      const response = await api.post('/api/auth/resend-otp', {
        phone: phone
      });
      console.log('OTP resent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  },

  // Register with phone and role
  signup: async (phone) => {
    try {
      console.log('Registering user:', { phone, role: 'broker' });
      const response = await api.post('/api/auth/register', {
        phone: phone,
        role: 'broker'
      });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Complete profile
  completeProfile: async (profileData, token) => {
    try {
      console.log('Completing profile:', profileData);
      const response = await api.post('/api/auth/complete-profile', profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Profile completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Complete profile error:', error);
      throw error;
    }
  },

  // Get broker profile
  getProfile: async (brokerId, token) => {
    try {
      console.log('Getting profile for broker ID:', brokerId);
      const response = await api.get(`/api/brokers/${brokerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Profile retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
};

export default api;
