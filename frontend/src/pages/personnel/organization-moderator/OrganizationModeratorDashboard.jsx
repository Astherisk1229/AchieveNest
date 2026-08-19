import React from 'react'
import OrgModeratorDashboardView from './OrgModeratorDashboardView'

export default function OrganizationModeratorDashboard({ currentUser }) {
  return (
    <>
      <OrgModeratorDashboardView currentUser={currentUser} />
    </>
  )
}
