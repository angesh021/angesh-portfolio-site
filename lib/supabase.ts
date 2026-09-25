/**
 * File: /lib/supabase.ts
 * Purpose: Secure, lazy-instantiated Supabase Clients for Browser and Server-Side environments.
 * Prevents service role key leaking and provides high-entropy API routing capabilities.
 */

import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return (metaEnv[key] as string).trim();
    }
    if (metaEnv && metaEnv[`VITE_${key}`]) {
      return (metaEnv[`VITE_${key}`] as string).trim();
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const isValidUrl = (url: string) => {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
};

// Fallback configuration to prevent uncaught initialisation errors on load when credentials are unset.
const isConfigured = isValidUrl(supabaseUrl) && !!supabaseAnonKey;
const actualUrl = isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const actualKey = isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

if (!isConfigured) {
  console.warn('Supabase configuration is currently missing or invalid. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are valid HTTP/HTTPS URLs.');
}

// Browser/Default public anon client (re-uses cookies & local storage for auth tracking)
export const supabase = createClient(actualUrl, actualKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

/**
 * Server-only administrator client using the master Service Role key to bypass Row Level Security.
 * Should ONLY be used inside backend server endpoints (Express / Vercel API Routes).
 */
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('CRITICAL SECURITY BREACH: getSupabaseAdmin was loaded on client-side context!');
  }
  
  if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
    console.warn('SUPABASE_URL is missing or invalid. Operating under dummy administrator client.');
    return createClient('https://placeholder-project.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is missing from environment. Standard permissions will apply.');
    return createClient(supabaseUrl, supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
