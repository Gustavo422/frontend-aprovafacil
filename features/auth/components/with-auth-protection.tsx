'use client';

import { ComponentType } from 'react';
import { ProtectedRoute } from './protected-route';

interface WithAuthProtectionOptions {
  requiredRole?: string | string[];
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Higher-order component that wraps a component with authentication protection
 * 
 * @param Component The component to protect
 * @param options Authentication protection options
 * @returns Protected component
 */
export function withAuthProtection<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthProtectionOptions = {}
) {
  const { requiredRole, fallbackUrl, loadingComponent } = options;
  
  function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRole={requiredRole}
        fallbackUrl={fallbackUrl}
        loadingComponent={loadingComponent}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  }
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  ProtectedComponent.displayName = `withAuthProtection(${displayName})`;
  
  return ProtectedComponent;
}