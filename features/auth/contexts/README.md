# Authentication Context

The Authentication Context provides a centralized way to manage authentication state and operations throughout the application.

## Features

- User authentication state management
- Login and logout functionality
- Token storage and retrieval
- Automatic token refresh
- Session persistence
- Authentication status checking

## Usage

### Provider Setup

The AuthProvider should be placed near the root of your application:

```tsx
// In your root layout or provider wrapper
import { AuthProvider } from '@/features/auth/contexts/auth-context';

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### Using the Auth Hook

```tsx
import { useAuth } from '@/features/auth/hooks/use-auth';

function MyComponent() {
  const { 
    user,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    checkAuth,
    getToken
  } = useAuth();

  // Example: Protected content
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please log in to view this content</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.nome}</h1>
      <button onClick={signOut}>Log out</button>
    </div>
  );
}
```

## API Reference

### Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | The currently authenticated user or null if not authenticated |
| `loading` | `boolean` | Indicates if an authentication operation is in progress |
| `error` | `string \| null` | Error message from the last authentication operation |
| `isAuthenticated` | `boolean` | Shorthand for checking if a user is authenticated |

### Context Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `signIn` | `(email: string, password: string)` | `Promise<{ error?: string; token?: string }>` | Authenticates a user with email and password |
| `signOut` | None | `Promise<void>` | Logs out the current user |
| `checkAuth` | None | `Promise<boolean>` | Verifies if the current session is valid |
| `getToken` | None | `string \| null` | Retrieves the current authentication token |

### User Interface

```typescript
interface User {
  id: string;
  email: string;
  nome: string;
  role?: string;
  primeiro_login?: boolean;
}
```

## Security Features

- Tokens are stored in both localStorage and HTTP-only cookies for redundancy
- Token expiration tracking and automatic refresh
- Server-side validation of authentication state
- Automatic session invalidation on logout

## Implementation Details

- Uses the browser's localStorage for client-side token storage
- Sets HTTP-only cookies for server-side authentication
- Automatically redirects users based on authentication state
- Handles first-time login and onboarding flows
- Provides loading states for better UX during authentication operations