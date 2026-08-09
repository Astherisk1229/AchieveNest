import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import StudentAchievementsPage from './pages/StudentAchievementsPage'
import StudentPortfolioPage from './pages/StudentPortfolioPage'
import AccountPage from './pages/AccountPage'
import SettingsPage from './pages/SettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import PersonnelDashboard from './pages/PersonnelDashboard'
import PersonnelAchievementsPage from './pages/PersonnelAchievementsPage'
import PersonnelPortfolioPage from './pages/PersonnelPortfolioPage'
import HRDashboard from './pages/HRDashboard'
import OSADDashboard from './pages/OSADDashboard'
import OfficerScannerPage from './pages/OfficerScannerPage'


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/personnel/dashboard'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f4f8f5] font-sans">
          <div className="max-w-lg w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xl">
              ⚠️
            </div>
            <h1 className="text-lg font-extrabold text-slate-900">Application View Reload Required</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              A runtime view update occurred while switching role context. Click below to refresh your view state.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
              {String(this.state.error?.message || this.state.error || 'Unknown Render Error')}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              Reset Session & Reload Portal
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import useIdleSession from './hooks/useIdleSession'
import SessionTimeoutModal from './components/common/SessionTimeoutModal'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem('achievenest_current_user')
    sessionStorage.clear()
    window.location.href = '/'
  }

  const { showWarning, secondsRemaining, stayLoggedIn } = useIdleSession(handleLogout)

  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public Login Route */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            {/* Student Dashboard Routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/achievements" element={<ProtectedRoute allowedRoles={['student']}><StudentAchievementsPage /></ProtectedRoute>} />
            <Route path="/student/portfolio" element={<ProtectedRoute allowedRoles={['student']}><StudentPortfolioPage /></ProtectedRoute>} />
            <Route path="/student/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/student/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/student/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* Personnel & Faculty Dashboard Routes */}
            <Route path="/personnel/dashboard" element={<ProtectedRoute allowedRoles={['personnel', 'program_coordinator', 'organization_moderator', 'department_secretary']}><PersonnelDashboard /></ProtectedRoute>} />
            <Route path="/personnel" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/depsec" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/coordinator" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/org-moderator" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/personnel/achievements" element={<ProtectedRoute><PersonnelAchievementsPage /></ProtectedRoute>} />
            <Route path="/personnel/portfolio" element={<ProtectedRoute><PersonnelPortfolioPage /></ProtectedRoute>} />
            <Route path="/personnel/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/personnel/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/personnel/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* Executive Portals */}
            <Route path="/hr/dashboard" element={<ProtectedRoute allowedRoles={['hr_staff']}><HRDashboard /></ProtectedRoute>} />
            <Route path="/osad/dashboard" element={<ProtectedRoute allowedRoles={['osad_staff']}><OSADDashboard /></ProtectedRoute>} />
            <Route path="/scanner/:eventId" element={<ProtectedRoute><OfficerScannerPage /></ProtectedRoute>} />

            {/* Generic Routes */}
            <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Terminal Inactivity Session Warning Modal */}
          <SessionTimeoutModal
            isOpen={showWarning}
            secondsRemaining={secondsRemaining}
            onStayLoggedIn={stayLoggedIn}
            onLogoutNow={handleLogout}
          />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  )
}


