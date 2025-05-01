import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Setup mock API handler
import { handleStressTestRequest } from './api/middleware';

// Create a simple mock API route for /api/stress-test
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  if (url === '/api/stress-test' && init?.method === 'POST') {
    return handleStressTestRequest(new Request(url, init));
  }
  
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);