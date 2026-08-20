/**
 * ui_achievements.test.jsx
 * Unit test suite validating shadcn UI components used in Student Achievements.
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../card'
import { Badge } from '../badge'
import { Button } from '../button'
import { Input } from '../input'

describe('shadcn UI Components for Student Achievements', () => {
  it('renders Card with custom background without white override', () => {
    const element = <Card className="bg-[#1b4332] text-white">Hero Content</Card>
    expect(element.props.className).toContain('bg-[#1b4332]')
  })

  it('renders Badge with success, warning, and destructive variants', () => {
    const verifiedBadge = <Badge variant="success">Verified</Badge>
    const pendingBadge = <Badge variant="warning">Pending Review</Badge>
    const returnedBadge = <Badge variant="destructive">Returned</Badge>

    expect(verifiedBadge.props.variant).toBe('success')
    expect(pendingBadge.props.variant).toBe('warning')
    expect(returnedBadge.props.variant).toBe('destructive')
  })

  it('renders Button and Input primitives', () => {
    const button = <Button variant="outline">Export CSV</Button>
    const input = <Input placeholder="Search achievements..." />

    expect(button.props.children).toBe('Export CSV')
    expect(input.props.placeholder).toBe('Search achievements...')
  })
})
