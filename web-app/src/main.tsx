import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeApiClient } from './lib/api-config';

// Initialize API client before any component renders so the auth
// interceptor has access to tokens from the very first request.
initializeApiClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
