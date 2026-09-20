/**
 * main.jsx — entry point for React application.
 *
 * Wraps the entire component tree with:
 * 1. BrowserRouter (enables React Router)
 * 2. AuthProvider (provides user session and JWT state globally)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

// Global CSS imports
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
