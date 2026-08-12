import React from 'react'
import DepSecDashboardView from './DepSecDashboardView'

export default function DepSecDashboard({ currentUser }) {
  return (
    <>
      <DepSecDashboardView currentUser={currentUser} />
    </>
  )
}
