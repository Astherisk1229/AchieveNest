import apiClient from './apiClient'

export async function verifyOfficialEvaluationDocument(reference) {
  const response = await apiClient.get(`/public/official-evaluation-documents/${encodeURIComponent(reference)}/verify`)
  return response?.data || response
}
