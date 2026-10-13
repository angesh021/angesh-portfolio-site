
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AnalyticsTracker } from './lib/analyticsTracker';
import { registerSW } from 'virtual:pwa-register';

// In development, unregister any service workers to ensure clean HMR and avoid module caching
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}

// In production, register PWA Service Worker for offline caching and fast reloads
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info('PWA: New content available, updating automatically.');
    },
    onOfflineReady() {
      console.info('PWA: Application cached and ready for offline use.');
    },
  });
}

// Initialize clean privacy-safe asset & JS exception tracking triggers
AnalyticsTracker.initAutoClientListeners();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
