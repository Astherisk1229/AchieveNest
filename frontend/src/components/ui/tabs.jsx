/**
 * tabs.jsx
 * shadcn-style Tabs Component System.
 */

import React, { createContext, useContext } from 'react'

const TabsContext = createContext({
  activeTab: '',
  onTabChange: () => {}
})

export function Tabs({ value, onValueChange, className = '', children, ...props }) {
  return (
    <TabsContext.Provider value={{ activeTab: value, onTabChange: onValueChange }}>
      <div className={`space-y-4 ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className = '', children, ...props }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 text-slate-500 border border-slate-200/80 dark:border-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className = '', children, ...props }) {
  const { activeTab, onTabChange } = useContext(TabsContext)
  const isSelected = activeTab === value

  return (
    <button
      type="button"
      onClick={() => onTabChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-150 cursor-pointer ${
        isSelected
          ? 'bg-white dark:bg-[#131e2e] text-[#064e2b] dark:text-emerald-400 shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className = '', children, ...props }) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null

  return (
    <div className={`focus-visible:outline-none animate-in fade-in duration-200 ${className}`} {...props}>
      {children}
    </div>
  )
}
