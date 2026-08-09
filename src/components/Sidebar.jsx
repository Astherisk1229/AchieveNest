import React, { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../services/authService'
import useTheme from '../hooks/useTheme'
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
  Sun,
  Moon
} from 'lucide-react'

export default function Sidebar({ currentUser, onRoleChange }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const user = currentUser || getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const activeContext = user?.active_role_context || user?.user_type || 'student'
  const activeTabParam = searchParams.get('tab') || 'overview'

  const getPortalInfo = () => {
    switch (activeContext) {
      case 'student':
        return { label: 'Student Portal', path: '/student/dashboard', roleTitle: 'Student' }
      case 'program_coordinator':
        return { label: 'Program Coordinator', path: '/personnel/dashboard?tab=overview', roleTitle: 'Program Coordinator' }
      case 'organization_moderator':
        return { label: 'Org Moderator Portal', path: '/personnel/dashboard', roleTitle: 'Organization Account' }
      case 'department_secretary':
        return { label: 'Dept Secretary Portal', path: '/personnel/dashboard', roleTitle: 'Department Secretary' }
      case 'hr_staff':
        return { label: 'HR Office Portal', path: '/hr/dashboard', roleTitle: 'HR Staff' }
      case 'osad_staff':
        return { label: 'OSAD Admin Portal', path: '/osad/dashboard', roleTitle: 'OSAD Admin' }
      default:
        return { label: 'Personnel Portal', path: '/personnel/dashboard', roleTitle: 'Personnel' }
    }
  }

  const portalInfo = getPortalInfo()

  // Navigation Items according to active role context
  const getNavItems = () => {
    if (activeContext === 'hr_staff' || location.pathname.includes('/hr/')) {
      return [
        { label: 'Executive Command Center', icon: Home, path: '/hr/dashboard?tab=overview', tab: 'overview' },
        { label: 'Personnel Directory & Rank', icon: Users, path: '/hr/dashboard?tab=personnel', tab: 'personnel' },
        { label: 'Faculty Verification Queue', icon: FileCheck2, path: '/hr/dashboard?tab=verification', tab: 'verification' },
        { label: 'Accreditation & Audit Logs', icon: ShieldCheck, path: '/hr/dashboard?tab=reports', tab: 'reports' },
      ]
    }

    if (activeContext === 'osad_staff' || location.pathname.includes('/osad/')) {
      return [
        { label: 'OSAD Command Center', icon: Home, path: '/osad/dashboard?tab=overview', tab: 'overview' },
        { label: 'Student Governance', icon: Users, path: '/osad/dashboard?tab=accounts', tab: 'accounts' },
        { label: 'Departments & Programs', icon: Building2, path: '/osad/dashboard?tab=departments', tab: 'departments' },
        { label: 'Student Organizations', icon: Building2, path: '/osad/dashboard?tab=organizations', tab: 'organizations' },
        { label: 'Award Categories', icon: Award, path: '/osad/dashboard?tab=awards', tab: 'awards' },
        { label: 'Identify Awardees', icon: LayoutGrid, path: '/osad/dashboard?tab=awardees', tab: 'awardees' },
        { label: 'Accreditation Reports', icon: FileCheck2, path: '/osad/dashboard?tab=reports', tab: 'reports' },
        { label: 'System Audit Logs', icon: ShieldCheck, path: '/osad/dashboard?tab=audit', tab: 'audit' },
      ]
    }

    if (activeContext === 'program_coordinator') {
      return [
        { label: 'Overview', icon: Home, path: '/personnel/dashboard?tab=overview', tab: 'overview' },
        { label: 'Verification Workspace', icon: ShieldCheck, path: '/personnel/dashboard?tab=workspace', tab: 'workspace' },
        { label: 'Students', icon: Users, path: '/personnel/dashboard?tab=students', tab: 'students' },
      ]
    }

    if (activeContext === 'organization_moderator') {
      return [
        { label: 'Dashboard', icon: LayoutGrid, path: '/personnel/dashboard?tab=dashboard', tab: 'dashboard' },
        { label: 'Manage Events', icon: Calendar, path: '/personnel/dashboard?tab=events', tab: 'events' },
        { label: 'Attendance Sessions', icon: QrCode, path: '/personnel/dashboard?tab=attendance', tab: 'attendance' },
        { label: 'Manage Profile', icon: User, path: '/personnel/dashboard?tab=profile', tab: 'profile' },
      ]
    }

    if (activeContext === 'personnel') {
      return [
        { label: 'Homepage', icon: Home, path: '/personnel/dashboard' },
        { label: 'Achievements', icon: Award, path: '/personnel/achievements' },
        { label: 'Portfolio', icon: FolderKanban, path: '/personnel/portfolio' },
        { label: 'Account', icon: User, path: '/personnel/account' },
      ]
    }

    return [
      { label: 'Homepage', icon: Home, path: portalInfo.path },
      { label: 'Achievements', icon: Award, path: '/student/achievements' },
      { label: 'Portfolio', icon: FolderKanban, path: '/student/portfolio' },
      { label: 'Account', icon: User, path: '/student/account' },
    ]
  }

  const navItems = getNavItems()

  // Active state indicators
  const isNotificationsActive = location.pathname.includes('notifications')
  const isAccountActive = location.pathname.includes('account')
  const isSettingsActive = location.pathname.includes('settings')

  const defaultTabForContext = activeContext === 'organization_moderator' ? 'dashboard' : 'overview'
  const currentActiveTab = activeTabParam || defaultTabForContext
  const isOSADAdmin = activeContext === 'osad_staff' || location.pathname.includes('/osad/')

  return (
    <aside className={`w-60 flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans overflow-y-auto no-scrollbar transition-colors duration-200 ${
      isOSADAdmin
        ? 'bg-white dark:bg-[#0d1520] text-slate-900 dark:text-slate-100 border-r border-slate-200/80 dark:border-slate-800/80 selection:bg-[#2d8a4e] selection:text-white'
        : 'bg-[#1b4332] dark:bg-[#07130b] text-white border-r border-[#285d3c] dark:border-emerald-950/80 selection:bg-[#2d8a4e] selection:text-white'
    }`}>
      <div>
        
        {/* Brand Header */}
        <div className={`p-4 flex items-center gap-3 border-b ${
          isOSADAdmin
            ? 'border-slate-100 dark:border-slate-800/80'
            : 'border-[#285d3c] dark:border-emerald-950/80'
        }`}>
          <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs shrink-0 border border-slate-100">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
              <circle cx="50" cy="50" r="28" fill="#ffffff" />
              <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
            </svg>
          </div>
          <div>
            <h1 className={`font-extrabold text-lg leading-tight tracking-tight ${
              isOSADAdmin ? 'text-slate-900 dark:text-white' : 'text-[#ffffff]'
            }`}>AchieveNest</h1>
            <p className={`text-[10px] font-bold tracking-widest uppercase ${
              isOSADAdmin ? 'text-[#2d8a4e] dark:text-emerald-400' : 'text-emerald-200/80 dark:text-emerald-400/80'
            }`}>NDMU OSAD</p>
          </div>
        </div>

        {/* Sidebar Search Input */}
        <div className="p-3 pb-1.5">
          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
              isOSADAdmin ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-200/60 dark:text-emerald-400/60'
            }`}>
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search OSAD Portal..."
              className={`w-full pl-8.5 pr-2.5 py-1.5 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2d8a4e] transition ${
                isOSADAdmin
                  ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400'
                  : 'bg-[#133626] dark:bg-[#030a05] border border-[#245236] dark:border-emerald-950/80 text-white placeholder-emerald-200/50 dark:placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Active Portal / Role Badge */}
        <div className="px-3 py-1.5">
          <div className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-between shadow-2xs border ${
            isOSADAdmin
              ? 'bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1e5831] dark:text-emerald-300 border-[#2d8a4e]/30 dark:border-emerald-800/60 font-bold'
              : activeContext === 'program_coordinator' 
              ? 'bg-[#1d6bba] border-blue-400/40 text-white font-bold' 
              : activeContext === 'organization_moderator'
              ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30'
              : activeContext === 'hr_staff' || location.pathname.includes('/hr/')
              ? 'bg-emerald-700/80 border-emerald-400/50 text-white font-bold'
              : 'bg-[#2d8a4e] dark:bg-[#184528] border-emerald-400/30 dark:border-emerald-700/50 text-white font-bold'
          }`}>
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className={`w-3.5 h-3.5 ${isOSADAdmin ? 'text-[#2d8a4e] dark:text-emerald-400' : 'text-emerald-300'}`} />
              {portalInfo.roleTitle || portalInfo.label}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 pt-3 space-y-1">
          <p className={`px-3 text-[10px] uppercase font-extrabold tracking-wider mb-2 ${
            isOSADAdmin ? 'text-slate-400 dark:text-slate-400' : 'text-emerald-300/70 dark:text-emerald-400/70'
          }`}>Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isTabActive = item.tab && item.tab === currentActiveTab
            const isPathActive = location.pathname === item.path.split('?')[0] && !item.tab
            const isAccountPageActive = !item.tab && item.path.includes('account') && isAccountActive && !location.pathname.includes('/osad/')
            const isActive = item.tab ? isTabActive : (isPathActive || isAccountPageActive)
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigate(item.path)
                }}
                className={`w-full px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer ${
                  isActive
                    ? isOSADAdmin
                      ? 'bg-[#eef7f0] dark:bg-emerald-950/70 text-[#1e5831] dark:text-emerald-300 border border-[#2d8a4e]/30 dark:border-emerald-700/50 shadow-2xs'
                      : 'bg-[#2d8a4e] dark:bg-[#184528] text-white dark:text-emerald-100 shadow-2xs border border-emerald-400/20 dark:border-emerald-600/40'
                    : isOSADAdmin
                      ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      : 'text-emerald-100/80 dark:text-slate-300 hover:bg-[#205236] dark:hover:bg-[#0c2415] hover:text-white'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
                  isActive
                    ? isOSADAdmin
                      ? 'bg-[#2d8a4e] dark:bg-emerald-500 text-white dark:text-slate-950'
                      : 'bg-white/20 text-white'
                    : isOSADAdmin
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50'
                      : 'bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-300 dark:text-emerald-400'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

      </div>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t space-y-1 ${
        isOSADAdmin ? 'border-slate-100 dark:border-slate-800/80' : 'border-[#285d3c] dark:border-emerald-950/80'
      }`}>
        <p className={`px-3 text-[10px] uppercase font-extrabold tracking-wider mb-2 ${
          isOSADAdmin ? 'text-slate-400 dark:text-slate-400' : 'text-emerald-300/70 dark:text-emerald-400/70'
        }`}>Account</p>
        
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className={`w-full px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer ${
            isNotificationsActive
              ? isOSADAdmin
                ? 'bg-[#eef7f0] dark:bg-emerald-950/70 text-[#1e5831] dark:text-emerald-300 border border-[#2d8a4e]/30 dark:border-emerald-700/50 shadow-2xs'
                : 'bg-[#2d8a4e] dark:bg-[#184528] text-white dark:text-emerald-100 shadow-2xs border border-emerald-400/20 dark:border-emerald-600/40'
              : isOSADAdmin
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                : 'text-emerald-100/80 dark:text-slate-300 hover:bg-[#205236] dark:hover:bg-[#0c2415] hover:text-white'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
            isNotificationsActive
              ? isOSADAdmin ? 'bg-[#2d8a4e] dark:bg-emerald-500 text-white dark:text-slate-950' : 'bg-white/20 text-white'
              : isOSADAdmin ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-300 dark:text-emerald-400'
          }`}>
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/student/settings')}
          className={`w-full px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer ${
            isSettingsActive
              ? isOSADAdmin
                ? 'bg-[#eef7f0] dark:bg-emerald-950/70 text-[#1e5831] dark:text-emerald-300 border border-[#2d8a4e]/30 dark:border-emerald-700/50 shadow-2xs'
                : 'bg-[#2d8a4e] dark:bg-[#184528] text-white dark:text-emerald-100 shadow-2xs border border-emerald-400/20 dark:border-emerald-600/40'
              : isOSADAdmin
                ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                : 'text-emerald-100/80 dark:text-slate-300 hover:bg-[#205236] dark:hover:bg-[#0c2415] hover:text-white'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
            isSettingsActive
              ? isOSADAdmin ? 'bg-[#2d8a4e] dark:bg-emerald-500 text-white dark:text-slate-950' : 'bg-white/20 text-white'
              : isOSADAdmin ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-emerald-500/15 dark:bg-emerald-950/60 text-emerald-300 dark:text-emerald-400'
          }`}>
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-200 flex items-center gap-3 transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          <span>Logout</span>
        </button>
      </div>

    </aside>
  )
}
