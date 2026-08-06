import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getCurrentUser, updateUserRoleContext } from '../services/authService'

export default function MainLayout({ children, onRoleChange: externalRoleChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
    <div className="h-screen w-screen flex overflow-hidden bg-[#f4f8f5] text-slate-900 font-sans selection:bg-[#2d8a4e] selection:text-white relative">
      
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Stationary Fixed Header Bar */}
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRoleChange={handleRoleChange}
        />

        {/* Independent Scrollable Workspace Area with max-w-[1280px] Container Limit */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full bg-[#f4f8f5]">
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

    </div>
  )
}

