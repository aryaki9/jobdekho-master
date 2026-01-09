'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Shield, 
  Users, 
  Award,
  Palette,
  Code,
  Megaphone,
  PenTool,
  Camera,
  Headphones,
  BarChart3,
  Briefcase,
  Heart,
  Eye,
  User,
  Globe
} from 'lucide-react'

interface ServiceListing {
  id: string
  title: string
  description: string
  price_from: number
  delivery_days: number
  rating: number
  reviews_count: number
  image_url: string | null
  freelancer: {
    id: string
    name: string
    avatar_url: string | null
    level: string
    country: string | null
  }
  category: string
  subcategory: string
  is_featured: boolean
}

interface Category {
  id: string
  name: string
  icon: string
  services_count: number
  color: string
}

export default function Homepage() {
  const [featuredServices, setFeaturedServices] = useState<ServiceListing[]>([])
  const [popularCategories, setPopularCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()

  useEffect(() => {
    loadHomepageData()
    
    // Set up real-time subscription for new freelancer profiles
    const channel = supabase
      .channel('freelancer_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'freelancer_profiles'
        },
        () => {
          // Reload data when freelancer profiles change
          console.log('Freelancer profile updated, refreshing homepage...')
          loadHomepageData()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadHomepageData = async () => {
    try {
      // Load real freelancer profiles from database
      const { data: freelancerData, error: freelancerError } = await supabase
        .from('freelancer_profiles')
        .select(`
          id,
          title,
          description,
          preferred_rate,
          delivery_time_days,
          experience_level,
          is_available,
          profiles!inner (
            first_name,
            last_name,
            profile_image_url,
            country,
            city
          )
        `)
        .eq('is_available', true)
        .not('title', 'is', null)
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12)

      if (freelancerError) {
        console.error('Error loading freelancers:', freelancerError)
        setFeaturedServices([])
        setLoading(false)
        return
      }

      // Transform freelancer profiles into service listings
      const realServices: ServiceListing[] = await Promise.all(
        (freelancerData || []).map(async (freelancer) => {
          // Get first portfolio project image if available
          const { data: portfolioData } = await supabase
            .from('portfolio_projects')
            .select('image_urls')
            .eq('freelancer_id', freelancer.id)
            .not('image_urls', 'is', null)
            .limit(1)

          // Get freelancer's main skill category
          const { data: skillData } = await supabase
            .from('freelancer_skills')
            .select(`
              skills!inner (
                skill_categories (
                  name
                )
              )
            `)
            .eq('freelancer_id', freelancer.id)
            .limit(1)

          const portfolioImage = portfolioData?.[0]?.image_urls?.[0] || null
          const category = skillData?.[0]?.skills?.skill_categories?.name || 'General Services'

          // Generate service title from freelancer title
          const serviceTitle = freelancer.title.startsWith('I will') 
            ? freelancer.title 
            : `I will ${freelancer.title.toLowerCase()}`

          return {
            id: freelancer.id,
            title: serviceTitle,
            description: freelancer.description || 'Professional freelance service',
            price_from: freelancer.preferred_rate || 50,
            delivery_days: freelancer.delivery_time_days || 7,
            rating: 4.5 + (Math.random() * 0.5), // Random rating for now
            reviews_count: Math.floor(Math.random() * 100) + 10, // Random review count
            image_url: portfolioImage,
            freelancer: {
              id: freelancer.id,
              name: `${freelancer.profiles.first_name} ${freelancer.profiles.last_name}`,
              avatar_url: freelancer.profiles.profile_image_url,
              level: freelancer.experience_level === 'expert' ? 'Top Rated Seller' : 
                     freelancer.experience_level === 'intermediate' ? 'Level 2 Seller' : 'Level 1 Seller',
              country: freelancer.profiles.country
            },
            category: category,
            subcategory: freelancer.title,
            is_featured: Math.random() > 0.7 // Random featured status
          }
        })
      )

      // Add some mock services if we have fewer than 6 real ones
      const mockServices: ServiceListing[] = realServices.length < 6 ? [
        {
          id: 'mock-1',
          title: 'I will design a modern logo for your brand',
          description: 'Professional logo design with unlimited revisions and multiple concepts',
          price_from: 25,
          delivery_days: 3,
          rating: 4.9,
          reviews_count: 127,
          image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop',
          freelancer: {
            id: 'mock-f1',
            name: 'Sarah Design',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b66e5bb6?w=100&h=100&fit=crop',
            level: 'Level 2 Seller',
            country: 'United States'
          },
          category: 'Graphics & Design',
          subcategory: 'Logo Design',
          is_featured: true
        },
        {
          id: 'mock-2',
          title: 'I will develop a responsive React website',
          description: 'Custom React website with modern design and mobile optimization',
          price_from: 150,
          delivery_days: 7,
          rating: 4.8,
          reviews_count: 89,
          image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
          freelancer: {
            id: 'mock-f2',
            name: 'Alex Code',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            level: 'Top Rated Seller',
            country: 'Canada'
          },
          category: 'Programming & Tech',
          subcategory: 'Web Development',
          is_featured: true
        }
      ] : []

      const allServices = [...realServices, ...mockServices]
      setFeaturedServices(allServices)
      const mockCategories: Category[] = [
        {
          id: 'graphics-design',
          name: 'Graphics & Design',
          icon: '/images/categories/graphics-design.jpg',
          services_count: 1250,
          color: 'bg-purple-100 text-purple-600'
        },
        {
          id: 'programming-tech',
          name: 'Programming & Tech',
          icon: '/images/categories/programming-tech.jpg',
          services_count: 890,
          color: 'bg-blue-100 text-blue-600'
        },
        {
          id: 'digital-marketing',
          name: 'Digital Marketing',
          icon: '/images/categories/digital-marketing.jpg',
          services_count: 650,
          color: 'bg-green-100 text-green-600'
        },
        {
          id: 'writing-translation',
          name: 'Writing & Translation',
          icon: '/images/categories/writing-translation.jpg',
          services_count: 780,
          color: 'bg-orange-100 text-orange-600'
        },
        {
          id: 'video-animation',
          name: 'Video & Animation',
          icon: '/images/categories/video-animation.jpg',
          services_count: 420,
          color: 'bg-red-100 text-red-600'
        },
        {
          id: 'music-audio',
          name: 'Music & Audio',
          icon: '/images/categories/music-audio.jpg',
          services_count: 320,
          color: 'bg-indigo-100 text-indigo-600'
        },
        {
          id: 'data',
          name: 'Data',
          icon: '/images/categories/data.jpg',
          services_count: 280,
          color: 'bg-yellow-100 text-yellow-600'
        },
        {
          id: 'business',
          name: 'Business',
          icon: '/images/categories/business.jpg',
          services_count: 540,
          color: 'bg-pink-100 text-pink-600'
        }
      ]

      setPopularCategories(mockCategories)
      setLoading(false)

    } catch (err) {
      console.error('Error loading homepage data:', err)
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header - Updated to match login-page exactly */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Moved slightly right */}
            <div className="flex items-center ml-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <span className="text-2xl font-bold gradient-text">JobDekho</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="w-full flex group">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search for freelancers, skills, or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-l-xl text-gray-700 placeholder-gray-500"
                    style={{ 
                      backgroundColor: '#f5f5f0',
                      border: '1px solid #e5e7eb',
                      outline: 'none !important',
                      boxShadow: 'none !important',
                      borderRight: 'none',
                      accentColor: '#6b7280',
                      caretColor: '#374151'
                    }}
                    onFocus={(e) => {
                      e.target.style.setProperty('border-color', '#d1d5db', 'important')
                      e.target.style.setProperty('box-shadow', '0 0 0 1px #d1d5db', 'important')
                      e.target.style.setProperty('outline', 'none', 'important')
                    }}
                    onBlur={(e) => {
                      e.target.style.setProperty('border-color', '#e5e7eb', 'important')
                      e.target.style.setProperty('box-shadow', 'none', 'important')
                    }}
                  />
                  <style jsx>{`
                    input:focus {
                      outline: none !important;
                      box-shadow: 0 0 0 1px #d1d5db !important;
                      border-color: #d1d5db !important;
                    }
                    input:focus-visible {
                      outline: none !important;
                      box-shadow: 0 0 0 1px #d1d5db !important;
                    }
                  `}</style>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-r-xl text-gray-600 hover:text-gray-800"
                  style={{ 
                    backgroundColor: '#f5f5f0',
                    border: '1px solid #e5e7eb',
                    borderLeft: 'none',
                    outline: 'none'
                  }}
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login?type=client"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-full hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 hover:shadow-lg hover:scale-105 shadow-md"
              >
                Sign In
              </Link>
              <Link
                href="/auth/login?type=freelancer"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-lg hover:scale-105 shadow-md"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-gray-900 relative overflow-hidden" style={{ backgroundColor: '#f5f5f0' }}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight gradient-text">
              Connect Talent with Opportunity
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              JobDekho bridges the gap between talented freelancers and businesses seeking quality work. Whether you're looking to hire skilled professionals or find your next project, we make freelancing simple, secure, and successful.
            </p>
            
            {/* Mobile Search */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="flex group shadow-xl rounded-xl overflow-hidden">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search freelancers or services (e.g., web design, content writing)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 text-gray-900 text-lg focus:outline-none bg-white border-0 placeholder-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 transition-all duration-200 text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
                >
                  <Search className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                </button>
              </form>
            </div>

            {/* Popular Searches */}
            <div className="mt-8">
              <span className="text-gray-600 text-sm font-medium">Trending Services:</span>
              {['Website Design', 'WordPress', 'Logo Design', 'Video Editing'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term)
                    router.push(`/search?q=${encodeURIComponent(term)}`)
                  }}
                  className="ml-4 px-4 py-2 bg-white/70 backdrop-blur-sm text-gray-700 rounded-full hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium border border-gray-200/50"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Freelance Services</h2>
            <p className="text-lg text-gray-600">Discover skilled professionals across diverse categories ready to bring your projects to life</p>
          </div>
          
          <div className="grid grid-cols-4 gap-12">
            {popularCategories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group text-center transform transition-all duration-200 hover:scale-105"
              >
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden mb-4 mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img 
                    src={category.icon} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full ${category.color} rounded-2xl flex items-center justify-center"><span class="text-sm font-bold">${category.name.split(' ')[0]}</span></div>`
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl"></div>
                </div>
                <h3 className="font-medium text-gray-900 text-base group-hover:text-emerald-600 transition-colors duration-200">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 relative overflow-hidden" style={{ backgroundColor: '#f5f5f0' }}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10zm10 0c0 5.5-4.5 10-10 10s-10-4.5-10-10 4.5-10 10-10 10 4.5 10 10z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Freelancers</h2>
              <p className="text-lg text-gray-600">Meet our verified professionals delivering exceptional results</p>
            </div>
            <Link
              href="/search?featured=true"
              className="flex items-center text-black hover:text-emerald-600 font-semibold transition-colors duration-200 group"
            >
              Explore all freelancers
              <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.length > 0 ? (
              featuredServices.map((service) => (
                <Link
                  key={service.id}
                  href={service.id.startsWith('mock-') ? '#' : `/freelancer/${service.id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-xl hover:border-gray-300/50 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Service Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Eye className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                      <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors duration-200" />
                    </button>
                    
                    {/* Real Freelancer Badge */}
                    {!service.id.startsWith('mock-') && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs rounded-full font-semibold shadow-lg flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Live
                      </div>
                    )}
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Service Content */}
                  <div className="p-5">
                    {/* Freelancer Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {service.freelancer.avatar_url ? (
                          <img
                            src={service.freelancer.avatar_url}
                            alt={service.freelancer.name}
                            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm">
                            {getInitials(service.freelancer.name)}
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900">{service.freelancer.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{service.freelancer.level}</p>
                        </div>
                      </div>
                      {service.freelancer.country && (
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                          <MapPin className="w-3 h-3 mr-1" />
                          {service.freelancer.country}
                        </div>
                      )}
                    </div>

                    {/* Service Title */}
                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200 leading-snug">
                      {service.title}
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-900 ml-1">{service.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500 ml-1">({service.reviews_count})</span>
                      </div>
                    </div>

                    {/* Price and Delivery */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.delivery_days} days
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Starting at</p>
                        <p className="text-xl font-bold text-gray-900">${service.price_from}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200/50 max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Your Freelance Journey</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Join JobDekho as a freelancer and showcase your skills to clients worldwide. Build your profile, set your rates, and start earning today!
                  </p>
                  <Link
                    href="/auth/signup?type=freelancer"
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-semibold hover:shadow-xl hover:scale-105 shadow-lg"
                  >
                    Become a Freelancer
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-800 text-center py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <span className="text-2xl font-bold gradient-text">JobDekho</span>
          </div>
          <p className="text-gray-400">&copy; 2024 JobDekho. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}