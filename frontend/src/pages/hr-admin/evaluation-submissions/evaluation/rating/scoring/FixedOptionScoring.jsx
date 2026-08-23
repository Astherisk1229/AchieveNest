import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'

export default function FixedOptionScoring({
  rule,
  value,
  onChange,
  disabled = false
}) {
  const options = rule.options || []

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
        Rating Basis Classification
      </label>
      <Select
        value={value?.selectedOption || ''}
        onValueChange={(val) => {
          const opt = options.find((o) => o.value === val)
          onChange({
            selectedOption: val,
            points: opt ? opt.points : 0
          })
        }}
        disabled={disabled}
        placeholder="Select applicable classification..."
        className="w-full"
        triggerClassName="py-2.5 text-xs font-semibold"
      >
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label} ({opt.points} pts)
          </SelectItem>
        ))}
      </Select>
    </div>
  )
}
