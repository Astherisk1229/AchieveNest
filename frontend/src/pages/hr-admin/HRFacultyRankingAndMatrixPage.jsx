import React, { useState } from 'react'
import HRRankingMasterboardPage from './HRRankingMasterboardPage'
import { useHR } from '../../hooks/useHR'

export function HRFacultyRankingAndMatrixPage(props) {
  const hrHook = useHR()

  const accomplishments = props.portfolios || hrHook.accomplishments || []
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  return (
    <div className="space-y-6 font-sans">
      <HRRankingMasterboardPage
        portfolios={accomplishments}
        searchQuery={props.searchQuery !== undefined ? props.searchQuery : searchQuery}
        setSearchQuery={props.setSearchQuery || setSearchQuery}
        departmentFilter={props.departmentFilter || departmentFilter}
        setDepartmentFilter={props.setDepartmentFilter || setDepartmentFilter}
        statusFilter={props.statusFilter || statusFilter}
        setStatusFilter={props.setStatusFilter || setStatusFilter}
        onSelectAuditPortfolio={props.onSelectAuditPortfolio || hrHook.setSelectedAccomplishment}
        selectedAuditPortfolio={props.selectedAuditPortfolio || hrHook.selectedAccomplishment}
      />
    </div>
  )
}

export const HRFacultyRankingAndMatrix = HRFacultyRankingAndMatrixPage
export default HRFacultyRankingAndMatrixPage
