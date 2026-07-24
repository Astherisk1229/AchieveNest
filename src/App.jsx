import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import StudentAchievementsPage from './pages/StudentAchievementsPage'
import StudentPortfolioPage from './pages/StudentPortfolioPage'
import AccountPage from './pages/AccountPage'
import NotificationsPage from './pages/NotificationsPage'
import PersonnelDashboard from './pages/PersonnelDashboard'
import HRDashboard from './pages/HRDashboard'
import OSADDashboard from './pages/OSADDashboard'

export default function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/" element={<Login />} />

      {/* Primary Dashboard Routes */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/achievements" element={<StudentAchievementsPage />} />
      <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
      <Route path="/student/account" element={<AccountPage />} />
      <Route path="/personnel/account" element={<AccountPage />} />
      <Route path="/account" element={<AccountPage />} />
      
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
  )
}
