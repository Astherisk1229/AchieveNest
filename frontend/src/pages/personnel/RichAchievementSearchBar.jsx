import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Award, Folder, Building2, History, ChevronRight } from 'lucide-react'

/**
 * RichAchievementSearchBar.jsx
 * Search bar featuring inline gray ghost text autocompletion and a categorized suggestions dropdown.
 */
export default function RichAchievementSearchBar({
  searchTerm,
  onSearchChange,
  suggestions = {},
  onSelectSuggestion
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const recentSearches = ['Scopus', 'IEEE', 'Seminars', 'CHED Region XII', 'Verified']

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Top inline ghost text match
  const topMatch = suggestions.topMatch || ''
  const showGhostText = searchTerm && topMatch && topMatch.toLowerCase().startsWith(searchTerm.toLowerCase()) && topMatch !== searchTerm
  const ghostSuffix = showGhostText ? topMatch.slice(searchTerm.length) : ''

  // Flattened list for keyboard arrow navigation
  const flatItems = []
  if (suggestions.titles) {
    suggestions.titles.forEach(t => flatItems.push({ type: 'title', value: t.title }))
  }
  if (suggestions.categories) {
    suggestions.categories.forEach(c => flatItems.push({ type: 'category', value: c }))
  }
  if (suggestions.venues) {
    suggestions.venues.forEach(v => flatItems.push({ type: 'venue', value: v }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' || (e.key === 'ArrowRight' && showGhostText)) {
      if (showGhostText) {
        e.preventDefault()
        onSearchChange(topMatch)
        setIsOpen(false)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
      setSelectedIndex(prev => (prev + 1) % Math.max(flatItems.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && flatItems[selectedIndex]) {
        e.preventDefault()
        onSearchChange(flatItems[selectedIndex].value)
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (val) => {
    onSearchChange(val)
    if (onSelectSuggestion) onSelectSuggestion(val)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[220px] sm:min-w-[320px]">
      
      {/* Search Input Box with Ghost Text Overlay */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none z-10" />

        {/* Input Layer */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search achievements by title, category, or journal..."
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 focus:border-[#2d8a4e] focus:ring-2 focus:ring-[#2d8a4e]/20 text-xs text-slate-800 bg-white outline-none transition shadow-2xs relative z-0 font-medium"
        />

        {/* Inline Gray Ghost Text Completion Layer */}
        {showGhostText && (
          <div className="absolute left-9 top-2.5 text-xs text-slate-300 pointer-events-none font-medium z-0 flex items-center">
            <span className="opacity-0">{searchTerm}</span>
            <span className="text-slate-400/80 font-mono">{ghostSuffix}</span>
            <span className="ml-2 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">
              Tab ↹
            </span>
          </div>
        )}

        {/* Clear Search Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rich Interactive Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-3 px-2 z-50 font-sans animate-in fade-in duration-150 space-y-3">
          
          {/* Empty Search Focus: Show Recent Search History Tags */}
          {!searchTerm && (
            <div className="px-2 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <History className="w-3.5 h-3.5 text-[#2d8a4e]" />
                <span>Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentSearches.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelect(tag)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#eef7f0] hover:text-[#2d8a4e] text-xs font-semibold text-slate-600 transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Query Active: Grouped Suggestions */}
          {searchTerm && (
            <div className="space-y-3 text-xs max-h-72 overflow-y-auto">
              
              {/* Group 1: Matching Achievement Titles */}
              {suggestions.titles && suggestions.titles.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-[#2d8a4e]" />
                    <span>Matching Titles</span>
                  </div>
                  {suggestions.titles.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.title)}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#eef7f0] flex items-center justify-between group transition cursor-pointer"
                    >
                      <div className="truncate">
                        <p className="font-bold text-slate-800 group-hover:text-[#2d8a4e] truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{item.category} • {item.location}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#2d8a4e] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Group 2: NDMU Rating Categories */}
              {suggestions.categories && suggestions.categories.length > 0 && (
                <div className="space-y-1 border-t border-slate-100 pt-2">
                  <div className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Folder className="w-3 h-3 text-emerald-600" />
                    <span>NDMU Categories</span>
                  </div>
                  {suggestions.categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelect(cat)}
                      className="w-full px-3 py-1.5 rounded-xl text-left hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer flex items-center justify-between"
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Category</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Group 3: Issuing Bodies & Venues */}
              {suggestions.venues && suggestions.venues.length > 0 && (
                <div className="space-y-1 border-t border-slate-100 pt-2">
                  <div className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-amber-600" />
                    <span>Issuing Authorities & Venues</span>
                  </div>
                  {suggestions.venues.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelect(v)}
                      className="w-full px-3 py-1.5 rounded-xl text-left hover:bg-slate-50 font-semibold text-slate-700 transition cursor-pointer flex items-center justify-between"
                    >
                      <span>{v}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Publisher</span>
                    </button>
                  ))}
                </div>
              )}

              {/* No suggestions fallback */}
              {(!suggestions.titles || suggestions.titles.length === 0) &&
               (!suggestions.categories || suggestions.categories.length === 0) &&
               (!suggestions.venues || suggestions.venues.length === 0) && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No matching achievements found for "{searchTerm}"
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  )
}
