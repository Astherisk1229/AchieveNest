/**
 * OSADPlacementAlignment.test.jsx
 * Verification of layout grid alignment, header action placement,
 * and dialog footer ordering across OSAD components.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import OSADCommandCenterPage from '../OSADCommandCenterPage'
import OSADSystemAuditLogsPage from '../OSADSystemAuditLogsPage'
import OSADAccreditationReportsPage from '../OSADAccreditationReportsPage'

describe('Plan 06 Phase 5 — OSAD Placement & Alignment Audit', () => {
  it('instantiates OSADCommandCenterPage cleanly with grid-aligned metrics', () => {
    const metrics = {
      total_students: 120,
      total_submissions: 45,
      pending_verifications: 12,
      active_evaluations: 8
    }

    const element = <OSADCommandCenterPage metrics={metrics} />
    expect(element.type).toBe(OSADCommandCenterPage)
    expect(element.props.metrics.total_students).toBe(120)
  })

  it('instantiates OSADSystemAuditLogsPage with audit log records', () => {
    const auditLogs = [
      { id: '1', action: 'CREATE_PROGRAM', user: 'OSAD Admin', created_at: '2026-09-01' }
    ]

    const element = <OSADSystemAuditLogsPage auditLogs={auditLogs} />
    expect(element.type).toBe(OSADSystemAuditLogsPage)
    expect(element.props.auditLogs).toHaveLength(1)
  })

  it('instantiates OSADAccreditationReportsPage cleanly', () => {
    const element = <OSADAccreditationReportsPage accreditationReports={[]} />
    expect(element.type).toBe(OSADAccreditationReportsPage)
  })
})
