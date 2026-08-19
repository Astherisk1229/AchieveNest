import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import useTheme from '../../hooks/useTheme'
import {
  Home,
  Award,
  FolderKanban,
  User,
  Bell,
  Settings,
  LogOut,
  Search,
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  FileCheck2,
  LayoutGrid,
  Calendar,
  QrCode,
  Edit3,
  Sparkles
} from 'lucide-react'
import AdminOnboardingGuideWidget from '../common/AdminOnboardingGuideWidget'

export default function Sidebar({ currentUser, onRoleChange }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const user = currentUser || authUser || getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const activeContext = user?.active_role_context || authRoleContext || user?.user_type || 'student'
  const activeTabParam = searchParams.get('tab') || 'overview'

  const getPortalInfo = () => {
    switch (activeContext) {
      case 'student':
        return { label: 'Student Portal', path: '/student/dashboard', roleTitle: 'Student Portal' }
      case 'program_coordinator':
        return { label: 'Program Coordinator', path: '/personnel/dashboard?tab=overview', roleTitle: 'Program Coordinator' }
      case 'organization_moderator':
        return { label: 'Org Moderator Portal', path: '/personnel/dashboard', roleTitle: 'Organization Account' }
      case 'department_secretary':
        return { label: 'Dept Secretary Portal', path: '/personnel/dashboard', roleTitle: 'Department Secretary' }
      case 'hr_staff':
        return { label: 'HR Office Portal', path: '/hr/dashboard', roleTitle: 'HR Staff' }
      case 'osad_staff':
        return { label: 'OSAD Portal', path: '/osad/dashboard', roleTitle: 'OSAD Staff' }
      default:
        return { label: 'Personnel Portal', path: '/personnel/dashboard', roleTitle: 'Personnel Portal' }
    }
  }

  const portalInfo = getPortalInfo()
  const defaultTabForContext = 'overview'
  const isDashboardPage = location.pathname.includes('dashboard')

  const navItems = activeContext === 'osad_staff' || location.pathname.includes('/osad/') ? [
    { label: 'OSAD Dashboard', icon: Home, path: '/osad/dashboard', tab: 'overview' },
    { label: 'Academic Structure', icon: Building2, path: '/osad/dashboard?tab=departments', tab: 'departments' },
    { label: 'Student Accounts', icon: Users, path: '/osad/dashboard?tab=accounts', tab: 'accounts' },
    { label: 'Student Organizations', icon: Users, path: '/osad/dashboard?tab=organizations', tab: 'organizations' },
    { label: 'Award Categories', icon: Award, path: '/osad/dashboard?tab=awards', tab: 'awards' },
    { label: 'Certificate Templates', icon: Sparkles, path: '/osad/dashboard?tab=certificate-templates', tab: 'certificate-templates' },
    { label: 'Identify Awardees', icon: LayoutGrid, path: '/osad/dashboard?tab=awardees', tab: 'awardees' },
    { label: 'Accreditation Reports', icon: FileCheck2, path: '/osad/dashboard?tab=reports', tab: 'reports' },
    { label: 'OSAD Activity Log', icon: ShieldCheck, path: '/osad/dashboard?tab=audit', tab: 'audit' }
  ] : activeContext === 'hr_staff' || location.pathname.includes('/hr/') ? [
    { label: 'HR Dashboard', icon: Home, path: '/hr/dashboard', tab: 'overview' },
    { label: 'Personnel Directory', icon: UserCheck, path: '/hr/personnel-directory' },
    { label: 'Evaluation Submissions', icon: FolderKanban, path: '/hr/evaluation-submissions' },
    { label: 'HR Audit Trail', icon: ShieldCheck, path: '/hr/audit-trail' },
    { label: 'Rank Assignment Logs', icon: FileCheck2, path: '/hr/rank-assignment-logs' }
  ] : [
    { label: 'Dashboard Overview', icon: Home, path: '/personnel/dashboard' },
    { label: 'My Portfolio Dossier', icon: FolderKanban, path: '/personnel/portfolio/edit' },
    { label: 'Evaluations & Scorecard', icon: Award, path: '/personnel/evaluations' }
  ]

  const filteredNavItems = navItems.filter(item => {
    if (!searchTerm.trim()) return true
    return item.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  })

  const effectiveAdminContext = location.pathname.includes('/hr/')
    ? 'hr_staff'
    : location.pathname.includes('/osad/')
      ? 'osad_staff'
      : activeContext

  return (
    <aside className="w-64 bg-white dark:bg-[#131e2e] border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-screen sticky top-0 font-sans z-30 shadow-2xs">
      
      {/* Scrollable Navigation Region */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        
        {/* Brand Header */}
        <div className="px-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1b4332] dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              AN
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight block">AchieveNest</span>
              <span className="text-[10px] font-extrabold text-[#2d8a4e] dark:text-emerald-400 uppercase tracking-wider block">NDMU Portal</span>
            </div>
          </Link>
        </div>

        {/* Quick Search Bar */}
        <div className="px-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Portal..."
              className="w-full pl-8.5 pr-2.5 py-1.5 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1b4332] transition bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Active Portal / Role Badge */}
        <div className="px-3">
          <div className="w-full py-1.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-between border bg-[#edf3ec] dark:bg-emerald-950/60 text-[#1e5831] dark:text-emerald-300 border-[#d2e6d5] dark:border-emerald-800/60">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
              {portalInfo.roleTitle || portalInfo.label}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 space-y-1">
          <p className="px-3 text-[10px] uppercase font-extrabold tracking-wider mb-2 text-slate-400 dark:text-slate-400">
            Navigation
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const itemCleanPath = item.path.split('?')[0]
            const currentCleanPath = location.pathname.split('?')[0]

            let isActive = false
            if (item.tab) {
              if (isDashboardPage) {
                const activeTab = activeTabParam || defaultTabForContext
                isActive = (activeTab === item.tab)
              } else {
                isActive = (currentCleanPath === itemCleanPath)
              }
            } else {
              isActive = (currentCleanPath === itemCleanPath)
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`w-full px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-3 transition cursor-pointer ${isActive
                    ? 'bg-[#edf3ec] dark:bg-emerald-950/70 text-[#1e5831] dark:text-emerald-300 border border-[#d2e6d5] dark:border-emerald-700/50 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${isActive
                    ? 'bg-[#1b4332] dark:bg-emerald-500 text-white dark:text-slate-950'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

      </div>

      {/* Docked Admin Onboarding Guide Widget (For OSAD & HR Staff Admins) */}
      {(effectiveAdminContext === 'hr_staff' || effectiveAdminContext === 'osad_staff') && (
        <div className="shrink-0 px-3 pb-3 pt-2">
          <AdminOnboardingGuideWidget currentUser={user} activeRoleContext={effectiveAdminContext} />
        </div>
      )}
    </aside>
  )
}
