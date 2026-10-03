import apiClient from './apiClient'

const personnelEvaluationResultService = {
  async fetchCompletedResult(evaluationId) {
    const response = await apiClient.get(`/personnel/evaluations/${evaluationId}/result`)
    return response?.data?.result || response?.result || null
  },

  printableUrl(evaluationId) {
    return `/api/v1/personnel/evaluations/${evaluationId}/result/print`
  }
}

export default personnelEvaluationResultService
