// src/app/auth/login/page.tsx - Updated with user type handling
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Globe, Users, Briefcase, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const userType = searchParams.get('type') // 'client' or 'freelancer'

  const [selectedType, setSelectedType] = useState<'client' | 'freelancer'>(
    (userType as 'client' | 'freelancer') || 'client'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) throw signInError

      if (data.user) {
        // Get user profile to determine actual user type
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, is_profile_complete')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        // Redirect based on actual user type
        if (profile.user_type === 'freelancer') {
          if (profile.is_profile_complete) {
            router.push('/dashboard/freelancer')
          } else {
            router.push('/onboarding/skills')
          }
        } else if (profile.user_type === 'recruiter') {
          router.push('/dashboard/client')
        } else {
          // User exists but no profile type set, update it
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ user_type: selectedType === 'client' ? 'recruiter' : 'freelancer' })
            .eq('id', data.user.id)

          if (updateError) throw updateError

          if (selectedType === 'freelancer') {
            router.push('/onboarding/skills')
          } else {
            router.push('/dashboard/client')
          }
        }
      }

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modern header section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome back
        </h2>
        <p className="text-gray-600 text-lg">
          {selectedType === 'freelancer' 
            ? 'Sign in to your JobDekho freelancer account and start earning' 
            : 'Sign in to JobDekho and hire talented freelancers for your projects'
          }
        </p>
      </div>

      {/* Modern User Type Toggle with improved styling */}
      <div className="flex mb-8 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
        <button
          onClick={() => setSelectedType('freelancer')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            selectedType === 'freelancer'
              ? 'bg-white text-gray-800 shadow-md border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Freelancer
        </button>
        <button
          onClick={() => setSelectedType('client')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            selectedType === 'client'
              ? 'bg-white text-gray-800 shadow-md border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Client
        </button>
      </div>

      {/* Error message styling */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Email address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            Password *
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-gray-800 transition-colors underline">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 ${loading ? 'opacity-50 cursor-not-allowed transform-none' : ''} focus:outline-none focus:ring-3 focus:ring-offset-2`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="ml-3">Signing in...</span>
            </div>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          New to JobDekho?{' '}
          <Link
            href={`/auth/signup?type=${selectedType === 'client' ? 'recruiter' : 'freelancer'}`}
            className="font-semibold text-gray-700 hover:text-gray-900 transition-colors underline decoration-2 underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </>
  )
}