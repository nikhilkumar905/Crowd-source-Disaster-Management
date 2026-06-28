import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';


import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';

// Registers the service worker in production builds
registerSW({ immediate: false });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
