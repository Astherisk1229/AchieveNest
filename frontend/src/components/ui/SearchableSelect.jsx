import React, { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export const SearchableSelect = forwardRef(function SearchableSelect({
  id,
  value,
  options,
  onChange,
  disabled = false,
  invalid = false,
  describedBy,
  placeholder = 'Search or select an option',
  searchPlaceholder = 'Search options',
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  emptyMessage = 'No matching options',
  onBlur
}, forwardedRef) {
  const generatedId = useId()
  const inputId = id || generatedId
  const listboxId = `${inputId}-listbox`
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = options.find((option) => getOptionValue(option) === value)
  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return needle
      ? options.filter((option) => getOptionLabel(option).toLocaleLowerCase().includes(needle))
      : options
  }, [getOptionLabel, options, query])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => setActiveIndex(0), [query, options])

  const choose = (option) => {
    onChange(getOptionValue(option))
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
      setQuery('')
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => Math.max(0, Math.min(visibleOptions.length - 1, current + direction)))
      return
    }
    if (event.key === 'Enter' && open && visibleOptions[activeIndex]) {
      event.preventDefault()
      choose(visibleOptions[activeIndex])
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          ref={forwardedRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && visibleOptions[activeIndex] ? `${inputId}-option-${getOptionValue(visibleOptions[activeIndex])}` : undefined}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
          value={open ? query : (selected ? getOptionLabel(selected) : '')}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={onBlur}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className={`min-h-11 w-full rounded-xl border bg-white py-2.5 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none transition duration-150 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 ${invalid ? 'border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950' : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:hover:border-slate-600 dark:focus:border-emerald-500 dark:focus:ring-emerald-950'}`}
        />
        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {searchPlaceholder}
          </div>
          <ul id={listboxId} role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</li>
            ) : visibleOptions.map((option, index) => {
              const optionValue = getOptionValue(option)
              const isSelected = optionValue === value
              const isActive = index === activeIndex
              return (
                <li
                  id={`${inputId}-option-${optionValue}`}
                  key={optionValue}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900'}`}
                >
                  <span className="min-w-0 leading-5">{getOptionLabel(option)}</span>
                  {isSelected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
})
