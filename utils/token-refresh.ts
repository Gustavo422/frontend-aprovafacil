/**
 * Utilities for handling token refresh and management
 */

// Removido import de js-cookie - usando localStorage em vez disso

// Constants
const ACCESS_TOKEN_STORAGE = 'access_token';
const REFRESH_TOKEN_STORAGE = 'refresh_token';

// Token expiration buffer (5 minutes in milliseconds)
const TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000;

/**
 * Checks if a token is about to expire
 * @param token - JWT token to check
 * @returns True if token is about to expire, false otherwise
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    // Decode token payload (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (!payload.exp) {
      return true; // If no expiration, consider it expiring
    }
    
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeRemaining = expirationTime - currentTime;
    
    return timeRemaining <= TOKEN_EXPIRATION_BUFFER;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If there's an error, consider it expiring
  }
}

/**
 * Refreshes the access token using the refresh token
 * @returns New access token if successful, null otherwise
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Get refresh token from cookie or localStorage
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE);
    
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }
    
    // Call refresh token endpoint
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token refresh failed:', errorData);
      
      // If refresh token is invalid or expired, clear tokens
      if (errorData.code === 'INVALID_REFRESH_TOKEN' || errorData.code === 'EXPIRED_REFRESH_TOKEN') {
        clearTokens();
      }
      
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.accessToken) {
      console.error('Invalid response from refresh endpoint');
      return null;
    }
    
    // Store new access token
    storeAccessToken(data.accessToken);
    
    return data.accessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

/**
 * Stores access token in cookie and localStorage
 * @param token - Access token to store
 */
export function storeAccessToken(token: string): void {
  // Store in HTTP-only cookie (primary storage)
  localStorage.setItem(ACCESS_TOKEN_STORAGE, token);
  
  // Backup in localStorage
  try {
    localStorage.setItem(ACCESS_TOKEN_STORAGE, token);
  } catch (error) {
    console.warn('Could not store token in localStorage:', error);
  }
}

/**
 * Stores refresh token in cookie and localStorage
 * @param token - Refresh token to store
 */
export function storeRefreshToken(token: string): void {
  // Store in HTTP-only cookie (primary storage)
  localStorage.setItem(REFRESH_TOKEN_STORAGE, token);
  
  // Backup in localStorage
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE, token);
  } catch (error) {
    console.warn('Could not store refresh token in localStorage:', error);
  }
}

/**
 * Gets the access token from cookie or localStorage
 * @returns Access token if available, null otherwise
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE);
}

/**
 * Gets the refresh token from cookie or localStorage
 * @returns Refresh token if available, null otherwise
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE);
}

/**
 * Clears all tokens from cookie and localStorage
 */
export function clearTokens(): void {
  // Clear cookies
  localStorage.removeItem(ACCESS_TOKEN_STORAGE);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE);
  
  // Clear localStorage
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE);
  } catch (error) {
    console.warn('Could not clear tokens from localStorage:', error);
  }
}

/**
 * Creates an authenticated fetch function that handles token refresh
 * @returns Authenticated fetch function
 */
export function createAuthFetch(): (url: string, options?: RequestInit) => Promise<Response> {
  return async (url: string, options: RequestInit = {}) => {
    // Get access token
    let accessToken = getAccessToken();
    
    // Check if token is expiring soon and refresh if needed
    if (accessToken && isTokenExpiringSoon(accessToken)) {
      console.log('Access token is expiring soon, refreshing...');
      const newToken = await refreshAccessToken();
      if (newToken) {
        accessToken = newToken;
      }
    }
    
    // Clone options to avoid modifying the original
    const fetchOptions = { ...options };
    
    // Add headers if not present
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is available
    if (accessToken) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${accessToken}`
      };
    }
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    // Check if token has expired during the request
    if (response.status === 401) {
      const responseData = await response.json();
      
      // If token expired, try to refresh and retry the request
      if (responseData.code === 'TOKEN_EXPIRED') {
        console.log('Token expired during request, refreshing...');
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Retry the request with new token
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${newToken}`
          };
          
          return fetch(url, fetchOptions);
        }
      }
    }
    
    return response;
  };
}

// Export an instance of the authenticated fetch
export const authFetch = createAuthFetch();