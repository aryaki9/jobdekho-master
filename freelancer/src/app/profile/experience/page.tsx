// src/app/profile/experience/page.tsx - Work Experience Management
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Plus, Edit, Trash2, Briefcase, MapPin, 
  Calendar, Save, X, CheckCircle, AlertCircle 
} from 'lucide-react'

interface WorkExperience {
  id: string
  job_title: string
  company_name: string
  description: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  location: string | null
  employment_type: string | null
}

interface ExperienceFormData {
  job_title: string
  company_name: string
  description: string
  start_date: string
  end_date: string
  is_current: boolean
  location: string
  employment_type: string
}

export default function WorkExperiencePage() {
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [freelancerProfileId, setFreelancerProfileId] = useState<string>('')

  const [formData, setFormData] = useState<ExperienceFormData>({
    job_title: '',
    company_name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_current: false,
    location: '',
    employment_type: 'full-time'
  })

  const router = useRouter()

  const employmentTypes = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' }
  ]

  useEffect(() => {
    loadExperiences()
  }, [])

  const loadExperiences = async () => {
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

      if (profileError) throw profileError
      setFreelancerProfileId(profile.id)

      // Load work experiences
      const { data: experienceData, error: experienceError } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('freelancer_id', profile.id)
        .order('start_date', { ascending: false })

      if (experienceError) throw experienceError
      setExperiences(experienceData || [])

    } catch (err) {
      console.error('Error loading experiences:', err)
      setError('Failed to load work experiences')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      job_title: '',
      company_name: '',
      description: '',
      start_date: '',
      end_date: '',
      is_current: false,
      location: '',
      employment_type: 'full-time'
    })
    setEditingExperience(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (experience: WorkExperience) => {
    setFormData({
      job_title: experience.job_title,
      company_name: experience.company_name,
      description: experience.description || '',
      start_date: experience.start_date,
      end_date: experience.end_date || '',
      is_current: experience.is_current,
      location: experience.location || '',
      employment_type: experience.employment_type || 'full-time'
    })
    setEditingExperience(experience)
    setShowForm(true)
  }

  const saveExperience = async () => {
    if (!formData.job_title.trim() || !formData.company_name.trim() || !formData.start_date) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const experienceData = {
        freelancer_id: freelancerProfileId,
        job_title: formData.job_title.trim(),
        company_name: formData.company_name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date || null,
        is_current: formData.is_current,
        location: formData.location.trim() || null,
        employment_type: formData.employment_type
      }

      if (editingExperience) {
        const { data, error } = await supabase
          .from('work_experiences')
          .update(experienceData)
          .eq('id', editingExperience.id)
          .select()
          .single()

        if (error) throw error

        setExperiences(prev => 
          prev.map(exp => exp.id === editingExperience.id ? data : exp)
        )
      } else {
        const { data, error } = await supabase
          .from('work_experiences')
          .insert(experienceData)
          .select()
          .single()

        if (error) throw error

        setExperiences(prev => [data, ...prev])
      }

      setSuccess(true)
      resetForm()
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error saving experience:', err)
      setError('Failed to save work experience')
    } finally {
      setSaving(false)
    }
  }

  const deleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return

    try {
      const { error } = await supabase
        .from('work_experiences')
        .delete()
        .eq('id', experienceId)

      if (error) throw error

      setExperiences(prev => prev.filter(exp => exp.id !== experienceId))
    } catch (err) {
      console.error('Error deleting experience:', err)
      setError('Failed to delete work experience')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const calculateDuration = (startDate: string, endDate: string | null, isCurrent: boolean) => {
    const start = new Date(startDate)
    const end = isCurrent ? new Date() : new Date(endDate || '')
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30))
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths > 0 ? `${diffMonths} month${diffMonths > 1 ? 's' : ''}` : ''}`
    } else {
      return `${Math.max(1, diffMonths)} month${diffMonths > 1 ? 's' : ''}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading work experience...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Work Experience</h1>
                <p className="text-gray-600 mt-1">Add your professional work history and accomplishments</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm">Work experience updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Experience Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingExperience ? 'Edit Work Experience' : 'Add Work Experience'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. Google Inc."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employment Type
                      </label>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      >
                        {employmentTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        disabled={formData.is_current}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_current"
                      checked={formData.is_current}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        is_current: e.target.checked,
                        end_date: e.target.checked ? '' : prev.end_date
                      }))}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_current" className="ml-2 block text-sm text-gray-900">
                      I currently work here
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Describe your role, responsibilities, and achievements..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-[#f5f5f0] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveExperience}
                      disabled={saving}
                      className={`flex items-center px-6 py-2 rounded-md font-semibold transition-colors ${
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
                          Save Experience
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Experience List */}
        <div className="space-y-4">
          {experiences.length > 0 ? (
            experiences.map((experience) => (
              <div key={experience.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Briefcase className="w-5 h-5 text-gray-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {experience.job_title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-700 font-medium mb-2">{experience.company_name}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(experience.start_date)} - {
                          experience.is_current ? 'Present' : (experience.end_date ? formatDate(experience.end_date) : 'Present')
                        }
                      </div>
                      
                      <span className="text-gray-400">•</span>
                      
                      <span>{calculateDuration(experience.start_date, experience.end_date, experience.is_current)}</span>
                      
                      {experience.employment_type && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="capitalize">{experience.employment_type.replace('-', ' ')}</span>
                        </>
                      )}
                      
                      {experience.location && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {experience.location}
                          </div>
                        </>
                      )}
                    </div>

                    {experience.description && (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {experience.description}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(experience)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-[#f5f5f0] rounded-md transition-colors"
                      title="Edit experience"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExperience(experience.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Experience Added</h3>
              <p className="text-gray-600 mb-6">
                Add your work history to showcase your professional experience
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Experience
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}