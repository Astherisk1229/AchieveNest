import React, { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, UserCheck, X } from 'lucide-react'

export default function SearchablePersonnelDropdown({
  selectedId,
  onSelect,
  personnelList = [],
  placeholder = 'Unassigned (Assign Later)',
  label = 'Assign Personnel',
  accentColor = 'purple' // 'purple' | 'emerald'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  const selectedPerson = personnelList.find(p => p.id === selectedId)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cleanQuery = searchQuery.toLowerCase().trim().replace(/-/g, '')

  const filteredPersonnel = personnelList.filter(p => {
    if (!cleanQuery) return true
    const cleanEmpId = (p.employee_id || '').toLowerCase().replace(/-/g, '')
    return (
      p.full_name.toLowerCase().includes(cleanQuery) ||
      cleanEmpId.includes(cleanQuery) ||
      (p.department && p.department.toLowerCase().includes(cleanQuery)) ||
      (p.email && p.email.toLowerCase().includes(cleanQuery))
    )
  })

  const borderFocusClass = accentColor === 'emerald'
    ? 'focus:border-[#16834a] border-emerald-500/40'
    : 'focus:border-purple-600 border-purple-500/40'

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      
      {/* Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${
          isOpen ? borderFocusClass : 'border-slate-200 dark:border-slate-700'
        } font-bold text-xs text-slate-800 dark:text-white transition cursor-pointer flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-600`}
      >
        {selectedPerson ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-slate-900 dark:text-white font-extrabold truncate">{selectedPerson.full_name}</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-extrabold shrink-0">
              {(selectedPerson.employee_id || 'EMP7491').replace(/-/g, '')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
              • {selectedPerson.department}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-medium">{placeholder}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedPerson && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(null)
              }}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              placeholder="Search faculty by name or ID (e.g. EMP7491)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* List Options */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {/* Unassign Option */}
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                !selectedId
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{placeholder}</span>
              {!selectedId && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            {filteredPersonnel.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No personnel found matching "{searchQuery}".
              </div>
            ) : (
              filteredPersonnel.map(person => {
                const isSelected = selectedId === person.id
                const cleanEmpId = (person.employee_id || 'EMP7491').replace(/-/g, '')
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onSelect(person)
                      setIsOpen(false)
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-[#16834a] dark:text-[#245F42] border border-emerald-200/60 dark:border-emerald-800/60'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold">{person.full_name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-extrabold">
                          {cleanEmpId}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {person.academic_rank || 'Faculty'} • {person.department}
                      </p>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-[#16834a] dark:text-emerald-400 shrink-0 ml-2" />}
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
