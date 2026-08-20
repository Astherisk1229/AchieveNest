/**
 * avatar.test.jsx
 * Unit test suite for Avatar component system.
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount } from '../avatar'

describe('Avatar Component System', () => {
  it('instantiates Avatar element with size prop', () => {
    const element = <Avatar size="lg"><AvatarFallback>MS</AvatarFallback></Avatar>
    expect(element.props.size).toBe('lg')
    expect(element.type).toBe(Avatar)
  })

  it('instantiates AvatarImage element with src and alt props', () => {
    const element = <AvatarImage src="https://example.com/avatar.jpg" alt="Student Avatar" />
    expect(element.props.src).toBe('https://example.com/avatar.jpg')
    expect(element.props.alt).toBe('Student Avatar')
  })

  it('instantiates AvatarFallback element', () => {
    const element = <AvatarFallback>MS</AvatarFallback>
    expect(element.props.children).toBe('MS')
  })

  it('instantiates AvatarBadge element', () => {
    const element = <AvatarBadge className="bg-emerald-600">✓</AvatarBadge>
    expect(element.props.children).toBe('✓')
    expect(element.props.className).toContain('bg-emerald-600')
  })

  it('instantiates AvatarGroup and AvatarGroupCount elements', () => {
    const groupElement = (
      <AvatarGroup>
        <Avatar size="sm"><AvatarFallback>A1</AvatarFallback></Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>
    )

    expect(groupElement.type).toBe(AvatarGroup)
  })
})
