import apiClient from './apiClient'

const unwrap = (response) => response?.data?.data || response?.data || response

export async function listPersonnelEvaluationPeriods(filters = {}) { return unwrap(await apiClient.get('/hr/personnel-evaluation-periods', { params: filters })) }
export async function listRankingCycles() { return unwrap(await apiClient.get('/hr/ranking-cycles')) }
export async function getCurrentPersonnelEvaluationPeriod(evaluationType = 'RANKING_PROMOTION') { return unwrap(await apiClient.get('/personnel/evaluation-period/current', { params: { evaluation_type: evaluationType } })) }
const requestConfig = (key = crypto.randomUUID()) => ({ headers: { 'Idempotency-Key': key } })
const cyclePath = id => `/hr/ranking-cycles/${encodeURIComponent(id)}`
export async function getRankingCycle(id) { return unwrap(await apiClient.get(cyclePath(id))) }
export async function createRankingCycle(payload, requestKey) { return unwrap(await apiClient.post('/hr/ranking-cycles', payload, requestConfig(requestKey))) }
export async function addRankingCycleCoverage(id, payload, requestKey) { return unwrap(await apiClient.post(`${cyclePath(id)}/tracks`, payload, requestConfig(requestKey))) }
export async function updateRankingCycleSchedule(id, payload) { return unwrap(await apiClient.patch(`${cyclePath(id)}/schedule`, payload)) }
/** Achievement coverage: which accomplishments belong to the period (not the submission/evaluation schedule). */
export async function updateRankingCycleAchievementCoverage(id, payload) { return unwrap(await apiClient.patch(`${cyclePath(id)}/coverage`, payload)) }
export async function archiveRankingCycle(id, requestKey) { return unwrap(await apiClient.post(`${cyclePath(id)}/archive`, { confirm: true }, requestConfig(requestKey))) }
export async function cancelRankingCycle(id, reason, requestKey) { return unwrap(await apiClient.post(`${cyclePath(id)}/cancel`, { reason }, requestConfig(requestKey))) }
export async function restoreRankingCycle(id, requestKey) { return unwrap(await apiClient.post(`${cyclePath(id)}/restore`, { confirm: true }, requestConfig(requestKey))) }
export async function deleteRankingCycle(id, confirmName) { return unwrap(await apiClient.delete(cyclePath(id), { data: { confirm_name: confirmName } })) }
export async function createPersonnelEvaluationPeriod(payload, requestKey) { return unwrap(await apiClient.post('/hr/personnel-evaluation-periods', payload, requestConfig(requestKey))) }
export async function updatePersonnelEvaluationPeriod(id, payload, requestKey) { return unwrap(await apiClient.patch(`/hr/personnel-evaluation-periods/${id}`, payload, requestConfig(requestKey))) }
export async function transitionPersonnelEvaluationPeriod(id, action, expectedVersion, requestKey) { return unwrap(await apiClient.post(`/hr/personnel-evaluation-periods/${id}/${action}`, { expected_version: expectedVersion }, requestConfig(requestKey))) }

export default { listRankingCycles, getRankingCycle, createRankingCycle, addRankingCycleCoverage, updateRankingCycleSchedule, updateRankingCycleAchievementCoverage, archiveRankingCycle, cancelRankingCycle, restoreRankingCycle, deleteRankingCycle, listPersonnelEvaluationPeriods, getCurrentPersonnelEvaluationPeriod, createPersonnelEvaluationPeriod, updatePersonnelEvaluationPeriod, transitionPersonnelEvaluationPeriod }
