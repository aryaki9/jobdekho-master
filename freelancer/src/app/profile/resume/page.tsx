// src/app/profile/resume/page.tsx - Resume Management Interface
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Upload, FileText, Download, Trash2, 
  CheckCircle, AlertCircle, Eye 
} from 'lucide-react'

interface ResumeData {
  resume_url: string | null
  updated_at: string
}

export default function ResumeManagementPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [freelancerProfileId, setFreelancerProfileId] = useState<string>('')

  const router = useRouter()

  useEffect(() => {
    loadResumeData()
  }, [])

  const loadResumeData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/auth/login')
        return
      }

      // Get freelancer profile
      const { data: profile, error: profileError } = await supabase
        .from('freelancer_profiles')
        .select('id, resume_url, updated_at')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError
      
      setFreelancerProfileId(profile.id)
      setResumeData({
        resume_url: profile.resume_url,
        updated_at: profile.updated_at
      })

    } catch (err) {
      console.error('Error loading resume:', err)
      setError('Failed to load resume data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `resume_${user.id}_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Update freelancer profile
      const { error: updateError } = await supabase
        .from('freelancer_profiles')
        .update({ resume_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Delete old resume if exists
      if (resumeData?.resume_url) {
        const oldFileName = resumeData.resume_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('resumes').remove([oldFileName])
        }
      }

      setResumeData({
        resume_url: publicUrl,
        updated_at: new Date().toISOString()
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error uploading resume:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const deleteResume = async () => {
    if (!confirm('Are you sure you want to delete your resume?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Delete from storage
      if (resumeData?.resume_url) {
        const fileName = resumeData.resume_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('resumes').remove([fileName])
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('freelancer_profiles')
        .update({ resume_url: null })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setResumeData({ resume_url: null, updated_at: new Date().toISOString() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Error deleting resume:', err)
      setError('Failed to delete resume')
    }
  }

  const getFileName = (url: string) => {
    const parts = url.split('/')
    const filename = parts[parts.length - 1]
    return filename.replace(/resume_[^_]+_\d+\./, 'resume.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Resume Management</h1>
              <p className="text-gray-600 mt-1">Upload and manage your resume for clients to download</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800 text-sm">Resume updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {resumeData?.resume_url ? (
            // Current Resume Display
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-700" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Resume</h2>
                <p className="text-gray-600 text-sm">
                  Last updated: {new Date(resumeData.updated_at).toLocaleDateString()}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  File: {getFileName(resumeData.resume_url)}
                </p>
              </div>

              <div className="flex justify-center space-x-4 mb-6">
                <a
                  href={resumeData.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </a>
                <a
                  href={resumeData.resume_url}
                  download
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
                <button
                  onClick={deleteResume}
                  className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Resume</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Replace your current resume with a new version
                </p>
              </div>
            </div>
          ) : (
            // No Resume State
            <div className="text-center">
              <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Resume Uploaded</h2>
              <p className="text-gray-600 mb-6">
                Upload your resume so potential clients can learn more about your background
              </p>
            </div>
          )}

          {/* Upload Section */}
          <div className="relative">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors ${
              uploading ? 'bg-[#f5f5f0] cursor-not-allowed' : 'cursor-pointer hover:bg-[#f5f5f0]'
            }`}>
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p className="text-gray-600">Uploading resume...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload your resume
                  </p>
                  <p className="text-gray-500 text-sm">
                    Supports PDF, DOC, DOCX • Max size 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-[#f5f5f0] border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Resume Tips:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Keep it to 1-2 pages maximum</li>
              <li>• Include relevant work experience and skills</li>
              <li>• Use a clean, professional format</li>
              <li>• Save as PDF for best compatibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}