// API configuration
const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '',
  endpoints: {
    organizations: '/organizations',
    users: '/users',
    // Add other endpoints as needed
  }
};

export function getApiUrl(endpoint: keyof typeof API_CONFIG.endpoints): string {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint]}`;
}

export default API_CONFIG;
