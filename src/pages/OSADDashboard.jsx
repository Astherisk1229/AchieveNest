import React from 'react'
import MainLayout from '../layouts/MainLayout'
import OSADDashboardView from '../components/osad/OSADDashboardView'

export default function OSADDashboard({ currentUser }) {
  return (
    <MainLayout>
      <OSADDashboardView currentUser={currentUser} />
    </MainLayout>
  )
}
