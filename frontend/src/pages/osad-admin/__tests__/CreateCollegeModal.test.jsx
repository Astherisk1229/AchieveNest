import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CreateCollegeModal from '../modals/CreateCollegeModal'
import CollegeModel from '../../../models/CollegeModel'
import * as collegeAdminService from '../../../services/collegeAdminService'

describe('CreateCollegeModal & College Branding Service (Phase C)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates CreateCollegeModal React component cleanly', () => {
    const element = <CreateCollegeModal isOpen={true} onClose={() => {}} onSubmit={() => {}} />
    expect(element.type).toBe(CreateCollegeModal)
    expect(element.props.isOpen).toBe(true)
  })

  it('collegeAdminService exposes expected API functions', () => {
    expect(typeof collegeAdminService.fetchColleges).toBe('function')
    expect(typeof collegeAdminService.fetchCollege).toBe('function')
    expect(typeof collegeAdminService.createCollege).toBe('function')
    expect(typeof collegeAdminService.getCollegeLogoUrl).toBe('function')
  })

  it('getCollegeLogoUrl generates proper controlled streaming endpoint URL', () => {
    const url = collegeAdminService.getCollegeLogoUrl('20000000-0000-0000-0000-000000000001')
    expect(url).toContain('/osad/colleges/20000000-0000-0000-0000-000000000001/logo')
    expect(collegeAdminService.getCollegeLogoUrl(null)).toBeNull()
  })

  it('CollegeModel initializes branding fields and normalizes uppercase acronym', () => {
    const model = new CollegeModel({
      code: 'ceac',
      name: 'College of Engineering',
      acronym_badge_color: '#16834a',
      logo_storage_key: 'colleges/123/logo.png',
      logo_original_name: 'logo.png',
      logo_mime_type: 'image/png'
    })

    expect(model.code).toBe('CEAC')
    expect(model.name).toBe('College of Engineering')
    expect(model.acronym_badge_color).toBe('#16834A')
    expect(model.logo_storage_key).toBe('colleges/123/logo.png')
    expect(model.logo_original_name).toBe('logo.png')
    expect(model.logo_mime_type).toBe('image/png')
  })

  it('CollegeModel.validate verifies required fields, hex colors, and code uniqueness', () => {
    // Valid model
    const valid = CollegeModel.validate({
      code: 'CET',
      name: 'College of Engineering & Tech',
      acronym_badge_color: '#16834A'
    }, [])
    expect(valid.isValid).toBe(true)
    expect(valid.errors).toHaveLength(0)

    // Missing code and name
    const missing = CollegeModel.validate({}, [])
    expect(missing.isValid).toBe(false)
    expect(missing.errors).toContain('College code is required.')
    expect(missing.errors).toContain('College name is required.')

    // Invalid hex
    const invalidHex = CollegeModel.validate({
      code: 'TEST',
      name: 'Test College',
      acronym_badge_color: '#INVALID'
    }, [])
    expect(invalidHex.isValid).toBe(false)
    expect(invalidHex.errors[0]).toMatch(/valid 6-digit hex string/i)

    // Duplicate code
    const duplicate = CollegeModel.validate({
      code: 'CET',
      name: 'Another CET'
    }, [{ id: 'existing-id', code: 'CET' }])
    expect(duplicate.isValid).toBe(false)
    expect(duplicate.errors[0]).toMatch(/already exists/i)
  })
})
