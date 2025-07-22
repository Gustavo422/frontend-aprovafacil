'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToSimple() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/index-simples');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">Redirecionando...</p>
    </div>
  );
}