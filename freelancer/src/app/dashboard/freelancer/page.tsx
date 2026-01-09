// src/app/dashboard/freelancer/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Briefcase, User, Settings, LogOut, Bell, Search,
  Star, DollarSign, Clock, Eye, ImageIcon, FileText,
  Building, GraduationCap, Edit
} from 'lucide-react'

interface Profile {
  first_name: string
  last_name: string
  email: string
}

interface FreelancerProfile {
  title: string
  description: string
  preferred_rate: number | null
  profile_completion_percentage: number | null
  is_available: boolean | null
  resume_url: string | null
}

export default function FreelancerDashboard() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null)
  const [showCreatedBanner, setShowCreatedBanner] = useState(false)

  useEffect(() => {
    // detect ?created=1 for one-time success banner
    if (typeof window !== 'undefined') {
      const created = new URLSearchParams(window.location.search).get('created') === '1'
      setShowCreatedBanner(created)
    }
    checkAuthAndLoad()
  }, []) // IMPORTANT: Empty dependency array = run only once
  const fullName = useMemo(
    () => (profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : ''),
    [profile]
  )

  async function checkAuthAndLoad() {
    try {
      // Check for unified auth FIRST
      const unifiedAuth = localStorage.getItem('unified_auth');

      if (unifiedAuth) {
        const authData = JSON.parse(unifiedAuth);
        console.log('✅ Using unified auth:', authData.email);
        setAuthChecking(false);
        setLoading(true);

        const userId = authData.user_id;

        const [pRes, fRes] = await Promise.all([
          supabase.from('profiles')
            .select('first_name,last_name,email')
            .eq('id', userId)
            .single(),
          supabase.from('freelancer_profiles')
            .select('title,description,preferred_rate,profile_completion_percentage,is_available,resume_url')
            .eq('user_id', userId)
            .maybeSingle()
        ]);

        if (pRes.error) {
          console.error('Profile fetch error:', pRes.error);
          throw pRes.error;
        }
        setProfile(pRes.data as Profile);

        if (fRes.error && fRes.error.code !== 'PGRST116') {
          console.error('Freelancer profile fetch error:', fRes.error);
          throw fRes.error;
        }
        setFreelancerProfile(fRes.data as FreelancerProfile | null);

        setLoading(false);
        console.log('✅ Dashboard loaded successfully with unified auth');
        return; // CRITICAL: Stop here, don't check Supabase
      }

      // Only check Supabase if no unified auth
      console.log('No unified auth, checking Supabase...');
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('No Supabase user, redirecting to login');
        router.push('/auth/login');
        return;
      }

      setAuthChecking(false);
      setLoading(true);

      const [pRes, fRes] = await Promise.all([
        supabase.from('profiles')
          .select('first_name,last_name,email')
          .eq('id', user.id)
          .single(),
        supabase.from('freelancer_profiles')
          .select('title,description,preferred_rate,profile_completion_percentage,is_available,resume_url')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (pRes.error) throw pRes.error;
      setProfile(pRes.data as Profile);

      if (fRes.error) throw fRes.error;
      setFreelancerProfile(fRes.data as FreelancerProfile | null);

      setLoading(false);
    } catch (err) {
      console.error('Auth/Load error:', err);
      // Only redirect if unified auth also doesn't exist
      const unifiedAuth = localStorage.getItem('unified_auth');
      if (!unifiedAuth) {
        router.push('/auth/login');
      } else {
        setLoading(false);
      }
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (authChecking) {
    return <ScreenCenter message="Checking authentication..." />
  }
  if (loading) {
    return <ScreenCenter message="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header
        name={fullName}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        {showCreatedBanner && (
          <div className="relative rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6 shadow-lg animate-fade-in">
            <button
              aria-label="Dismiss"
              onClick={() => setShowCreatedBanner(false)}
              className="absolute right-4 top-4 text-emerald-700/70 hover:text-emerald-800 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-100 transition-colors"
            >
              ×
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-emerald-800 mb-2">Welcome to your dashboard 🎉</h1>
            <p className="text-emerald-700">Your freelancer profile was created successfully. Start building your portfolio!</p>
          </div>
        )}

        {/* ...existing code... */}

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Profile Views"
            value="0"
            icon={<Eye className="h-5 w-5 text-gray-700" />}
          />
          <StatCard
            label="Active Proposals"
            value="0"
            icon={<Briefcase className="h-5 w-5 text-gray-700" />}
          />
          <StatCard
            label="Hourly Rate"
            value={freelancerProfile?.preferred_rate != null ? `$${freelancerProfile.preferred_rate}` : '—'}
            icon={<DollarSign className="h-5 w-5 text-gray-700" />}
          />
          <StatCard
            label="Profile Complete"
            value={freelancerProfile?.profile_completion_percentage != null
              ? `${freelancerProfile.profile_completion_percentage}%`
              : '—'}
            icon={<Star className="h-5 w-5 text-gray-700" />}
          />
        </section>

        {/* Profile overview */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Your Profile</h3>
            <Link
              href="/profile/edit"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </div>

          {/* ...existing code... */}
        </section>

        {/* Profile management */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Profile Management</h3>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <ActionTile href="/profile/edit" icon={<Edit className="h-6 w-6 text-gray-700" />} label="Basic Info" />
            <ActionTile href="/profile/portfolio" icon={<ImageIcon className="h-6 w-6 text-gray-700" />} label="Portfolio" />
            <ActionTile href="/profile/resume" icon={<FileText className="h-6 w-6 text-gray-700" />} label="Resume" />
            <ActionTile href="/profile/experience" icon={<Building className="h-6 w-6 text-gray-700" />} label="Experience" />
            <ActionTile href="/profile/credentials" icon={<GraduationCap className="h-6 w-6 text-gray-700" />} label="Education" />
          </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ActionTile href="/profile/preview" icon={<Eye className="h-6 w-6 text-emerald-600" />} label="Preview Profile" emphasis />
            <ActionTile href="/jobs/browse" icon={<Briefcase className="h-6 w-6 text-gray-700" />} label="Browse Jobs" />
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ActionTile href="/messages" icon={<Bell className="h-6 w-6 text-gray-700" />} label="Messages" />
            <ActionTile href="/settings" icon={<Settings className="h-6 w-6 text-gray-700" />} label="Settings" />
          </div>
        </section>
      </main>
    </div>
  )
}

/* ---------- Small presentational components ---------- */

function ScreenCenter({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

function Header({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">JobDekho</span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                aria-label="Search jobs"
                type="text"
                placeholder="Search jobs..."
                className="w-64 rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              />
            </div>

            <Link href="/browse-freelancers" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Browse Freelancers
            </Link>

            <Link
              href="/messages"
              aria-label="Notifications"
              className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f0]">
                <User className="h-5 w-5 text-gray-700" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-900">{name || '—'}</span>
            </div>

            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 group-hover:from-emerald-100 group-hover:to-blue-100 transition-all duration-300">
          <div className="text-emerald-600 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionTile({
  href,
  icon,
  label,
  emphasis
}: {
  href: string
  icon: React.ReactNode
  label: string
  emphasis?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${emphasis ? 'ring-2 ring-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50' : ''
        }`}
    >
      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${emphasis ? 'bg-gradient-to-br from-emerald-100 to-green-100 group-hover:from-emerald-200 group-hover:to-green-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-emerald-50 group-hover:to-blue-50'}`}>
        <div className={emphasis ? 'text-emerald-600 group-hover:scale-110 transition-transform duration-300' : 'text-gray-700 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-300'}>
          {icon}
        </div>
      </div>
      <div className={`text-center text-sm font-semibold transition-colors duration-300 ${emphasis ? 'text-emerald-800 group-hover:text-emerald-900' : 'text-gray-800 group-hover:text-emerald-700'}`}>{label}</div>
    </Link>
  )
}