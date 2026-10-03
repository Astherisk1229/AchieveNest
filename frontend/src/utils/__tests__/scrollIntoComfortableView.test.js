import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollIntoComfortableView } from '../scrollIntoComfortableView'

function createElement(rect) {
  return {
    getBoundingClientRect: vi.fn(() => rect),
    scrollIntoView: vi.fn()
  }
}

const container = {
  getBoundingClientRect: () => ({ top: 72, bottom: 800 })
}

describe('scrollIntoComfortableView', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      innerHeight: 900,
      matchMedia: vi.fn(() => ({ matches: false }))
    })
  })

  it('does not move an Award header that is already comfortably visible', () => {
    const element = createElement({ top: 120, bottom: 220 })

    expect(scrollIntoComfortableView(element, { scrollContainer: container })).toBe(false)
    expect(element.scrollIntoView).not.toHaveBeenCalled()
  })

  it('smoothly brings a partially hidden Award header to the start', () => {
    const element = createElement({ top: 740, bottom: 830 })

    expect(scrollIntoComfortableView(element, { scrollContainer: container })).toBe(true)
    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })
  })

  it('moves an Award header out from under the workspace top edge', () => {
    const element = createElement({ top: 76, bottom: 176 })

    scrollIntoComfortableView(element, { scrollContainer: container })
    expect(element.scrollIntoView).toHaveBeenCalledOnce()
  })

  it('respects reduced-motion preferences', () => {
    window.matchMedia.mockReturnValue({ matches: true })
    const element = createElement({ top: 760, bottom: 840 })

    scrollIntoComfortableView(element, { scrollContainer: container })
    expect(element.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
  })
})
