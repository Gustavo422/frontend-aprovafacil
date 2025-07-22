import { NextRequest, NextResponse } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = [
  {
    path: '/dashboard',
    roles: ['user', 'admin'],
  },
  {
    path: '/admin',
    roles: ['admin'],
  },
];

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

/**
 * Middleware to protect routes based on authentication and roles
 */
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if route is protected
  const protectedRoute = protectedRoutes.find(route => 
    pathname.startsWith(route.path)
  );
  
  if (protectedRoute) {
    // Get token from HTTP-only cookie first (more secure), then fallback to regular cookie
    const secureToken = request.cookies.get('auth_token_secure')?.value;
    const regularToken = request.cookies.get('auth_token')?.value;
    const token = secureToken || regularToken;
    
    if (!token) {
      // No token, redirect to login
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
    
    try {
      // Verify token with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid user data');
      }
      
      // Check role requirements
      const userRole = data.data.role || 'user';
      
      if (!protectedRoute.roles.includes(userRole)) {
        // User doesn't have required role
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // User is authenticated and has required role
      return NextResponse.next();
    } catch (error) {
      // Token verification failed
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
  }
  
  // Not a protected route, proceed
  return NextResponse.next();
}