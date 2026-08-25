import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'

export default function SingleCategoryControl({
  title = 'Rating Basis Classification',
  options = [],
  value,
  onChange,
  disabled = false
}) {
  const currentVal = typeof value === 'object' ? (value.selectedOption || value.value || '') : (value || '')

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
        {title}
      </label>
      <Select
        value={currentVal}
        onValueChange={(val) => {
          const opt = options.find((o) => o.value === val)
          onChange({
            selectedOption: val,
            value: val,
            points: opt ? opt.points : 0
          }, opt ? opt.points : 0)
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
