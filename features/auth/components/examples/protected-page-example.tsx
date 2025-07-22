'use client';

import { ProtectedRoute } from '../protected-route';
import { withAuthProtection } from '../with-auth-protection';

// Example 1: Using ProtectedRoute component directly
export function ProtectedPageExample() {
  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Protected Page</h1>
        <p className="mt-4">This content is only visible to authenticated users.</p>
      </div>
    </ProtectedRoute>
  );
}

// Example 2: Using ProtectedRoute with role requirements
export function AdminPageExample() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-4">This content is only visible to admin users.</p>
      </div>
    </ProtectedRoute>
  );
}

// Example 3: Using ProtectedRoute with custom loading component
export function ProtectedPageWithCustomLoading() {
  return (
    <ProtectedRoute
      loadingComponent={
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl mb-4">Verificando autenticação...</h2>
          <div className="animate-pulse h-8 w-32 bg-primary/20 rounded"></div>
        </div>
      }
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold">Protected Page</h1>
        <p className="mt-4">This content is only visible to authenticated users.</p>
      </div>
    </ProtectedRoute>
  );
}

// Example 4: Using the HOC pattern
function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>
      <p className="mt-4">This content is only visible to authenticated users.</p>
    </div>
  );
}

export const ProtectedDashboardPage = withAuthProtection(DashboardPage);

// Example 5: Using the HOC with role requirements
function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">User Settings</h1>
      <p className="mt-4">This content is only visible to authenticated users with specific roles.</p>
    </div>
  );
}

export const ProtectedSettingsPage = withAuthProtection(SettingsPage, {
  requiredRole: ['user', 'admin'],
  fallbackUrl: '/login',
});