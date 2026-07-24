import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getCurrentUser } from '../services/authService'

export default function MainLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  const handleRoleChange = (newRoleContext) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, active_role_context: newRoleContext }
      setCurrentUser(updatedUser)
      
      if (localStorage.getItem('achievenest_current_user')) {
        localStorage.setItem('achievenest_current_user', JSON.stringify(updatedUser))
      } else {
        sessionStorage.setItem('achievenest_current_user', JSON.stringify(updatedUser))
      }
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f4f8f5] text-slate-900 font-sans selection:bg-[#2d8a4e] selection:text-white">
      
      {/* Fixed Left Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          currentUser={currentUser}
          onRoleChange={handleRoleChange}
        />
      )}

      {/* Right Column (Header Fixed Top + Scrollable Content Body) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Stationary Fixed Header Bar */}
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRoleChange={handleRoleChange}
        />

        {/* Independent Scrollable Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 w-full max-w-full space-y-6 bg-[#f4f8f5]">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { currentUser, onRoleChange: handleRoleChange })
            }
            return child
          })}
        </main>
        
      </div>

    </div>
  )
}
