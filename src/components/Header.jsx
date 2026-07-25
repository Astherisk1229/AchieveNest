import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../services/authService'
import NotificationPopover from './NotificationPopover'
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
  Users 
} from 'lucide-react'

export default function Header({ currentUser, onToggleSidebar, onRoleChange }) {
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSwitchToOpen, setIsSwitchToOpen] = useState(true)

  const user = currentUser || getCurrentUser() || {
    full_name: 'Juan A. Dela Cruz',
    user_type: 'student',
    active_role_context: 'student'
  }

  const userType = user?.user_type || 'student'
  const isStudent = userType === 'student'
  const activeRoleContext = user?.active_role_context || userType

  const handleLogout = () => {
    logoutUser()
    navigate('/')
  }

  const handleSelectRole = (roleId) => {
    if (onRoleChange) {
      onRoleChange(roleId)
    }
  }

  // Personnel role options for role switcher
  const allPersonnelRoles = [
    { id: 'program_coordinator', label: 'Program Coordinator', icon: ShieldCheck },
    { id: 'organization_moderator', label: 'Organization Account', icon: Users },
    { id: 'department_secretary', label: 'Department Secretary', icon: Building2 },
    { id: 'personnel', label: 'Faculty / Personnel View', icon: UserCheck }
  ]

  // Filter out active role context for personnel users
  const availableSwitchRoles = allPersonnelRoles.filter(role => role.id !== activeRoleContext)

  // Label display helper for user type & active role context
  const getUserTypeLabel = () => {
    if (activeRoleContext === 'program_coordinator') return 'Program Coordinator'
    if (activeRoleContext === 'department_secretary') return 'Department Secretary'
    if (activeRoleContext === 'organization_moderator') return 'Organization Moderator'
    if (activeRoleContext === 'personnel') return 'Personnel'
    if (userType === 'student') return 'Student'
    return userType.replace('_', ' ')
  }

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 shrink-0 z-30 flex items-center justify-between shadow-2xs font-sans">
      
      {/* Left Side: Sidebar Toggle Menu Icon */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Right Side: Notification Icon & User Profile Dropdown */}
      <div className="flex items-center gap-4 sm:gap-5">
        <NotificationPopover />

        {/* User Profile Dropdown Container */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100/80 transition group"
          >
            <div className="w-9.5 h-9.5 rounded-full border-2 border-[#2d8a4e] p-0.5 overflow-hidden shrink-0 shadow-xs">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="User Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'Juan A. Dela Cruz'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-medium text-slate-500 capitalize flex items-center gap-1">
                  <User className="w-3 h-3 text-[#2d8a4e]" />
                  {getUserTypeLabel()}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition" />
              </div>
            </div>
          </button>

          {/* Profile Dropdown Menu - Perfectly Aligned Right */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200/90 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* Header User Card inside Dropdown */}
                <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 mb-2">
                  <div className="w-10 h-10 rounded-full bg-[#eef7f0] border border-[#cbe6d2] flex items-center justify-center text-[#2d8a4e] shrink-0 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{user?.full_name || 'Juan A. Dela Cruz'}</p>
                    <p className="text-[11px] text-slate-500 font-medium capitalize flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-[#2d8a4e]" /> {getUserTypeLabel()}
                    </p>
                  </div>
                </div>

                {/* Main Action Links */}
                <div className="space-y-1 py-1">
                  
                  {/* My Profile */}
                  <button
                    type="button"
                    onClick={() => { alert('Opening My Profile details...'); setIsProfileOpen(false) }}
                    className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold flex items-center gap-2.5 transition text-left"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>My Profile</span>
                  </button>

                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => { alert('Opening System Settings...'); setIsProfileOpen(false) }}
                    className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold flex items-center gap-2.5 transition text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </button>

                  {/* Switch To Accordion Submenu - ONLY FOR PERSONNEL ACCOUNTS */}
                  {!isStudent && userType === 'personnel' && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSwitchToOpen(!isSwitchToOpen)}
                        className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold flex items-center justify-between transition text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <RefreshCw className="w-4 h-4 text-slate-500" />
                          <span>Switch To</span>
                        </div>
                        {isSwitchToOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {/* Expandable Role Options List for Personnel */}
                      {isSwitchToOpen && (
                        <div className="ml-3 pl-3 my-1 border-l-2 border-slate-100 space-y-1">
                          {availableSwitchRoles.map(role => {
                            const IconComp = role.icon
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => { handleSelectRole(role.id); setIsProfileOpen(false) }}
                                className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-left text-slate-600 hover:bg-[#eef7f0] hover:text-[#1e5831]"
                              >
                                <IconComp className="w-3.5 h-3.5 text-[#2d8a4e]" />
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
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-2 transition text-left"
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
