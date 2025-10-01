// Environment configuration
// This file provides a more reliable way to handle environment variables

// Try to import from @env, fallback to hardcoded values
let API_BASE_URL;
let GOOGLE_PLACES_API_KEY;

try {
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
  GOOGLE_PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY;
} catch (error) {
  console.log('Failed to load @env, using fallback values');
  API_BASE_URL = undefined;
  GOOGLE_PLACES_API_KEY = undefined;
}

// Fallback configuration
const config = {
  API_BASE_URL: API_BASE_URL || 'https://broker-adda-be.algofolks.com',
  GOOGLE_PLACES_API_KEY: GOOGLE_PLACES_API_KEY || 'AIzaSyA5Lb-4aPQwchmojJe4IpblpreNOjxHFMc',
};

// Debug logging
console.log('Environment Config:', {
  API_BASE_URL: config.API_BASE_URL,
  GOOGLE_PLACES_API_KEY: config.GOOGLE_PLACES_API_KEY ? '***' + config.GOOGLE_PLACES_API_KEY.slice(-4) : 'not set',
  source: API_BASE_URL ? 'environment' : 'fallback'
});

export default config;
