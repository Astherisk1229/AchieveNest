import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/common/LoginPage'
import MainLayout from './components/layout/MainLayout'
import RouteLoadingFallback from './components/common/RouteLoadingFallback'
import useIdleSession from './hooks/useIdleSession'
import SessionTimeoutModal from './components/common/SessionTimeoutModal'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { getCurrentUser } from './services/authService'
import RouteAccessController from './controllers/RouteAccessController'

import ActiveRoleGuard from './components/common/ActiveRoleGuard'
import PermissionRoute from './components/security/PermissionRoute'
import ForbiddenPage from './pages/common/ForbiddenPage'

// Lazy-loaded route pages for bundle code-splitting
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage'))
const StudentAchievementsPage = lazy(() => import('./pages/student/StudentAchievementsPage'))
const StudentPortfolioPage = lazy(() => import('./pages/student/StudentPortfolioPage'))

const AccountPage = lazy(() => import('./pages/common/AccountPage'))
const SettingsPage = lazy(() => import('./pages/common/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/common/NotificationsPage'))

const PersonnelDashboardPage = lazy(() => import('./pages/personnel/PersonnelDashboardPage'))
const PersonnelPortfolioPage = lazy(() => import('./pages/personnel/PersonnelPortfolioPage'))
const PersonnelPortfolioEditPage = lazy(() => import('./pages/personnel/PersonnelPortfolioEditPage'))
const PersonnelAchievementsPage = lazy(() => import('./pages/personnel/PersonnelAchievementsPage'))

const HRDashboardPage = lazy(() => import('./pages/hr-admin/HRDashboardPage'))
const HRPersonnelDirectoryPage = lazy(() => import('./pages/hr-admin/HRPersonnelDirectoryPage'))
const HREvaluationSubmissionsPage = lazy(() => import('./pages/hr-admin/HREvaluationSubmissionsPage'))
const HRFacultyEvaluationAndRankingPage = lazy(() => import('./pages/hr-admin/HRFacultyEvaluationAndRankingPage'))
const HRAuditTrailPage = lazy(() => import('./pages/hr-admin/HRAuditTrailPage'))
const HRRankAssignmentLogsPage = lazy(() => import('./pages/hr-admin/HRRankAssignmentLogsPage'))

const OSADDashboardPage = lazy(() => import('./pages/osad-admin/OSADDashboardPage'))
const OfficerScannerPage = lazy(() => import('./pages/personnel/organization-moderator/OfficerScannerPage'))
const PublicCertificateVerificationPage = lazy(() => import('./pages/common/PublicCertificateVerificationPage'))
const ResetPasswordPage = lazy(() => import('./pages/common/ResetPasswordPage'))

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
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center font-bold text-xl">!</div>
            <h1 className="text-xl font-black text-slate-900">Application Error Encountered</h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              AchieveNest ran into an unhandled UI state exception. Session caches have been isolated to protect your data.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 break-words max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown React render error'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-[#064e2b] hover:bg-[#1a382b] text-white font-bold rounded-xl text-sm transition shadow-md"
            >
              Reset Session & Return to Safety
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
  'hr_staff',
  'osad_staff',
  'dean',
  'program_coordinator',
  'organization_moderator'
]

function LayoutShell({ allowedAccountTypes = [], requiredRoles = [] }) {
  const { isInitializing } = useAuth()
  const currentUser = getCurrentUser()

  if (isInitializing) {
    return <RouteLoadingFallback />
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!RouteAccessController.isAllowedAccess(currentUser, allowedAccountTypes, requiredRoles)) {
    return <Navigate to={RouteAccessController.resolveRedirect(currentUser)} replace />
  }

  return (
    <MainLayout currentUser={currentUser}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet context={{ currentUser }} />
      </Suspense>
    </MainLayout>
  )
}

function AppContent() {
  const { logout } = useAuth()
  const { showWarning, secondsRemaining, stayLoggedIn } = useIdleSession(
    logout,
    15 * 60 * 1000,
    13 * 60 * 1000
  )

  return (
    <ThemeProvider>
      <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<Suspense fallback={<RouteLoadingFallback />}><ResetPasswordPage /></Suspense>} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/verify/certificate/:publicId" element={<Suspense fallback={<RouteLoadingFallback />}><PublicCertificateVerificationPage /></Suspense>} />

            {/* Personnel Portal — Rejected for hr_admin & osad_admin */}
            <Route element={<LayoutShell allowedAccountTypes={['personnel']} requiredRoles={['personnel']} />}>
              <Route path="/personnel/dashboard" element={<PersonnelDashboardPage />} />
              <Route path="/personnel/portfolio/edit" element={<ActiveRoleGuard allowedActiveContexts={['personnel']}><PersonnelPortfolioEditPage /></ActiveRoleGuard>} />
              <Route path="/personnel/portfolio" element={<ActiveRoleGuard allowedActiveContexts={['personnel']}><PersonnelPortfolioPage /></ActiveRoleGuard>} />
              <Route path="/personnel/achievements" element={<ActiveRoleGuard allowedActiveContexts={['personnel']}><PersonnelAchievementsPage /></ActiveRoleGuard>} />
              <Route path="/personnel/account" element={<AccountPage />} />
              <Route path="/personnel/settings" element={<SettingsPage />} />
              <Route path="/personnel/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Student Portal */}
            <Route element={<LayoutShell allowedAccountTypes={['student']} requiredRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboardPage />} />
              <Route path="/student/achievements" element={<StudentAchievementsPage />} />
              <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
              <Route path="/student/account" element={<AccountPage />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/notifications" element={<NotificationsPage />} />
            </Route>

            {/* HR Admin Portal — Dedicated to hr_admin with hr_staff */}
            <Route element={<LayoutShell allowedAccountTypes={['hr_admin']} requiredRoles={['hr_staff']} />}>
              <Route path="/hr/dashboard" element={<HRDashboardPage />} />
              <Route path="/hr/personnel-directory" element={<HRPersonnelDirectoryPage />} />
              <Route path="/hr/evaluation-submissions" element={<HREvaluationSubmissionsPage />} />
              <Route path="/hr/faculty-evaluation-and-ranking" element={<HRFacultyEvaluationAndRankingPage />} />
              <Route path="/hr/audit-trail" element={<HRAuditTrailPage />} />
              <Route path="/hr/rank-assignment-logs" element={<HRRankAssignmentLogsPage />} />
              <Route path="/hr/account" element={<AccountPage />} />
              <Route path="/hr/settings" element={<SettingsPage />} />

              {/* Legacy Route Redirects */}
              <Route path="/hr/profile" element={<Navigate to="/hr/account" replace />} />
              <Route path="/hr/personnel-governance" element={<Navigate to="/hr/personnel-directory" replace />} />
              <Route path="/hr/verification-queue" element={<Navigate to="/hr/evaluation-submissions" replace />} />
              <Route path="/hr/faculty-ranking-and-matrix" element={<Navigate to="/hr/faculty-evaluation-and-ranking" replace />} />
              <Route path="/hr/accreditation-and-audit-logs" element={<Navigate to="/hr/audit-trail" replace />} />
            </Route>

            {/* OSAD Admin Portal — Dedicated to osad_admin with osad_staff */}
            <Route element={<LayoutShell allowedAccountTypes={['osad_admin']} requiredRoles={['osad_staff']} />}>
              <Route path="/osad/dashboard" element={<OSADDashboardPage />} />
              <Route path="/osad/account" element={<AccountPage />} />
              <Route path="/osad/settings" element={<SettingsPage />} />
              <Route path="/osad/notifications" element={<NotificationsPage />} />
            </Route>

            <Route path="/scanner/:eventId" element={<Suspense fallback={<RouteLoadingFallback />}><OfficerScannerPage /></Suspense>} />
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

        <SessionTimeoutModal isOpen={showWarning} secondsRemaining={secondsRemaining} onStayLoggedIn={stayLoggedIn} onLogoutNow={logout} />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
