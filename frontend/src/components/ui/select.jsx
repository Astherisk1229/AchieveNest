/**
 * select.jsx
 * Custom shadcn-style Select Component System.
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function Select({ value, onChange, children, placeholder = 'Select an option', className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Collect option children details
  const options = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.props) {
      options.push({
        value: child.props.value,
        label: child.props.children,
        disabled: child.props.disabled
      })
    }
  })

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange(optionValue)
    }
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left w-full sm:w-auto ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-150 cursor-pointer"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 min-w-[180px] w-full z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-lg py-1 animate-in fade-in-80 zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 scrollbar-none">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#064e2b] dark:text-emerald-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>
}
