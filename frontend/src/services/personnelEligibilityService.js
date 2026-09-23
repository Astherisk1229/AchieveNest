import apiClient from './apiClient'

export async function fetchCurrentPersonnelEligibility(params = {}) {
  const response = await apiClient.get('/personnel/eligibility/current', { params })
  return response?.data || response
}

export async function fetchHRPersonnelEligibility(personnelProfileId, params = {}) {
  const response = await apiClient.get(`/hr/personnel/${personnelProfileId}/eligibility`, { params })
  return response?.data || response
}

export default {
  fetchCurrentPersonnelEligibility,
  fetchHRPersonnelEligibility
}
