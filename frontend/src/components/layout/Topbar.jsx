import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getCurrentUser, logoutUser, updateUserRoleContext } from '../../services/authService'
import NotificationPopover from '../common/NotificationPopover'
import useTheme from '../../hooks/useTheme'
import { 
  Menu, 
  ChevronDown, 
  ChevronUp, 
  LogOut, 
  Search, 
  User, 
  Settings, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Users,
  Sun,
  Moon
} from 'lucide-react'

import { getAccountRoute, getSettingsRoute } from '../../utils/portalRoutes'

export default function Header({ currentUser, onToggleSidebar, onRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, isDark, toggleTheme, setTheme } = useTheme()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSwitchToOpen, setIsSwitchToOpen] = useState(true)

  const user = currentUser || getCurrentUser() || {
    full_name: 'Juan A. Dela Cruz',
    user_type: 'student',
    active_role_context: 'student'
  }

  const userType = user?.user_type || 'student'
  const activeRoleContext = user?.active_role_context || userType
  
  const targetAccountPath = getAccountRoute(user)
  const targetSettingsPath = getSettingsRoute(user)

  const isPersonnelUser = userType !== 'student' && userType !== 'osad_staff' && userType !== 'hr_staff'

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const handleSelectRole = (roleId) => {
    const updated = updateUserRoleContext(roleId)
    if (onRoleChange) {
      onRoleChange(roleId, updated)
    }
    // Personnel Dashboard handles all personnel sub-role views dynamically
    navigate('/personnel/dashboard')
  }

  // Personnel role options for role switcher
  const allPersonnelRoles = [
    { id: 'personnel', label: 'Personnel Account View', icon: UserCheck },
    { id: 'department_secretary', label: 'Department Secretary View', icon: Building2 },
    { id: 'program_coordinator', label: 'Program Coordinator View', icon: ShieldCheck },
    { id: 'organization_moderator', label: 'Organization Account View', icon: Users }
  ]

  // Filter out active role context for personnel users
  const availableSwitchRoles = allPersonnelRoles.filter(role => role.id !== activeRoleContext)

  // Label display helper for user type & active role context
  const getUserTypeLabel = () => {
    if (activeRoleContext === 'program_coordinator') return 'Program Coordinator'
    if (activeRoleContext === 'department_secretary') return 'Department Secretary'
    if (activeRoleContext === 'organization_moderator') return 'Organization Moderator'
    if (activeRoleContext === 'personnel') return 'Personnel'
    if (activeRoleContext === 'hr_staff' || userType === 'hr_staff') return 'HR Staff'
    if (activeRoleContext === 'osad_staff' || userType === 'osad_staff') return 'OSAD Staff'
    if (userType === 'student') return 'Student'
    return userType.replace('_', ' ')
  }

  return (
    <header className="bg-white/95 dark:bg-[#0d1520]/95 border-b border-slate-200/80 dark:border-slate-800/80 px-5 py-2 shrink-0 z-30 flex items-center justify-between font-sans transition-colors duration-200 backdrop-blur-md">
      
      {/* Left Side: Sidebar Toggle Menu Icon */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Right Side: Notification Icon, Theme Toggle & User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        
        {/* Dark / Light Mode Quick Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#2d8a4e] dark:hover:text-emerald-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition active:scale-[0.98] cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark / Light Theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400 animate-in spin-in-90 duration-200" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 animate-in spin-in-45 duration-200" />
          )}
        </button>

        <NotificationPopover />

        {/* System Settings Quick Icon Button */}
        <Link
          to={targetSettingsPath}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#2d8a4e] dark:hover:text-emerald-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition active:scale-[0.98] cursor-pointer"
          title="System Settings"
          aria-label="Open Settings"
        >
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>

        {/* User Profile Dropdown Container */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition active:scale-[0.98] cursor-pointer group"
          >
            <div className="w-9.5 h-9.5 rounded-full border-2 border-[#2d8a4e] p-0.5 overflow-hidden shrink-0 shadow-xs aspect-square">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="User Avatar"
                width="38"
                height="38"
                className="w-full h-full object-cover rounded-full aspect-square"
                fetchpriority="high"
                decoding="async"
                loading="eager"
              />
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.full_name || 'Juan A. Dela Cruz'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1">
                  <User className="w-3 h-3 text-[#2d8a4e] dark:text-emerald-400" />
                  {getUserTypeLabel()}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
              </div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-white dark:bg-[#131e2e] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Header User Card inside Dropdown */}
                <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#eef7f0] dark:bg-emerald-950/60 border border-[#cbe6d2] dark:border-emerald-800/60 flex items-center justify-center text-[#2d8a4e] dark:text-emerald-400 shrink-0 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{user?.full_name || 'Juan A. Dela Cruz'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-[#2d8a4e] dark:text-emerald-400" /> {getUserTypeLabel()}
                    </p>
                  </div>
                </div>

                {/* Main Action Links */}
                <div className="space-y-1 py-1">
                  
                  {/* My Profile */}
                  <Link
                    to={targetAccountPath}
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2.5 transition text-left active:scale-[0.98] cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  {/* Settings */}
                  <Link
                    to={targetSettingsPath}
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2.5 transition text-left active:scale-[0.98] cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Settings</span>
                  </Link>

                  {/* Theme Mode Toggle Option */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-between transition text-left active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      )}
                      <span>Appearance Mode</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {isDark ? 'Dark' : 'Light'}
                    </span>
                  </button>

                  {/* Switch Workspace Accordion Submenu */}
                  {isPersonnelUser && availableSwitchRoles.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSwitchToOpen(!isSwitchToOpen)}
                        className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-between transition text-left active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>Switch Workspace Context</span>
                        </div>
                        {isSwitchToOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {/* Expandable Role Options List */}
                      {isSwitchToOpen && (
                        <div className="ml-3 pl-3 my-1 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
                          {availableSwitchRoles.map(role => {
                            const IconComp = role.icon
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => { handleSelectRole(role.id); setIsProfileOpen(false) }}
                                className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-left text-slate-600 dark:text-slate-300 hover:bg-[#eef7f0] dark:hover:bg-emerald-950/60 hover:text-[#1e5831] dark:hover:text-emerald-300 active:scale-[0.98] cursor-pointer"
                              >
                                <IconComp className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                                <span>{role.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Logout Button */}
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-2 transition text-left active:scale-[0.98] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

              </div>
            </>
          )}
        </div>
      </div>

    </header>
  )
}
