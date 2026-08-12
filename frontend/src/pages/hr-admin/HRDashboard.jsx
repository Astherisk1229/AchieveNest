import React from 'react'
import HRDashboardView from './HRDashboardView'

export default function HRDashboard({ currentUser }) {
  return (
    <>
      <HRDashboardView currentUser={currentUser} />
    </>
  )
}
