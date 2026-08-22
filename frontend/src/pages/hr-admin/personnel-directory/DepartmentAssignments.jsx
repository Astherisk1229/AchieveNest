import React, { useState, useMemo } from 'react'
import { Search, Building2, UserCheck, UserPlus, Check, X, ShieldAlert, Info } from 'lucide-react'

export default function DepartmentAssignments({
  personnelList = [],
  onAssignSecretary
}) {
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [selectedDept, setSelectedDept] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Selected new secretary inside modal
  const [selectedSecretaryId, setSelectedSecretaryId] = useState('')
  const [secretarySearch, setSecretarySearch] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('2026-08-15')
  const [step, setStep] = useState('select') // 'select' | 'confirm'

  // Pre-configured list of departments
  const departmentCatalog = [
    { id: 'dept-1', name: 'Department of Computer Studies', college: 'CEAC', currentSecretary: { name: 'Dr. Maria Santos', email: 'faculty@ndmu.edu.ph', employee_id: 'EMP-2021-0842' } },
    { id: 'dept-2', name: 'Department of Engineering', college: 'CEAC', currentSecretary: null },
    { id: 'dept-3', name: 'Department of Physical Sciences', college: 'CEAC', currentSecretary: null },
    { id: 'dept-4', name: 'Department of Business Management', college: 'CBA', currentSecretary: { name: 'Dr. Gabriel Mendoza', email: 'gmendoza@ndmu.edu.ph', employee_id: 'EMP-2018-0412' } },
    { id: 'dept-5', name: 'Department of Arts & Humanities', college: 'CAS', currentSecretary: null },
  ]

  const filteredDepartments = useMemo(() => {
    return departmentCatalog.filter(d => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || d.name.toLowerCase().includes(q)
      const matchesCollege = collegeFilter === 'ALL' || d.college === collegeFilter
      return matchesSearch && matchesCollege
    })
  }, [search, collegeFilter])

  const eligiblePersonnel = useMemo(() => {
    if (!secretarySearch.trim()) return personnelList
    const q = secretarySearch.toLowerCase().trim()
    return personnelList.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.employee_id.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    )
  }, [personnelList, secretarySearch])

  const handleOpenAssignModal = (dept) => {
    setSelectedDept(dept)
    setSelectedSecretaryId('')
    setSecretarySearch('')
    setStep('select')
    setIsModalOpen(true)
  }

  const handleConfirmAssignment = () => {
    const selectedPerson = personnelList.find(p => p.id === selectedSecretaryId)
    if (selectedPerson && selectedDept && onAssignSecretary) {
      onAssignSecretary(selectedDept.name, selectedPerson, effectiveDate)
    }
    setIsModalOpen(false)
  }

  const selectedNewSecretaryObj = personnelList.find(p => p.id === selectedSecretaryId)

  return (
    <div className="space-y-4 font-sans">
      {/* Governance Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Governance Notice:</strong> HR manages administrative department placement. College Dean governance appointments are appointed separately by <strong>OSAD</strong>.
        </p>
      </div>

      {/* Header & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search department by name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#69A97C]"
            />
          </div>

          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#69A97C] w-full sm:w-auto"
          >
            <option value="ALL">All Colleges</option>
            <option value="CEAC">CEAC - Engineering &amp; Computing</option>
            <option value="CBA">CBA - Business Administration</option>
            <option value="CAS">CAS - Arts &amp; Sciences</option>
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDepartments.map(dept => (
          <div
            key={dept.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.03em] text-slate-500 dark:text-slate-400">
                  {dept.college}
                </p>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-[1.35]">
                  {dept.name}
                </h3>
              </div>
              <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
            </div>

            {/* Department Secretary Status */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Department Secretary</p>
                {dept.currentSecretary ? (
                  <div className="mt-0.5 space-y-0.5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{dept.currentSecretary.name}</p>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">{dept.currentSecretary.email}</p>
                  </div>
                ) : (
                  <p className="text-xs font-normal text-slate-400 italic mt-0.5">No secretary assigned</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenAssignModal(dept)}
                className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  dept.currentSecretary
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                    : 'bg-[#EFF7F0] hover:bg-[#143326] dark:bg-emerald-600 text-white shadow-xs'
                }`}
              >
                {dept.currentSecretary ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{dept.currentSecretary ? 'Change Secretary' : 'Assign Secretary'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign / Change Department Secretary Modal */}
      {isModalOpen && selectedDept && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  <span>{step === 'select' ? 'Assign Department Secretary' : 'Confirm Assignment'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {step === 'select' ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80">
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Target Department</p>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{selectedDept.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Search &amp; Select Faculty Member
                    </label>
                    <input
                      type="text"
                      value={secretarySearch}
                      onChange={e => setSecretarySearch(e.target.value)}
                      placeholder="Search by name, ID, or email..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-[#69A97C] mb-2"
                    />

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                      {eligiblePersonnel.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedSecretaryId(p.id)}
                          className={`p-2.5 flex items-center justify-between transition cursor-pointer ${
                            selectedSecretaryId === p.id
                              ? 'bg-[#EFF7F0]/10 dark:bg-emerald-950/40 text-[#064e2b] dark:text-[#245F42]'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-extrabold">{p.full_name}</p>
                            <p className="text-[10px] text-slate-500">{p.email}</p>
                          </div>
                          {selectedSecretaryId === p.id && <Check className="w-4 h-4 text-[#064e2b] dark:text-emerald-400" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSecretaryId}
                      onClick={() => setStep('confirm')}
                      className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold disabled:opacity-40 transition cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Confirmation */
                <div className="space-y-4">
                  {selectedDept.currentSecretary && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Changing the secretary will replace the current assignment for {selectedDept.currentSecretary.name}.</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-slate-400">Department</p>
                      <p className="font-extrabold text-slate-900 dark:text-white">{selectedDept.name}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] uppercase font-extrabold text-slate-400">New Secretary</p>
                      <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 text-sm">
                        {selectedNewSecretaryObj?.full_name} ({selectedNewSecretaryObj?.employee_id})
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-slate-400">Effective Date</p>
                      <input
                        type="date"
                        value={effectiveDate}
                        onChange={e => setEffectiveDate(e.target.value)}
                        className="mt-1 w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep('select')}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAssignment}
                      className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Assignment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
