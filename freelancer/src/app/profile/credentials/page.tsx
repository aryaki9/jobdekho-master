// src/app/profile/credentials/page.tsx - Education & Certifications Management
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Plus, Edit, Trash2, GraduationCap, Award,
  Calendar, ExternalLink, Save, X, CheckCircle, AlertCircle 
} from 'lucide-react'

interface Education {
  id: string
  institution_name: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean
  grade_gpa: string | null
  description: string | null
}

interface Certification {
  id: string
  name: string
  issuing_organization: string
  issue_date: string | null
  expiry_date: string | null
  credential_id: string | null
  credential_url: string | null
}

interface EducationFormData {
  institution_name: string
  degree: string
  field_of_study: string
  start_date: string
  end_date: string
  is_current: boolean
  grade_gpa: string
  description: string
}

interface CertificationFormData {
  name: string
  issuing_organization: string
  issue_date: string
  expiry_date: string
  credential_id: string
  credential_url: string
}

type ActiveTab = 'education' | 'certifications'
type FormType = 'education' | 'certification' | null

export default function CredentialsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('education')
  const [educations, setEducations] = useState<Education[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<FormType>(null)
  const [editingItem, setEditingItem] = useState<Education | Certification | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [freelancerProfileId, setFreelancerProfileId] = useState<string>('')

  const [educationForm, setEducationForm] = useState<EducationFormData>({
    institution_name: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    is_current: false,
    grade_gpa: '',
    description: ''
  })

  const [certificationForm, setCertificationForm] = useState<CertificationFormData>({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: ''
  })

  const router = useRouter()

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
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

      // Load education
      const { data: educationData, error: educationError } = await supabase
        .from('education')
        .select('*')
        .eq('freelancer_id', profile.id)
        .order('start_date', { ascending: false })

      if (educationError) throw educationError

      // Load certifications
      const { data: certificationData, error: certificationError } = await supabase
        .from('certifications')
        .select('*')
        .eq('freelancer_id', profile.id)
        .order('issue_date', { ascending: false })

      if (certificationError) throw certificationError

      setEducations(educationData || [])
      setCertifications(certificationData || [])

    } catch (err) {
      console.error('Error loading credentials:', err)
      setError('Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  const resetForms = () => {
    setEducationForm({
      institution_name: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      is_current: false,
      grade_gpa: '',
      description: ''
    })
    setCertificationForm({
      name: '',
      issuing_organization: '',
      issue_date: '',
      expiry_date: '',
      credential_id: '',
      credential_url: ''
    })
    setEditingItem(null)
    setShowForm(null)
    setError(null)
  }

  const handleEditEducation = (education: Education) => {
    setEducationForm({
      institution_name: education.institution_name,
      degree: education.degree || '',
      field_of_study: education.field_of_study || '',
      start_date: education.start_date || '',
      end_date: education.end_date || '',
      is_current: education.is_current,
      grade_gpa: education.grade_gpa || '',
      description: education.description || ''
    })
    setEditingItem(education)
    setShowForm('education')
  }

  const handleEditCertification = (certification: Certification) => {
    setCertificationForm({
      name: certification.name,
      issuing_organization: certification.issuing_organization,
      issue_date: certification.issue_date || '',
      expiry_date: certification.expiry_date || '',
      credential_id: certification.credential_id || '',
      credential_url: certification.credential_url || ''
    })
    setEditingItem(certification)
    setShowForm('certification')
  }

  const saveEducation = async () => {
    if (!educationForm.institution_name.trim()) {
      setError('Institution name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const educationData = {
        freelancer_id: freelancerProfileId,
        institution_name: educationForm.institution_name.trim(),
        degree: educationForm.degree.trim() || null,
        field_of_study: educationForm.field_of_study.trim() || null,
        start_date: educationForm.start_date || null,
        end_date: educationForm.is_current ? null : educationForm.end_date || null,
        is_current: educationForm.is_current,
        grade_gpa: educationForm.grade_gpa.trim() || null,
        description: educationForm.description.trim() || null
      }

      if (editingItem && 'institution_name' in editingItem) {
        // Update existing education
        const { error: updateError } = await supabase
          .from('education')
          .update(educationData)
          .eq('id', editingItem.id)

        if (updateError) throw updateError

        setEducations(prev => prev.map(edu => 
          edu.id === editingItem.id 
            ? { ...edu, ...educationData }
            : edu
        ))
      } else {
        // Create new education
        const { data: newEducation, error: insertError } = await supabase
          .from('education')
          .insert(educationData)
          .select()
          .single()

        if (insertError) throw insertError
        setEducations(prev => [newEducation, ...prev])
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      resetForms()

    } catch (err) {
      console.error('Error saving education:', err)
      setError(err instanceof Error ? err.message : 'Failed to save education')
    } finally {
      setSaving(false)
    }
  }

  const saveCertification = async () => {
    if (!certificationForm.name.trim() || !certificationForm.issuing_organization.trim()) {
      setError('Certification name and issuing organization are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const certificationData = {
        freelancer_id: freelancerProfileId,
        name: certificationForm.name.trim(),
        issuing_organization: certificationForm.issuing_organization.trim(),
        issue_date: certificationForm.issue_date || null,
        expiry_date: certificationForm.expiry_date || null,
        credential_id: certificationForm.credential_id.trim() || null,
        credential_url: certificationForm.credential_url.trim() || null
      }

      if (editingItem && 'issuing_organization' in editingItem) {
        // Update existing certification
        const { error: updateError } = await supabase
          .from('certifications')
          .update(certificationData)
          .eq('id', editingItem.id)

        if (updateError) throw updateError

        setCertifications(prev => prev.map(cert => 
          cert.id === editingItem.id 
            ? { ...cert, ...certificationData }
            : cert
        ))
      } else {
        // Create new certification
        const { data: newCertification, error: insertError } = await supabase
          .from('certifications')
          .insert(certificationData)
          .select()
          .single()

        if (insertError) throw insertError
        setCertifications(prev => [newCertification, ...prev])
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      resetForms()

    } catch (err) {
      console.error('Error saving certification:', err)
      setError(err instanceof Error ? err.message : 'Failed to save certification')
    } finally {
      setSaving(false)
    }
  }

  const deleteEducation = async (educationId: string) => {
    if (!confirm('Are you sure you want to delete this education record?')) return

    try {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('id', educationId)

      if (error) throw error

      setEducations(prev => prev.filter(edu => edu.id !== educationId))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error deleting education:', err)
      setError('Failed to delete education')
    }
  }

  const deleteCertification = async (certificationId: string) => {
    if (!confirm('Are you sure you want to delete this certification?')) return

    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', certificationId)

      if (error) throw error

      setCertifications(prev => prev.filter(cert => cert.id !== certificationId))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error deleting certification:', err)
      setError('Failed to delete certification')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credentials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Education & Certifications</h1>
                <p className="text-gray-600 mt-1">Add your educational background and professional certifications</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(activeTab === 'education' ? 'education' : 'certification')}
              className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {activeTab === 'education' ? 'Education' : 'Certification'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mt-6">
            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'education'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Education ({educations.length})
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`flex items-center pb-4 border-b-2 font-medium transition-colors ${
                activeTab === 'certifications'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award className="w-5 h-5 mr-2" />
              Certifications ({certifications.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm">Credentials updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Education Form Modal */}
        {showForm === 'education' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingItem ? 'Edit Education' : 'Add Education'}
                  </h2>
                  <button
                    onClick={resetForms}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      value={educationForm.institution_name}
                      onChange={(e) => setEducationForm(prev => ({ ...prev, institution_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. Stanford University"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={educationForm.degree}
                        onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. Bachelor's Degree"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={educationForm.field_of_study}
                        onChange={(e) => setEducationForm(prev => ({ ...prev, field_of_study: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={educationForm.start_date}
                        onChange={(e) => setEducationForm(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={educationForm.end_date}
                        onChange={(e) => setEducationForm(prev => ({ ...prev, end_date: e.target.value }))}
                        disabled={educationForm.is_current}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_current_education"
                      checked={educationForm.is_current}
                      onChange={(e) => setEducationForm(prev => ({ 
                        ...prev, 
                        is_current: e.target.checked,
                        end_date: e.target.checked ? '' : prev.end_date
                      }))}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_current_education" className="ml-2 block text-sm text-gray-900">
                      I am currently studying here
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade/GPA
                    </label>
                    <input
                      type="text"
                      value={educationForm.grade_gpa}
                      onChange={(e) => setEducationForm(prev => ({ ...prev, grade_gpa: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. 3.8 GPA, First Class Honours"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={educationForm.description}
                      onChange={(e) => setEducationForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Additional details, achievements, coursework..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      onClick={resetForms}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-[#f5f5f0] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEducation}
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
                          Save Education
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certification Form Modal */}
        {showForm === 'certification' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingItem ? 'Edit Certification' : 'Add Certification'}
                  </h2>
                  <button
                    onClick={resetForms}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certification Name *
                    </label>
                    <input
                      type="text"
                      value={certificationForm.name}
                      onChange={(e) => setCertificationForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. AWS Solutions Architect"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issuing Organization *
                    </label>
                    <input
                      type="text"
                      value={certificationForm.issuing_organization}
                      onChange={(e) => setCertificationForm(prev => ({ ...prev, issuing_organization: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        value={certificationForm.issue_date}
                        onChange={(e) => setCertificationForm(prev => ({ ...prev, issue_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={certificationForm.expiry_date}
                        onChange={(e) => setCertificationForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={certificationForm.credential_id}
                      onChange={(e) => setCertificationForm(prev => ({ ...prev, credential_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Certificate or license number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credential URL
                    </label>
                    <input
                      type="url"
                      value={certificationForm.credential_url}
                      onChange={(e) => setCertificationForm(prev => ({ ...prev, credential_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      placeholder="https://verify.certificate.com/abc123"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      onClick={resetForms}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-[#f5f5f0] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCertification}
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
                          Save Certification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'education' ? (
          <div className="space-y-4">
            {educations.length > 0 ? (
              educations.map((education) => (
                <div key={education.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <GraduationCap className="w-5 h-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {education.institution_name}
                        </h3>
                      </div>
                      
                      {(education.degree || education.field_of_study) && (
                        <p className="text-gray-700 font-medium mb-2">
                          {education.degree} {education.field_of_study && `in ${education.field_of_study}`}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        {(education.start_date || education.end_date) && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {education.start_date ? formatDate(education.start_date) : 'Start date not set'} - {
                              education.is_current ? 'Present' : (education.end_date ? formatDate(education.end_date) : 'End date not set')
                            }
                          </div>
                        )}
                        
                        {education.grade_gpa && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{education.grade_gpa}</span>
                          </>
                        )}
                      </div>

                      {education.description && (
                        <p className="text-gray-700 leading-relaxed">
                          {education.description}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditEducation(education)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-[#f5f5f0] rounded-md transition-colors"
                        title="Edit education"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEducation(education.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Education Added</h3>
                <p className="text-gray-600 mb-6">
                  Add your educational background to showcase your academic qualifications
                </p>
                <button
                  onClick={() => setShowForm('education')}
                  className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Education
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.length > 0 ? (
              certifications.map((certification) => (
                <div key={certification.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Award className="w-5 h-5 text-gray-600 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {certification.name}
                        </h3>
                      </div>
                      
                      <p className="text-gray-700 font-medium mb-2">{certification.issuing_organization}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        {certification.issue_date && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Issued: {formatDate(certification.issue_date)}
                          </div>
                        )}
                        
                        {certification.expiry_date && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>Expires: {formatDate(certification.expiry_date)}</span>
                          </>
                        )}
                        
                        {certification.credential_id && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>ID: {certification.credential_id}</span>
                          </>
                        )}
                      </div>

                      {certification.credential_url && (
                        <a
                          href={certification.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Certificate
                        </a>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditCertification(certification)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-[#f5f5f0] rounded-md transition-colors"
                        title="Edit certification"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCertification(certification.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete certification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certifications Added</h3>
                <p className="text-gray-600 mb-6">
                  Add your professional certifications to demonstrate your expertise
                </p>
                <button
                  onClick={() => setShowForm('certification')}
                  className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Certification
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}