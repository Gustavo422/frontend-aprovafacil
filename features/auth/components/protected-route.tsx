'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useToast } from '@/features/shared/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  fallbackUrl?: string;
  loadingComponent?: ReactNode;
  redirectAfterLogin?: boolean;
}

/**
 * ProtectedRoute component that guards routes based on authentication and role requirements
 * 
 * @param children - Content to render when authentication and role checks pass
 * @param requiredRole - Role or array of roles required to access the route
 * @param fallbackUrl - URL to redirect to when authentication fails (default: '/login')
 * @param loadingComponent - Custom component to show while checking authentication
 * @param redirectAfterLogin - Whether to redirect back to the current page after login (default: true)
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallbackUrl = '/login',
  loadingComponent,
  redirectAfterLogin = true,
}: ProtectedRouteProps) {
  const { user, loading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const verifyAuth = async () => {
      setIsChecking(true);
      
      // Check authentication status
      const isAuth = await checkAuth();
      
      if (!isAuth) {
        // Not authenticated, redirect to login
        toast({
          title: 'Acesso restrito',
          descricao: 'Faça login para acessar esta página.',
          variant: 'destructive',
        });
        
        // Add return URL to redirect back after login if enabled
        if (redirectAfterLogin) {
          const returnUrl = encodeURIComponent(pathname || '/');
          router.push(`${fallbackUrl}?returnUrl=${returnUrl}`);
        } else {
          router.push(fallbackUrl);
        }
        return;
      }
      
      // Check role requirements if specified
      if (requiredRole && user) {
        const userRole = user.role || 'user';
        const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        if (!requiredRoles.includes(userRole)) {
          // User doesn't have required role
          toast({
            title: 'Acesso negado',
            descricao: 'Você não tem permissão para acessar esta página.',
            variant: 'destructive',
          });
          
          // Redirect to home page or dashboard instead of login page
          router.push('/');
          return;
        }
      }
      
      setIsChecking(false);
    };

    verifyAuth();
  }, [checkAuth, fallbackUrl, pathname, requiredRole, redirectAfterLogin, router, toast, user]);

  // Show loading state while checking authentication
  if (loading || isChecking) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
}