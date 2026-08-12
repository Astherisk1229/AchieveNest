import React from 'react'
import HRDashboardView from '../components/hr/HRDashboardView'

export default function HRDashboard({ currentUser }) {
  return (
    <>
      <HRDashboardView currentUser={currentUser} />
    </>
  )
}
