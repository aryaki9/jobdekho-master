'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    // Check unified auth
    const unifiedAuth = localStorage.getItem('unified_auth');
    
    if (unifiedAuth) {
      const authData = JSON.parse(unifiedAuth);
      console.log('✅ Dashboard router: Unified auth found');
      
      // For now, always go to freelancer dashboard
      // Later you can add logic to check user type
      router.replace('/dashboard/freelancer');
      return;
    }

    // No unified auth, redirect to login
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}