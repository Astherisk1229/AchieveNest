const readJson = value => {
  if (value === null || value === undefined || value === '') return { ok: true, value: [] }
  if (typeof value !== 'string') return { ok: true, value }
  try { return { ok: true, value: JSON.parse(value) } } catch { return { ok: false, value: null }
  }
}

const stableFieldKey = field => String(field?.key || field?.name || '')
const displayFieldName = field => String(field?.label || field?.name || field?.key || 'Unnamed field')
const niceValue = value => value === null || value === undefined || value === '' ? 'none' : String(value)
const same = (left, right) => JSON.stringify(left ?? null) === JSON.stringify(right ?? null)
const formatOptions = options => Array.isArray(options) ? options.map(option => String(option?.label ?? option?.value ?? option)).join(', ') : ''
const formatInputType = value => ({ text: 'short text', textarea: 'long text', select: 'dropdown', number: 'number', date: 'date', checkbox: 'checkbox' }[value] || '')

function compareFields(changes) {
  const lines = []
  let limitation = ''
  for (const change of changes.filter(item => /\.field_schema$/i.test(item.path || ''))) {
    const beforeResult = readJson(change.before)
    const afterResult = readJson(change.after)
    const before = beforeResult.value
    const after = afterResult.value
    if (!beforeResult.ok || !afterResult.ok || !Array.isArray(before) || !Array.isArray(after)) {
      limitation = 'The form fields changed, but their details could not be compared reliably.'
      continue
    }
    const keysAreReliable = fields => {
      const keys = fields.map(stableFieldKey)
      return keys.every(Boolean) && new Set(keys).size === keys.length
    }
    if (!keysAreReliable(before) || !keysAreReliable(after)) {
      limitation = 'The form fields changed, but the system could not match every field reliably.'
      continue
    }
    const oldFields = new Map(before.map(field => [stableFieldKey(field), field]))
    const newFields = new Map(after.map(field => [stableFieldKey(field), field]))
    const oldOrder = before.map(stableFieldKey)
    const newOrder = after.map(stableFieldKey)
    for (const [key, field] of newFields) if (!oldFields.has(key)) lines.push(`Added: ${displayFieldName(field)}`)
    for (const [key, field] of oldFields) if (!newFields.has(key)) lines.push(`Removed: ${displayFieldName(field)}`)

    for (const [key, next] of newFields) {
      const previous = oldFields.get(key)
      if (!previous) continue
      const oldName = displayFieldName(previous)
      const nextName = displayFieldName(next)
      if (oldName !== nextName) lines.push(`Field label changed: ${oldName} → ${nextName}`)
      if ((previous.required !== false) !== (next.required !== false)) {
        lines.push(`${nextName} — now ${next.required === false ? 'optional' : 'required'}`)
      }
      if (!same(previous.options, next.options)) {
        const oldOptions = formatOptions(previous.options) || 'none'
        const newOptions = formatOptions(next.options) || 'none'
        lines.push(`${nextName} — available options changed: ${oldOptions} → ${newOptions}`)
      }
      if (previous.type !== next.type) {
        const oldType = formatInputType(previous.type)
        const newType = formatInputType(next.type)
        if (oldType && newType) lines.push(`${nextName} — input changed from ${oldType} to ${newType}`)
        else limitation = `The settings for ${nextName} changed, but the exact change could not be described reliably.`
      }
      const oldValidation = previous.validation || {}
      const newValidation = next.validation || {}
      for (const rule of new Set([...Object.keys(oldValidation), ...Object.keys(newValidation)])) {
        if (same(oldValidation[rule], newValidation[rule])) continue
        const oldValue = oldValidation[rule]
        const newValue = newValidation[rule]
        const ruleLabels = {
          minLength: ['minimum length', 'characters'], maxLength: ['maximum length', 'characters'],
          min: ['minimum value', ''], max: ['maximum value', ''], integer: ['whole numbers only', ''],
        }
        const readable = ruleLabels[rule]
        if (!readable) { limitation = `The settings for ${nextName} changed, but the exact change could not be described reliably.`; continue }
        if (rule === 'integer') lines.push(`${nextName} — ${newValue ? 'whole numbers only' : 'decimal values allowed'}`)
        else lines.push(`${nextName} — ${readable[0]} changed from ${niceValue(oldValue)}${readable[1] ? ` ${readable[1]}` : ''} to ${niceValue(newValue)}${readable[1] ? ` ${readable[1]}` : ''}`)
      }
      const known = new Set(['key', 'name', 'label', 'required', 'options', 'type', 'validation'])
      const extraKeys = new Set([...Object.keys(previous), ...Object.keys(next)].filter(fieldKey => !known.has(fieldKey)))
      if ([...extraKeys].some(fieldKey => !same(previous[fieldKey], next[fieldKey]))) {
        limitation = `The settings for ${nextName} changed, but the exact change could not be described reliably.`
      }
    }
    if (oldOrder.length === newOrder.length && oldOrder.some((key, index) => key !== newOrder[index]) && oldOrder.every(key => newFields.has(key)) && newOrder.every(key => oldFields.has(key))) {
      lines.push('Form field order updated.')
    }
  }
  return { lines: [...new Set(lines)], limitation }
}

function compareEvidence(changes) {
  const lines = []
  let limitation = ''
  for (const change of changes.filter(item => /\.evidence_rules$/i.test(item.path || ''))) {
    const beforeResult = readJson(change.before)
    const afterResult = readJson(change.after)
    const before = change.before == null || change.before === '' ? {} : beforeResult.value
    const after = change.after == null || change.after === '' ? {} : afterResult.value
    if (!beforeResult.ok || !afterResult.ok || !before || !after || typeof before !== 'object' || typeof after !== 'object' || Array.isArray(before) || Array.isArray(after)) {
      limitation = 'Evidence requirements changed, but the details could not be compared reliably.'
      continue
    }
    if (before.required !== undefined && after.required !== undefined && before.required !== after.required) lines.push(`Evidence is now ${after.required ? 'required' : 'optional'}.`)
    else if (before.required === undefined && after.required !== undefined) lines.push(`Evidence requirement added: ${after.required ? 'required' : 'optional'}.`)
    const oldAccepted = Array.isArray(before.accepted) ? before.accepted.map(String) : []
    const newAccepted = Array.isArray(after.accepted) ? after.accepted.map(String) : []
    for (const item of newAccepted.filter(value => !oldAccepted.includes(value))) lines.push(`Added evidence: ${item}`)
    for (const item of oldAccepted.filter(value => !newAccepted.includes(value))) lines.push(`Removed evidence: ${item}`)
    const known = new Set(['required', 'accepted'])
    if ([...new Set([...Object.keys(before), ...Object.keys(after)])].some(key => !known.has(key) && !same(before[key], after[key]))) {
      limitation = 'Evidence requirements changed, but the details could not be compared reliably.'
    }
  }
  return { lines: [...new Set(lines)], limitation }
}

const levelMap = tree => {
  const map = new Map()
  for (const area of tree?.areas || []) for (const category of area.categories || []) for (const subcategory of category.subcategories || []) {
    for (const level of subcategory.levels || []) if (level.option_code) map.set(String(level.option_code).toUpperCase(), level)
  }
  return map
}

function compareScoring(changes, context) {
  const lines = []
  const previousLevels = levelMap(context.previousTree)
  const nextLevels = levelMap(context.nextTree)
  const groups = new Map()
  let limitation = ''
  for (const change of changes.filter(item => item.scoring_impact || /\.level\.[^.]+\.label$/i.test(item.path || ''))) {
    const path = String(change.path || '')
    const levelMatch = path.match(/\.level\.([^.]+)\.(label|points|active)$/i)
    if (levelMatch) {
      const [, code, field] = levelMatch
      const key = code.toUpperCase()
      const group = groups.get(key) || { code: key, changes: {} }
      group.changes[field.toLowerCase()] = change
      groups.set(key, group)
      continue
    }
    const pointsMatch = path.match(/\.(?:max_points|default_points|points|max_points_per_entry)$/i)
    if (pointsMatch && change.type === 'CHANGED') lines.push(`Points changed from ${niceValue(change.before)} to ${niceValue(change.after)} points.`)
    else if (/\.(?:active|is_active)$/i.test(path) && change.type === 'CHANGED') lines.push(`Availability for new entries is now ${Number(change.after) === 1 ? 'on' : 'off'}.`)
    else if (change.type !== 'CHANGED' || !pointsMatch) limitation = 'A scoring change was found, but the affected item could not be identified reliably.'
  }
  for (const group of groups.values()) {
    const before = previousLevels.get(group.code)
    const after = nextLevels.get(group.code)
    const labelChange = group.changes.label
    const label = after?.label || before?.label || labelChange?.after || labelChange?.before
    const points = group.changes.points
    const active = group.changes.active
    if (!label) { limitation = 'A scoring level changed, but its display name could not be confirmed.'; continue }
    if (points?.type === 'CHANGED') lines.push(`${label}: ${niceValue(points.before)} → ${niceValue(points.after)} points`)
    else if (points?.type === 'ADDED') lines.push(`Added scoring level: ${label} — ${niceValue(points.after)} points`)
    else if (points?.type === 'REMOVED') lines.push(`Removed scoring level: ${label} — ${niceValue(points.before)} points`)
    if (labelChange?.type === 'CHANGED') lines.push(`Scoring level renamed: ${labelChange.before} → ${labelChange.after}`)
    if (active?.type === 'CHANGED') lines.push(`${label} is now ${Number(active.after) === 1 ? 'available' : 'unavailable'} for new entries`)
    if (!points && !labelChange && !active) limitation = 'A scoring level changed, but the details could not be identified reliably.'
  }
  return { lines: [...new Set(lines)], limitation }
}

const isTargetChange = (change, type, code) => {
  const path = String(change?.path || '')
  const normalizedCode = String(code || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!normalizedCode) return false
  const pattern = type === 'category'
    ? new RegExp(`^category\\.[^.]+\\.${normalizedCode}\\.`, 'i')
    : new RegExp(`^category\\.[^.]+\\.[^.]+\\.subcategory\\.${normalizedCode}\\.`, 'i')
  return pattern.test(path)
}

export function buildCriteriaChangeSummary(changes = [], context = {}) {
  const type = context.type === 'category' ? 'category' : 'subcategory'
  const code = context.criterion?.code || ''
  const name = context.criterion?.name || ''
  const targetChanges = changes.filter(change => isTargetChange(change, type, code))
  const summaryLines = []
  const add = line => { if (line && !summaryLines.includes(line)) summaryLines.push(line) }
  if (context.previousCriterion?.code && code && context.previousCriterion.code !== code) add(`Criterion code changed from ${context.previousCriterion.code} to ${code}.`)

  const nameChanges = targetChanges.filter(change => /\.name$/i.test(change.path || ''))
  const previousCode = context.previousCriterion?.code
  const previousNameChanges = changes.filter(change => isTargetChange(change, type, previousCode) && /\.name$/i.test(change.path || ''))
  const nameChange = nameChanges.find(change => change.type !== 'ADDED') || nameChanges[0]
  if (nameChange?.type === 'CHANGED') add(`Criterion renamed: ${niceValue(nameChange.before)} → ${niceValue(nameChange.after)}`)
  else if (nameChange && context.previousCriterion?.name && previousNameChanges.some(change => change.type === 'REMOVED') && context.previousCriterion.name !== nameChange.after) {
    add(`Criterion renamed: ${context.previousCriterion.name} → ${niceValue(nameChange.after)}`)
  } else if (nameChange?.type === 'REMOVED') add('This criterion will be removed.')
  else if (nameChange?.type === 'ADDED' && !context.previousCriterion?.name) add(`Criterion added: ${niceValue(nameChange.after)}`)

  const scoring = compareScoring(changes, { ...context, type })
  const fields = compareFields(changes)
  const evidence = compareEvidence(changes)
  const genericChanges = targetChanges.filter(change => /\.(?:description|scoring_rule_reference|intake_active|intake_mode)$/i.test(change.path || ''))
  if (genericChanges.some(change => /\.description$/i.test(change.path || ''))) add('Criterion instructions were updated.')
  if (genericChanges.some(change => /\.scoring_rule_reference$/i.test(change.path || ''))) add('Scoring guidance was updated.')
  if (genericChanges.some(change => /\.(?:intake_active|intake_mode)$/i.test(change.path || ''))) add('Accomplishment form requirements were updated.')
  for (const line of scoring.lines) add(line)
  const limitations = [...new Set([fields.limitation, evidence.limitation, scoring.limitation].filter(Boolean))]
  const fieldsMayAffectSavedInformation = fields.lines.some(line => line.startsWith('Removed:') || /now required|available options changed|input changed|minimum (?:length|value) changed|maximum (?:length|value) changed|whole numbers only|decimal values allowed/i.test(line))
  const evidenceMayAffectSavedInformation = evidence.lines.some(line => line.startsWith('Removed evidence:') || /Evidence is now required/i.test(line))
  const removesScoring = changes.some(change => change.scoring_impact && change.type === 'REMOVED')
  const removesCriterion = targetChanges.some(change => /\.name$/i.test(change.path || '') && change.type === 'REMOVED')
  const deactivatesCriterion = targetChanges.some(change => /\.(?:active|is_active)$/i.test(change.path || '') && Number(change.after) === 0)
  return {
    title: [code, name].filter(Boolean).join(' · '),
    summaryLines,
    scoringLines: scoring.lines,
    fieldLines: fields.lines,
    evidenceLines: evidence.lines,
    limitations,
    consequence: fieldsMayAffectSavedInformation || evidenceMayAffectSavedInformation
      ? 'Some existing accomplishment information may need review.'
      : removesScoring || removesCriterion || deactivatesCriterion
      ? 'Some existing scoring choices or criteria will no longer be available. Ongoing evaluations may need review.'
      : '',
  }
}

export function ongoingEvaluationMessage(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return 'The number of affected ongoing evaluations could not be confirmed.'
  }
  const count = Number(value)
  const effect = count === 0 ? 'This change will not affect any ongoing evaluations.' : `This change will affect ${count.toLocaleString()} ongoing evaluation${count === 1 ? '' : 's'}.`
  return `${effect} Completed evaluations will remain unchanged.`
}
