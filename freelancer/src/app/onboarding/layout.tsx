// src/app/onboarding/layout.tsx - Onboarding Layout
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
       <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/90">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                {/* Logo - Moved slightly right */}
                <div className="flex items-center ml-4">
                  <Link href="/" className="flex items-center space-x-3 group">
                    <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Job Portal.AI</span>
              </Link>
            </div>

            <div className="text-sm text-gray-600">
              Setting up your freelancer profile...
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  )
}