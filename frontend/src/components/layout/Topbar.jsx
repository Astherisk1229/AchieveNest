import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../../services/authService'
import NotificationPopover from '../common/NotificationPopover'
import HelpGuidePanel from '../common/HelpGuidePanel'
import SettingsPage from '../../pages/common/SettingsPage'
import useTheme from '../../hooks/useTheme'
import { 
  Menu, 
  ChevronDown, 
  User, 
  Sun,
  Moon
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { useHelpGuide } from '../../context/HelpGuideContext'
import { isWorkspaceAvailable, normalizeAccountType, normalizeRoleContext, normalizeAssignedRoles } from '../../utils/roleContext'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '../ui/avatar'

export default function Header({ currentUser, isSidebarOpen = true, onToggleSidebar, onRoleChange }) {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const { request: helpRequest, openHelpGuide, consumeHelpGuideRequest, closeHelpGuide } = useHelpGuide()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [profileView, setProfileView] = useState('menu')
  const profileContainerRef = useRef(null)
  const profileTriggerRef = useRef(null)
  const helpGuideMenuItemRef = useRef(null)
  const settingsMenuItemRef = useRef(null)
  const helpReturnToProfileRef = useRef(false)

  const user = currentUser || authUser || getCurrentUser() || {
    full_name: 'Account',
    user_type: 'student',
    active_role_context: 'student'
  }

  const accountType = normalizeAccountType(user?.account_type || user?.user_type || 'student')
  const activeRoleContext = normalizeRoleContext(authRoleContext || user?.active_role_context || accountType)
  const assignedRoles = normalizeAssignedRoles(user?.assigned_roles || user?.roles, accountType)

  useEffect(() => {
    if (!helpRequest) return
    setIsProfileOpen(false)
    setIsHelpOpen(true)
  }, [helpRequest])

  useEffect(() => {
    if (!isHelpOpen && !isSettingsOpen) return undefined
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        helpReturnToProfileRef.current = false
        setIsHelpOpen(false)
        setIsSettingsOpen(false)
        closeHelpGuide()
        profileTriggerRef.current?.focus()
      }
    }
    const handleOutsidePointer = (event) => {
      if (!profileContainerRef.current?.contains(event.target)) {
        helpReturnToProfileRef.current = false
        setIsHelpOpen(false)
        setIsSettingsOpen(false)
        closeHelpGuide()
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('pointerdown', handleOutsidePointer)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('pointerdown', handleOutsidePointer)
    }
  }, [isHelpOpen, isSettingsOpen, closeHelpGuide])

  const handleLogout = () => {
    logoutUser()
    // Replace (not push) so Back does not return to the signed-in page just left.
    navigate('/login', { replace: true })
  }

  const openHelpFromProfile = () => {
    helpReturnToProfileRef.current = true
    setIsProfileOpen(false)
    setIsSettingsOpen(false)
    openHelpGuide({})
  }

  const openSettingsFromProfile = () => {
    helpReturnToProfileRef.current = true
    setIsProfileOpen(false)
    setIsHelpOpen(false)
    closeHelpGuide()
    setIsSettingsOpen(true)
  }

  const returnToProfileMenu = () => {
    helpReturnToProfileRef.current = false
    setIsHelpOpen(false)
    setIsSettingsOpen(false)
    closeHelpGuide()
    setProfileView('menu')
    setIsProfileOpen(true)
    requestAnimationFrame(() => helpGuideMenuItemRef.current?.focus())
  }

  const closeHelpPanel = () => {
    helpReturnToProfileRef.current = false
    setIsHelpOpen(false)
    setIsSettingsOpen(false)
    setIsProfileOpen(false)
    closeHelpGuide()
    profileTriggerRef.current?.focus()
  }

  const returnSettingsToProfile = () => {
    helpReturnToProfileRef.current = false
    setIsSettingsOpen(false)
    setProfileView('menu')
    setIsProfileOpen(true)
    requestAnimationFrame(() => settingsMenuItemRef.current?.focus())
  }

  const closeSettingsPanel = () => {
    helpReturnToProfileRef.current = false
    setIsSettingsOpen(false)
    setIsProfileOpen(false)
    profileTriggerRef.current?.focus()
  }

  const handleSelectRole = (roleId) => {
    const normId = normalizeRoleContext(roleId)
    if (onRoleChange) {
      onRoleChange(normId)
    }
  }

  const ROLE_DISPLAY_NAMES = {
    personnel: 'Personnel',
    student: 'Student',
    dean: 'College Dean',
    program_coordinator: 'Program Coordinator',
    organization_moderator: 'Organization Moderator',
    hr_staff: 'HR',
    osad_staff: 'OSAD'
  }

  const availableAssignedRoles = assignedRoles.filter(role => ROLE_DISPLAY_NAMES[role] && isWorkspaceAvailable(user, role))
  const canSwitchRole = availableAssignedRoles.length > 1

  // Label display helper for user type & active role context
  const getUserTypeLabel = () => {
    if (activeRoleContext === 'hr_staff') return 'HR'
    if (activeRoleContext === 'osad_staff') return 'OSAD'
    if (accountType === 'student') return 'Student'
    if (activeRoleContext === 'dean') {
      const deanAssignment = (user?.role_assignments || []).find(item => item.role_key === 'dean')
      return deanAssignment?.scope_name ? `Dean · ${deanAssignment.scope_name}` : 'Dean'
    }
    if (activeRoleContext === 'program_coordinator') return 'Program Coordinator'
    if (activeRoleContext === 'organization_moderator') return 'Organization Moderator'
    if (activeRoleContext !== 'personnel') return ROLE_DISPLAY_NAMES[activeRoleContext] || 'Account'
    const affiliation = user?.personnel_affiliation || {}
    const group = affiliation.personnel_group === 'faculty' ? 'Faculty' : affiliation.personnel_group === 'non_teaching_faculty' ? 'Non-teaching Faculty' : affiliation.personnel_group
    const side = affiliation.organizational_side === 'academic' ? 'Academic' : affiliation.organizational_side === 'non_academic' ? 'Non-academic' : affiliation.organizational_side
    return ['Personnel', group, side].filter(Boolean).join(' · ')
  }

  return (
    <header className="bg-white/95 dark:bg-[#0d1520]/95 border-b border-slate-200/80 dark:border-slate-800/80 px-5 py-2 shrink-0 z-30 flex items-center justify-between font-sans transition-colors duration-200 backdrop-blur-md">
      
      {/* Left Side: Sidebar Toggle Menu Icon */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer md:hidden"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
      </div>

      {/* Right Side: Theme Toggle, Notification Icon & User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        
        {/* Dark / Light Mode Quick Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#16834a] dark:hover:text-emerald-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/90 transition active:scale-[0.98] cursor-pointer"
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

        {/* User Profile Dropdown Container */}
        <div className="relative" ref={profileContainerRef}>
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={() => { setProfileView('menu'); setIsProfileOpen(!isProfileOpen) }}
            aria-expanded={isProfileOpen}
            className="flex items-center gap-3 p-1 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition active:scale-[0.98] cursor-pointer group"
          >
            <Avatar size="sm" className="w-9 h-9 border-2 border-[#16834a] shadow-xs">
              <AvatarImage src={user?.avatar_url || ''} alt={user?.full_name ? `${user.full_name} profile picture` : 'Profile picture'} />
              <AvatarFallback>{user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'A'}</AvatarFallback>
              <AvatarBadge className="bg-emerald-500 border border-white dark:border-slate-900" />
            </Avatar>

            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#123D2A] dark:text-white leading-tight">{user?.full_name || 'Juan A. Dela Cruz'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-medium text-[#3F6B52] dark:text-slate-400 capitalize flex items-center gap-1">
                  <User className="w-3 h-3 text-[#176B43] dark:text-emerald-400" />
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
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-[#131e2e] text-[#123D2A] dark:text-slate-100 shadow-xl border border-[#dde6dd] dark:border-slate-800 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                
                <div className="flex items-center gap-3 rounded-xl border border-[#dde6dd] bg-[#f8faf7] p-3 dark:border-slate-800 dark:bg-slate-800/60">
                  {canSwitchRole ? <button type="button" onClick={() => setProfileView('roles')} aria-label={`Switch role from ${getUserTypeLabel()}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                    <Avatar size="sm" className="h-10 w-10 shrink-0 border border-[#dde6dd] dark:border-slate-700"><AvatarImage src={user?.avatar_url || ''} alt=""/><AvatarFallback>{user?.full_name ? user.full_name.split(' ').map(name => name[0]).join('').slice(0, 2) : 'A'}</AvatarFallback></Avatar>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#123D2A] dark:text-white">{user?.full_name || 'Account'}</span><span className="mt-0.5 block truncate text-[11px] text-[#3F6B52] dark:text-slate-400">{getUserTypeLabel()}</span></span><ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-slate-500" aria-hidden="true"/>
                  </button> : <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar size="sm" className="h-10 w-10 shrink-0 border border-[#dde6dd] dark:border-slate-700"><AvatarImage src={user?.avatar_url || ''} alt=""/><AvatarFallback>{user?.full_name ? user.full_name.split(' ').map(name => name[0]).join('').slice(0, 2) : 'A'}</AvatarFallback></Avatar>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#123D2A] dark:text-white">{user?.full_name || 'Account'}</span><span className="mt-0.5 block truncate text-[11px] text-[#3F6B52] dark:text-slate-400">{getUserTypeLabel()}</span></span>
                  </div>}
                </div>

                {profileView === 'roles' ? <div className="py-2">
                  <button type="button" onClick={() => setProfileView('menu')} className="mb-1 rounded-md px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40">‹ Back</button>
                  <p className="px-3 py-1 text-xs font-extrabold">Switch Role</p>
                  {availableAssignedRoles.map(role => <button key={role} type="button" disabled={role === activeRoleContext} onClick={() => { handleSelectRole(role); setIsProfileOpen(false); setProfileView('menu') }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-emerald-950 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:bg-emerald-50/70 disabled:text-emerald-900 dark:text-slate-100 dark:hover:bg-emerald-950/40 dark:disabled:bg-emerald-950/50 dark:disabled:text-emerald-200"><span>{ROLE_DISPLAY_NAMES[role]}</span>{role === activeRoleContext && <span className="text-[11px] font-medium">Current</span>}</button>)}
                </div> : <div className="space-y-0.5 py-2">
                  <button ref={settingsMenuItemRef} type="button" onClick={openSettingsFromProfile} className="block w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-[#123D2A] hover:bg-[#f8faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-200 dark:hover:bg-slate-800">Settings</button>
                  <button ref={helpGuideMenuItemRef} type="button" onClick={openHelpFromProfile} className="block w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-[#123D2A] hover:bg-[#f8faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-200 dark:hover:bg-slate-800">Help &amp; Guide</button>
                </div>}

                {profileView === 'menu' && <div className="mt-1 border-t border-slate-200 pt-2 dark:border-slate-700"><button type="button" onClick={handleLogout} className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-rose-300 dark:hover:bg-rose-950/40">Sign Out</button></div>}

              </div>
            </>
          )}
          {isHelpOpen && <HelpGuidePanel role={activeRoleContext} user={user} request={helpRequest} onRequestConsumed={consumeHelpGuideRequest} onBack={helpReturnToProfileRef.current ? returnToProfileMenu : undefined} onClose={closeHelpPanel} />}
          {isSettingsOpen && <SettingsPage compact currentUser={user} onBack={returnSettingsToProfile} onClose={closeSettingsPanel} />}
        </div>
      </div>

    </header>
  )
}
