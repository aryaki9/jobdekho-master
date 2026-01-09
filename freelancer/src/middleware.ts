// src/middleware.ts - Temporarily disable all protection to test dashboard
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // Temporarily disable all protection - allow access to everything
    const authRoutes = ['/auth/login', '/auth/signup']
    
    const isAuthRoute = authRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route)
    )

    // Only handle auth page redirects for logged-in users
    if (isAuthRoute && session) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, is_profile_complete')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          if (profile.user_type === 'freelancer') {
            const redirectUrl = profile.is_profile_complete 
              ? '/dashboard/freelancer' 
              : '/onboarding/skills'
            return NextResponse.redirect(new URL(redirectUrl, req.url))
          } else {
            return NextResponse.redirect(new URL('/dashboard/client', req.url))
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error)
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}