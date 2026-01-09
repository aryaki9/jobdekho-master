// src/app/auth/layout.tsx - Authentication Layout
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <span className="text-2xl font-bold gradient-text">JobDekho</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to homepage
        </Link>
      </div>
    </div>
  )
}