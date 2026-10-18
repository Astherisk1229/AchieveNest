import apiClient from './apiClient'

const personnelEvaluationResultService = {
  async fetchCompletedResult(evaluationId) {
    const response = await apiClient.get(`/personnel/evaluations/${evaluationId}/result`)
    const result = response?.data?.result || response?.result || null
    if (!result) return null
    return {
      ...result,
      summary_context: response?.data?.summary_context || result.summary_context || {},
    }
  },

  printableUrl(evaluationId) {
    return `/api/v1/personnel/evaluations/${evaluationId}/result/print`
  },

  async downloadSummaryPdf(evaluationId) {
    return apiClient.get(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/summary.pdf`, {
      responseType: 'blob',
      timeout: 60_000,
    })
  }
}

export default personnelEvaluationResultService
