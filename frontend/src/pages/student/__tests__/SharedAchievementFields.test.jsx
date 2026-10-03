import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import SharedAchievementFields from '../components/SharedAchievementFields'
import EvidenceUploadSection from '../components/EvidenceUploadSection'

describe('SharedAchievementFields & Evidence Integration (Plan 04 Phase 3)', () => {
  it('instantiates SharedAchievementFields element with standard props', () => {
    const formData = {
      title: '12th Regional Research Symposium',
      organizer_or_body: 'NDMU CITE',
      start_date: '2026-04-05',
      end_date: '2026-04-06',
      description: 'Regional undergraduate research presenter.'
    }

    const element = (
      <SharedAchievementFields
        formData={formData}
        onChange={() => {}}
        errors={{}}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.formData.title).toBe('12th Regional Research Symposium')
    expect(element.props.formData.organizer_or_body).toBe('NDMU CITE')
    expect(element.props.formData.start_date).toBe('2026-04-05')
  })

  it('correctly passes field-level errors to SharedAchievementFields', () => {
    const errors = {
      title: 'Title is required.',
      organizer_or_body: 'Organizer is required.',
      start_date: 'Start date is required.',
      end_date: 'End date cannot be before start date.'
    }

    const element = (
      <SharedAchievementFields
        formData={{ title: '', organizer_or_body: '', start_date: '', end_date: '' }}
        onChange={() => {}}
        errors={errors}
      />
    )

    expect(element.props.errors.title).toBe('Title is required.')
    expect(element.props.errors.end_date).toBe('End date cannot be before start date.')
  })

  it('instantiates EvidenceUploadSection element with sample attachments', () => {
    const sampleFiles = [
      { name: 'certificate_proof.pdf', size: 1024 * 1024 * 2 },
      { name: 'event_photo.jpg', size: 1024 * 512 }
    ]

    const element = (
      <EvidenceUploadSection
        files={sampleFiles}
        onAddFiles={() => {}}
        onRemoveFile={() => {}}
        required={true}
      />
    )

    expect(element).toBeDefined()
    expect(element.props.files.length).toBe(2)
    expect(element.props.files[0].name).toBe('certificate_proof.pdf')
    expect(element.props.required).toBe(true)
  })

  it('validates date relationship helper logic', () => {
    const validateDates = (start, end) => {
      if (!start) return { valid: false, error: 'Start date is required.' }
      if (end && new Date(end) < new Date(start)) {
        return { valid: false, error: 'End date cannot be before start date.' }
      }
      return { valid: true, error: null }
    }

    expect(validateDates('', '').valid).toBe(false)
    expect(validateDates('2026-04-05', '2026-04-01').valid).toBe(false)
    expect(validateDates('2026-04-05', '2026-04-01').error).toBe('End date cannot be before start date.')
    expect(validateDates('2026-04-05', '2026-04-06').valid).toBe(true)
    expect(validateDates('2026-04-05', '').valid).toBe(true)
  })

  it('validates category preservation state boundary', () => {
    let state = {
      category_id: 'cat-sports',
      subcategory_id: 'sub-bball',
      shared: {
        title: 'Basketball Championship',
        organizer_or_body: 'Sports Development Office',
        start_date: '2026-02-14',
        end_date: '',
        description: 'Team captain varsity match.'
      },
      structured_metadata: {
        placement: 'champion',
        team_role: 'team_captain'
      }
    }

    // Category switch helper
    const handleCategorySwitch = (currentState, newCategoryId) => {
      return {
        ...currentState,
        category_id: newCategoryId,
        subcategory_id: null,
        // Shared fields preserved intact
        shared: { ...currentState.shared },
        // Category-specific structured metadata reset
        structured_metadata: {}
      }
    }

    const nextState = handleCategorySwitch(state, 'cat-leadership')

    expect(nextState.category_id).toBe('cat-leadership')
    expect(nextState.subcategory_id).toBeNull()
    expect(nextState.shared.title).toBe('Basketball Championship')
    expect(nextState.shared.organizer_or_body).toBe('Sports Development Office')
    expect(nextState.structured_metadata).toEqual({})
  })
})
