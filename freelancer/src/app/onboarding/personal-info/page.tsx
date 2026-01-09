// src/app/onboarding/personal-info/page.tsx - Fixed Personal Info Page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, Camera } from 'lucide-react'

export default function PersonalInfoPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hourlyRate: '',
    availability: '',
    deliveryTime: '',
    experienceLevel: 'intermediate'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Replace the handleContinue function in your src/app/onboarding/personal-info/page.tsx

const handleContinue = async () => {
  if (!formData.title || !formData.description) {
    setError('Please fill in all required fields')
    return
  }

  setLoading(true)
  setError(null)

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('User not authenticated')

    console.log('Personal Info - User ID:', user.id)

    // Get existing freelancer profile
    const { data: existingProfile, error: profileError } = await (supabase as any)
      .from('freelancer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError)
      throw profileError
    }

    let profileId: string

    if (!existingProfile) {
      console.log('Creating new freelancer profile for personal info...')
      // Create new freelancer profile if it doesn't exist
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('freelancer_profiles')
        .insert({
          user_id: user.id,
          profile_completion_percentage: 50
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Create profile error:', createError)
        throw createError
      }
      
      if (!newProfile || !newProfile.id) {
        throw new Error('Failed to create freelancer profile - no ID returned')
      }
      
      profileId = newProfile.id
      console.log('Created new profile with ID:', profileId)
    } else {
      profileId = existingProfile.id
      console.log('Using existing profile ID:', profileId)
    }

    // Validate profileId is a string
    if (typeof profileId !== 'string') {
      console.error('Profile ID is not a string:', profileId)
      throw new Error('Invalid profile ID format')
    }

    // Prepare update data
    const updateData = {
      title: formData.title,
      description: formData.description,
      preferred_rate: formData.hourlyRate ? parseInt(formData.hourlyRate) : null,
      availability_hours_per_week: formData.availability ? parseInt(formData.availability) : null,
      delivery_time_days: formData.deliveryTime ? parseInt(formData.deliveryTime) : null,
      experience_level: formData.experienceLevel,
      profile_completion_percentage: 100
    }

    console.log('Updating profile ID:', profileId)
    console.log('Update data:', updateData)

    // Update freelancer profile
    const { error: updateError } = await (supabase as any)
      .from('freelancer_profiles')
      .update(updateData)
      .eq('id', profileId)

    if (updateError) {
      console.error('Profile update error details:', updateError)
      throw updateError
    }

    console.log('Profile updated successfully')

    // Mark main profile as complete
    console.log('Marking profile as complete for user:', user.id)
    const { error: profileCompleteError } = await (supabase as any)
      .from('profiles')
      .update({ is_profile_complete: true })
      .eq('id', user.id)

    if (profileCompleteError) {
      console.error('Profile completion error:', profileCompleteError)
      throw profileCompleteError
    }

    console.log('Profile marked as complete, navigating to dashboard...')
    
    // Navigate to dashboard
    router.push('/dashboard/freelancer')
    
  } catch (err) {
    console.error('Error saving profile:', err)
    setError(err instanceof Error ? err.message : 'Failed to save profile')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-grey">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 ">Tell us a bit about yourself</h1>
            <p className="text-gray-600 mb-3">Fill out your profile for clients to better understand your services.</p>
            <span className="text-sm text-gray-500 bg-[#f5f5f0] px-3 py-1 rounded-full border border-gray-200 font-medium">Step 2 of 4</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Profile Image */}
          <div className="mb-8 text-center">
            <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-md">
              <Camera className="w-10 h-10 text-gray-400" />
            </div>
            <button className="text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors underline decoration-2 underline-offset-2">
              Add profile photo
            </button>
          </div>

          {/* Form */}
          <div className="space-y-8">
            {/* Professional Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-3">
                What do you do? *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Full Stack Developer"
                className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 text-lg"
              />
              <p className="text-sm text-gray-500 mt-2 font-medium">Write a one line description about yourself.</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-3">
                Describe yourself *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                required
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your top skills, strengths, and experiences. Provide more detail on the services you offer, things you're interested in working on, and what you like to do."
                className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 resize-none"
              />
            </div>

            {/* Professional Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="hourlyRate" className="block text-sm font-bold text-gray-900 mb-3">
                  Hourly Rate (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    min="1"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    placeholder="25"
                    className="w-full pl-8 pr-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-bold text-gray-900 mb-3">
                  Hours per week
                </label>
                <input
                  id="availability"
                  name="availability"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.availability}
                  onChange={handleInputChange}
                  placeholder="40"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-bold text-gray-900 mb-3">
                  Typical delivery time (days)
                </label>
                <input
                  id="deliveryTime"
                  name="deliveryTime"
                  type="number"
                  min="1"
                  value={formData.deliveryTime}
                  onChange={handleInputChange}
                  placeholder="7"
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="experienceLevel" className="block text-sm font-bold text-gray-900 mb-3">
                  Experience Level
                </label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="beginner" className="text-gray-900">Beginner (0-2 years)</option>
                  <option value="intermediate" className="text-gray-900">Intermediate (2-5 years)</option>
                  <option value="expert" className="text-gray-900">Expert (5+ years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium rounded-xl hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <button
              onClick={handleContinue}
              disabled={loading || !formData.title || !formData.description}
              className={`flex items-center px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 transform ${
                loading || !formData.title || !formData.description
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}