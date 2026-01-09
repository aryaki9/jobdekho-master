'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function UnifiedAuthBridge() {
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = searchParams.get('auth');
    
    console.log('🚀 UnifiedAuthBridge mounted');
    
    if (token && !processing) {
      console.log('🔑 Token detected, processing...');
      setProcessing(true);
      handleAuth(token);
    }
  }, [searchParams, processing]);

  const handleAuth = async (token: string) => {
    try {
      console.log('🔄 Exchanging token...');

      const response = await fetch('http://localhost:3000/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          platform: 'freelancer'
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Auth successful:', data.email);

        // Store authentication
        localStorage.setItem('unified_auth', JSON.stringify({
          email: data.email,
          user_id: data.user_id,
          authenticated: true,
          platform: 'freelancer',
          timestamp: Date.now()
        }));

        console.log('💾 Auth stored in localStorage');

        // Clean URL
        window.history.replaceState({}, '', '/dashboard');
        
        console.log('🔄 Redirecting to dashboard in 1 second...');
        
        // Redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        console.error('❌ Auth failed:', data.message);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  return null;
}