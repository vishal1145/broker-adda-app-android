// Environment configuration
// This file provides a more reliable way to handle environment variables

// Try to import from @env, fallback to hardcoded values
let API_BASE_URL;

try {
  const env = require('@env');
  API_BASE_URL = env.API_BASE_URL;
} catch (error) {
  console.log('Failed to load @env, using fallback values');
  API_BASE_URL = undefined;
}

// Fallback configuration
const config = {
  API_BASE_URL: API_BASE_URL || 'https://broker-adda-be.algofolks.com/',
};

// Debug logging
console.log('Environment Config:', {
  API_BASE_URL: config.API_BASE_URL,
  source: API_BASE_URL ? 'environment' : 'fallback'
});

export default config;
