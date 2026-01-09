// src/app/profile/edit/page.tsx - Profile Editing Interface
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Save, Camera, Plus, X, Edit, 
  DollarSign, Clock, User, MapPin, Globe
} from 'lucide-react'

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
}

interface FreelancerProfileData {
  id: string
  title: string | null
  description: string | null
  preferred_rate: number | null
  availability_hours_per_week: number | null
  delivery_time_days: number | null
  experience_level: string | null
  languages: string[] | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
}

interface SelectedSkill {
  id: string
  name: string
  category_name: string
  proficiency_level: number
}

export default function ProfileEditPage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    city: ''
  })
  
  const [freelancerData, setFreelancerData] = useState<FreelancerProfileData>({
    id: '',
    title: '',
    description: '',
    preferred_rate: null,
    availability_hours_per_week: null,
    delivery_time_days: null,
    experience_level: 'intermediate',
    languages: [],
    linkedin_url: '',
    github_url: '',
    website_url: ''
  })

  const [currentSkills, setCurrentSkills] = useState<SelectedSkill[]>([])
  const [newLanguage, setNewLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Load basic profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, country, city')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
      setProfileData(profile)

      // Load freelancer profile
      const { data: freelancerProfile, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (freelancerError && freelancerError.code !== 'PGRST116') {
        throw freelancerError
      }

      if (freelancerProfile) {
        setFreelancerData({
          ...freelancerProfile,
          languages: freelancerProfile.languages || [],
          linkedin_url: freelancerProfile.linkedin_url || '',
          github_url: freelancerProfile.github_url || '',
          website_url: freelancerProfile.website_url || ''
        })

        // Load current skills
        const { data: skills, error: skillsError } = await supabase
          .from('freelancer_skills')
          .select(`
            id,
            proficiency_level,
            skills (
              id,
              name,
              skill_categories (
                name
              )
            )
          `)
          .eq('freelancer_id', freelancerProfile.id)

        if (skillsError) throw skillsError

        const formattedSkills = skills?.map((skill: any) => ({
          id: skill.skills.id,
          name: skill.skills.name,
          category_name: skill.skills.skill_categories?.name || 'Other',
          proficiency_level: skill.proficiency_level
        })) || []

        setCurrentSkills(formattedSkills)
      }

    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleFreelancerChange = (field: keyof FreelancerProfileData, value: any) => {
    setFreelancerData(prev => ({ ...prev, [field]: value }))
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !freelancerData.languages?.includes(newLanguage.trim())) {
      setFreelancerData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()]
      }))
      setNewLanguage('')
    }
  }

  const removeLanguage = (language: string) => {
    setFreelancerData(prev => ({
      ...prev,
      languages: prev.languages?.filter(lang => lang !== language) || []
    }))
  }

  const updateSkillProficiency = (skillId: string, proficiency: number) => {
    setCurrentSkills(prev => 
      prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, proficiency_level: proficiency }
          : skill
      )
    )
  }

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('freelancer_skills')
        .delete()
        .eq('freelancer_id', freelancerData.id)
        .eq('skill_id', skillId)

      if (error) throw error

      setCurrentSkills(prev => prev.filter(skill => skill.id !== skillId))
    } catch (err) {
      console.error('Error removing skill:', err)
      setError('Failed to remove skill')
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Update basic profile
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone || null,
          country: profileData.country || null,
          city: profileData.city || null
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update freelancer profile
      const { error: freelancerError } = await (supabase as any)
        .from('freelancer_profiles')
        .update({
          title: freelancerData.title,
          description: freelancerData.description,
          preferred_rate: freelancerData.preferred_rate,
          availability_hours_per_week: freelancerData.availability_hours_per_week,
          delivery_time_days: freelancerData.delivery_time_days,
          experience_level: freelancerData.experience_level,
          languages: freelancerData.languages,
          linkedin_url: freelancerData.linkedin_url || null,
          github_url: freelancerData.github_url || null,
          website_url: freelancerData.website_url || null
        })
        .eq('user_id', user.id)

      if (freelancerError) throw freelancerError

      // Update skill proficiency levels
      for (const skill of currentSkills) {
        const { error: skillError } = await (supabase as any)
          .from('freelancer_skills')
          .update({ proficiency_level: skill.proficiency_level })
          .eq('freelancer_id', freelancerData.id)
          .eq('skill_id', skill.id)

        if (skillError) {
          console.error('Error updating skill proficiency:', skillError)
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-[#f5f5f0] rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-600 mt-1">Update your professional information and settings</p>
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-md font-semibold transition-colors ${
                saving 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800 text-sm">Profile updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0] mr-3">
                <User className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#f5f5f0] text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone || ''}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={profileData.country || ''}
                  onChange={(e) => handleProfileChange('country', e.target.value)}
                  className="w-full px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={profileData.city || ''}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="New York"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0] mr-3">
                <Edit className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={freelancerData.title || ''}
                  onChange={(e) => handleFreelancerChange('title', e.target.value)}
                  className="w-full px-3 text-gray-500 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="e.g. Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Description *
                </label>
                <textarea
                  rows={6}
                  value={freelancerData.description || ''}
                  onChange={(e) => handleFreelancerChange('description', e.target.value)}
                  className="w-full px-3 py-2  text-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Describe your skills, experience, and services..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1 text-gray-600" />
                    Hourly Rate (USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={freelancerData.preferred_rate || ''}
                    onChange={(e) => handleFreelancerChange('preferred_rate', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full text-gray-500 px-3 text-gray-500 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1 text-gray-600" />
                    Hours per Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={freelancerData.availability_hours_per_week || ''}
                    onChange={(e) => handleFreelancerChange('availability_hours_per_week', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={freelancerData.delivery_time_days || ''}
                    onChange={(e) => handleFreelancerChange('delivery_time_days', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="7"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={freelancerData.experience_level || 'intermediate'}
                  onChange={(e) => handleFreelancerChange('experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                >
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (2-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills Management */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Skills & Expertise</h2>
              <button
                onClick={() => router.push('/onboarding/skills')}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-[#f5f5f0] rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Skills
              </button>
            </div>

            {currentSkills.length > 0 ? (
              <div className="space-y-4">
                {currentSkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-4 bg-[#f5f5f0] rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.category_name}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Proficiency:</label>
                        <select
                          value={skill.proficiency_level}
                          onChange={(e) => updateSkillProficiency(skill.id, parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value={1}>Beginner</option>
                          <option value={2}>Basic</option>
                          <option value={3}>Intermediate</option>
                          <option value={4}>Advanced</option>
                          <option value={5}>Expert</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No skills added yet.</p>
                <button
                  onClick={() => router.push('/onboarding/skills')}
                  className="mt-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Add your first skill
                </button>
              </div>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Languages</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  className="flex-1 px-3 text-gray-500 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                />
                <button
                  onClick={addLanguage}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {freelancerData.languages?.map((language, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-[#f5f5f0] text-gray-800 rounded-full text-sm border border-gray-200"
                >
                  {language}
                  <button
                    onClick={() => removeLanguage(language)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f0] mr-3">
                <Globe className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Social Links</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={freelancerData.linkedin_url || ''}
                  onChange={(e) => handleFreelancerChange('linkedin_url', e.target.value)}
                  className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <input
                  type="url"
                  value={freelancerData.github_url || ''}
                  onChange={(e) => handleFreelancerChange('github_url', e.target.value)}
                  className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Website
                </label>
                <input
                  type="url"
                  value={freelancerData.website_url || ''}
                  onChange={(e) => handleFreelancerChange('website_url', e.target.value)}
                  className="w-full text-gray-500 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}