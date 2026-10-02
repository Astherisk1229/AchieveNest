import { describe, expect, it } from 'vitest'
import { compareAccomplishments } from '../PersonnelPortfolioEditPage'

const items = [
  { title: 'Seminar B', category: 'Seminar', date: '2025-03-10' },
  { title: 'Award A', category: 'Award', date: '2026-01-05' },
  { title: 'Undated', category: 'Award', date: '' },
  { title: 'Membership', category: 'Membership', date: '2024-07-01' },
]
const titles = order => [...items].sort((a, b) => compareAccomplishments(a, b, order)).map(i => i.title)

describe('D1: personnel accomplishments sort', () => {
  it('newest and oldest first keep undated entries last', () => {
    expect(titles('newest')).toEqual(['Award A', 'Seminar B', 'Membership', 'Undated'])
    expect(titles('oldest')).toEqual(['Membership', 'Seminar B', 'Award A', 'Undated'])
  })

  it('sorts by category (type), then title', () => {
    expect(titles('category')).toEqual(['Award A', 'Undated', 'Membership', 'Seminar B'])
  })

  it('sorts by title', () => {
    expect(titles('title')).toEqual(['Award A', 'Membership', 'Seminar B', 'Undated'])
  })
})
