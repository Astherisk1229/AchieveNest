export const HR_RANKING_TABS = [
  { key: 'periods', label: 'Ranking Periods' },
  { key: 'annual-reviews', label: 'Annual Reviews' },
  { key: 'portfolio-evaluation', label: 'Portfolio Evaluation' },
  { key: 'evaluation-summaries', label: 'Evaluation Summaries' },
  { key: 'evaluation-criteria', label: 'Evaluation Criteria' },
]

export const HR_PERIOD_WORKSPACE_TABS = [
  ...HR_RANKING_TABS.filter(tab => tab.key !== 'periods'),
]

const TAB_KEYS = new Set([...HR_RANKING_TABS, ...HR_PERIOD_WORKSPACE_TABS].map(tab => tab.key))
const TRACK_KEYS = new Set(['faculty', 'non-teaching-faculty'])
const LEGACY_STAGE_TABS = {
  'annual-reviews': 'annual-reviews',
  overview: 'annual-reviews',
  submissions: 'portfolio-evaluation',
  evaluation: 'portfolio-evaluation',
  evaluations: 'portfolio-evaluation',
  results: 'evaluation-summaries',
}

export function rankingWorkspaceTrack(location) {
  const params = new URLSearchParams(location.search)
  if (TRACK_KEYS.has(params.get('track'))) return params.get('track')
  const parts = location.pathname.split('/').filter(Boolean)
  return parts[1] === 'ranking-cycles' && TRACK_KEYS.has(parts[3]) ? parts[3] : null
}


export function rankingWorkspaceTab(location) {
  const requested = new URLSearchParams(location.search).get('tab')
  if (TAB_KEYS.has(requested)) return requested
  if (location.pathname === '/hr/evaluation-submissions' || location.pathname === '/hr/verification-queue') return 'portfolio-evaluation'
  const parts = location.pathname.split('/').filter(Boolean)
  const stageIndex = parts[1] === 'ranking-cycles' && TRACK_KEYS.has(parts[3]) ? 4 : -1
  const stage = stageIndex >= 0 ? parts[stageIndex] : ''
  if (stage === 'summary' || stage === 'results') return 'evaluation-summaries'
  return LEGACY_STAGE_TABS[stage] || 'periods'
}

export function rankingWorkspaceHref(location, tab, context = {}) {
  const targetTab = TAB_KEYS.has(tab) ? tab : 'periods'
  const params = new URLSearchParams(location.search)
  const parts = location.pathname.split('/').filter(Boolean)
  const isCyclePath = parts[0] === 'hr' && parts[1] === 'ranking-cycles' && parts[2] && parts[2] !== 'criteria'
  const period = context.cycleId || (isCyclePath ? decodeURIComponent(parts[2]) : null)
  const track = context.trackKey || (isCyclePath && TRACK_KEYS.has(parts[3]) ? parts[3] : null) || params.get('track')

  if (targetTab === 'periods') {
    params.delete('period')
  } else if (period) params.set('period', period)
  if (['periods', 'evaluation-criteria'].includes(targetTab)) params.delete('track')
  else if (track) params.set('track', track)
  else params.delete('track')
  if (targetTab !== 'portfolio-evaluation') params.delete('view')
  params.set('tab', TAB_KEYS.has(targetTab) ? targetTab : 'periods')
  return `/hr/ranking-cycles?${params.toString()}${location.hash || ''}`
}

export function legacyRankingWorkspaceHref(location, { cycleId = null, trackKey = null, stage = '' } = {}) {
  const params = new URLSearchParams(location.search)
  const tab = LEGACY_STAGE_TABS[stage] || 'periods'
  if (cycleId) params.set('period', cycleId)
  if (TRACK_KEYS.has(trackKey)) params.set('track', trackKey)
  else if (tab !== 'portfolio-evaluation') params.delete('track')
  params.set('tab', tab)
  if (stage === 'submissions') params.set('view', 'submissions')
  else if (tab === 'portfolio-evaluation') params.delete('view')
  return `/hr/ranking-cycles?${params.toString()}${location.hash || ''}`
}
