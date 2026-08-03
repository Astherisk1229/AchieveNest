import React from 'react'
import MainLayout from '../layouts/MainLayout'
import HRDashboardView from '../components/hr/HRDashboardView'

export default function HRDashboard({ currentUser }) {
  return (
    <MainLayout>
      <HRDashboardView currentUser={currentUser} />
    </MainLayout>
  )
}
