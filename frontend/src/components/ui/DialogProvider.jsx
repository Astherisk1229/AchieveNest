/**
 * DialogProvider.jsx
 * App-wide replacement for the browser's native window.confirm / window.alert.
 *
 * Mount <DialogProvider> once near the root, then call from any handler:
 *   if (!(await confirmDialog({ title: 'Discard changes?', message: '…' }))) return
 *   await alertDialog({ title: 'File not found', message: '…', tone: 'destructive' })
 *   const reason = await promptDialog({ title: 'Reason', inputLabel: 'Why?', required: true }) // null = cancelled
 *
 * Dialogs are queued, so two calls in a row are shown one after the other.
 * If no provider is mounted (e.g. an isolated unit test) the helpers fall back
 * to the native browser dialogs so behaviour never silently changes.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

let enqueue = null
let sequence = 0

const normalize = (input, kind) => {
  const options = typeof input === 'string' ? { message: input } : { ...(input || {}) }
  if (kind === 'alert') {
    return {
      title: options.title || 'Notice',
      message: options.message || '',
      tone: options.tone || 'info',
      confirmLabel: options.confirmLabel || 'OK',
      hideCancel: true,
    }
  }
  return {
    title: options.title || 'Are you sure?',
    message: options.message || '',
    tone: options.tone || 'warning',
    confirmLabel: options.confirmLabel || 'Confirm',
    cancelLabel: options.cancelLabel || 'Cancel',
    hideCancel: false,
  }
}

export function confirmDialog(input) {
  const options = normalize(input, 'confirm')
  if (!enqueue) return Promise.resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(options.message || options.title) : false)
  return new Promise(resolve => enqueue({ ...options, resolve }))
}

export function alertDialog(input) {
  const options = normalize(input, 'alert')
  if (!enqueue) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') window.alert(options.message || options.title)
    return Promise.resolve()
  }
  return new Promise(resolve => enqueue({ ...options, resolve: () => resolve() }))
}

export function promptDialog(input) {
  const options = typeof input === 'string' ? { message: input } : { ...(input || {}) }
  const config = {
    ...normalize(options, 'confirm'),
    tone: options.tone || 'default',
    confirmLabel: options.confirmLabel || 'Save',
    input: { label: options.inputLabel || 'Details', placeholder: options.placeholder || '', required: Boolean(options.required), value: options.defaultValue || '' },
  }
  if (!enqueue) {
    const value = typeof window !== 'undefined' && typeof window.prompt === 'function' ? window.prompt(options.message || options.title, config.input.value) : null
    return Promise.resolve(value === null ? null : String(value))
  }
  return new Promise(resolve => enqueue({ ...config, resolve }))
}

export function DialogProvider({ children }) {
  const [queue, setQueue] = useState([])

  useEffect(() => {
    enqueue = item => setQueue(current => [...current, { ...item, id: ++sequence }])
    return () => { enqueue = null }
  }, [])

  const current = queue[0] || null
  const setInputValue = useCallback(value => {
    setQueue(([head, ...rest]) => head ? [{ ...head, input: { ...head.input, value } }, ...rest] : [])
  }, [])
  const settle = useCallback(value => {
    setQueue(([head, ...rest]) => {
      head?.resolve?.(value)
      return rest
    })
  }, [])

  return (
    <>
      {children}
      {current && (
        <ConfirmDialog
          key={current.id}
          isOpen
          title={current.title}
          message={current.message}
          tone={current.tone}
          confirmLabel={current.confirmLabel}
          cancelLabel={current.cancelLabel}
          hideCancel={current.hideCancel}
          inputLabel={current.input?.label}
          inputValue={current.input?.value}
          inputPlaceholder={current.input?.placeholder}
          inputRequired={current.input?.required}
          onInputChange={current.input ? setInputValue : undefined}
          onConfirm={() => settle(current.input ? String(current.input.value || '').trim() : true)}
          onCancel={() => settle(current.input ? null : false)}
        />
      )}
    </>
  )
}

export default DialogProvider
