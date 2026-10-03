import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import OSADCollegeDetailsView from '../OSADCollegeDetailsView'

const source = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const college = { id: 'c1', code: 'CICT', name: 'College of ICT', status: 'active', programs: [] }

describe('OS-4: OSAD goes from a College to its students in one click', () => {
  it('shows View Students on the College page when the dashboard wires it', () => {
    const html = renderToStaticMarkup(<OSADCollegeDetailsView collegeId="c1" fallbackCollege={college} onBack={() => {}} onAddProgram={() => {}} onViewStudents={() => {}}/>)
    expect(html).toContain('View Students')
  })

  it('hides the button when no handler is given', () => {
    const html = renderToStaticMarkup(<OSADCollegeDetailsView collegeId="c1" fallbackCollege={college} onBack={() => {}} onAddProgram={() => {}}/>)
    expect(html).not.toContain('View Students')
  })

  it('opens Student Accounts filtered by the College code', () => {
    const dashboard = source('../OSADDashboardPage.jsx')
    expect(dashboard).toContain("setSelectedCollege(college?.code || 'all')")
    expect(dashboard).toContain("next.set('tab', 'accounts')")
    expect(source('../OSADAcademicProgramsPage.jsx')).toContain('onViewStudents={onViewCollegeStudents}')
  })
})
