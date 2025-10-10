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
  // timeout: 15000, // Increased timeout for ngrok
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
  },

  // Get regions by city
  getRegions: async (city) => {
    try {
      console.log('Fetching regions for city:', city);
      const response = await api.get(`/api/regions?city=${city.toLowerCase()}`);
      console.log('Regions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get regions error:', error);
      throw error;
    }
  },

  // Get nearest regions by latitude and longitude
  getNearestRegions: async (latitude, longitude, limit = 5) => {
    try {
      console.log('Fetching nearest regions for coordinates:', { latitude, longitude, limit });
      const response = await api.get(`/api/regions/nearest?latitude=${latitude}&longitude=${longitude}&limit=${limit}`);
      console.log('Nearest regions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get nearest regions error:', error);
      throw error;
    }
  },

  // Check if email is already in use
  checkEmail: async (email, userId) => {
    try {
      console.log('Checking email availability:', { email, userId });
      const response = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}&userId=${userId}`);
      console.log('Email check completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Check email error:', error);
      throw error;
    }
  }
};

// Leads API functions
export const leadsAPI = {
  // Get leads with pagination
  getLeads: async (page = 1, limit = 5, token, userId) => {
    try {
      console.log('Fetching leads:', { page, limit, userId });
      const response = await api.get(`/api/leads?page=${page}&limit=${limit}&createdBy=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Leads fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get leads error:', error);
      throw error;
    }
  },

  // Delete lead
  deleteLead: async (leadId, token) => {
    try {
      console.log('Deleting lead:', leadId);
      const response = await api.delete(`/api/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Lead deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete lead error:', error);
      throw error;
    }
  },

  // Get leads metrics
  getMetrics: async (userId, token) => {
    try {
      console.log('Fetching leads metrics for user:', userId);
      const response = await api.get(`/api/leads/metrics?createdBy=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Leads metrics fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get leads metrics error:', error);
      throw error;
    }
  }
};

// Google Places API functions
export const placesAPI = {
  // Google Places API key from environment
  API_KEY: config.GOOGLE_PLACES_API_KEY,
  
  // Get address suggestions from Google Places Autocomplete
  getAddressSuggestions: async (query) => {
    try {
      console.log('Fetching address suggestions for:', query);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${placesAPI.API_KEY}&components=country:in&types=address`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        console.log('Address suggestions fetched successfully:', data.predictions.length, 'results');
        return {
          success: true,
          data: data.predictions
        };
      } else {
        console.log('No address suggestions found or API error:', data.status);
        return {
          success: false,
          data: [],
          error: data.error_message || 'No suggestions found'
        };
      }
    } catch (error) {
      console.error('Get address suggestions error:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  },

  // Get place details from Google Places API
  getPlaceDetails: async (placeId) => {
    try {
      console.log('Fetching place details for place ID:', placeId);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${placesAPI.API_KEY}&fields=formatted_address,address_components,geometry`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        console.log('Place details fetched successfully:', data.result);
        return {
          success: true,
          data: data.result
        };
      } else {
        console.log('Place details not found or API error:', data.status);
        return {
          success: false,
          data: null,
          error: data.error_message || 'Place details not found'
        };
      }
    } catch (error) {
      console.error('Get place details error:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
};

export default api;
