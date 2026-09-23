import apiClient from './apiClient'

const unwrap = (response) => response?.data?.data || response?.data || response

export async function listPersonnelEvaluationPeriods(filters = {}) { return unwrap(await apiClient.get('/hr/personnel-evaluation-periods', { params: filters })) }
export async function listRankingCycles() { return unwrap(await apiClient.get('/hr/ranking-cycles')) }
export async function createRankingCycle(payload) { return unwrap(await apiClient.post('/hr/ranking-cycles', payload)) }
export async function getCurrentPersonnelEvaluationPeriod(evaluationType = 'RANKING_PROMOTION') { return unwrap(await apiClient.get('/personnel/evaluation-period/current', { params: { evaluation_type: evaluationType } })) }
const requestConfig = (key = crypto.randomUUID()) => ({ headers: { 'Idempotency-Key': key } })
export async function createPersonnelEvaluationPeriod(payload, requestKey) { return unwrap(await apiClient.post('/hr/personnel-evaluation-periods', payload, requestConfig(requestKey))) }
export async function updatePersonnelEvaluationPeriod(id, payload, requestKey) { return unwrap(await apiClient.patch(`/hr/personnel-evaluation-periods/${id}`, payload, requestConfig(requestKey))) }
export async function transitionPersonnelEvaluationPeriod(id, action, expectedVersion, requestKey) { return unwrap(await apiClient.post(`/hr/personnel-evaluation-periods/${id}/${action}`, { expected_version: expectedVersion }, requestConfig(requestKey))) }

export default { listRankingCycles, createRankingCycle, listPersonnelEvaluationPeriods, getCurrentPersonnelEvaluationPeriod, createPersonnelEvaluationPeriod, updatePersonnelEvaluationPeriod, transitionPersonnelEvaluationPeriod }
