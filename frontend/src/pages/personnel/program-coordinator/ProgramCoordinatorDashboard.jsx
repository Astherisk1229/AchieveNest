import React from 'react'
import CoordinatorDashboardView from './CoordinatorDashboardView'

export default function ProgramCoordinatorDashboard({ currentUser }) {
  return (
    <>
      <CoordinatorDashboardView currentUser={currentUser} />
    </>
  )
}
