import React from 'react'
import OSADDashboardView from '../components/osad/OSADDashboardView'

export default function OSADDashboard({ currentUser }) {
  return (
    <>
      <OSADDashboardView currentUser={currentUser} />
    </>
  )
}
