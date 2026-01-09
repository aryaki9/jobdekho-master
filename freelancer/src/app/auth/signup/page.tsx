// src/app/auth/signup/page.tsx - Fixed Signup Page
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Users, Briefcase, AlertCircle } from 'lucide-react'

type UserType = 'freelancer' | 'recruiter'

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('freelancer')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get('type') as UserType
    if (type === 'freelancer' || type === 'recruiter') {
      setUserType(type)
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setLoading(true)

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: userType
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Use secure database function to create profile (bypass TypeScript checking)
        const { data: profileResult, error: profileError } = await supabase.rpc(
          'create_user_profile_secure' as any,
          {
            user_id: authData.user.id,
            user_type_param: userType,
            first_name_param: formData.firstName,
            last_name_param: formData.lastName,
            email_param: formData.email
          } as any
        )

        if (profileError || !profileResult) {
          console.error('Profile creation error:', profileError || profileResult)
          throw new Error(profileError?.message ||'Failed to create user profile')
        }

        console.log('Profile created successfully:', profileResult)

        // Redirect based on user type
        if (userType === 'freelancer') {
          router.push('/onboarding/skills')
        } else {
          router.push('/dashboard/recruiter')
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modern header section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Join JobDekho as a {userType === 'freelancer' ? 'Freelancer' : 'Client'}
        </h2>
        <p className="text-gray-600 text-lg">
          {userType === 'freelancer' 
            ? 'Start your freelance journey on JobDekho and discover amazing projects'
            : 'Find the perfect talent for your business needs on JobDekho'
          }
        </p>
      </div>

      {/* Modern User Type Toggle with improved styling */}
      <div className="flex mb-8 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setUserType('freelancer')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            userType === 'freelancer'
              ? 'bg-white text-gray-800 shadow-md border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Freelancer
        </button>
        <button
          type="button"
          onClick={() => setUserType('recruiter')}
          className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            userType === 'recruiter'
              ? 'bg-white text-gray-800 shadow-md border border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Client
        </button>
      </div>

      {/* ...existing error code... */}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
              First name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
              Last name *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Email address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
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
              value={formData.password}
              onChange={handleInputChange}
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
          <p className="text-xs text-gray-500 mt-2">Must be at least 6 characters</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
            Confirm password *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all duration-200"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
            userType === 'freelancer'
              ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500'
              : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500'
          } ${loading ? 'opacity-50 cursor-not-allowed transform-none' : ''} focus:outline-none focus:ring-3 focus:ring-offset-2`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="ml-3">Creating account...</span>
            </div>
          ) : (
            `Create ${userType === 'freelancer' ? 'Freelancer' : 'Client'} Account`
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have a JobDekho account?{' '}
          <Link href="/auth/login" className="font-semibold text-gray-700 hover:text-gray-900 transition-colors underline decoration-2 underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-gray-600 hover:text-gray-800 transition-colors underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-gray-600 hover:text-gray-800 transition-colors underline">
          Privacy Policy
        </Link>
      </div>
    </>
  )
}