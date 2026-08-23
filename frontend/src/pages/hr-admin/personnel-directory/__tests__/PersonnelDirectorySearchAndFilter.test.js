/**
 * PersonnelDirectorySearchAndFilter.test.js
 * Unit test suite for multi-attribute search and structured filtering logic.
 */

import { describe, it, expect } from 'vitest'

const samplePersonnel = [
  {
    id: 'emp_001',
    employee_id: 'EMP-2021-0842',
    institutional_id: '9000000010',
    first_name: 'Maria',
    middle_name: 'Clara',
    last_name: 'Santos',
    full_name: 'Dr. Maria Clara Santos',
    email: 'faculty@ndmu.edu.ph',
    institutional_email: 'maria.santos@ndmu.edu.ph',
    college: 'CEAC - College of Engineering, Architecture, and Computing',
    department: 'Department of Computer Studies',
    department_code: 'CSD',
    academic_rank: 'Associate Professor II',
    employment_status: 'Full-Time Permanent',
    tenure_years: 9
  },
  {
    id: 'emp_002',
    employee_id: 'EMP-2015-0120',
    institutional_id: '9000000011',
    first_name: 'Ricardo',
    middle_name: 'Bayan',
    last_name: 'Gomez',
    full_name: 'Prof. Ricardo Bayan Gomez',
    email: 'coordinator@ndmu.edu.ph',
    institutional_email: 'ricardo.gomez@ndmu.edu.ph',
    college: 'CEAC - College of Engineering, Architecture, and Computing',
    department: 'Department of Engineering',
    department_code: 'ENG',
    academic_rank: 'Assistant Professor IV',
    employment_status: 'Full-Time Permanent',
    tenure_years: 11
  },
  {
    id: 'emp_003',
    employee_id: 'EMP-2019-0881',
    institutional_id: '9000000012',
    first_name: 'Ana',
    middle_name: 'Rocio',
    last_name: 'Reyes',
    full_name: 'Dr. Ana Reyes',
    email: 'moderator@ndmu.edu.ph',
    institutional_email: 'ana.reyes@ndmu.edu.ph',
    college: 'CBA - College of Business Administration',
    department: 'Department of Business Management',
    department_code: 'DBM',
    academic_rank: 'Associate Professor I',
    employment_status: 'Full-Time Probationary',
    tenure_years: 7
  },
  {
    id: 'emp_004',
    employee_id: 'EMP-2022-0994',
    institutional_id: '9000000013',
    first_name: 'Evelyn',
    middle_name: 'Tan',
    last_name: 'Mercado',
    full_name: 'Evelyn Tan Mercado',
    email: 'hr.admin01@ndmu.edu.ph',
    institutional_email: 'evelyn.mercado@ndmu.edu.ph',
    college: 'CAS - College of Arts and Sciences',
    department: 'Department of Languages & Humanities',
    department_code: 'DLH',
    academic_rank: 'Assistant Professor II',
    employment_status: 'Part-Time Lecturer',
    tenure_years: 3
  }
]

const normalizeSearchValue = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

const matchesPersonnelSearch = (person, query) => {
  if (!query) return true
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true

  const compositeName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ')

  const searchValues = [
    person.first_name,
    person.middle_name,
    person.last_name,
    person.full_name,
    compositeName,
    person.employee_id,
    person.institutional_id,
    person.email,
    person.institutional_email,
    person.department,
    person.department_name,
    person.department_code,
    person.college
  ].filter(Boolean).map(normalizeSearchValue)

  // Direct full substring match
  if (searchValues.some(val => val.includes(normalizedQuery))) {
    return true
  }

  // Multi-token match (e.g. "Evelyn Mercado" matching first_name + last_name across fields)
  const tokens = normalizedQuery.split(' ').filter(Boolean)
  if (tokens.length > 1) {
    return tokens.every(token =>
      searchValues.some(val => val.includes(token))
    )
  }

  return false
}

describe('PersonnelDirectorySearchAndFilter', () => {
  describe('Multi-Attribute Search Logic', () => {
    it('matches personnel by first name', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'Evelyn'))
      expect(results.length).toBe(1)
      expect(results[0].last_name).toBe('Mercado')
    })

    it('matches personnel by last name', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'Mercado'))
      expect(results.length).toBe(1)
      expect(results[0].first_name).toBe('Evelyn')
    })

    it('matches personnel by full name or composite name', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'Evelyn Tan Mercado'))
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('emp_004')
    })

    it('matches personnel across first and last name tokens omitting middle name', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'Evelyn Mercado'))
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('emp_004')
    })

    it('matches personnel by employee ID (partial and exact)', () => {
      const exact = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'EMP-2019-0881'))
      expect(exact.length).toBe(1)
      expect(exact[0].first_name).toBe('Ana')

      const partial = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'EMP-2021'))
      expect(partial.length).toBe(1)
      expect(partial[0].first_name).toBe('Maria')
    })

    it('matches personnel by institutional ID', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, '9000000010'))
      expect(results.length).toBe(1)
      expect(results[0].first_name).toBe('Maria')
    })

    it('matches personnel by institutional email substring', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'moderator@ndmu.edu.ph'))
      expect(results.length).toBe(1)
      expect(results[0].first_name).toBe('Ana')

      const domain = samplePersonnel.filter(p => matchesPersonnelSearch(p, '@ndmu.edu.ph'))
      expect(domain.length).toBe(4)
    })

    it('matches personnel by department name or code', () => {
      const byDept = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'Computer Studies'))
      expect(byDept.length).toBe(1)
      expect(byDept[0].first_name).toBe('Maria')

      const byCode = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'CSD'))
      expect(byCode.length).toBe(1)
      expect(byCode[0].first_name).toBe('Maria')
    })

    it('handles whitespace-padded and mixed-case search terms seamlessly', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, '   eVeLyN   mErCaDo  '))
      expect(results.length).toBe(1)
      expect(results[0].first_name).toBe('Evelyn')
    })

    it('returns empty array when no records match', () => {
      const results = samplePersonnel.filter(p => matchesPersonnelSearch(p, 'NonExistentPersonXYZ'))
      expect(results.length).toBe(0)
    })
  })

  describe('Structured Filter Combination', () => {
    it('combines search and college filter with AND semantics', () => {
      const results = samplePersonnel.filter(p => {
        const matchesQuery = matchesPersonnelSearch(p, 'Santos')
        const matchesCollege = p.college.startsWith('CEAC')
        return matchesQuery && matchesCollege
      })
      expect(results.length).toBe(1)
      expect(results[0].first_name).toBe('Maria')
    })

    it('returns empty when search and filter conditions conflict', () => {
      const results = samplePersonnel.filter(p => {
        const matchesQuery = matchesPersonnelSearch(p, 'Santos')
        const matchesCollege = p.college.startsWith('CAS') // Maria is in CEAC, not CAS!
        return matchesQuery && matchesCollege
      })
      expect(results.length).toBe(0)
    })
  })
})
