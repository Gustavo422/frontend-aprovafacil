import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.replace('/dashboard/login');
        return;
      }
      // Validar token e role no backend
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success || data.role !== 'admin') {
        localStorage.removeItem('auth_token');
        router.replace('/dashboard/login');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  return <>{children}</>;
} 