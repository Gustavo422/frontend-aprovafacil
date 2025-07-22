"use client";

// import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/contexts/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        {/* <Toaster /> */}
      </AuthProvider>
    </ErrorBoundary>
  );
}
