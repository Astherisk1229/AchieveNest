import { describe, expect, it } from 'vitest'
import { CANONICAL_ROLES } from '../../utils/roleContext'
import { getPersonnelCategoryTree, getPersonnelGroup, getRoleHelpTopics, getRoleTerms, HELP_ROLE_LABELS } from '../helpGuideContent'

describe('role-based Help & Guide content', () => {
  it('provides role labels, role-specific topics, and terms for every canonical role', () => {
    Object.values(CANONICAL_ROLES).forEach((role) => {
      expect(HELP_ROLE_LABELS[role]).toBeTruthy()
      expect(getRoleHelpTopics(role, 'faculty').length).toBeGreaterThan(0)
      expect(getRoleTerms(role).id).toBe('terms')
      expect(getRoleTerms(role).sections.length).toBeGreaterThan(0)
    })
  })

  it('keeps the Personnel guide to three agreed topics with the four role-aware FAQs', () => {
    const topics = getRoleHelpTopics(CANONICAL_ROLES.PERSONNEL)
    expect(topics.map((item) => item.title)).toEqual(['Getting Started', 'Portfolio & Evaluation', 'FAQs'])
    const gettingStarted = JSON.stringify(topics[0])
    for (const phrase of ['Welcome to AchieveNest', 'Using Your Workspace', 'Profile Information', 'Settings', 'Profile Picture', 'Contact Phone', 'Professional Specialization', 'Professional Biography & Summary', 'Institutional Email', 'Undergraduate Program']) {
      expect(gettingStarted).toContain(phrase)
    }
    expect(gettingStarted).not.toContain('Campus Location')
    expect(gettingStarted).not.toContain('Highest Educational Degree')
    const portfolio = topics[1]
    expect(portfolio.sections.map((section) => section.title)).toEqual(['Adding Accomplishments', 'Evaluation Process'])
    const faq = topics[2].sections.find((section) => section.type === 'faq')
    expect(faq.items.map(([question]) => question)).toEqual([
      'How do I know which category or subcategory to choose?',
      'Why is my accomplishment not included in my portfolio?',
      'Can I edit my portfolio after submitting it?',
      'Who evaluates my portfolio?'
    ])
  })

  it('keeps student terminology separate from personnel evaluation terms', () => {
    const studentTerms = getRoleTerms(CANONICAL_ROLES.STUDENT)
    const personnelTerms = getRoleTerms(CANONICAL_ROLES.PERSONNEL)
    const studentText = JSON.stringify(studentTerms)
    const personnelText = JSON.stringify(personnelTerms)

    expect(studentText).toContain('Pending Review')
    expect(studentText).not.toContain('Evaluation period')
    expect(personnelText).toContain('Evaluation period')
    expect(personnelText).not.toContain('Pending Review')
  })

  it('uses the canonical Faculty and Non-Teaching form schemas for personnel category trees', () => {
    const faculty = getPersonnelCategoryTree('faculty')
    const nonTeaching = getPersonnelCategoryTree('non_teaching_faculty')

    expect(faculty.map((area) => area.code)).toEqual(['A', 'B', 'C'])
    expect(faculty[0].children[0].children[0].code).toBe('A1_PHD_HOLDER')
    const facultyYears = faculty[2].children.find((item) => item.code === 'C.3')
    expect(facultyYears.description).toContain('derived')
    expect(facultyYears.evidence).toContain('No separate Personnel-entered')
    expect(nonTeaching.map((area) => area.code)).toEqual(['A', 'B'])
    expect(nonTeaching[1].children.some((item) => item.code === 'B.3')).toBe(true)
    expect(nonTeaching[1].children.find((item) => item.code === 'B.3').description).toContain('derived')
  })

  it('does not guess a personnel category tree when the personnel classification is unknown', () => {
    expect(getPersonnelCategoryTree('')).toEqual([])
    expect(getPersonnelCategoryTree('unknown')).toEqual([])
    expect(getPersonnelGroup({ personnel_affiliation: { personnel_group: 'non_academic' } })).toBe('non_academic')
    expect(getRoleHelpTopics(CANONICAL_ROLES.PERSONNEL, '')).toHaveLength(3)
  })

  it('keeps the HR guide to the three concise topics and places required material within them', () => {
    const topics = getRoleHelpTopics(CANONICAL_ROLES.HR_STAFF)
    expect(topics.map((item) => item.menuTitle || item.title)).toEqual(['Getting Started', 'Ranking & Evaluation', 'FAQs'])

    const guideText = JSON.stringify(topics)
    for (const phrase of ['Personnel Directory', 'Notifications', 'Settings', 'Submitted for Review', 'Annual Review', 'College Dean', 'Non-Teaching Personnel', 'Returned for Revision', 'achievement coverage', 'final snapshot']) {
      expect(guideText).toContain(phrase)
    }
    for (const removedTopic of ['About AchieveNest', 'Ranking Periods & Eligibility', 'Personnel Evaluation & Finalization', 'Terms & Definitions', 'Need More Help?', 'Help & Support']) {
      expect(topics.map((item) => item.title)).not.toContain(removedTopic)
    }
    const faqs = topics.find((item) => item.id === 'hr-faqs').sections.find((section) => section.type === 'faq')
    expect(faqs.items).toHaveLength(11)
    expect(guideText).not.toContain('Department Head')
  })
})
