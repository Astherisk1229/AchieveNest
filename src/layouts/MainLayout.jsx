import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getCurrentUser, updateUserRoleContext } from '../services/authService'
import { ArrowUp } from 'lucide-react'

export default function MainLayout({ children, onRoleChange: externalRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    const syncUser = () => {
      const user = getCurrentUser()
      if (user) {
        setCurrentUser({ ...user })
      }
    }
    syncUser()
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

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
    const updated = updateUserRoleContext(newRoleContext)
    setCurrentUser({ ...updated })
    
    // Auto-navigate to personnel dashboard if role switches to personnel/coordinator mode from another page
    if (['program_coordinator', 'personnel', 'organization_moderator', 'department_secretary'].includes(newRoleContext)) {
      if (location.pathname !== '/personnel/dashboard') {
        navigate('/personnel/dashboard')
      }
    }

    if (externalRoleChange) {
      externalRoleChange(newRoleContext, updated)
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#dfebd9] dark:bg-[#0b1320] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#2d8a4e] selection:text-white relative transition-colors duration-200">
      
      {/* Mobile / Tablet Backdrop Overlay for screens < 1024px */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Component (Off-canvas drawer on mobile < 1024px, permanent sidebar on >= 1024px) */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
      }`}>
        <Sidebar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
        />
      </div>

      {/* Right Column (Header Fixed Top + Scrollable Content Body) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-[#dfebd9] dark:bg-[#0b1320] transition-colors duration-200">
        
        {/* Stationary Fixed Header Bar */}
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRoleChange={handleRoleChange}
        />

        {/* Independent Scrollable Workspace Area with max-w-[1280px] Container Limit */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full bg-[#dfebd9] dark:bg-[#0b1320] transition-colors duration-200 relative">
          <div className="container-responsive space-y-6">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { currentUser, onRoleChange: handleRoleChange })
              }
              return child
            })}
          </div>
        </main>
        
      </div>

      {/* Floating Scroll To Top Button (High-Contrast Soft Minimalist) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Back to Top"
          className="fixed bottom-6 right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-[#1b4332] dark:bg-[#0a2417] text-white font-extrabold text-xs border border-[#2d8a4e]/60 shadow-lg hover:bg-[#2d8a4e] dark:hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2 group cursor-pointer animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="w-6 h-6 rounded-lg bg-[#2d8a4e]/40 text-emerald-200 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5 text-white" />
          </div>
          <span className="hidden sm:inline">Back to Top</span>
        </button>
      )}

    </div>
  )
}


