// src/app/freelancer/[id]/page.tsx - Improved Public Freelancer Profile
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, MapPin, Star, Clock, DollarSign, Eye, Download,
  ExternalLink, Calendar, Building, GraduationCap, Award, 
  Globe, Mail, MessageCircle, User, Heart, Share, CheckCircle,
  Briefcase, Phone, Languages, Shield, Verified, ImageIcon
} from 'lucide-react'

interface FreelancerPublicProfile {
  // Basic Info
  first_name: string
  last_name: string
  email: string
  phone: string | null
  profile_image_url: string | null
  country: string | null
  city: string | null
  
  // Freelancer Details
  title: string | null
  description: string | null
  preferred_rate: number | null
  availability_hours_per_week: number | null
  delivery_time_days: number | null
  experience_level: string | null
  languages: string[] | null
  resume_url: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  is_available: boolean
  created_at: string
}

interface Skill {
  id: string
  name: string
  category_name: string
  proficiency_level: number
}

interface PortfolioProject {
  id: string
  title: string
  description: string | null
  project_url: string | null
  image_urls: string[] | null
  technologies_used: string[] | null
  project_type: string | null
  completion_date: string | null
  client_name: string | null
  is_featured: boolean
}

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

export default function PublicFreelancerProfile() {
  const params = useParams()
  const router = useRouter()
  const freelancerId = params.id as string

  const [profile, setProfile] = useState<FreelancerPublicProfile | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'experience' | 'education'>('about')

  useEffect(() => {
    if (freelancerId) {
      loadFreelancerProfile()
    }
  }, [freelancerId])

  const loadFreelancerProfile = async () => {
    try {
      // Get freelancer profile with user data
      const { data: freelancerData, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select(`
          *,
          profiles!inner (
            first_name,
            last_name,
            email,
            phone,
            profile_image_url,
            country,
            city
          )
        `)
        .eq('id', freelancerId)
        .single()

      if (freelancerError) {
        console.error('Freelancer profile error:', freelancerError)
        throw freelancerError
      }

      // Flatten the profile data
      const profileData = {
        ...freelancerData.profiles,
        ...freelancerData,
        profiles: undefined // Remove nested object
      }
      setProfile(profileData)

      // Load skills with better error handling
      const { data: skillsData, error: skillsError } = await supabase
        .from('freelancer_skills')
        .select(`
          proficiency_level,
          skills!inner (
            id,
            name,
            skill_categories (
              name
            )
          )
        `)
        .eq('freelancer_id', freelancerId)

      if (skillsError) {
        console.error('Skills error:', skillsError)
      } else {
        const formattedSkills = skillsData?.map((item: any) => ({
          id: item.skills.id,
          name: item.skills.name,
          category_name: item.skills.skill_categories?.name || 'Other',
          proficiency_level: item.proficiency_level
        })) || []
        setSkills(formattedSkills)
      }

      // Load portfolio projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('portfolio_projects')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })

      if (projectsError) {
        console.error('Projects error:', projectsError)
      } else {
        setProjects(projectsData || [])
      }

      // Load work experiences
      const { data: experiencesData, error: experiencesError } = await supabase
        .from('work_experiences')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('start_date', { ascending: false })

      if (experiencesError) {
        console.error('Experiences error:', experiencesError)
      } else {
        setExperiences(experiencesData || [])
      }

      // Load education
      const { data: educationData, error: educationError } = await supabase
        .from('education')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('start_date', { ascending: false })

      if (educationError) {
        console.error('Education error:', educationError)
      } else {
        setEducation(educationData || [])
      }

      // Load certifications
      const { data: certificationsData, error: certificationsError } = await supabase
        .from('certifications')
        .select('*')
        .eq('freelancer_id', freelancerId)
        .order('issue_date', { ascending: false })

      if (certificationsError) {
        console.error('Certifications error:', certificationsError)
      } else {
        setCertifications(certificationsData || [])
      }

    } catch (err) {
      console.error('Error loading freelancer profile:', err)
      setError('Freelancer profile not found')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatDateLong = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSkillColor = (proficiency: number) => {
    if (proficiency >= 4) return 'bg-[#f5f5f0] text-gray-800 border-gray-300'
    if (proficiency >= 3) return 'bg-gray-100 text-gray-700 border-gray-200'
    if (proficiency >= 2) return 'bg-gray-50 text-gray-600 border-gray-200'
    return 'bg-gray-50 text-gray-500 border-gray-200'
  }

  const getSkillLabel = (proficiency: number) => {
    const labels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']
    return labels[proficiency - 1] || 'Beginner'
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const calculateDuration = (startDate: string, endDate: string | null, isCurrent: boolean) => {
    const start = new Date(startDate)
    const end = isCurrent ? new Date() : new Date(endDate || '')
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30))
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths > 0 ? `${diffMonths} month${diffMonths !== 1 ? 's' : ''}` : ''}`
    } else {
      return `${Math.max(diffMonths, 1)} month${diffMonths !== 1 ? 's' : ''}`
    }
  }

  const getExperienceLevel = (level: string) => {
    const levels = {
      'beginner': { label: 'Entry Level', color: 'bg-gray-100 text-gray-800' },
      'intermediate': { label: 'Intermediate', color: 'bg-gray-200 text-gray-800' },
      'expert': { label: 'Expert', color: 'bg-gray-300 text-gray-900' }
    }
    return levels[level as keyof typeof levels] || { label: 'Intermediate', color: 'bg-gray-200 text-gray-800' }
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">The freelancer profile you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    )
  }

  const experienceLevel = getExperienceLevel(profile.experience_level || 'intermediate')

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Link>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Share className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#f5f5f0] to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
                  {getInitials(profile.first_name, profile.last_name)}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    {profile.is_available && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Available
                      </span>
                    )}
                  </div>
                  
                  {profile.title && (
                    <h2 className="text-xl text-gray-700 font-semibold mb-4">{profile.title}</h2>
                  )}
                  
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                    {(profile.country || profile.city) && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.country || profile.city}
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Member since {formatDate(profile.created_at)}
                    </div>

                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${experienceLevel.color}`}>
                        {experienceLevel.label}
                      </span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-6 mt-6">
                    {profile.preferred_rate && (
                      <div className="flex items-center bg-white px-4 py-3 rounded-lg shadow-sm border">
                        <DollarSign className="w-5 h-5 text-gray-700 mr-2" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">${profile.preferred_rate}/hr</p>
                          <p className="text-xs text-gray-500">Starting rate</p>
                        </div>
                      </div>
                    )}
                    
                    {profile.delivery_time_days && (
                      <div className="flex items-center bg-white px-4 py-3 rounded-lg shadow-sm border">
                        <Clock className="w-5 h-5 text-gray-700 mr-2" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{profile.delivery_time_days} days</p>
                          <p className="text-xs text-gray-500">Delivery time</p>
                        </div>
                      </div>
                    )}

                    {profile.availability_hours_per_week && (
                      <div className="flex items-center bg-white px-4 py-3 rounded-lg shadow-sm border">
                        <Clock className="w-5 h-5 text-gray-700 mr-2" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{profile.availability_hours_per_week}h/week</p>
                          <p className="text-xs text-gray-500">Availability</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 lg:min-w-[200px]">
                  <button className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Contact Me
                  </button>
                  
                  {profile.resume_url && (
                    <a
                      href={profile.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-6 py-3 border-2 border-gray-700 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Resume
                    </a>
                  )}
                  
                  <button className="flex items-center justify-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Hire Me
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {(profile.linkedin_url || profile.github_url || profile.website_url) && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4">
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skills Section */}
      {skills.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Star className="w-6 h-6 text-gray-700 mr-3" />
              Skills & Expertise
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border ${getSkillColor(skill.proficiency_level)}`}
                >
                  <div className="font-semibold">{skill.name}</div>
                  <div className="text-xs opacity-80 mt-1">{getSkillLabel(skill.proficiency_level)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Languages className="w-5 h-5 text-gray-700 mr-2" />
              Languages
            </h3>
            <div className="flex flex-wrap gap-3">
              {profile.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-gray-50 text-gray-800 rounded-lg text-sm font-medium border border-gray-200"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'about', label: 'About', count: null },
              { id: 'portfolio', label: 'Portfolio', count: projects.length },
              { id: 'experience', label: 'Experience', count: experiences.length },
              { id: 'education', label: 'Education', count: education.length + certifications.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-700 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            {profile.description && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">About Me</h3>
                <div className="prose prose-gray max-w-none">
                  {profile.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Contact Info */}
            <div className="bg-gradient-to-r from-[#f5f5f0] to-gray-100 rounded-xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Work With Me</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Response Time</p>
                  <p className="text-gray-600 text-sm">Usually within 2 hours</p>
                </div>
                
                <div className="text-center">
                  <Clock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Availability</p>
                  <p className="text-gray-600 text-sm">
                    {profile.availability_hours_per_week}h per week
                  </p>
                </div>
                
                <div className="text-center">
                  <Shield className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="font-semibold text-gray-900">Work Style</p>
                  <p className="text-gray-600 text-sm">Professional & reliable</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Portfolio</h3>
              <span className="text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
            </div>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="h-48 bg-[#f5f5f0] relative overflow-hidden">
                      {project.image_urls && project.image_urls.length > 0 ? (
                        <img 
                          src={project.image_urls[0]} 
                          alt={project.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      {project.is_featured && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                          Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 mb-2 text-lg">{project.title}</h4>
                      
                      {project.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                      )}
                      
                      {project.technologies_used && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.technologies_used.slice(0, 3).map((tech, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {tech}
                            </span>
                          ))}
                          {project.technologies_used.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{project.technologies_used.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {project.completion_date && formatDate(project.completion_date)}
                          {project.client_name && ` • ${project.client_name}`}
                        </div>
                        {project.project_url && (
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center"
                          >
                            View Live
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No portfolio projects yet</h4>
                <p className="text-gray-600">Portfolio projects will appear here when added.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Work Experience</h3>
              <span className="text-gray-500">{experiences.length} experience{experiences.length !== 1 ? 's' : ''}</span>
            </div>
            
            {experiences.length > 0 ? (
              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
                    {/* Timeline connector */}
                    {index < experiences.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-16 bg-gray-200"></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4 text-gray-700" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{exp.job_title}</h4>
                            <p className="text-gray-700 font-semibold">{exp.company_name}</p>
                          </div>
                          {exp.employment_type && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full capitalize">
                              {exp.employment_type}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date!)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {calculateDuration(exp.start_date, exp.end_date, exp.is_current)}
                          </div>
                          {exp.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {exp.location}
                            </div>
                          )}
                        </div>
                        
                        {exp.description && (
                          <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No work experience added</h4>
                <p className="text-gray-600">Work experience will appear here when added.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-8">
            {/* Education */}
            {education.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <GraduationCap className="w-6 h-6 text-gray-700 mr-3" />
                  Education
                </h3>
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={edu.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
                      {/* Timeline connector */}
                      {index < education.length - 1 && (
                        <div className="absolute left-8 top-16 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-gray-700" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900">{edu.institution_name}</h4>
                          
                          {(edu.degree || edu.field_of_study) && (
                            <p className="text-gray-700 font-semibold mb-2">
                              {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {(edu.start_date || edu.end_date) && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {edu.start_date ? formatDate(edu.start_date) : 'Start date not set'} - {
                                  edu.is_current ? 'Present' : (edu.end_date ? formatDate(edu.end_date) : 'End date not set')
                                }
                              </div>
                            )}
                            
                            {edu.grade_gpa && (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-1" />
                                {edu.grade_gpa}
                              </div>
                            )}
                          </div>

                          {edu.description && (
                            <p className="text-gray-700 leading-relaxed">{edu.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 text-gray-700 mr-3" />
                  Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-gray-700" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{cert.name}</h4>
                          <p className="text-gray-700 font-semibold mb-3">{cert.issuing_organization}</p>
                          
                          <div className="space-y-1 text-sm text-gray-600 mb-4">
                            {cert.issue_date && (
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-2" />
                                Issued: {formatDate(cert.issue_date)}
                              </div>
                            )}
                            {cert.expiry_date && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-2" />
                                Expires: {formatDate(cert.expiry_date)}
                              </div>
                            )}
                            {cert.credential_id && (
                              <div className="flex items-center">
                                <Verified className="w-3 h-3 mr-2" />
                                ID: {cert.credential_id}
                              </div>
                            )}
                          </div>
                          
                          {cert.credential_url && (
                            <a
                              href={cert.credential_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm font-medium"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Certificate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {education.length === 0 && certifications.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No education or certifications added</h4>
                <p className="text-gray-600">Education and certifications will appear here when added.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}