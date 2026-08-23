import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'

export default function MultiFactorControl({
  payload = {},
  factors = {},
  onChange,
  disabled = false
}) {
  const sponsoringOrg = payload.sponsoringOrg || 'external'
  const extentOfTalk = payload.extentOfTalk || '1_day'
  const participantsScope = payload.participantsScope || 'national'
  const role = payload.role || 'speaker'

  const orgPts = sponsoringOrg === 'external' ? 2 : 1
  const extentMap = { '1_hour': 1, half_day: 2, '1_day': 3, '2_days': 4, more_than_2_days: 5 }
  const extentPts = extentMap[extentOfTalk] || 3
  const scopeMap = { local: 1, regional: 2, national: 3, international: 4 }
  const scopePts = scopeMap[participantsScope] || 3
  const rolePts = role === 'judge' ? 3 : 5

  const rawSum = orgPts + extentPts + scopePts + rolePts
  const calculatedPoints = Math.min(40, rawSum)

  const handleFieldChange = (key, val) => {
    const updated = {
      ...payload,
      sponsoringOrg: key === 'sponsoringOrg' ? val : sponsoringOrg,
      extentOfTalk: key === 'extentOfTalk' ? val : extentOfTalk,
      participantsScope: key === 'participantsScope' ? val : participantsScope,
      role: key === 'role' ? val : role,
    }
    const oP = updated.sponsoringOrg === 'external' ? 2 : 1
    const eP = extentMap[updated.extentOfTalk] || 3
    const sP = scopeMap[updated.participantsScope] || 3
    const rP = updated.role === 'judge' ? 3 : 5
    const computed = Math.min(40, oP + eP + sP + rP)

    onChange(updated, computed)
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          1. Sponsoring Organization
        </label>
        <Select
          value={sponsoringOrg}
          onValueChange={(val) => handleFieldChange('sponsoringOrg', val)}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="external">External Agencies / Other Schools (2 pts)</SelectItem>
          <SelectItem value="ndmu">NDMU / Local Unit (1 pt)</SelectItem>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          2. Extent of Talk / Duration
        </label>
        <Select
          value={extentOfTalk}
          onValueChange={(val) => handleFieldChange('extentOfTalk', val)}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="more_than_2_days">More than 2 Days (5 pts)</SelectItem>
          <SelectItem value="2_days">2 Days (4 pts)</SelectItem>
          <SelectItem value="1_day">1 Day (3 pts)</SelectItem>
          <SelectItem value="half_day">Half Day / 3–4 Hours (2 pts)</SelectItem>
          <SelectItem value="1_hour">1 Hour (1 pt)</SelectItem>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          3. Participants / Scope
        </label>
        <Select
          value={participantsScope}
          onValueChange={(val) => handleFieldChange('participantsScope', val)}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="international">International (4 pts)</SelectItem>
          <SelectItem value="national">National (3 pts)</SelectItem>
          <SelectItem value="regional">Regional (2 pts)</SelectItem>
          <SelectItem value="local">Local (1 pt)</SelectItem>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          4. Role of Personnel
        </label>
        <Select
          value={role}
          onValueChange={(val) => handleFieldChange('role', val)}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="speaker">Reactor / Keynote / Facilitator / Consultant / Speaker / Organizer (5 pts)</SelectItem>
          <SelectItem value="judge">Judge / Evaluator (3 pts)</SelectItem>
        </Select>
      </div>

      {/* Breakdown Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Provisional Calculated Score</span>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Structurally Implied Rule</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
          <span>{orgPts} (Sponsor) + {extentPts} (Extent) + {scopePts} (Scope) + {rolePts} (Role)</span>
          <strong className="text-[#176B43] dark:text-emerald-400 font-bold">= {calculatedPoints}.00 pts</strong>
        </div>
      </div>
    </div>
  )
}
