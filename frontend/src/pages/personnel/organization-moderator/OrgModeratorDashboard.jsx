import React from 'react'
import OrgModeratorDashboardView from './OrgModeratorDashboardView'

export default function OrgModeratorDashboard({ currentUser }) {
  return (
    <>
      <OrgModeratorDashboardView currentUser={currentUser} />
    </>
  )
}
