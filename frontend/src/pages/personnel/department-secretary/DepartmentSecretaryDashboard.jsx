import React from 'react'
import DepSecDashboardView from './DepSecDashboardView'

export default function DepartmentSecretaryDashboard({ currentUser }) {
  return (
    <>
      <DepSecDashboardView currentUser={currentUser} />
    </>
  )
}
