'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.facilityIds && user.facilityIds.length > 0) {
        router.push(`/hospital/${user.facilityIds[0]}`);
      } else {
        router.push('/admin');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Redirecting to e-Arogyam Dashboard...</span>
      </div>
    </div>
  );
}
