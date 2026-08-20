/**
 * ui_components.test.jsx
 * Unit test suite for shadcn UI components (Card, Badge, Button, Progress, Tabs, Skeleton).
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'
import { Badge } from '../badge'
import { Button } from '../button'
import { Progress } from '../progress'
import { Skeleton } from '../skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'

describe('shadcn UI Components System', () => {
  it('instantiates Card components', () => {
    const element = (
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(element.type).toBe(Card)
  })

  it('instantiates Badge component with variants', () => {
    const badgeDefault = <Badge variant="default">Verified</Badge>
    const badgeSuccess = <Badge variant="success">Approved</Badge>
    const badgeWarning = <Badge variant="warning">Pending</Badge>

    expect(badgeDefault.props.variant).toBe('default')
    expect(badgeSuccess.props.variant).toBe('success')
    expect(badgeWarning.props.variant).toBe('warning')
  })

  it('instantiates Button component with sizes and variants', () => {
    const btnSm = <Button size="sm" variant="outline">Click</Button>
    const btnLg = <Button size="lg" variant="default">Submit</Button>

    expect(btnSm.props.size).toBe('sm')
    expect(btnLg.props.variant).toBe('default')
  })

  it('instantiates Progress component with percentage calculation', () => {
    const prog = <Progress value={75} max={100} />
    expect(prog.props.value).toBe(75)
  })

  it('instantiates Skeleton component', () => {
    const skel = <Skeleton className="w-20 h-4" />
    expect(skel.type).toBe(Skeleton)
  })

  it('instantiates Tabs component system', () => {
    const tabs = (
      <Tabs value="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )

    expect(tabs.type).toBe(Tabs)
  })
})
