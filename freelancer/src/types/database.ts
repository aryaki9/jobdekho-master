// types/database.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_type: 'freelancer' | 'recruiter'
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          country: string | null
          city: string | null
          timezone: string | null
          profile_image_url: string | null
          is_profile_complete: boolean | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type: 'freelancer' | 'recruiter'
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          city?: string | null
          timezone?: string | null
          profile_image_url?: string | null
          is_profile_complete?: boolean | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: 'freelancer' | 'recruiter'
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          country?: string | null
          city?: string | null
          timezone?: string | null
          profile_image_url?: string | null
          is_profile_complete?: boolean | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      skill_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_name: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_name?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_name?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          category_id: string | null
          description: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          description?: string | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      freelancer_profiles: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          description: string | null
          hourly_rate_min: number | null
          hourly_rate_max: number | null
          preferred_rate: number | null
          availability_hours_per_week: number | null
          delivery_time_days: number | null
          experience_level: 'beginner' | 'intermediate' | 'expert' | null
          languages: string[] | null
          resume_url: string | null
          portfolio_url: string | null
          linkedin_url: string | null
          github_url: string | null
          website_url: string | null
          is_available: boolean | null
          profile_completion_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          preferred_rate?: number | null
          availability_hours_per_week?: number | null
          delivery_time_days?: number | null
          experience_level?: 'beginner' | 'intermediate' | 'expert' | null
          languages?: string[] | null
          resume_url?: string | null
          portfolio_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          is_available?: boolean | null
          profile_completion_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          description?: string | null
          hourly_rate_min?: number | null
          hourly_rate_max?: number | null
          preferred_rate?: number | null
          availability_hours_per_week?: number | null
          delivery_time_days?: number | null
          experience_level?: 'beginner' | 'intermediate' | 'expert' | null
          languages?: string[] | null
          resume_url?: string | null
          portfolio_url?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          is_available?: boolean | null
          profile_completion_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      freelancer_skills: {
        Row: {
          id: string
          freelancer_id: string | null
          skill_id: string | null
          proficiency_level: number | null
          years_of_experience: number | null
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id?: string | null
          skill_id?: string | null
          proficiency_level?: number | null
          years_of_experience?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string | null
          skill_id?: string | null
          proficiency_level?: number | null
          years_of_experience?: number | null
          created_at?: string
        }
      }
      work_experiences: {
        Row: {
          id: string
          freelancer_id: string | null
          job_title: string
          company_name: string
          description: string | null
          start_date: string
          end_date: string | null
          is_current: boolean | null
          location: string | null
          employment_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id?: string | null
          job_title: string
          company_name: string
          description?: string | null
          start_date: string
          end_date?: string | null
          is_current?: boolean | null
          location?: string | null
          employment_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string | null
          job_title?: string
          company_name?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          is_current?: boolean | null
          location?: string | null
          employment_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_projects: {
        Row: {
          id: string
          freelancer_id: string | null
          title: string
          description: string | null
          project_url: string | null
          image_urls: string[] | null
          technologies_used: string[] | null
          project_type: string | null
          completion_date: string | null
          client_name: string | null
          is_featured: boolean | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          freelancer_id?: string | null
          title: string
          description?: string | null
          project_url?: string | null
          image_urls?: string[] | null
          technologies_used?: string[] | null
          project_type?: string | null
          completion_date?: string | null
          client_name?: string | null
          is_featured?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string | null
          title?: string
          description?: string | null
          project_url?: string | null
          image_urls?: string[] | null
          technologies_used?: string[] | null
          project_type?: string | null
          completion_date?: string | null
          client_name?: string | null
          is_featured?: boolean | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      education: {
        Row: {
          id: string
          freelancer_id: string | null
          institution_name: string
          degree: string | null
          field_of_study: string | null
          start_date: string | null
          end_date: string | null
          is_current: boolean | null
          grade_gpa: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id?: string | null
          institution_name: string
          degree?: string | null
          field_of_study?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean | null
          grade_gpa?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string | null
          institution_name?: string
          degree?: string | null
          field_of_study?: string | null
          start_date?: string | null
          end_date?: string | null
          is_current?: boolean | null
          grade_gpa?: string | null
          description?: string | null
          created_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          freelancer_id: string | null
          name: string
          issuing_organization: string
          issue_date: string | null
          expiry_date: string | null
          credential_id: string | null
          credential_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id?: string | null
          name: string
          issuing_organization: string
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string | null
          name?: string
          issuing_organization?: string
          issue_date?: string | null
          expiry_date?: string | null
          credential_id?: string | null
          credential_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}