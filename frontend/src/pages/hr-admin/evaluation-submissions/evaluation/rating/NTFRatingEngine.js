const numberOrNull = value => value === null || value === undefined || value === '' ? null : Number(value)

export function calculateNTFScores(items = [], tenureYears = 0) {
  const areaAItems = items.filter(item => String(item.categoryArea || '').toLowerCase() === 'areaa')
  const requiredAreaA = ['A.1', 'A.2', 'A.3']
  const areaAValues = requiredAreaA.map(code => {
    const item = areaAItems.find(entry => String(entry.criterionCode || '').toUpperCase() === code)
    return item ? numberOrNull(item.awardedPoints) : null
  })
  const areaAComplete = areaAValues.every(value => Number.isFinite(value))
  const areaATotal = areaAComplete ? areaAValues.reduce((sum, value) => sum + value, 0) : null

  const areaBItems = items.filter(item => String(item.categoryArea || '').toLowerCase() === 'areab')
  const categoryTotals = areaBItems.reduce((totals, item) => {
    if (item.verificationStatus !== 'verified' || item.ratingStatus !== 'rated') return totals
    const code = String(item.criterionCode || '').toUpperCase().slice(0, 3)
    const points = numberOrNull(item.awardedPoints)
    if (code && Number.isFinite(points)) totals[code] = (totals[code] || 0) + points
    return totals
  }, {})

  const servicePoints = Math.min(10, Math.floor(Math.max(0, Number(tenureYears) || 0) / 2))
  const caps = { 'B.1': 30, 'B.2': 30, 'B.3': 10, 'B.4': 30, 'B.5': 30 }
  categoryTotals['B.3'] = servicePoints
  const rawTotal = Object.entries(categoryTotals).reduce((sum, [code, value]) => sum + Math.min(value, caps[code] ?? value), 0)
  const areaBTotal = Math.min(60, rawTotal)

  return {
    areaA: { total: areaATotal, complete: areaAComplete, max: 90 },
    areaB: { total: areaBTotal, awardedTotal: areaBTotal, rawTotal, max: 60, categoryTotals },
    areaC: null,
    grandTotalAwarded: areaAComplete ? areaATotal + areaBTotal : null,
    totalScore: areaAComplete ? areaATotal + areaBTotal : null,
  }
}
