/**
 * Utility functions for managing secure HTTP-only cookies for authentication
 */

// Constants
export const AUTH_COOKIE_NAME = 'auth_token_secure';
export const AUTH_COOKIE_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Sets a secure HTTP-only cookie for authentication
 * @param token JWT token to store
 * @param expiresIn Expiration time in seconds (default: 7 days)
 */
export const setSecureCookie = (token: string, expiresIn: number = AUTH_COOKIE_EXPIRY): void => {
  if (typeof document === 'undefined') return;
  
  // Set secure HTTP-only cookie for server-side auth
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${expiresIn}; SameSite=Strict; Secure; HttpOnly`;
};

/**
 * Clears the secure HTTP-only authentication cookie
 */
export const clearSecureCookie = (): void => {
  if (typeof document === 'undefined') return;
  
  // Clear the cookie by setting max-age to 0
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict; Secure; HttpOnly`;
};