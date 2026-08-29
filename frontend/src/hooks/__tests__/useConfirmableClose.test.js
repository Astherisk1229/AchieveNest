import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfirmableClose } from '../useConfirmableClose'

describe('useConfirmableClose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('closes immediately without opening confirmation when form is clean', () => {
    const onClose = vi.fn()
    const onDiscard = vi.fn()

    const { result } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: false,
        onClose,
        onDiscard
      })
    )

    act(() => {
      result.current.requestClose()
    })

    expect(result.current.isConfirmOpen).toBe(false)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('opens confirmation and does not close immediately when form is dirty', () => {
    const onClose = vi.fn()
    const onDiscard = vi.fn()

    const { result } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: true,
        onClose,
        onDiscard
      })
    )

    act(() => {
      result.current.requestClose()
    })

    expect(result.current.isConfirmOpen).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    expect(onDiscard).not.toHaveBeenCalled()
  })

  it('evaluates isDirty as a dynamic function', () => {
    const onClose = vi.fn()
    let currentInput = ''

    const { result, rerender } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: () => currentInput.trim().length > 0,
        onClose
      })
    )

    // Initially clean
    act(() => {
      result.current.requestClose()
    })
    expect(result.current.isConfirmOpen).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)

    // Form becomes dirty
    currentInput = 'New Org Name'
    rerender()

    act(() => {
      result.current.requestClose()
    })
    expect(result.current.isConfirmOpen).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1) // not called again
  })

  it('discards changes and closes when confirmDiscard is invoked', () => {
    const onClose = vi.fn()
    const onDiscard = vi.fn()

    const { result } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: true,
        onClose,
        onDiscard
      })
    )

    act(() => {
      result.current.requestClose()
    })
    expect(result.current.isConfirmOpen).toBe(true)

    act(() => {
      result.current.confirmDiscard()
    })

    expect(result.current.isConfirmOpen).toBe(false)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cancels discard and keeps modal open when cancelDiscard is invoked', () => {
    const onClose = vi.fn()
    const onDiscard = vi.fn()

    const { result } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: true,
        onClose,
        onDiscard
      })
    )

    act(() => {
      result.current.requestClose()
    })
    expect(result.current.isConfirmOpen).toBe(true)

    act(() => {
      result.current.cancelDiscard()
    })

    expect(result.current.isConfirmOpen).toBe(false)
    expect(onDiscard).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('handles Escape key to request close when open', () => {
    const onClose = vi.fn()

    const { result } = renderHook(() =>
      useConfirmableClose({
        isOpen: true,
        isDirty: true,
        onClose
      })
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isConfirmOpen).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })
})
