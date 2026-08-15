import React from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import LoginPage from './pages/common/LoginPage'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import StudentAchievementsPage from './pages/student/StudentAchievementsPage'
import StudentPortfolioPage from './pages/student/StudentPortfolioPage'
import AccountPage from './pages/common/AccountPage'
import SettingsPage from './pages/common/SettingsPage'
import NotificationsPage from './pages/common/NotificationsPage'
import PersonnelDashboardPage from './pages/personnel/PersonnelDashboardPage'
import PersonnelPortfolioPage from './pages/personnel/PersonnelPortfolioPage'
import PersonnelPortfolioEditPage from './pages/personnel/PersonnelPortfolioEditPage'
import HRDashboardPage from './pages/hr-admin/HRDashboardPage'
import HRPersonnelGovernancePage from './pages/hr-admin/HRPersonnelGovernancePage'
import HRVerificationQueuePage from './pages/hr-admin/HRVerificationQueuePage'
import HRFacultyRankingAndMatrixPage from './pages/hr-admin/HRFacultyRankingAndMatrixPage'
import HRAccreditationAndAuditLogsPage from './pages/hr-admin/HRAccreditationAndAuditLogsPage'
import OSADDashboardPage from './pages/osad-admin/OSADDashboardPage'
import OfficerScannerPage from './pages/personnel/organization-moderator/OfficerScannerPage'
import MainLayout from './components/layout/MainLayout'
import useIdleSession from './hooks/useIdleSession'
import SessionTimeoutModal from './components/common/SessionTimeoutModal'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { getCurrentUser } from './services/authService'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, errorInfo) { console.error('ErrorBoundary:', error, errorInfo) }
  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null })
    }
  }
  handleReset = () => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/personnel/dashboard' }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f4f8f5] font-sans">
          <div className="max-w-lg w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xl">!</div>
            <h1 className="text-lg font-extrabold text-slate-900">Application View Reload Required</h1>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">A runtime view update occurred. Click below to refresh your view state.</p>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 overflow-x-auto">
              {String(this.state.error?.message || 'Unknown Render Error')}
            </div>
            <button type="button" onClick={this.handleReset} className="w-full py-3 rounded-2xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-extrabold text-xs shadow-md transition cursor-pointer">
              Reset Session and Reload Portal
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const PERSONNEL_ROLES = [
  'personnel',
  'program_coordinator',
  'organization_moderator',
  'department_secretary'
]

function LayoutShell({ allowedRoles }) {
  const { user: authUser } = useAuth() || {}
  const currentUser = authUser || getCurrentUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const role = currentUser.active_role_context || currentUser.primary_role || 'personnel'

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'student') return <Navigate to="/student/dashboard" replace />
    if (role === 'hr_staff') return <Navigate to="/hr/dashboard" replace />
    if (role === 'osad_staff') return <Navigate to="/osad/dashboard" replace />
    return <Navigate to="/personnel/dashboard" replace />
  }

  return (
    <MainLayout currentUser={currentUser}>
      <Outlet context={{ currentUser }} />
    </MainLayout>
  )
}

export default function App() {
  const { showWarning, secondsRemaining, stayLoggedIn, handleLogout } = useIdleSession(30, 2)

  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Personnel Portal — LayoutShell mounts once, Outlet swaps page content */}
            <Route element={<LayoutShell allowedRoles={PERSONNEL_ROLES} />}>
              <Route path="/personnel/dashboard" element={<PersonnelDashboardPage />} />
              <Route path="/personnel/portfolio/edit" element={<PersonnelPortfolioEditPage />} />
              <Route path="/personnel/portfolio" element={<PersonnelPortfolioPage />} />
              <Route path="/personnel/account" element={<AccountPage />} />
              <Route path="/personnel/settings" element={<SettingsPage />} />
              <Route path="/personnel/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Student Portal */}
            <Route element={<LayoutShell allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
              <Route path="/student/achievements" element={<StudentAchievementsPage />} />
              <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
              <Route path="/student/account" element={<AccountPage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/notifications" element={<NotificationsPage />} />
            </Route>

            {/* HR Portal */}
            <Route element={<LayoutShell allowedRoles={['hr_staff']} />}>
              <Route path="/hr/dashboard" element={<HRDashboardPage />} />
              <Route path="/hr/personnel-governance" element={<HRPersonnelGovernancePage />} />
              <Route path="/hr/verification-queue" element={<HRVerificationQueuePage />} />
              <Route path="/hr/faculty-ranking-and-matrix" element={<HRFacultyRankingAndMatrixPage />} />
              <Route path="/hr/accreditation-and-audit-logs" element={<HRAccreditationAndAuditLogsPage />} />
            </Route>

            {/* OSAD Portal */}
            <Route element={<LayoutShell allowedRoles={['osad_staff']} />}>
              <Route path="/osad/dashboard" element={<OSADDashboardPage />} />
            </Route>

            <Route path="/scanner/:eventId" element={<OfficerScannerPage />} />
            <Route path="/personnel/achievements" element={<Navigate to="/personnel/portfolio/edit" replace />} />
            <Route path="/personnel" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/depsec" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/coordinator" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/org-moderator" element={<Navigate to="/personnel/dashboard" replace />} />
            <Route path="/account" element={<Navigate to="/personnel/account" replace />} />
            <Route path="/settings" element={<Navigate to="/personnel/settings" replace />} />
            <Route path="/notifications" element={<Navigate to="/personnel/notifications" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <SessionTimeoutModal isOpen={showWarning} secondsRemaining={secondsRemaining} onStayLoggedIn={stayLoggedIn} onLogoutNow={handleLogout} />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  )
}
