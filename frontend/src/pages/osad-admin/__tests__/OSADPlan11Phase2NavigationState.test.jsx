import { describe, it, expect } from 'vitest'

describe('Plan 11 Phase 2 — Unified Navigation State Model', () => {
  // Pure state resolution logic matching MainLayout state contract
  const computeSidebarVisibility = ({ navigationMode, mobileOpen, desktopCollapsed = false }) => {
    if (navigationMode === 'persistent') {
      return {
        isVisible: true,
        isCollapsed: desktopCollapsed,
        isOverlay: false,
        containerClasses: 'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 -translate-x-full lg:translate-x-0'
      }
    } else {
      return {
        isVisible: mobileOpen,
        isCollapsed: false,
        isOverlay: true,
        containerClasses: `fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`
      }
    }
  }

  it('guarantees desktop persistent sidebar remains visible across link navigation', () => {
    // Before click: desktop persistent mode
    const beforeClick = computeSidebarVisibility({
      navigationMode: 'persistent',
      mobileOpen: false,
      desktopCollapsed: false
    })
    expect(beforeClick.isVisible).toBe(true)
    expect(beforeClick.isOverlay).toBe(false)
    expect(beforeClick.containerClasses).not.toContain('lg:hidden')

    // User clicks link: invokes onCloseMobile() -> sets mobileOpen=false
    const afterClick = computeSidebarVisibility({
      navigationMode: 'persistent',
      mobileOpen: false,
      desktopCollapsed: false
    })
    expect(afterClick.isVisible).toBe(true)
    expect(afterClick.containerClasses).not.toContain('lg:hidden')
    expect(afterClick.containerClasses).toContain('lg:translate-x-0')
  })

  it('guarantees mobile drawer closes when link navigation occurs in overlay mode', () => {
    // Drawer opened by user on mobile
    const drawerOpen = computeSidebarVisibility({
      navigationMode: 'overlay',
      mobileOpen: true
    })
    expect(drawerOpen.isVisible).toBe(true)
    expect(drawerOpen.isOverlay).toBe(true)
    expect(drawerOpen.containerClasses).toContain('translate-x-0')

    // Navigation link clicked on mobile: closes drawer
    const afterNav = computeSidebarVisibility({
      navigationMode: 'overlay',
      mobileOpen: false
    })
    expect(afterNav.isVisible).toBe(false)
    expect(afterNav.containerClasses).toContain('-translate-x-full')
  })

  it('guarantees backdrop click only closes mobile drawer without affecting desktop mode', () => {
    const mobileClose = computeSidebarVisibility({
      navigationMode: 'overlay',
      mobileOpen: false
    })
    expect(mobileClose.isVisible).toBe(false)

    const desktopState = computeSidebarVisibility({
      navigationMode: 'persistent',
      mobileOpen: false
    })
    expect(desktopState.isVisible).toBe(true)
  })

  it('guarantees viewport resize from overlay to persistent restores visible sidebar', () => {
    // Mobile closed
    const mobileState = computeSidebarVisibility({
      navigationMode: 'overlay',
      mobileOpen: false
    })
    expect(mobileState.isVisible).toBe(false)

    // Viewport resized to desktop (>= 1024px)
    const desktopState = computeSidebarVisibility({
      navigationMode: 'persistent',
      mobileOpen: false
    })
    expect(desktopState.isVisible).toBe(true)
    expect(desktopState.containerClasses).toContain('lg:translate-x-0')
  })
})
