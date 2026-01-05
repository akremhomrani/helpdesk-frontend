// For production, update this URL to your Render API Gateway URL
// Example: 'https://helpdesk-api-gateway.onrender.com'
export const API_CONFIG = {
  baseUrl: import.meta.env?.['VITE_API_URL'] || 'http://localhost:8080'
} as const;
