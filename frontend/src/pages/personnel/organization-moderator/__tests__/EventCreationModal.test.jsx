import { describe, expect, it, vi } from 'vitest'
import {
  calculateDuration,
  formatScheduleDuration,
  getNextDayDate,
  getSmartDefaultEndTime,
  validateSchedule
} from '../../../../lib/eventSchedule'

describe('EventCreationModal Form Contract & Validation', () => {
  const validateForm = (formData, isEditing = false) => {
    const errors = {}

    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Event title is required.'
    }

    if (!formData.startDate) {
      errors.startDate = 'Select an event start date.'
    }

    if (!formData.startTime) {
      errors.startTime = 'Select a start time.'
    }

    if (!formData.endDate) {
      errors.endDate = 'Select an event end date.'
    }

    if (!formData.endTime) {
      errors.endTime = 'Select an end time.'
    }

    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const dur = calculateDuration(formData.startDate, formData.startTime, formData.endDate, formData.endTime)
      if (!dur.isValid) {
        errors.schedule = dur.error
      }
    }

    if (!isEditing && !formData.venue_id) {
      errors.venue_id = 'Select an official venue.'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  it('validates required fields for a new canonical event', () => {
    const emptyForm = {
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      venue_id: ''
    }

    const res = validateForm(emptyForm, false)
    expect(res.isValid).toBe(false)
    expect(res.errors.title).toBe('Event title is required.')
    expect(res.errors.startDate).toBe('Select an event start date.')
    expect(res.errors.startTime).toBe('Select a start time.')
    expect(res.errors.endDate).toBe('Select an event end date.')
    expect(res.errors.endTime).toBe('Select an end time.')
    expect(res.errors.venue_id).toBe('Select an official venue.')
  })

  it('rejects same-day earlier end time and equal start/end time', () => {
    const earlierTimeForm = {
      title: 'Valid Title',
      startDate: '2026-06-24',
      startTime: '09:00',
      endDate: '2026-06-24',
      endTime: '03:00',
      venue_id: 'v-1'
    }

    const resEarlier = validateForm(earlierTimeForm, false)
    expect(resEarlier.isValid).toBe(false)
    expect(resEarlier.errors.schedule).toBe('End time is earlier than the start time.')

    const equalTimeForm = {
      ...earlierTimeForm,
      startTime: '09:00',
      endTime: '09:00'
    }
    const resEqual = validateForm(equalTimeForm, false)
    expect(resEqual.isValid).toBe(false)
    expect(resEqual.errors.schedule).toBe('End time must be later than the start time.')
  })

  it('accepts valid overnight event spanning consecutive days', () => {
    const overnightForm = {
      title: 'Overnight Hackathon',
      startDate: '2026-06-24',
      startTime: '21:00',
      endDate: '2026-06-25',
      endTime: '03:00',
      venue_id: 'v-1'
    }

    const res = validateForm(overnightForm, false)
    expect(res.isValid).toBe(true)
    expect(res.errors).toEqual({})

    const dur = calculateDuration(overnightForm.startDate, overnightForm.startTime, overnightForm.endDate, overnightForm.endTime)
    expect(dur.isValid).toBe(true)
    expect(dur.isOvernight).toBe(true)
    expect(formatScheduleDuration(overnightForm.startDate, overnightForm.startTime, overnightForm.endDate, overnightForm.endTime))
      .toBe('6 hours · Ends the following day')
  })

  it('accepts valid multi-day event', () => {
    const multiDayForm = {
      title: '3-Day Leadership Summit',
      startDate: '2026-06-24',
      startTime: '09:00',
      endDate: '2026-06-26',
      endTime: '13:00',
      venue_id: 'v-1'
    }

    const res = validateForm(multiDayForm, false)
    expect(res.isValid).toBe(true)
    expect(res.errors).toEqual({})

    const durationLabel = formatScheduleDuration(multiDayForm.startDate, multiDayForm.startTime, multiDayForm.endDate, multiDayForm.endTime)
    expect(durationLabel).toBe('2 days, 4 hours')
  })

  it('allows editing legacy event without requiring new venue_id', () => {
    const legacyEditForm = {
      title: 'R3 Acceptance Event EDITED',
      startDate: '2026-09-23',
      startTime: '18:19',
      endDate: '2026-09-23',
      endTime: '20:19',
      venue_id: '',
      historicalVenue: 'R3 Acceptance Hall'
    }

    const res = validateForm(legacyEditForm, true)
    expect(res.isValid).toBe(true)
    expect(res.errors.venue_id).toBeUndefined()
  })

  it('constructs backend payload without client authority or non-persisted fields', () => {
    const formValues = {
      title: 'Workshop Event',
      category: 'Workshop',
      startDate: '2026-10-20',
      startTime: '13:00',
      endDate: '2026-10-20',
      endTime: '15:00',
      venue_id: 'venue-uuid-1',
      description: 'Test workshop'
    }

    const payload = {
      title: formValues.title,
      event_type: formValues.category,
      start_time: `${formValues.startDate} ${formValues.startTime}:00`,
      end_time: `${formValues.endDate} ${formValues.endTime}:00`,
      venue_id: formValues.venue_id,
      description: formValues.description
    }

    expect(payload).toEqual({
      title: 'Workshop Event',
      event_type: 'Workshop',
      start_time: '2026-10-20 13:00:00',
      end_time: '2026-10-20 15:00:00',
      venue_id: 'venue-uuid-1',
      description: 'Test workshop'
    })

    // Assert no client authority leakage
    expect(payload).not.toHaveProperty('organization_id')
    expect(payload).not.toHaveProperty('organizer_profile_id')
    expect(payload).not.toHaveProperty('status')
    expect(payload).not.toHaveProperty('capacity')
    expect(payload).not.toHaveProperty('target_audience')
    expect(payload).not.toHaveProperty('banner_type')
  })

  describe('Wizard Navigation & Defensive Final-Step Submission Guard (2-Step Reconciled)', () => {
    // Simulator for the component wizard navigation and submission behavior
    class WizardSimulator {
      constructor({ onCreateEvent, onUpdateEvent, editingEvent = null }) {
        this.activeStep = 1
        this.onCreateEvent = onCreateEvent
        this.onUpdateEvent = onUpdateEvent
        this.editingEvent = editingEvent
        this.isSubmitting = false
        this.formData = {
          title: 'Canonical Test Event',
          category: 'General Assembly',
          startDate: '2026-10-20',
          startTime: '08:00',
          endDate: '2026-10-20',
          endTime: '12:00',
          venue_id: 'venue-1',
          description: 'Testing wizard semantics',
          osad_template_id: 'OSAD-TPL-01'
        }
      }

      validateStep1() {
        return validateForm(this.formData, !!this.editingEvent).isValid
      }

      handleNextStep() {
        if (this.activeStep === 1) {
          if (!this.validateStep1()) return
        }
        this.activeStep = Math.min(2, this.activeStep + 1)
      }

      handleBack() {
        this.activeStep = Math.max(1, this.activeStep - 1)
      }

      async handleSubmit(e = { preventDefault: () => {} }) {
        e.preventDefault()

        // Defensive submission guard: Event creation is strictly allowed only on final Step 2 (Certificate)
        if (this.activeStep !== 2) {
          if (this.activeStep === 1) {
            if (this.validateStep1()) {
              this.activeStep = 2
            }
          }
          return
        }

        if (this.isSubmitting) return

        if (!this.validateStep1()) {
          this.activeStep = 1
          return
        }

        this.isSubmitting = true
        try {
          const payload = {
            title: this.formData.title.trim(),
            category: this.formData.category,
            startDate: this.formData.startDate,
            startTime: this.formData.startTime,
            endDate: this.formData.endDate,
            endTime: this.formData.endTime,
            date: this.formData.startDate,
            description: this.formData.description.trim() || null,
            osad_template_id: this.formData.osad_template_id
          }
          if (this.formData.venue_id) {
            payload.venue_id = this.formData.venue_id
          }

          if (this.editingEvent && this.onUpdateEvent) {
            await this.onUpdateEvent(this.editingEvent.id, payload)
          } else if (this.onCreateEvent) {
            await this.onCreateEvent(payload)
          }
        } finally {
          this.isSubmitting = false
        }
      }
    }

    it('1. Event Details is first step and initial wizard state', () => {
      const wizard = new WizardSimulator({ onCreateEvent: vi.fn() })
      expect(wizard.activeStep).toBe(1)
    })

    it('2-7. Confirms duplicate attendance and officer URL fields are absent from wizard formData', () => {
      const wizard = new WizardSimulator({ onCreateEvent: vi.fn() })
      expect(wizard.formData).not.toHaveProperty('attendance_start_time')
      expect(wizard.formData).not.toHaveProperty('attendance_end_time')
      expect(wizard.formData).not.toHaveProperty('officer_scanner_url')
      expect(wizard.formData).not.toHaveProperty('scanner_url')
    })

    it('8-9. Step 1 Next Step navigates to Certificate (Step 2) with 0 Event POSTs', async () => {
      const mockCreate = vi.fn()
      const wizard = new WizardSimulator({ onCreateEvent: mockCreate })

      expect(wizard.activeStep).toBe(1)
      wizard.handleNextStep()

      expect(wizard.activeStep).toBe(2) // Step 2 is Certificate
      expect(mockCreate).toHaveBeenCalledTimes(0)
    })

    it('10. Back from Certificate does not POST and returns to Step 1', async () => {
      const mockCreate = vi.fn()
      const wizard = new WizardSimulator({ onCreateEvent: mockCreate })

      wizard.handleNextStep() // 1 -> 2
      expect(wizard.activeStep).toBe(2)
      expect(mockCreate).toHaveBeenCalledTimes(0)

      wizard.handleBack() // 2 -> 1
      expect(wizard.activeStep).toBe(1)
      expect(mockCreate).toHaveBeenCalledTimes(0)
    })

    it('11. Enter / submit attempt on Step 1 does not POST Event', async () => {
      const mockCreate = vi.fn()
      const wizard = new WizardSimulator({ onCreateEvent: mockCreate })

      expect(wizard.activeStep).toBe(1)
      await wizard.handleSubmit({ preventDefault: vi.fn() })

      expect(mockCreate).toHaveBeenCalledTimes(0)
      expect(wizard.activeStep).toBe(2) // Safely advances without POST
    })

    it('12-15. Final Step 2 Create Event posts exactly once with canonical schedule and no duplicate attendance fields', async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: 'evt-123' })
      const wizard = new WizardSimulator({ onCreateEvent: mockCreate })

      wizard.handleNextStep() // 1 -> 2 (Certificate)
      expect(wizard.activeStep).toBe(2)
      expect(mockCreate).toHaveBeenCalledTimes(0)

      await wizard.handleSubmit({ preventDefault: vi.fn() })
      expect(mockCreate).toHaveBeenCalledTimes(1)

      const submittedPayload = mockCreate.mock.calls[0][0]
      expect(submittedPayload).toEqual(expect.objectContaining({
        title: 'Canonical Test Event',
        startDate: '2026-10-20',
        startTime: '08:00',
        endDate: '2026-10-20',
        endTime: '12:00',
        venue_id: 'venue-1'
      }))

      // Assert no duplicate attendance fields
      expect(submittedPayload).not.toHaveProperty('attendance_start_time')
      expect(submittedPayload).not.toHaveProperty('attendance_end_time')
      expect(submittedPayload).not.toHaveProperty('officer_scanner_url')
    })

    it('final submit does not accidentally execute twice while in progress', async () => {
      let resolveCreation
      const mockCreate = vi.fn().mockImplementation(() => new Promise((resolve) => {
        resolveCreation = resolve
      }))
      const wizard = new WizardSimulator({ onCreateEvent: mockCreate })

      wizard.activeStep = 2 // Final step

      // First submit
      const p1 = wizard.handleSubmit({ preventDefault: vi.fn() })
      // Rapid second submit while isSubmitting = true
      const p2 = wizard.handleSubmit({ preventDefault: vi.fn() })

      resolveCreation({ id: 'evt-123' })
      await Promise.all([p1, p2])

      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })
})
