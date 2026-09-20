import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export function filterSearchableOptions(options, query, getOptionLabel) {
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase()
  if (!normalizedQuery) return options
  return options.filter(option => getOptionLabel(option).toLocaleLowerCase().includes(normalizedQuery))
}

const SearchableSelect = forwardRef(function SearchableSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Search or select an option',
  searchPlaceholder = 'Search options',
  getOptionLabel,
  getOptionValue,
  emptyMessage = 'No matching options',
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid = false,
  className = ''
}, forwardedRef) {
  const generatedId = useId()
  const inputId = id || generatedId
  const listboxId = `${inputId}-listbox`
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useImperativeHandle(forwardedRef, () => ({
    focus: () => inputRef.current?.focus()
  }))

  const selectedOption = useMemo(
    () => options.find(option => String(getOptionValue(option)) === String(value)) || null,
    [getOptionValue, options, value]
  )
  const visibleOptions = useMemo(
    () => filterSearchableOptions(options, query, getOptionLabel),
    [getOptionLabel, options, query]
  )

  useEffect(() => {
    if (activeIndex >= visibleOptions.length) setActiveIndex(Math.max(visibleOptions.length - 1, 0))
  }, [activeIndex, visibleOptions.length])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const selectOption = (option) => {
    onChange(getOptionValue(option))
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    if (disabled) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex(index => isOpen ? Math.min(index + 1, Math.max(visibleOptions.length - 1, 0)) : 0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && isOpen && visibleOptions[activeIndex]) {
      event.preventDefault()
      selectOption(visibleOptions[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  const displayValue = isOpen ? query : selectedOption ? getOptionLabel(selectedOption) : ''

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={isOpen && visibleOptions[activeIndex] ? `${inputId}-option-${activeIndex}` : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          autoComplete="off"
          disabled={disabled}
          value={displayValue}
          placeholder={disabled ? placeholder : selectedOption ? '' : placeholder}
          onFocus={() => {
            if (!disabled) {
              setQuery('')
              setActiveIndex(0)
              setIsOpen(true)
            }
          }}
          onClick={() => !disabled && setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm font-medium text-slate-900 outline-none transition duration-150 placeholder:text-slate-500 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
        />
        <button
          type="button"
          aria-label={isOpen ? 'Close options' : 'Open options'}
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus()
              setIsOpen(open => !open)
            }
          }}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:pointer-events-none dark:hover:bg-slate-800"
        >
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-500 dark:border-slate-800">
            {searchPlaceholder}
          </div>
          <ul id={listboxId} role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">{emptyMessage}</li>
            ) : visibleOptions.map((option, index) => {
              const optionValue = getOptionValue(option)
              const isSelected = String(optionValue) === String(value)
              const isActive = index === activeIndex
              return (
                <li
                  id={`${inputId}-option-${index}`}
                  key={optionValue}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                >
                  <span className="min-w-0 leading-snug">{getOptionLabel(option)}</span>
                  {isSelected && <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
})

export default SearchableSelect
