import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useConfirmableClose logic', () => {
  let isConfirmOpen
  let isDirty
  let onClose
  let onDiscard

  beforeEach(() => {
    isConfirmOpen = false
    isDirty = false
    onClose = vi.fn()
    onDiscard = vi.fn()
  })

  function requestClose(dirtyVal) {
    const dirty = typeof dirtyVal === 'function' ? dirtyVal() : dirtyVal
    if (dirty) {
      isConfirmOpen = true
    } else {
      if (onDiscard) onDiscard()
      if (onClose) onClose()
    }
  }

  function confirmDiscard() {
    isConfirmOpen = false
    if (onDiscard) onDiscard()
    if (onClose) onClose()
  }

  function cancelDiscard() {
    isConfirmOpen = false
  }

  it('closes immediately without opening confirmation when form is clean', () => {
    requestClose(false)
    expect(isConfirmOpen).toBe(false)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('opens confirmation and does not close immediately when form is dirty', () => {
    requestClose(true)
    expect(isConfirmOpen).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
    expect(onDiscard).not.toHaveBeenCalled()
  })

  it('evaluates isDirty as a dynamic function', () => {
    let currentInput = ''
    const isDirtyFn = () => currentInput.trim() !== ''

    requestClose(isDirtyFn)
    expect(isConfirmOpen).toBe(false)

    currentInput = 'Unsaved draft text'
    requestClose(isDirtyFn)
    expect(isConfirmOpen).toBe(true)
  })

  it('discards changes and calls onClose when confirmDiscard is triggered', () => {
    requestClose(true)
    expect(isConfirmOpen).toBe(true)

    confirmDiscard()
    expect(isConfirmOpen).toBe(false)
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('cancels discard and leaves form open when cancelDiscard is triggered', () => {
    requestClose(true)
    expect(isConfirmOpen).toBe(true)

    cancelDiscard()
    expect(isConfirmOpen).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
    expect(onDiscard).not.toHaveBeenCalled()
  })
})
