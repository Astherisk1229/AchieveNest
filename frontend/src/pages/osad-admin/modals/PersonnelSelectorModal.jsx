import React, { useState } from 'react'
import { formatPersonnelPlacement } from '../../../utils/personnelPlacement'
import { Search, UserCheck, Check, X } from 'lucide-react'

export default function PersonnelSelectorModal({
  isOpen,
  onClose,
  title = 'Select Eligible Personnel',
  targetName = '',
  personnelList = [],
  onSelectPersonnel,
  roleType = 'coordinator' // 'coordinator' | 'moderator'
}) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const cleanQuery = searchQuery.toLowerCase().trim().replace(/-/g, '')

  const filteredList = personnelList.filter(p => {
    if (!searchQuery.trim()) return true
    const cleanEmpId = (p.employee_id || '').toLowerCase().replace(/-/g, '')
    return (
      p.full_name.toLowerCase().includes(cleanQuery) ||
      cleanEmpId.includes(cleanQuery) ||
      (p.college && p.college.toLowerCase().includes(cleanQuery)) ||
      (p.college_code && p.college_code.toLowerCase().includes(cleanQuery)) ||
      (p.administrative_unit && p.administrative_unit.toLowerCase().includes(cleanQuery)) ||
      (p.email && p.email.toLowerCase().includes(cleanQuery))
    )
  })

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Assigning to: <span className="text-emerald-400 font-extrabold">{targetName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search eligible personnel by name, Employee ID, or institutional affiliation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#16834a] placeholder:text-slate-400"
            />
          </div>

          {/* Searchable Personnel List */}
          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {filteredList.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-medium">
                No eligible personnel found matching "{searchQuery}".
              </div>
            ) : (
              filteredList.map(person => {
                const cleanEmpId = (person.employee_id || 'EMP7491').replace(/-/g, '')
                const isCurrentlyAssigned = 
                  roleType === 'coordinator' ? person.coordinator_program === targetName :
                  person.moderator_org === targetName

                return (
                  <div
                    key={person.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#16834a] transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{person.full_name}</h4>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                          {cleanEmpId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {person.academic_rank || 'Personnel'} • {formatPersonnelPlacement(person)}
                      </p>
                      
                      {/* Current Assigned Roles Badges */}
                      {person.assigned_roles && person.assigned_roles.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {person.assigned_roles.map(r => (
                            <span key={r} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-[#245F42] text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/60">
                              {r === 'college_dean' ? `College Dean (${person.dean_college})` :
                               r === 'program_coordinator' ? `Program Coordinator (${person.coordinator_program})` :
                               r === 'organization_moderator' ? `Organization Moderator (${person.moderator_org})` : r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isCurrentlyAssigned}
                      onClick={() => {
                        onSelectPersonnel(person)
                        onClose()
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1.5 ${
                        isCurrentlyAssigned
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-[#EFF7F0] hover:bg-[#143326] text-white'
                      }`}
                    >
                      {isCurrentlyAssigned ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Assigned</span>
                        </>
                      ) : (
                        <span>Select Personnel</span>
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
