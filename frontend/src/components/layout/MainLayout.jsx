import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Footer from './Footer'
import { getCurrentUser, updateUserRoleContext } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { ArrowUp } from 'lucide-react'
import {
  getWorkspaceLandingRoute,
  isWorkspaceAvailable,
  normalizeRoleContext,
  resolveRouteOwnership,
  ROUTE_OWNERSHIP_TYPES
} from '../../utils/roleContext'

export default function MainLayout({ children, onRoleChange: externalRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser, setUser, switchRoleContext, activeRoleContext } = useAuth()
  const currentUser = authUser || getCurrentUser()
  const [pendingWorkspaceTransition, setPendingWorkspaceTransition] = useState(null)
  const transitionSequenceRef = useRef(0)
  const completedTransitionRef = useRef(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.innerWidth < 768)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = window.localStorage.getItem('achievenest.sidebar.collapsed')
    if (stored !== null) return stored === 'true'
    return window.innerWidth >= 768 && window.innerWidth < 1024
  })
  const [showScrollTop, setShowScrollTop] = useState(false)
  const mainRef = useRef(null)
  const isHrDashboard = location.pathname === '/hr/dashboard'
  const isCollegePersonnelRoster = location.pathname === '/dean/college-personnel'
  const normalizedActiveWorkspace = normalizeRoleContext(activeRoleContext || currentUser?.active_role_context)
  const routeOwnership = resolveRouteOwnership(
    location.pathname,
    location.state?.workspaceContext || normalizedActiveWorkspace
  )
  const routeWorkspaceNeedsReconciliation = routeOwnership.type === ROUTE_OWNERSHIP_TYPES.WORKSPACE &&
    routeOwnership.workspace !== normalizedActiveWorkspace &&
    isWorkspaceAvailable(currentUser, routeOwnership.workspace)

  useLayoutEffect(() => {
    if (!routeWorkspaceNeedsReconciliation) return
    if (switchRoleContext) switchRoleContext(routeOwnership.workspace)
    else updateUserRoleContext(routeOwnership.workspace)
  }, [routeOwnership.workspace, routeWorkspaceNeedsReconciliation, switchRoleContext])

  useEffect(() => {
    const syncUser = () => {
      const user = getCurrentUser()
      if (user && setUser) {
        setUser({ ...user })
      }
    }
    syncUser()
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [setUser])

  // Auto-scroll workspace to top on route / query parameter change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.search])

  useEffect(() => {
    const mainEl = mainRef.current

    const handleScroll = () => {
      const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY
      if (scrollTop > 200) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll)
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRoleChange = (newRoleContext) => {
    const requestedWorkspace = normalizeRoleContext(newRoleContext)
    if (!isWorkspaceAvailable(currentUser, requestedWorkspace)) {
      if (externalRoleChange) externalRoleChange(requestedWorkspace, null)
      return
    }

    let updated
    if (switchRoleContext) {
      updated = switchRoleContext(requestedWorkspace)
    } else {
      updated = updateUserRoleContext(requestedWorkspace)
    }

    const destination = getWorkspaceLandingRoute(requestedWorkspace)
    const transitionId = ++transitionSequenceRef.current
    completedTransitionRef.current = null
    setPendingWorkspaceTransition({ id: transitionId, workspace: requestedWorkspace, destination })

    if (externalRoleChange) {
      externalRoleChange(requestedWorkspace, updated)
    }
  }

  useEffect(() => {
    const pending = pendingWorkspaceTransition
    if (!pending || normalizedActiveWorkspace !== pending.workspace || completedTransitionRef.current === pending.id) return
    completedTransitionRef.current = pending.id
    if (pending.destination && `${location.pathname}${location.search}` !== pending.destination) {
      navigate(pending.destination, { state: { workspaceContext: pending.workspace } })
    }
    setPendingWorkspaceTransition(null)
  }, [location.pathname, location.search, navigate, normalizedActiveWorkspace, pendingWorkspaceTransition])

  // Keyboard Escape listener to dismiss mobile drawer in overlay mode (< lg)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const updateViewport = event => setIsMobileViewport(event.matches)
    media.addEventListener('change', updateViewport)
    return () => media.removeEventListener('change', updateViewport)
  }, [])

  const closeMobileNavigation = (restoreFocus = false) => {
    setMobileOpen(false)
    if (restoreFocus) requestAnimationFrame(() => document.querySelector('button[aria-controls="main-sidebar"]')?.focus())
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        closeMobileNavigation(true)
      } else if (e.key === 'Tab' && mobileOpen && isMobileViewport) {
        const sidebar = document.getElementById('main-sidebar')
        const focusable = [...(sidebar?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])') || [])]
          .filter(element => element.getClientRects().length > 0 && window.getComputedStyle(element).visibility !== 'hidden')
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen, isMobileViewport])

  useEffect(() => {
    window.localStorage.setItem('achievenest.sidebar.collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    if (!mobileOpen || window.innerWidth >= 768) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => document.querySelector('#main-sidebar button[aria-label="Close navigation drawer"]')?.focus())
    return () => { document.body.style.overflow = previousOverflow }
  }, [mobileOpen])

  const handleNavigationToggle = () => {
    if (window.innerWidth >= 768) setSidebarCollapsed(value => !value)
    else setMobileOpen(value => !value)
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F8FAF7] dark:bg-[#0b1320] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#16834a] selection:text-white relative transition-colors duration-200">
      
      {/* Mobile / Tablet Backdrop Overlay for screens < 1024px */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
          onClick={() => closeMobileNavigation(true)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component (Off-canvas drawer on mobile < 1024px, persistent sidebar on >= 1024px) */}
      <div 
        id="main-sidebar"
        aria-hidden={isMobileViewport && !mobileOpen ? true : undefined}
        inert={isMobileViewport && !mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 md:static md:z-auto transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
          onCloseMobile={() => closeMobileNavigation(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed(value => !value)}
        />
      </div>

      {/* Right Column (Header Fixed Top + Scrollable Content Body) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-[#F8FAF7] dark:bg-[#0b1320] transition-colors duration-200">
        
        {/* Stationary Fixed Header Bar / Topbar */}
        <Topbar
          currentUser={currentUser}
          isSidebarOpen={isMobileViewport ? mobileOpen : !sidebarCollapsed}
          onToggleSidebar={handleNavigationToggle}
          onRoleChange={handleRoleChange}
        />

        {/* Independent Scrollable Workspace Area with max-w-[1280px] Container Limit */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full bg-[#F8FAF7] dark:bg-[#0b1320] transition-colors duration-200 relative flex flex-col justify-between">
          <div className="container-responsive space-y-6">
            {routeWorkspaceNeedsReconciliation ? <div className="py-16 text-center text-sm font-semibold text-slate-500">Restoring workspace…</div> : children}
          </div>
          {!isHrDashboard && <Footer />}
        </main>
        
      </div>

      {/* Floating Scroll To Top Button (High-Contrast Soft Minimalist) */}
      {showScrollTop && !isHrDashboard && !isCollegePersonnelRoster && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Back to Top"
          className="fixed bottom-6 right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-[#064e2b] dark:bg-[#0a2417] text-white font-extrabold text-xs border border-[#16834a]/60 shadow-lg hover:bg-[#16834a] dark:hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2 group cursor-pointer animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="w-6 h-6 rounded-lg bg-[#16834a]/40 text-emerald-200 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 text-white" />
          </div>
          <span className="hidden sm:inline">Back to Top</span>
        </button>
      )}

    </div>
  )
}


