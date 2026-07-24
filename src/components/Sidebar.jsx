import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../services/authService'
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
  BarChart3
} from 'lucide-react'

export default function Sidebar({ currentUser, onRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = currentUser || getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const activeContext = user?.active_role_context || user?.user_type || 'student'

  const getPortalInfo = () => {
    switch (activeContext) {
      case 'student':
        return { label: 'Student Portal', path: '/student/dashboard', roleTitle: 'Student' }
      case 'program_coordinator':
        return { label: 'Program Coordinator', path: '/personnel/dashboard', roleTitle: 'Program Coordinator' }
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
    if (activeContext === 'program_coordinator') {
      return [
        { label: 'Overview', icon: Home, path: '/personnel/dashboard' },
        { label: 'Verification Workspace', icon: ShieldCheck, path: '#workspace' },
        { label: 'Students', icon: Users, path: '#students' },
        { label: 'Reports', icon: BarChart3, path: '#reports' },
      ]
    }

    return [
      { label: 'Homepage', icon: Home, path: portalInfo.path },
      { label: 'Achievements', icon: Award, path: '/student/achievements' },
      { label: 'Portfolio', icon: FolderKanban, path: '#portfolio' },
      { label: 'Account', icon: User, path: '#account' },
    ]
  }

  const navItems = getNavItems()

  return (
    <aside className="w-64 bg-[#143823] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-[#1e4a30] selection:bg-[#2d8a4e] selection:text-white font-sans overflow-y-auto">
      <div>
        
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-[#1e4a30]">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="#0f4625" stroke="#f59e0b" strokeWidth="4"/>
              <circle cx="50" cy="50" r="28" fill="#ffffff" />
              <path d="M50 28 L57 42 L72 42 L60 52 L65 67 L50 57 L35 67 L40 52 L28 42 L43 42 Z" fill="#f59e0b" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-[#ffffff] leading-tight tracking-tight">AchieveNest</h1>
            <p className="text-xs text-emerald-200/80 font-bold tracking-widest uppercase">NDMU</p>
          </div>
        </div>

        {/* Sidebar Search Input */}
        <div className="p-4 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-200/60">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9.5 pr-3 py-2 rounded-xl bg-[#0c2416] border border-[#1e4a30] text-xs font-medium text-white placeholder-emerald-200/50 focus:outline-none focus:border-[#2d8a4e] transition"
            />
          </div>
        </div>

        {/* Active Portal / Role Badge */}
        <div className="px-4 py-2">
          <div className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-between shadow-sm border ${
            activeContext === 'program_coordinator' 
              ? 'bg-[#1d6bba] border-blue-400/40' 
              : 'bg-[#2d8a4e] border-emerald-400/30'
          }`}>
            <span className="flex items-center gap-2">
              {activeContext === 'program_coordinator' ? (
                <ShieldCheck className="w-4 h-4 text-blue-200" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-300" />
              )}
              {portalInfo.label}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 pt-3 space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-emerald-300/60 mb-2">Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path.startsWith('/')) {
                    navigate(item.path)
                  }
                }}
                className={`w-full px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition ${
                  isActive
                    ? 'bg-[#2d8a4e] text-white shadow-xs'
                    : 'text-emerald-100/80 hover:bg-[#1b4332] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-emerald-300" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#1e4a30] space-y-1">
        <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-emerald-300/60 mb-2">Account</p>
        
        <button
          type="button"
          onClick={() => alert('Notifications Center')}
          className="w-full px-3 py-2 rounded-xl font-bold text-xs text-emerald-100/80 hover:bg-[#1b4332] hover:text-white flex items-center gap-3 transition"
        >
          <Bell className="w-4 h-4 text-emerald-300" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => alert('Account Settings')}
          className="w-full px-3 py-2 rounded-xl font-bold text-xs text-emerald-100/80 hover:bg-[#1b4332] hover:text-white flex items-center gap-3 transition"
        >
          <Settings className="w-4 h-4 text-emerald-300" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-3 py-2 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center gap-3 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  )
}
