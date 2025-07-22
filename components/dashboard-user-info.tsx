import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardUserInfo() {
  const [user, setUser] = useState<{ nome?: string; email?: string; role?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) setUser(data.data);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.replace('/dashboard/login');
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 p-2 bg-gray-50 border-b">
      <div className="flex flex-col text-xs">
        <span className="font-semibold">{user.nome || user.email}</span>
        <span className="text-gray-500">{user.role}</span>
      </div>
      <button
        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        onClick={handleLogout}
      >
        Sair
      </button>
    </div>
  );
} 



