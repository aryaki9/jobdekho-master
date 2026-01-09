// src/app/profile/preview/page.tsx - Preview how your profile looks to clients
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ExternalLink, Edit } from 'lucide-react'

export default function ProfilePreview() {
  const [freelancerProfileId, setFreelancerProfileId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    getFreelancerProfileId()
  }, [])

  const getFreelancerProfileId = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Get freelancer profile ID
      const { data: profile, error: profileError } = await supabase
        .from('freelancer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('No freelancer profile found. Please complete your profile setup first.')
        } else {
          throw profileError
        }
        return
      }

      setFreelancerProfileId(profile.id)

    } catch (err) {
      console.error('Error getting profile ID:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Preview</h1>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Profile Not Available</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/profile/edit')}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Complete Profile Setup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Preview</h1>
                <p className="text-gray-600 mt-1">This is how clients see your profile</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/profile/edit')}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-[#f5f5f0] transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              <button
                onClick={() => window.open(`/freelancer/${freelancerProfileId}`, '_blank')}
                className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Public View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Banner */}
      <div className="bg-[#f5f5f0] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Profile Tips</h3>
              <div className="text-sm text-gray-700 mt-1">
                <p>Make sure your profile is complete to attract more clients:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                  <li>Add a professional profile photo</li>
                  <li>Write a compelling description of your services</li>
                  <li>Upload portfolio projects showcasing your work</li>
                  <li>Include your resume and work experience</li>
                  <li>Set competitive rates for your skills</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content (Embedded) */}
      <div className="w-full h-screen">
        <iframe
          src={`/freelancer/${freelancerProfileId}`}
          className="w-full h-full border-0"
          title="Profile Preview"
        />
      </div>
    </div>
  )
}