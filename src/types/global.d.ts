// Global type declarations

declare module 'lodash-es';
declare module 'ramda';
declare module 'axios';
declare module 'react-window';
declare module 'react-window-infinite-loader';
// Add any other missing module declarations here

// Fix for Vite's import.meta.env
interface ImportMetaEnv {
  VITE_API_URL: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for browser globals
interface Window {
  ENV: {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    // Add other environment variables as needed
  };
}

// Global error type for API responses
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// Global type for API response
interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: number;
  success: boolean;
}
