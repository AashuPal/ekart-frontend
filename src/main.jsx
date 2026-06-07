import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

// Normalize duplicate slashes in the URL path before React Router mounts.
// This fixes cases like https://ekartms.netlify.app//reset-password?token=...
const normalizeUrlPath = () => {
  if (typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location;
      const normalizedPath = pathname.replace(/\/{2,}/g, '/');
    if (pathname !== normalizedPath) {
      window.location.replace(`${window.location.origin}${normalizedPath}${search}${hash}`);
    }
  }
};

normalizeUrlPath();

// Create future flags for React Router v6 to prepare for v7
const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={routerFuture}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);