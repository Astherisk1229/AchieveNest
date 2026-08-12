import React from 'react'
import OSADDashboardView from './OSADDashboardView'

export default function OSADDashboard({ currentUser }) {
  return (
    <>
      <OSADDashboardView currentUser={currentUser} />
    </>
  )
}
