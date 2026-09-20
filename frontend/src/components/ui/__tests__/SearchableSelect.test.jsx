import { describe, expect, it } from 'vitest'
import { filterSearchableOptions } from '../SearchableSelect'

const programs = [
  { id: '1', code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
  { id: '2', code: 'BSBA', name: 'Bachelor of Science in Business Administration' }
]
const label = program => `${program.code} — ${program.name}`

describe('SearchableSelect filtering', () => {
  it('matches official options by code or name without creating custom values', () => {
    expect(filterSearchableOptions(programs, 'bsit', label)).toEqual([programs[0]])
    expect(filterSearchableOptions(programs, 'information', label)).toEqual([programs[0]])
    expect(filterSearchableOptions(programs, 'custom program', label)).toEqual([])
  })

  it('returns the browsable official list for a blank query', () => {
    expect(filterSearchableOptions(programs, ' ', label)).toEqual(programs)
  })
})
