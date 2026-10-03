/**
 * popover.jsx
 * Accessible lightweight shadcn-style Popover Component System.
 */

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'

const PopoverContext = createContext(null)

export function Popover({ children, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const triggerRef = useRef(null)

  const setIsOpen = useCallback((nextOpen) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    if (onOpenChange) {
      onOpenChange(nextOpen)
    }
  }, [isControlled, onOpenChange])

  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block text-left w-full">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ asChild = false, children, className = '', ...props }) {
  const { isOpen, setIsOpen, triggerRef } = useContext(PopoverContext)

  const handleClick = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e) => {
        children.props.onClick?.(e)
        handleClick(e)
      },
      'aria-expanded': isOpen,
      'aria-haspopup': 'dialog'
    })
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export function PopoverContent({
  children,
  className = '',
  align = 'start',
  sideOffset = 6,
  usePortal = true,
  ...props
}) {
  const { isOpen, setIsOpen, triggerRef } = useContext(PopoverContext)
  const contentRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY || window.pageYOffset
      const scrollX = window.scrollX || window.pageXOffset

      let top = rect.bottom + scrollY + sideOffset
      let left = rect.left + scrollX

      if (align === 'end') {
        const contentWidth = contentRef.current ? contentRef.current.offsetWidth : 280
        left = rect.right + scrollX - contentWidth
      } else if (align === 'center') {
        const contentWidth = contentRef.current ? contentRef.current.offsetWidth : 280
        left = rect.left + scrollX + (rect.width - contentWidth) / 2
      }

      // Viewport bounds checking
      if (left < 10) left = 10
      if (left + 300 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 310)
      }

      setPosition({ top, left })
    }
  }, [align, sideOffset, triggerRef])

  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleClickOutside = (e) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handleScrollOrResize = () => {
      updatePosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, setIsOpen, triggerRef, updatePosition])

  if (!isOpen) return null

  const contentElement = (
    <div
      ref={contentRef}
      role="dialog"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999
      }}
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 animate-in fade-in-80 zoom-in-95 duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  )

  if (usePortal && typeof document !== 'undefined') {
    return createPortal(contentElement, document.body)
  }

  return contentElement
}
