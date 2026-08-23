/**
 * select.jsx
 * Reusable accessible shadcn-style Select Component System.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function Select({
  value,
  onChange,
  onValueChange,
  children,
  placeholder = 'Select an option',
  className = '',
  triggerClassName = '',
  contentClassName = '',
  disabled = false,
  id,
  name,
  align = 'left',
  'aria-label': ariaLabelProp,
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const effectiveAriaLabel = ariaLabelProp || ariaLabel || placeholder

  // Collect option children details
  const options = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.props) {
      options.push({
        value: child.props.value,
        label: child.props.children,
        disabled: Boolean(child.props.disabled)
      })
    }
  })

  const selectedOption = options.find((opt) => String(opt.value) === String(value))
  const triggerText = selectedOption ? selectedOption.label : placeholder

  const handleSelect = useCallback((optionValue) => {
    if (onValueChange) {
      onValueChange(optionValue)
    } else if (onChange) {
      onChange(optionValue)
    }
    setIsOpen(false)
    triggerRef.current?.focus()
  }, [onValueChange, onChange])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
        const selectedIdx = options.findIndex((opt) => String(opt.value) === String(value))
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'Tab') {
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        let next = prev + 1
        while (next < options.length && options[next].disabled) {
          next++
        }
        return next < options.length ? next : prev
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => {
        let next = prev - 1
        while (next >= 0 && options[next].disabled) {
          next--
        }
        return next >= 0 ? next : prev
      })
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        const targetOpt = options[highlightedIndex]
        if (!targetOpt.disabled) {
          handleSelect(targetOpt.value)
        }
      }
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-select-item]')
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen, highlightedIndex])

  const alignClass = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={effectiveAriaLabel}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            if (!isOpen) {
              const selectedIdx = options.findIndex((opt) => String(opt.value) === String(value))
              setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0)
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition-all duration-150 cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${triggerClassName}`}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#176B43] dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={effectiveAriaLabel}
          className={`absolute ${alignClass} mt-1.5 min-w-[200px] w-full z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl py-1 animate-in fade-in-80 zoom-in-95 ${contentClassName}`}
        >
          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">No options available</div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value)
                const isHighlighted = idx === highlightedIndex

                return (
                  <button
                    key={String(opt.value)}
                    data-select-item
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg transition cursor-pointer text-left ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#176B43] dark:text-emerald-300 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#176B43] dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function SelectItem({ value, children, disabled = false }) {
  return <option value={value} disabled={disabled}>{children}</option>
}
