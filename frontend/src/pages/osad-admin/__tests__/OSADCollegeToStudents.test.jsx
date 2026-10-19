import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import OSADAcademicProgramsPage, { filterStudentsByProgram } from '../OSADAcademicProgramsPage'

const colleges = [{ id: 'c1', code: 'CICT', name: 'College of ICT', status: 'active' }]
const programs = [
  { id: 'p1', college_id: 'c1', code: 'BSIT', name: 'Information Technology', status: 'active' },
  { id: 'p2', college_id: 'c1', code: 'BSCS', name: 'Computer Science', status: 'inactive' }
]
const students = [
  { id: 's1', academic_program_id: 'p1' },
  { id: 's2', academic_program_id: 'p1' },
  { id: 's3', academic_program_id: 'p2' }
]

describe('OSAD Student Management college browsing', () => {
  it('shows colleges directly and provides a clear programs path without college-structure controls', () => {
    const html = renderToStaticMarkup(<OSADAcademicProgramsPage colleges={colleges} academicPrograms={programs} />)
    expect(html).toContain('College of ICT')
    expect(html).toContain('Search colleges')
    expect(html).not.toContain('Create College')
    expect(html).not.toContain('Create Academic Program')
    expect(html).not.toContain('Manage College')
  })

  it('shows one student list with Add student and Add program actions on the college page', () => {
    const html = renderToStaticMarkup(
      <OSADAcademicProgramsPage colleges={colleges} academicPrograms={programs} selectedCollegeId="c1" />
    )
    expect(html).toContain('Back to colleges')
    expect(html).toContain('Add student')
    expect(html).toContain('Add program')
    expect(html).toContain('All programs')
    expect(html).toContain('Information Technology')
    expect(html).toContain('Computer Science (Disabled)')
    expect(html).toContain('Students')
    expect(html).not.toContain('Students by program')
    expect(html).not.toContain('Program management')
    expect(html).toContain('No students in this college')
    expect(html).not.toContain('Edit College')
    expect(html).not.toContain('Manage Program Coordinators')
  })

  it('shows the selected program status, count, edit/toggle actions, and its empty state', () => {
    const html = renderToStaticMarkup(
      <OSADAcademicProgramsPage
        colleges={colleges}
        academicPrograms={programs}
        selectedCollegeId="c1"
        selectedProgramId="p2"
      />
    )
    expect(html).toContain('Computer Science')
    expect(html).toContain('BSCS')
    expect(html).toContain('inactive')
    expect(html).toContain('Edit program')
    expect(html).toContain('Enable program')
    expect(html).toContain('No students in this program')
  })

  it('filters the single college roster for all, selected, and empty programs', () => {
    expect(filterStudentsByProgram(students, 'all')).toEqual(students)
    expect(filterStudentsByProgram(students, 'p1')).toEqual(students.slice(0, 2))
    expect(filterStudentsByProgram(students, 'p2')).toEqual(students.slice(2))
    expect(filterStudentsByProgram(students, 'empty')).toEqual([])
  })
})
