// src/app/dashboard/client/page.tsx - Basic Client Dashboard
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Search, Bell, User, LogOut, Globe, Star,
  ShoppingBag, Clock, DollarSign, Users,
  Eye, MessageCircle, Calendar, CheckCircle
} from 'lucide-react'

interface HiredFreelancer {
  id: string
  service_title: string
  freelancer_name: string
  freelancer_avatar: string | null
  order_status: 'active' | 'completed' | 'cancelled' | 'delivered'
  order_date: string
  delivery_date: string | null
  amount_paid: number
  rating: number | null
  review: string | null
}

interface Profile {
  first_name: string
  last_name: string
  email: string
}

export default function ClientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hiredFreelancers, setHiredFreelancers] = useState<HiredFreelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Mock hired freelancers data (in real app, would query orders table)
      const mockHiredFreelancers: HiredFreelancer[] = [
        {
          id: '1',
          service_title: 'Logo Design for Tech Startup',
          freelancer_name: 'Sarah Design',
          freelancer_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b66e5bb6?w=100&h=100&fit=crop',
          order_status: 'completed',
          order_date: '2024-01-10T10:00:00Z',
          delivery_date: '2024-01-13T15:30:00Z',
          amount_paid: 75,
          rating: 5,
          review: 'Amazing work! Very professional and delivered exactly what we needed.'
        },
        {
          id: '2',
          service_title: 'React Website Development',
          freelancer_name: 'Alex Code',
          freelancer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          order_status: 'active',
          order_date: '2024-01-15T14:00:00Z',
          delivery_date: '2024-01-25T17:00:00Z',
          amount_paid: 250,
          rating: null,
          review: null
        },
        {
          id: '3',
          service_title: 'SEO Blog Content Writing',
          freelancer_name: 'Emma Writer',
          freelancer_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
          order_status: 'delivered',
          order_date: '2024-01-12T09:00:00Z',
          delivery_date: '2024-01-14T12:00:00Z',
          amount_paid: 45,
          rating: null,
          review: null
        }
      ]

      setHiredFreelancers(mockHiredFreelancers)

    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkAuthAndLoadProfile = async () => {
    try {
      // Check for unified auth FIRST
      const unifiedAuth = localStorage.getItem('unified_auth');
      
      if (unifiedAuth) {
        const authData = JSON.parse(unifiedAuth);
        console.log('✅ Unified auth found:', authData.email);
        setAuthChecking(false);
        
        // Use the unified user_id to load profile
        await loadProfile(authData.user_id);
        return;
      }

      // Fallback to Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.log('No authenticated user, redirecting to login')
        router.push('/auth/login?type=client')
        return
      }

      setAuthChecking(false);
      await loadProfile(user.id);
    } catch (err) {
      console.error('Error checking auth:', err)
      router.push('/auth/login?type=client')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'delivered': return <Eye className="w-4 h-4" />
      case 'cancelled': return <DollarSign className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FreelanceHub</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#f5f5f0] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-600"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name}!
          </h1>
          <p className="text-gray-600">
            Manage your orders and find amazing freelance services
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hiredFreelancers.filter(h => h.order_status === 'active').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {hiredFreelancers.filter(h => h.order_status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${hiredFreelancers.reduce((sum, h) => sum + h.amount_paid, 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Freelancers Hired</p>
                <p className="text-2xl font-bold text-gray-900">{hiredFreelancers.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Orders</h2>
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 font-medium text-sm"
              >
                Browse Services
              </Link>
            </div>
          </div>
          
          {hiredFreelancers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {hiredFreelancers.map((hire) => (
                <div key={hire.id} className="p-6 hover:bg-[#f5f5f0] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Freelancer Avatar */}
                      {hire.freelancer_avatar ? (
                        <img
                          src={hire.freelancer_avatar}
                          alt={hire.freelancer_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                          {getInitials(hire.freelancer_name)}
                        </div>
                      )}
                      
                      {/* Order Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{hire.service_title}</h3>
                        <p className="text-gray-600 text-sm mb-2">by {hire.freelancer_name}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Ordered: {formatDate(hire.order_date)}
                          </div>
                          
                          {hire.delivery_date && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {hire.order_status === 'completed' ? 'Delivered' : 'Due'}: {formatDate(hire.delivery_date)}
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${hire.amount_paid}
                          </div>
                        </div>

                        {/* Rating and Review */}
                        {hire.rating && hire.review && (
                          <div className="mt-3 p-3 bg-[#f5f5f0] rounded-lg">
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < hire.rating!
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">Your review</span>
                            </div>
                            <p className="text-sm text-gray-700">"{hire.review}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hire.order_status)}`}>
                        {getStatusIcon(hire.order_status)}
                        <span className="ml-1 capitalize">{hire.order_status}</span>
                      </span>
                      
                      <div className="flex space-x-2">
                        <button className="text-gray-600 hover:text-gray-800 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                Start browsing amazing freelance services to get your projects done
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Services
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <Search className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Find Services</h3>
            <p className="text-gray-600 text-sm">Browse thousands of freelance services</p>
          </Link>
          
          <Link
            href="/favorites"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <Star className="w-8 h-8 text-yellow-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Favorites</h3>
            <p className="text-gray-600 text-sm">Services you've saved for later</p>
          </Link>
          
          <Link
            href="/messages"
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <MessageCircle className="w-8 h-8 text-gray-700 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Messages</h3>
            <p className="text-gray-600 text-sm">Chat with your freelancers</p>
          </Link>
        </div>
      </div>
    </div>
  )
}