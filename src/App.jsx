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

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Login Route */}
        <Route path="/" element={<Login />} />

        {/* Primary Dashboard Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/achievements" element={<StudentAchievementsPage />} />
        <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
        <Route path="/student/account" element={<AccountPage />} />
        <Route path="/personnel/account" element={<AccountPage />} />
        <Route path="/personnel/achievements" element={<PersonnelAchievementsPage />} />
        <Route path="/personnel/portfolio" element={<PersonnelPortfolioPage />} />
        <Route path="/account" element={<AccountPage />} />

        {/* Dedicated Settings Routes */}
        <Route path="/student/settings" element={<SettingsPage />} />
        <Route path="/personnel/settings" element={<SettingsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Notifications Routes */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/personnel/notifications" element={<NotificationsPage />} />

        <Route path="/personnel/dashboard" element={<PersonnelDashboard />} />
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/osad/dashboard" element={<OSADDashboard />} />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

