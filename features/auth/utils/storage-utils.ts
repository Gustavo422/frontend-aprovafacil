/**
 * Utility functions for managing token storage in localStorage
 */

// Constants
export const TOKEN_KEY = 'auth_token';
export const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
export const TOKEN_REFRESH_KEY = 'auth_token_refresh';

/**
 * Stores authentication token in localStorage
 * @param token JWT token to store
 * @param expiresIn Expiration time in seconds (default: 7 days)
 * @param refreshToken Optional refresh token
 */
export const storeToken = (
  token: string, 
  expiresIn: number = 60 * 60 * 24 * 7, // 7 days in seconds
  refreshToken?: string
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Store the token
    localStorage.setItem(TOKEN_KEY, token);
    
    // Calculate and store expiry time
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Store refresh token if provided
    if (refreshToken) {
      localStorage.setItem(TOKEN_REFRESH_KEY, refreshToken);
    }
    
    console.log('[DEBUG] Token stored in localStorage');
  } catch (error) {
    console.error('Error storing token in localStorage:', error);
  }
};

/**
 * Retrieves authentication token from localStorage
 * @returns The stored token or null if not found
 */
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token from localStorage:', error);
    return null;
  }
};

/**
 * Retrieves token expiry time from localStorage
 * @returns The expiry timestamp or null if not found
 */
export const getTokenExpiry = (): number | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  } catch (error) {
    console.error('Error retrieving token expiry from localStorage:', error);
    return null;
  }
};

/**
 * Checks if the stored token is expired
 * @param bufferSeconds Optional buffer time in seconds (default: 300 - 5 minutes)
 * @returns True if token is expired or about to expire, false otherwise
 */
export const isTokenExpired = (bufferSeconds: number = 300): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  // Check if token is expired or will expire within buffer time
  return Date.now() + bufferSeconds * 1000 > expiry;
};

/**
 * Retrieves refresh token from localStorage
 * @returns The stored refresh token or null if not found
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(TOKEN_REFRESH_KEY);
  } catch (error) {
    console.error('Error retrieving refresh token from localStorage:', error);
    return null;
  }
};

/**
 * Clears all authentication tokens from localStorage
 */
export const clearStoredTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TOKEN_REFRESH_KEY);
    console.log('[DEBUG] Tokens cleared from localStorage');
  } catch (error) {
    console.error('Error clearing tokens from localStorage:', error);
  }
};