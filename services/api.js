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

  // Get all regions for filter dropdown
  getAllRegions: async () => {
    try {
      console.log('Fetching all regions for filter');
      const response = await api.get('/api/regions');
      console.log('All regions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get all regions error:', error);
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
  // Get leads with pagination, search and status filter
  getLeads: async (page = 1, limit = 5, token, userId, search = '', status = 'all') => {
    try {
      console.log('Fetching leads:', { page, limit, userId, search, status });
      let url = `/api/leads?page=${page}&limit=${limit}&createdBy=${userId}`;
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      // Only add status parameter if it's not 'all' - API returns all data by default
      if (status && status !== 'all') {
        url += `&status=${encodeURIComponent(status)}`;
      }
      const response = await api.get(url, {
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
  },

  // Get transferred leads with search, status, and advanced filters
  getTransferredLeads: async (page = 1, limit = 5, token, userId, search = '', status = 'all', filters = {}) => {
    try {
      console.log('Fetching transferred leads:', { page, limit, userId, search, status, filters });
      let url = `/api/leads/transferred?toBroker=${userId}&page=${page}&limit=${limit}`;
      
      // Add search parameter
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      // Add status parameter
      if (status && status !== 'all') {
        url += `&status=${encodeURIComponent(status)}`;
      }
      
      // Add advanced filter parameters
      if (filters.regionId) {
        url += `&regionId=${filters.regionId}`;
      }
      if (filters.propertyType && filters.propertyType !== 'All Property Types') {
        url += `&propertyType=${encodeURIComponent(filters.propertyType)}`;
      }
      if (filters.requirement && filters.requirement !== 'All Requirements') {
        url += `&requirement=${encodeURIComponent(filters.requirement)}`;
      }
      if (filters.budgetMax) {
        url += `&budgetMax=${filters.budgetMax}`;
      }
      
      const response = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Transferred leads fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get transferred leads error:', error);
      throw error;
    }
  },

  // Get leads with advanced filters
  getLeadsWithFilters: async (page = 1, limit = 5, token, userId, filters = {}) => {
    try {
      console.log('Fetching leads with filters:', { page, limit, userId, filters });
      let url = `/api/leads?page=${page}&limit=${limit}&createdBy=${userId}`;
      
      // Add filter parameters
      if (filters.regionId) {
        url += `&regionId=${filters.regionId}`;
      }
      if (filters.propertyType && filters.propertyType !== 'All') {
        url += `&propertyType=${encodeURIComponent(filters.propertyType)}`;
      }
      if (filters.requirement && filters.requirement !== 'All') {
        url += `&requirement=${encodeURIComponent(filters.requirement)}`;
      }
      if (filters.budgetMax) {
        url += `&budgetMax=${filters.budgetMax}`;
      }
      if (filters.search && filters.search.trim()) {
        url += `&search=${encodeURIComponent(filters.search.trim())}`;
      }
      if (filters.status && filters.status !== 'all') {
        url += `&status=${encodeURIComponent(filters.status)}`;
      }
      
      const response = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Filtered leads fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get filtered leads error:', error);
      throw error;
    }
  },

  // Create new lead
  createLead: async (leadData, token) => {
    try {
      console.log('Creating new lead:', leadData);
      const response = await api.post('/api/leads', leadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Lead created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create lead error:', error);
      throw error;
    }
  },

  // Get lead details by ID
  getLeadDetails: async (leadId, token) => {
    try {
      console.log('Fetching lead details for ID:', leadId);
      const response = await api.get(`/api/leads/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Lead details fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get lead details error:', error);
      throw error;
    }
  },

  // Update lead by ID
  updateLead: async (leadId, leadData, token) => {
    try {
      console.log('Updating lead:', leadId, leadData);
      const response = await api.put(`/api/leads/${leadId}`, leadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Lead updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update lead error:', error);
      throw error;
    }
  },

  // Delete transfer by ID
  deleteTransfer: async (leadId, transferId, fromBrokerId, toBrokerId, token) => {
    try {
      console.log('Deleting transfer:', leadId, transferId, fromBrokerId, toBrokerId);
      
      const url = `/api/leads/${leadId}/transfers/${toBrokerId}`;
      
      const response = await api.delete(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Transfer deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete transfer error:', error);
      throw error;
    }
  },

  // Get all brokers for sharing
  getAllBrokers: async (token) => {
    try {
      console.log('Fetching all brokers for sharing');
      const response = await api.get('/api/brokers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('All brokers fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get all brokers error:', error);
      throw error;
    }
  },

  // Get brokers by region
  getBrokersByRegion: async (regionId, token) => {
    try {
      console.log('Fetching brokers by region:', regionId);
      const response = await api.get(`/api/brokers?regionId=${regionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Brokers by region fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get brokers by region error:', error);
      throw error;
    }
  },

  // Share lead with brokers
  shareLead: async (leadId, shareData, token) => {
    try {
      console.log('Sharing lead:', leadId, shareData);
      const response = await api.post(`/api/leads/${leadId}/transfer-and-notes`, shareData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log('Lead shared successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Share lead error:', error);
      throw error;
    }
  }
};

// Properties API functions
export const propertiesAPI = {
  // Create new property
  createProperty: async (propertyData, token) => {
    try {
      console.log('Creating new property:', propertyData);
      const response = await api.post('/api/properties', propertyData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Property created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create property error:', error);
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
