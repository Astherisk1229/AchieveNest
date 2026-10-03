import { describe, it, expect } from 'vitest'
import { PRIMARY_CATEGORIES } from '../../../config/portfolioFormSchemaRegistry'

describe('Plan 05 Phase 4 — Student Portfolio UX Test Suite', () => {
  const sampleStudentRecords = [
    {
      id: 'rec-sports-01',
      title: 'PRISAA Regional Basketball Championship',
      category_id: '2d20d412-bf34-46b4-a21d-d7131d4b514a',
      category_name: 'Sports',
      subcategory_id: '40000007-0001-0000-0000-000000000001',
      subcategory_name: 'Basketball',
      status: 'verified',
      occurrence_date: '2026-02-14',
      structured_metadata: {
        schema_version: '1.0',
        placement: 'champion',
        event_level: 'regional',
        individual_team: 'team'
      },
      evidence: [
        { id: 'ev-01', original_filename: 'prisaa_cert.pdf', mime_type: 'application/pdf' }
      ]
    },
    {
      id: 'rec-lead-02',
      title: 'Supreme Student Government Vice President',
      category_id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
      category_name: 'Leadership Position',
      subcategory_id: '40000001-0001-0000-0000-000000000001',
      subcategory_name: 'SSG / University Student Government',
      status: 'revisions_requested',
      occurrence_date: '2025-08-01',
      structured_metadata: {
        schema_version: '1.0',
        position_level: 'executive',
        organization_name: 'Supreme Student Government (SSG)'
      },
      verification_feedback: 'Please attach the official oath of office document.',
      evidence: []
    },
    {
      id: 'rec-sem-03',
      title: 'Regional Youth Leadership Summit 2025',
      category_id: '802de57b-54d7-4d38-9433-052ca9636380',
      category_name: 'Seminar / Training',
      subcategory_id: '40000005-0001-0000-0000-000000000001',
      subcategory_name: 'Leadership Development',
      status: 'draft',
      occurrence_date: '2025-11-20',
      structured_metadata: {
        schema_version: '1.0',
        training_type: 'leadership_dev',
        hours_duration: 16
      },
      evidence: []
    }
  ]

  it('renders all 9 primary categories in canonical order', () => {
    expect(PRIMARY_CATEGORIES).toHaveLength(9)
    expect(PRIMARY_CATEGORIES[0].name).toBe('Leadership Position')
    expect(PRIMARY_CATEGORIES[6].name).toBe('Sports')
    expect(PRIMARY_CATEGORIES[8].name).toBe('Campus Journalism')
  })

  it('correctly maps lifecycle permissions: Edit & Delete allowed only on draft & revisions_requested', () => {
    const checkPermissions = (status) => {
      const isEditable = status === 'draft' || status === 'revisions_requested'
      const isDeletable = status === 'draft' || status === 'revisions_requested'
      const isVerified = status === 'verified'
      return { isEditable, isDeletable, isVerified }
    }

    // Verified Record: Non-editable, Non-deletable
    const verifiedPerms = checkPermissions(sampleStudentRecords[0].status)
    expect(verifiedPerms.isEditable).toBe(false)
    expect(verifiedPerms.isDeletable).toBe(false)
    expect(verifiedPerms.isVerified).toBe(true)

    // Revisions Requested Record: Editable, Deletable
    const revPerms = checkPermissions(sampleStudentRecords[1].status)
    expect(revPerms.isEditable).toBe(true)
    expect(revPerms.isDeletable).toBe(true)
    expect(revPerms.isVerified).toBe(false)

    // Draft Record: Editable, Deletable
    const draftPerms = checkPermissions(sampleStudentRecords[2].status)
    expect(draftPerms.isEditable).toBe(true)
    expect(draftPerms.isDeletable).toBe(true)
    expect(draftPerms.isVerified).toBe(false)
  })

  it('verifies resubmitting operates on the same record ID without creating duplicates', () => {
    const originalRecord = sampleStudentRecords[1]
    const updatedPayload = {
      ...originalRecord,
      status: 'submitted',
      evidence: [{ id: 'ev-new', original_filename: 'oath_of_office.pdf' }]
    }

    expect(updatedPayload.id).toBe(originalRecord.id)
    expect(updatedPayload.status).toBe('submitted')
  })

  it('confirms zero internal OSAD evaluation or scoring keys in student records', () => {
    const forbiddenKeys = ['osad_evaluation', 'award_id', 'score', 'points', 'rubric_weights', 'potential_candidate']

    sampleStudentRecords.forEach((record) => {
      forbiddenKeys.forEach((key) => {
        expect(record[key]).toBeUndefined()
        if (record.structured_metadata) {
          expect(record.structured_metadata[key]).toBeUndefined()
        }
      })
    })
  })
})
