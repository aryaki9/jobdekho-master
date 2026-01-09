'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import { 
    CheckCircle2, Clock, Target, TrendingUp, Calendar, Briefcase, 
    MapPin, ExternalLink, BarChart3, Award, BookOpen, Flame, ArrowRight 
} from 'lucide-react'

// ==================== CUSTOM CURSOR COMPONENT ====================
const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            setIsHovering(
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') !== null ||
                target.closest('a') !== null ||
                target.classList.contains('hoverable')
            )
        }

        window.addEventListener('mousemove', updateMousePosition)
        window.addEventListener('mouseover', handleMouseOver)

        return () => {
            window.removeEventListener('mousemove', updateMousePosition)
            window.removeEventListener('mouseover', handleMouseOver)
        }
    }, [])

    return (
        <>
            <motion.div
                className="cursor-dot"
                animate={{
                    x: mousePosition.x - 3,
                    y: mousePosition.y - 3,
                    scale: isHovering ? 0 : 1,
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            />
            <motion.div
                className="cursor-ring"
                animate={{
                    x: mousePosition.x - 16,
                    y: mousePosition.y - 16,
                    scale: isHovering ? 1.5 : 1,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            />
            <motion.div
                className="cursor-glow"
                animate={{
                    x: mousePosition.x - 40,
                    y: mousePosition.y - 40,
                    opacity: isHovering ? 0.6 : 0,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            />
        </>
    )
}

export default function Dashboard() {
    // ==================== ALL ORIGINAL STATE - UNCHANGED ====================
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [learningPlan, setLearningPlan] = useState<any>(null)
    const [progress, setProgress] = useState<any>(null)
    const [skillsCount, setSkillsCount] = useState(0)
    const [userSkills, setUserSkills] = useState<any[]>([])
    const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
    const [jobsLoading, setJobsLoading] = useState(false)
    const [nextActions, setNextActions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // ==================== ALL ORIGINAL LOGIC - UNCHANGED ====================
    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/signin')
                return
            }

            setUser(user)

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (!profile) {
                router.push('/onboarding')
                return
            }

            setProfile(profile)

            const { data: skillsData } = await supabase
                .from('user_skills')
                .select(`
                    *,
                    skills (name, category)
                `)
                .eq('user_id', user.id)

            if (skillsData) {
                setUserSkills(skillsData)
                setSkillsCount(skillsData.length)

                if (profile.target_role) {
                    await loadJobRecommendations(profile.target_role, skillsData)
                }
            }

            const { data: plans } = await supabase
                .from('learning_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            const plan = plans && plans.length > 0 ? plans[0] : null
            setLearningPlan(plan)

            if (plan) {
                const { data: progressData } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('plan_id', plan.id)
                    .single()

                setProgress(progressData)

                if (progressData && plan.plan_data) {
                    const actions = getNextActions(plan, progressData)
                    setNextActions(actions)
                }
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading dashboard:', error)
            setLoading(false)
        }
    }

    const loadJobRecommendations = async (targetRole: string, skills: any[]) => {
        if (!targetRole || skills.length === 0) return

        setJobsLoading(true)
        try {
            const response = await fetch('/api/job/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keywords: targetRole,
                    location: 'India',
                    limit: 4
                })
            })

            if (response.ok) {
                const data = await response.json()

                if (data.jobs && data.jobs.length > 0) {
                    const jobsWithScores = data.jobs.map((job: any) => ({
                        ...job,
                        matchScore: calculateJobMatch(job, skills)
                    }))

                    jobsWithScores.sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0))
                    setRecommendedJobs(jobsWithScores.slice(0, 4))
                }
            }
        } catch (error) {
            console.error('Error loading job recommendations:', error)
        }
        setJobsLoading(false)
    }

    const calculateJobMatch = (job: any, userSkills: any[]): number => {
        if (!job.requirements || job.requirements.length === 0) return 30
        if (!userSkills || userSkills.length === 0) return 10

        const userSkillNames = userSkills
            .filter(skill => skill.proficiency_level >= 2)
            .map(skill => skill.skills.name.toLowerCase())

        const matchedRequirements = job.requirements.filter((req: string) =>
            userSkillNames.some(userSkill =>
                userSkill.includes(req.toLowerCase()) || req.toLowerCase().includes(userSkill)
            )
        )

        return Math.round((matchedRequirements.length / job.requirements.length) * 100)
    }

    const getNextActions = (plan: any, progress: any) => {
        const currentWeek = getCurrentWeek(plan)
        const completedTasks = progress.completed_tasks || []

        if (!plan.plan_data?.weeks || currentWeek > plan.plan_data.weeks.length) {
            return []
        }

        const weekData = plan.plan_data.weeks[currentWeek - 1]
        if (!weekData?.tasks) return []

        const pendingTasks = weekData.tasks
            .filter((task: any) => !completedTasks.includes(task.id))
            .slice(0, 3)
            .map((task: any) => ({
                ...task,
                week: currentWeek
            }))

        return pendingTasks
    }

    const getCurrentWeek = (plan: any): number => {
        const startDate = new Date(plan.created_at)
        const now = new Date()
        const weeksPassed = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        return Math.min(weeksPassed + 1, plan.duration_weeks || 1)
    }

    const markTaskComplete = async (taskId: string) => {
        if (!progress) return

        const newCompletedTasks = [...(progress.completed_tasks || []), taskId]
        const totalTasks = getTotalTasks(learningPlan.plan_data)
        const newProgress = Math.round((newCompletedTasks.length / totalTasks) * 100)

        try {
            const { error } = await supabase
                .from('user_progress')
                .update({
                    completed_tasks: newCompletedTasks,
                    overall_completion_percentage: newProgress,
                    last_activity_date: new Date().toISOString().split('T')[0],
                    updated_at: new Date().toISOString()
                })
                .eq('id', progress.id)

            if (!error) {
                loadDashboardData()
            }
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const getTotalTasks = (planData: any): number => {
        return planData?.weeks?.reduce((total: number, week: any) =>
            total + (week.tasks?.length || 0), 0) || 0
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    // ==================== COMPUTED VALUES - UNCHANGED ====================
    const overallProgress = progress?.overall_completion_percentage || 0
    const completedTasks = progress?.completed_tasks?.length || 0
    const currentWeek = learningPlan ? getCurrentWeek(learningPlan) : 1
    const studyHoursThisWeek = 0

    // Helper to get match tier
    const getMatchTier = (score: number) => {
        if (score >= 70) return 'excellent'
        if (score >= 50) return 'good'
        return 'potential'
    }

    // ==================== LOADING STATE ====================
    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner-gradient" />
                <p>Loading your dashboard...</p>
            </div>
        )
    }

    // ==================== MAIN RENDER ====================
    return (
        <>
            <CustomCursor />
            <div className="noise-overlay" />

            <div className="dashboard-container">
                {/* Navigation */}
                <nav className="dashboard-nav">
                    <div className="nav-inner">
                        <Link href="/" className="nav-logo">
                            CAREER GPS
                        </Link>
                        <div className="nav-links">
                            <Link href="/dashboard" className="nav-link active">
                                Dashboard
                            </Link>
                            <Link href="/plan" className="nav-link">
                                Learning Plan
                            </Link>
                            <Link href="/jobs" className="nav-link">
                                Jobs
                            </Link>
                            <button onClick={handleSignOut} className="nav-link">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <div className="dashboard-main">
                    {/* Hero Card */}
                    <motion.div
                        className="hero-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="hero-glow" />

                        <div className="hero-header">
                            <div>
                                <h1 className="hero-title">
                                    Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0]}</span>! 👋
                                </h1>
                                <p className="hero-subtitle">
                                    You're on track to becoming a <span className="highlight">{profile?.target_role}</span>
                                </p>
                            </div>
                            <button onClick={() => router.push('/plan')} className="hero-cta">
                                View Full Plan
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <motion.div
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                <div className="stat-icon blue">
                                    <TrendingUp />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{overallProgress}%</div>
                                    <div className="stat-label">Overall Progress</div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                            >
                                <div className="stat-icon green">
                                    <Calendar />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{studyHoursThisWeek}h</div>
                                    <div className="stat-label">This Week</div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                            >
                                <div className="stat-icon purple">
                                    <CheckCircle2 />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{completedTasks}</div>
                                    <div className="stat-label">Tasks Done</div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                            >
                                <div className="stat-icon orange">
                                    <Award />
                                </div>
                                <div className="stat-content">
                                    <div className="stat-value">{skillsCount}</div>
                                    <div className="stat-label">Skills Mastered</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-label">Learning Journey</span>
                                <span className="progress-value">Week {currentWeek} of {learningPlan?.duration_weeks || 12}</span>
                            </div>
                            <div className="progress-track">
                                <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallProgress}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Bento Grid: Actions + Streak */}
                    <div className="bento-grid">
                        {/* Next Actions Card */}
                        <motion.div
                            className="section-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="section-header">
                                <h2 className="section-title">
                                    <Flame style={{ color: '#f97316' }} />
                                    Your Next Actions
                                </h2>
                                <span className="section-badge">Week {currentWeek}</span>
                            </div>

                            {nextActions.length > 0 ? (
                                <div className="actions-list">
                                    {nextActions.map((action, index) => (
                                        <motion.div
                                            key={action.id}
                                            className="action-item"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                        >
                                            <div className="action-number">{index + 1}</div>
                                            <div className="action-content">
                                                <h3 className="action-title">{action.title}</h3>
                                                <div className="action-meta">
                                                    <Clock />
                                                    <span>{action.estimatedHours}h</span>
                                                    <span>•</span>
                                                    <span>{action.type}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => markTaskComplete(action.id)}
                                                className="action-btn"
                                            >
                                                Complete
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="actions-empty">
                                    <CheckCircle2 />
                                    <p>Great job! You're all caught up.</p>
                                </div>
                            )}

                            <div className="actions-footer">
                                <button onClick={() => router.push('/plan')} className="actions-footer-btn">
                                    View All Tasks
                                    <ArrowRight />
                                </button>
                            </div>
                        </motion.div>

                        {/* Streak Card */}
                        <motion.div
                            className="streak-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <div className="streak-header">
                                <h3 className="streak-title">Study Streak</h3>
                                <div className="streak-icon">
                                    <Flame />
                                </div>
                            </div>

                            <div className="streak-value">
                                <div className="streak-number">0</div>
                                <div className="streak-label">days • longest: 0</div>
                            </div>

                            <div className="streak-goal">
                                <div className="streak-goal-header">
                                    <span className="streak-goal-label">This Week's Goal</span>
                                    <span className="streak-goal-value">
                                        <strong>{studyHoursThisWeek}h</strong> / {profile?.study_hours_per_week}h
                                    </span>
                                </div>
                                <div className="streak-progress-track">
                                    <div
                                        className="streak-progress-fill"
                                        style={{
                                            width: `${profile?.study_hours_per_week
                                                ? (studyHoursThisWeek / profile.study_hours_per_week) * 100
                                                : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Jobs Section */}
                    <motion.div
                        className="jobs-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="section-header">
                            <h2 className="section-title">
                                <Briefcase style={{ color: '#22c55e' }} />
                                Jobs Matching Your Skills
                            </h2>
                            <button onClick={() => router.push('/jobs')} className="section-link">
                                View All
                                <ArrowRight />
                            </button>
                        </div>

                        {jobsLoading ? (
                            <div className="jobs-loading">
                                <div className="spinner" />
                                <p>Finding jobs for you...</p>
                            </div>
                        ) : recommendedJobs.length > 0 ? (
                            <div className="jobs-grid">
                                {recommendedJobs.map((job, index) => {
                                    const tier = getMatchTier(job.matchScore || 0)
                                    return (
                                        <motion.div
                                            key={job.id}
                                            className={`job-card ${tier}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                        >
                                            <div className="job-header">
                                                <div>
                                                    <h3 className="job-title">{job.title}</h3>
                                                    <div className="job-company">{job.company}</div>
                                                    {job.location && (
                                                        <div className="job-location">
                                                            <MapPin />
                                                            {job.location}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`job-match ${tier}`}>
                                                    {job.matchScore || 0}% match
                                                </span>
                                            </div>

                                            <div className="job-skills">
                                                {job.requirements?.slice(0, 5).map((req: string, i: number) => {
                                                    const hasSkill = userSkills.some(skill =>
                                                        skill.skills.name.toLowerCase() === req.toLowerCase()
                                                    )
                                                    return (
                                                        <span
                                                            key={i}
                                                            className={`job-skill ${hasSkill ? 'matched' : 'missing'}`}
                                                        >
                                                            {req} {hasSkill && '✓'}
                                                        </span>
                                                    )
                                                })}
                                            </div>

                                            <button
                                                onClick={() => job.url !== '#' && window.open(job.url, '_blank')}
                                                className="job-btn"
                                            >
                                                View Details
                                                <ExternalLink />
                                            </button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="jobs-empty">
                                <Briefcase />
                                <h3>Finding Jobs for You</h3>
                                <p>We're searching for {profile?.target_role} opportunities</p>
                                <button onClick={() => router.push('/jobs')} className="jobs-empty-btn">
                                    Browse All Jobs
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* Learning Plan Summary */}
                    {learningPlan && (
                        <motion.div
                            className="plan-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            <div className="plan-header">
                                <div>
                                    <h2 className="plan-title">{learningPlan.title}</h2>
                                    <p className="plan-overview">
                                        {learningPlan.plan_data?.overview || 'Your personalized learning journey'}
                                    </p>
                                </div>
                                <button onClick={() => router.push('/plan')} className="hero-cta">
                                    View Full Plan
                                </button>
                            </div>

                            <div className="plan-stats">
                                <div className="plan-stat">
                                    <div className="plan-stat-value">{learningPlan.duration_weeks}</div>
                                    <div className="plan-stat-label">Weeks</div>
                                </div>
                                <div className="plan-stat">
                                    <div className="plan-stat-value">{learningPlan.total_hours}</div>
                                    <div className="plan-stat-label">Total Hours</div>
                                </div>
                                <div className="plan-stat">
                                    <div className="plan-stat-value">{completedTasks}</div>
                                    <div className="plan-stat-label">Tasks Done</div>
                                </div>
                                <div className="plan-stat">
                                    <div className="plan-stat-value">{currentWeek}</div>
                                    <div className="plan-stat-label">Current Week</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Analytics Section */}
                    <motion.div
                        className="analytics-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <div className="analytics-header">
                            <BarChart3 className="analytics-icon" />
                            <h2 className="analytics-title">Your Learning Analytics</h2>
                        </div>
                        <AnalyticsDashboard userId={user?.id} planId={learningPlan?.id} />
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        className="quick-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <button
                            onClick={() => router.push('/plan')}
                            disabled={!learningPlan}
                            className="quick-action-btn"
                        >
                            <BookOpen />
                            View Learning Plan
                        </button>
                        <button
                            onClick={() => router.push('/jobs')}
                            className="quick-action-btn"
                        >
                            <Briefcase />
                            Browse More Jobs
                        </button>
                        <button
                            disabled={!learningPlan}
                            className="quick-action-btn"
                        >
                            <Target />
                            Track Progress
                        </button>
                    </motion.div>
                </div>
            </div>
        </>
    )
}