import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const workspace = read('../RankPlacementWorkspace.jsx')
const service = read('../../../services/rankPlacementViewService.js')

describe('Phase V role-specific rank and placement views', () => {
  it('shows locked rank and placement statuses and explicit states', () => {
    for (const label of ['Current Rank','Pending Approved Future Rank','Historical Rank','Cancelled Future Rank','Corrected Record','Activation Failed','Current Placement','Pending Future Placement','Historical Placement','Cancelled Placement']) expect(workspace).toContain(label)
    for (const state of ['aria-busy',"No {type === 'rank' ? 'rank' : 'placement'} history yet",'could not be loaded']) expect(workspace).toContain(state)
  })

  it('uses separate server-filtered endpoints for each role', () => {
    for (const endpoint of ['/personnel/rank-history','/personnel/rank-placements','/reviewer/personnel/','/hr/personnel/']) expect(service).toContain(endpoint)
    expect(workspace).toContain("role === 'reviewer'")
    expect(workspace).toContain("role !== 'reviewer'")
  })

  it('shows signed documents only to personnel and HR and recovery only to HR', () => {
    expect(workspace).toContain("role !== 'reviewer'")
    expect(workspace).toContain('Signed document')
    expect(workspace).toContain("role === 'hr'")
    expect(workspace).toContain('Retry rank activation')
  })

  it('uses semantic tables, pagination, truncation, and accessible action names', () => {
    for (const token of ['<table','scope="col"','pagination','truncate','aria-label={`Download signed document','aria-label="Retry rank activation"']) expect(workspace).toContain(token)
  })
})
