// src/components/ProfileNavigation.tsx - Enhanced Profile Navigation
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  User, Briefcase, FileText, GraduationCap, 
  Award, Building, Settings, Eye 
} from 'lucide-react'

const profileSections = [
  {
    name: 'Basic Info',
    href: '/profile/edit',
    icon: User,
    description: 'Personal details, skills, and rates'
  },
  {
    name: 'Portfolio',
    href: '/profile/portfolio',
    icon: Briefcase,
    description: 'Showcase your projects and work'
  },
  {
    name: 'Resume',
    href: '/profile/resume',
    icon: FileText,
    description: 'Upload your resume/CV'
  },
  {
    name: 'Experience',
    href: '/profile/experience',
    icon: Building,
    description: 'Work history and positions'
  },
  {
    name: 'Education',
    href: '/profile/credentials',
    icon: GraduationCap,
    description: 'Education and certifications'
  }
]

interface ProfileNavigationProps {
  className?: string
  variant?: 'sidebar' | 'tabs' | 'cards'
}

export default function ProfileNavigation({ 
  className = '', 
  variant = 'cards' 
}: ProfileNavigationProps) {
  const pathname = usePathname()

  if (variant === 'sidebar') {
    return (
      <nav className={`space-y-2 ${className}`}>
        {profileSections.map((section) => {
          const Icon = section.icon
          const isActive = pathname === section.href
          
          return (
            <Link
              key={section.name}
              href={section.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {section.name}
            </Link>
          )
        })}
        
        {/* View Public Profile Link */}
        <div className="pt-4 mt-4 border-t border-gray-200">
          <Link
            href="/profile/preview"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
          >
            <Eye className="w-5 h-5 mr-3" />
            Preview Public Profile
          </Link>
        </div>
      </nav>
    )
  }

  if (variant === 'tabs') {
    return (
      <div className={`border-b border-gray-200 ${className}`}>
        <nav className="flex space-x-8">
          {profileSections.map((section) => {
            const Icon = section.icon
            const isActive = pathname === section.href
            
            return (
              <Link
                key={section.name}
                href={section.href}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {section.name}
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

  // Default: cards variant
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {profileSections.map((section) => {
        const Icon = section.icon
        const isActive = pathname === section.href
        
        return (
          <Link
            key={section.name}
            href={section.href}
            className={`p-6 rounded-lg border transition-all hover:shadow-md ${
              isActive
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center mb-3">
              <Icon className={`w-6 h-6 mr-3 ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`} />
              <h3 className={`font-semibold ${
                isActive ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {section.name}
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              {section.description}
            </p>
            {isActive && (
              <div className="mt-3 text-xs font-medium text-blue-600">
                Currently editing
              </div>
            )}
          </Link>
        )
      })}
      
      {/* View Public Profile Card */}
      <Link
        href="/profile/preview"
        className="p-6 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-all hover:shadow-md"
      >
        <div className="flex items-center mb-3">
          <Eye className="w-6 h-6 mr-3 text-green-600" />
          <h3 className="font-semibold text-green-900">
            Preview Profile
          </h3>
        </div>
        <p className="text-green-700 text-sm">
          See how your profile looks to clients
        </p>
      </Link>
    </div>
  )
}