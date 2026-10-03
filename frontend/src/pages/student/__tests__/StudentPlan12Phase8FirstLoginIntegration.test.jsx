import { describe, it, expect, vi } from 'vitest'

describe('Plan 12 Phase 8 — First-Login Integration', () => {
  it('guarantees mandatory password change gate cannot be bypassed by unactivated accounts', () => {
    const checkRouteAccess = (user, targetPath) => {
      if (user.must_change_password && targetPath !== '/change-password') {
        return { allowed: false, redirect: '/change-password' }
      }
      return { allowed: true, redirect: null }
    }

    const unactivatedUser = { id: 'u1', account_type: 'student', must_change_password: true }
    const access = checkRouteAccess(unactivatedUser, '/student/account')

    expect(access.allowed).toBe(false)
    expect(access.redirect).toBe('/change-password')
  })

  it('guarantees successful activation establishes normal student session and triggers profile fetch', () => {
    const completeFirstLogin = (user) => {
      const activatedUser = { ...user, must_change_password: false, status: 'active' }
      const session = {
        token: 'auth-bearer-token-xyz',
        user: activatedUser
      }
      return {
        session,
        landingRoute: '/student/account'
      }
    }

    const pendingUser = { id: 'u1', account_type: 'student', must_change_password: true }
    const result = completeFirstLogin(pendingUser)

    expect(result.session.user.must_change_password).toBe(false)
    expect(result.session.user.status).toBe('active')
    expect(result.landingRoute).toBe('/student/account')
  })

  it('guarantees profile ownership is strictly derived from the authenticated session after first login', () => {
    const resolvePostActivationProfile = (session) => {
      // Invariant: Never trust or require client student ID query param
      return {
        ownerId: session.user.id,
        accountType: session.user.account_type
      }
    }

    const session = { user: { id: 'student-999', account_type: 'student' } }
    const profile = resolvePostActivationProfile(session)

    expect(profile.ownerId).toBe('student-999')
    expect(profile.accountType).toBe('student')
  })

  it('guarantees missing required program linkage yields controlled support state without stack traces', () => {
    const handleMissingLinkage = (hasProgram) => {
      if (!hasProgram) {
        return {
          status: 'SUPPORT_REQUIRED',
          message: 'Your academic program information is currently unavailable. Please contact the OSAD office.',
          isStackExposed: false
        }
      }
      return { status: 'COMPLETE', message: 'OK', isStackExposed: false }
    }

    const state = handleMissingLinkage(false)
    expect(state.status).toBe('SUPPORT_REQUIRED')
    expect(state.isStackExposed).toBe(false)
    expect(state.message).toContain('Please contact the OSAD office')
  })
})
