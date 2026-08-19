/**
 * PersonnelOnboardingDraftController.js
 * Controller handling local-storage read, save, clear, validation, and tab event
 * synchronization for HR personnel onboarding drafts.
 */

import { PersonnelOnboardingDraftModel } from '../models/PersonnelOnboardingDraftModel.js'

const STORAGE_KEY = 'achievenest_personnel_onboarding_drafts_v1'
const EVENT_NAME = 'achievenest:personnel-onboarding-draft-changed'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

class PersonnelOnboardingDraftController {
  constructor() {
    this.listeners = new Set()
    this.handleStorageEvent = this.handleStorageEvent.bind(this)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent)
      window.addEventListener(EVENT_NAME, this.handleStorageEvent)
    }
  }

  handleStorageEvent(e) {
    if (e.type === 'storage' && e.key !== STORAGE_KEY) return
    this.notifyListeners()
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn() } catch (err) { console.error('Draft listener error:', err) }
    })
  }

  getDraft(ownerContext) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null

      const targetOwnerKey = PersonnelOnboardingDraftModel.buildOwnerKey(ownerContext)
      if (parsed.ownerKey !== targetOwnerKey) return null

      // Check 7-day expiration
      const updatedTime = Date.parse(parsed.updatedAt || '')
      if (isNaN(updatedTime) || (Date.now() - updatedTime > SEVEN_DAYS_MS)) {
        this.clearDraft(ownerContext)
        return null
      }

      const model = new PersonnelOnboardingDraftModel(parsed, ownerContext)
      return model.hasMeaningfulInput() ? model : null
    } catch (e) {
      console.warn('Failed to parse onboarding draft storage:', e)
      return null
    }
  }

  saveDraft(ownerContext, formSnapshot) {
    try {
      const model = new PersonnelOnboardingDraftModel({
        ...formSnapshot,
        updatedAt: new Date().toISOString()
      }, ownerContext)

      if (!model.hasMeaningfulInput()) {
        return false
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(model.toJSON()))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME))
      }
      return true
    } catch (e) {
      console.error('Failed to save personnel onboarding draft:', e)
      return false
    }
  }

  clearDraft(ownerContext) {
    try {
      localStorage.removeItem(STORAGE_KEY)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME))
      }
      return true
    } catch (e) {
      console.error('Failed to clear personnel onboarding draft:', e)
      return false
    }
  }

  dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent)
      window.removeEventListener(EVENT_NAME, this.handleStorageEvent)
    }
    this.listeners.clear()
  }
}

export default new PersonnelOnboardingDraftController()
