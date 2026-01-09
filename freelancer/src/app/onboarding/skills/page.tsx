// src/app/onboarding/skills/page.tsx - Fixed Skills Selection Page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Monitor, PenTool, Palette, FileText, Cog, TrendingUp, Briefcase,
  Search, Check, ChevronRight, ArrowLeft, ArrowRight
} from 'lucide-react'

interface SkillCategory {
  id: string
  name: string
  description: string
  icon_name: string
  display_order: number
}

interface Skill {
  id: string
  name: string
  category_id: string
  description: string
}

interface SelectedSkill {
  id: string
  name: string
  category_id: string
}

const iconMap = {
  Monitor,
  PenTool, 
  Palette,
  FileText,
  Cog,
  TrendingUp,
  Briefcase
}

export default function SkillsSelectionPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categorySkills, setCategorySkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Load skills when category is selected
  useEffect(() => {
    if (selectedCategory) {
      loadSkillsForCategory(selectedCategory)
    }
  }, [selectedCategory])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Failed to load skill categories')
    } finally {
      setLoading(false)
    }
  }

  const loadSkillsForCategory = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategorySkills(data || [])
    } catch (err) {
      console.error('Error loading skills:', err)
      setError('Failed to load skills')
    }
  }

  const toggleSkill = (skill: Skill) => {
    const isSelected = selectedSkills.some(s => s.id === skill.id)
    
    if (isSelected) {
      setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))
    } else {
      setSelectedSkills(prev => [...prev, {
        id: skill.id,
        name: skill.name,
        category_id: skill.category_id
      }])
    }
  }

  const removeSkill = (skillId: string) => {
    setSelectedSkills(prev => prev.filter(s => s.id !== skillId))
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Briefcase
    return IconComponent
  }

  const filteredSkills = categorySkills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleContinue = async () => {
  if (selectedSkills.length === 0) {
    setError('Please select at least one skill to continue')
    return
  }

  setSaving(true)
  setError(null)

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('User not authenticated')

    console.log('User ID:', user.id)

    // Get or create freelancer profile
    let { data: existingProfile, error: profileError } = await (supabase as any)
      .from('freelancer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    let profileId: string

    if (!existingProfile) {
      console.log('Creating new freelancer profile...')
      // Create new freelancer profile
      const { data: newProfile, error: createError } = await (supabase as any)
        .from('freelancer_profiles')
        .insert({
          user_id: user.id,
          profile_completion_percentage: 20
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
      console.log('Created profile with ID:', profileId)
    } else {
      profileId = existingProfile.id
      console.log('Using existing profile ID:', profileId)
    }

    // Validate profileId is a string
    if (typeof profileId !== 'string') {
      console.error('Profile ID is not a string:', profileId)
      throw new Error('Invalid profile ID format')
    }

    // Delete existing skills first
    console.log('Deleting existing skills for profile:', profileId)
    const { error: deleteError } = await (supabase as any)
      .from('freelancer_skills')
      .delete()
      .eq('freelancer_id', profileId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Continue anyway, might be first time
    }

    // Prepare skills data with validation
    const skillsToInsert = selectedSkills.map(skill => {
      console.log('Processing skill:', skill.id, skill.name)
      
      // Validate skill ID is a string
      if (typeof skill.id !== 'string') {
        console.error('Skill ID is not a string:', skill.id)
        throw new Error(`Invalid skill ID format for ${skill.name}`)
      }
      
      return {
        freelancer_id: profileId,
        skill_id: skill.id,
        proficiency_level: 3
      }
    })

    console.log('Skills to insert:', skillsToInsert)

    // Insert new skills
    if (skillsToInsert.length > 0) {
      const { error: skillsError } = await (supabase as any)
        .from('freelancer_skills')
        .insert(skillsToInsert)

      if (skillsError) {
        console.error('Skills insert error:', skillsError)
        throw skillsError
      }
      
      console.log('Skills inserted successfully')
    }

    // Update profile completion
    console.log('Updating profile completion...')
    const { error: updateError } = await (supabase as any)
      .from('freelancer_profiles')
      .update({ 
        profile_completion_percentage: 30 
      })
      .eq('id', profileId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Don't throw here, skills were saved successfully
    }

    console.log('Skills saved successfully, navigating to personal info...')
    router.push('/onboarding/personal-info')
    
  } catch (err) {
    console.error('Error saving skills:', err)
    setError(err instanceof Error ? err.message : 'Failed to save skills')
  } finally {
    setSaving(false)
  }
}
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading skills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us your top skills</h1>
            <p className="text-gray-600 mb-3">This helps us recommend jobs for you.</p>
            <span className="text-sm text-gray-500 bg-[#f5f5f0] px-3 py-1 rounded-full border border-gray-200 font-medium">Step 1 of 4</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-lg">Select a category</h2>
              </div>
              <div className="space-y-1 p-2">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon_name)
                  const isSelected = selectedCategory === category.id
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center px-4 py-4 text-left rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? 'bg-gray-100 border-2 border-gray-300 shadow-sm' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <IconComponent className={`w-6 h-6 mr-4 ${
                        isSelected ? 'text-gray-700' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {category.name}
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${
                        isSelected ? 'text-gray-700' : 'text-gray-400'
                      }`} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Skills */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                {selectedCategory ? (
                  <>
                    <h2 className="font-bold text-gray-900 text-lg mb-4">Available Skills</h2>
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-500 transition-all duration-200"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Select a category to start adding skills to your profile.</p>
                  </div>
                )}
              </div>
              
              {selectedCategory && (
                <div className="max-h-96 overflow-y-auto">
                  {filteredSkills.map((skill) => {
                    const isSelected = selectedSkills.some(s => s.id === skill.id)
                    
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill)}
                        className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                          isSelected ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-green-800' : 'text-gray-900'
                        }`}>
                          {skill.name}
                        </span>
                        {isSelected && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                  
                  {filteredSkills.length === 0 && searchTerm && (
                    <div className="p-6 text-center text-gray-500 font-medium">
                      No skills found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Selected Skills */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="font-bold text-gray-900 text-lg">
                  {selectedSkills.length} skills selected
                </h2>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  Select at least one skill to help us recommend customized jobs for you.
                </p>
              </div>
              
              <div className="p-6">
                {selectedSkills.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium">No skills selected yet.</p>
                    <p className="text-sm mt-2">Choose from the categories to add skills.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSkills.map((skill) => {
                      const category = categories.find(c => c.id === skill.category_id)
                      
                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                        >
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{skill.name}</div>
                            <div className="text-xs text-gray-500 font-medium">{category?.name}</div>
                          </div>
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 font-bold text-lg"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
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
            disabled={saving || selectedSkills.length === 0}
            className={`flex items-center px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 transform ${
              saving || selectedSkills.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}