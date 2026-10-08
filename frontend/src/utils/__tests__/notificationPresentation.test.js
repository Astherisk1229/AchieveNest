import { describe, expect, it } from 'vitest'
import { actionLabel, notificationTarget, notificationTone, portalFromPath } from '../notificationPresentation'

const record = { reference_type: 'student_portfolio_records', reference_id: 'rec-1' }

describe('notification presentation (Step 7)', () => {
  it('resolves the portal from the current route', () => {
    expect(portalFromPath('/student/notifications')).toBe('student')
    expect(portalFromPath('/personnel/notifications')).toBe('personnel')
    expect(portalFromPath('/osad/notifications')).toBe('osad')
  })

  it('sends a student to their achievements with the record highlighted', () => {
    expect(notificationTarget(record, 'student')).toEqual({ path: '/student/achievements', state: { highlightId: 'rec-1' } })
  })

  it('sends a coordinator to the verification workspace with the record selected', () => {
    expect(notificationTarget(record, 'personnel')).toEqual({ path: '/personnel/dashboard?tab=workspace&record=rec-1', state: null })
  })

  it('does not invent a destination for OSAD or for missing references', () => {
    expect(notificationTarget(record, 'osad')).toBeNull()
    expect(notificationTarget({ reference_type: 'student_portfolio_records' }, 'student')).toBeNull()
  })

  it('keeps an explicit backend route and the personnel portfolio mapping', () => {
    expect(notificationTarget({ target_path: '/x' }, 'student')).toEqual({ path: '/x', state: null })
    expect(notificationTarget({ reference_type: 'personnel_portfolio_submission' }, 'personnel').path).toBe('/personnel/portfolio/edit')
  })

  it('routes HR-opened personnel evaluation notifications to the Portfolio page', () => {
    expect(notificationTarget({
      reference_type: 'personnel_evaluation_period',
      reference_id: 'period-1'
    }, 'personnel')).toEqual({ path: '/personnel/portfolio', state: null })
  })

  it('maps the four achievement notification types to distinct tones', () => {
    expect(notificationTone('student_achievement_submitted')).toBe('submitted')
    expect(notificationTone('portfolio_verified')).toBe('success')
    expect(notificationTone('portfolio_revision_requested')).toBe('warning')
    expect(notificationTone('portfolio_rejected')).toBe('danger')
    expect(actionLabel('portfolio_revision_requested', 'student')).toBe('Revise Achievement')
  })
})
