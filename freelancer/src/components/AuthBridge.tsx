'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthBridge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleUnifiedAuth = useCallback(async () => {
    const unifiedToken = searchParams.get('auth');
    
    if (unifiedToken) {
      try {
        // Validate token with API Gateway
        const response = await fetch('http://localhost:3000/api/validate-token', {
          headers: {
            'Authorization': `Bearer ${unifiedToken}`
          }
        });

        const data = await response.json();

        if (data.success && data.platforms?.freelancer) {
          const freelancerId = data.platforms.freelancer;

          // Get the Supabase session token for this user
          const { data: sessionData, error } = await supabase.auth.admin.getUserById(
            freelancerId
          );

          if (!error && sessionData) {
            // Set the session in the client
            await supabase.auth.setSession({
              access_token: sessionData.user.aud,
              refresh_token: ''
            });

            // Clear the auth parameter from URL
            const newUrl = window.location.pathname;
            router.replace(newUrl);
            
            // Redirect to dashboard
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth bridge error:', error);
      }
    }
  }, [searchParams, router, supabase]);

  useEffect(() => {
    handleUnifiedAuth();
  }, [handleUnifiedAuth]);

  return null; // This component doesn't render anything
}