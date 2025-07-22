# Authentication Components

This directory contains components related to user authentication.

## LoginForm

The `LoginForm` component provides a reusable form for user authentication with email and password.

### Features

- Email and password validation
- Password visibility toggle
- Login attempt limiting (blocks after 3 failed attempts)
- Loading state indication
- Error handling and display
- Success callback support

### Usage

```tsx
import { LoginForm } from '@/features/auth/components/login-form';

// Basic usage
<LoginForm />

// With success callback
<LoginForm onSuccess={() => console.log('Login successful')} />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `onSuccess` | `() => void` | Optional callback function that is called when login is successful |
| `redirectUrl` | `string` | Optional URL to redirect to after successful login (if not using the default redirect) |

### Dependencies

- Requires `AuthProvider` to be set up in the application
- Uses `useToast` from shared hooks for notifications

## ProtectedRoute

The `ProtectedRoute` component guards routes based on authentication and role requirements, redirecting unauthenticated or unauthorized users.

### Features

- Authentication verification
- Role-based access control
- Automatic redirection to login page
- Custom loading state support
- Return URL preservation for post-login redirection

### Usage

```tsx
import { ProtectedRoute } from '@/features/auth/components/protected-route';

// Basic usage - protect content for any authenticated user
<ProtectedRoute>
  <div>Protected content</div>
</ProtectedRoute>

// With role requirement - only allow admins
<ProtectedRoute requiredRole="admin">
  <div>Admin-only content</div>
</ProtectedRoute>

// With multiple allowed roles
<ProtectedRoute requiredRole={['admin', 'manager']}>
  <div>Admin or manager content</div>
</ProtectedRoute>

// With custom loading component
<ProtectedRoute
  loadingComponent={<div>Custom loading...</div>}
>
  <div>Protected content</div>
</ProtectedRoute>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Content to render when authentication and role checks pass |
| `requiredRole` | `string \| string[]` | Optional role or array of roles required to access the route |
| `fallbackUrl` | `string` | Optional URL to redirect to when authentication fails (default: '/login') |
| `loadingComponent` | `ReactNode` | Optional custom component to show while checking authentication |
| `redirectAfterLogin` | `boolean` | Optional flag to enable/disable redirect back to the current page after login (default: true) |

### Higher-Order Component

For convenience, a HOC version is also available:

```tsx
import { withAuthProtection } from '@/features/auth/components/with-auth-protection';

function AdminDashboard() {
  return <div>Admin dashboard content</div>;
}

// Export the protected version
export const ProtectedAdminDashboard = withAuthProtection(AdminDashboard, {
  requiredRole: 'admin',
  fallbackUrl: '/login',
});
```

### Example Integration

```tsx
// In a page component
'use client';

import { ProtectedRoute } from '@/features/auth/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>This content is only visible to authenticated users.</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Security Features

- Rate limiting: Blocks login attempts after 3 failures for 5 minutes
- Secure password handling: Password is never stored in plain text
- HTTP-only cookies: Sets authentication token in HTTP-only cookies for better security