import axios from 'axios';
const getBaseURL = () => {
  // Your working ngrok URL from Postman
  return 'https://9406b10bff6c.ngrok-free.app';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Increased timeout for ngrok
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'android',
    'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning
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

// Test connection function
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', getBaseURL());
    const response = await api.get('/');
    console.log('Connection test successful:', response.status);
    return true;
  } catch (error) {
    console.log('Connection test failed:', error.message);
    return false;
  }
};

// Auth API functions
export const authAPI = {
  // Send OTP to phone number
  sendOTP: async (phone) => {
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if your backend is running.');
      }

      const response = await api.post('/api/auth/login', {
        phone: phone
      });
      return response.data;
    } catch (error) {
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
  }
};

export default api;
