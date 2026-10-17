import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PersonnelDirectoryTable from '../PersonnelDirectoryTable'

const personnel = {
  id: 'staff-1',
  full_name: 'Jordan Rivera',
  institutional_email: 'jordan.rivera@ndmu.edu.ph',
  institutional_id: '20260042',
  status: 'active',
  personnel_group: 'faculty',
  personnel_classification: 'academic',
  organizational_side: 'academic',
  college_code: 'CAS',
  college_name: 'College of Arts and Sciences',
  position_title: 'Professor of Communication',
  academic_rank: 'Professor I',
  academic_rank_applicable: true,
  academic_rank_review_required: true,
  login_readiness: { status: 'READY' },
  assigned_roles: [
    'program_coordinator',
    'organization_moderator'
  ]
}

describe('PersonnelDirectoryTable redesign', () => {
  it('keeps the seven directory columns and places the five existing filters behind one control', () => {
    const html = renderToStaticMarkup(<PersonnelDirectoryTable personnelList={[personnel]} />)

    for (const heading of ['Personnel', 'Assignment', 'Job Title', 'Academic Rank', 'Status &amp; Responsibilities', 'Actions']) {
      expect(html).toContain(heading)
    }
    expect(html).toContain('aria-label="Personnel filters"')
    expect(html).toContain('class="hidden grid-cols-1')
    expect(html).toContain('aria-label="Filter by personnel group"')
    expect(html).toContain('aria-label="Filter by employment status"')
    expect(html).toContain('aria-label="Filter by college"')
    expect(html).toContain('aria-label="Filter by department"')
    expect(html).toContain('aria-label="Filter by status"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('retains complete directory information while presenting status and responsibilities as text', () => {
    const html = renderToStaticMarkup(<PersonnelDirectoryTable personnelList={[personnel]} />)

    expect(html).toContain('Jordan Rivera')
    expect(html).toContain('jordan.rivera@ndmu.edu.ph')
    expect(html).toContain('20260042')
    expect(html).toContain('title="College of Arts and Sciences"')
    expect(html).toContain('Professor of Communication')
    expect(html).toContain('Professor I')
    expect(html).toContain('HR review required')
    expect(html).toContain('Login ready')
    expect(html).toContain('program coordinator · organization moderator')
    expect(html).not.toContain('Login Ready</span>')
    expect(html).not.toContain('+1 responsibility')
  })

  it('keeps the server page visible while a new search is loading', () => {
    const html = renderToStaticMarkup(
      <PersonnelDirectoryTable
        personnelList={[personnel]}
        initialSearch="someone else"
        serverTotal={1}
        onServerQueryChange={() => {}}
        isLoading
      />
    )

    expect(html).toContain('Jordan Rivera')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Updating personnel records')
    expect(html).not.toContain('No personnel records found')
  })
})
