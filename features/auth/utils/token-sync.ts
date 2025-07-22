/**
 * Utility for synchronizing tokens between storage methods
 */
import { getStoredToken, storeToken, clearStoredTokens, isTokenExpired } from './storage-utils';
import { setSecureCookie, clearSecureCookie } from './cookie-utils';

/**
 * Synchronizes token between localStorage and cookies
 * Ensures both storage methods have the token
 * @returns The synchronized token or null if no valid token found
 */
export const synchronizeToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get token from localStorage
    const localToken = getStoredToken();
    
    // If localStorage has a valid token, ensure it's also in cookies
    if (localToken && !isTokenExpired()) {
      // We can't directly check HTTP-only cookies, but we can set them
      // This ensures the HTTP-only cookie is set if it wasn't
      setSecureCookie(localToken);
      return localToken;
    }
    
    // If no valid token in localStorage, clear all tokens to be safe
    clearStoredTokens();
    clearSecureCookie();
    return null;
  } catch (error) {
    console.error('Error synchronizing tokens:', error);
    return null;
  }
};

/**
 * Stores token in all storage methods
 * @param token JWT token to store
 * @param expiresIn Expiration time in seconds
 */
export const storeTokenInAllStorages = (token: string, expiresIn: number = 60 * 60 * 24 * 7): void => {
  if (!token) return;
  
  // Store in localStorage
  storeToken(token, expiresIn);
  
  // Store in cookie (client-side cookie, HTTP-only is set by API)
  setSecureCookie(token, expiresIn);
};

/**
 * Clears token from all storage methods
 */
export const clearAllTokens = (): void => {
  // Clear from localStorage
  clearStoredTokens();
  
  // Clear cookies (client-side cookie, HTTP-only is cleared by API)
  clearSecureCookie();
};