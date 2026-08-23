import apiClient from './apiClient'

export const roleService = {
  async getSpecializedRoles() {
    const res = await apiClient.get('/personnel/roles')
    return res?.data?.assignments || res?.assignments || []
  },

  async assignSpecializedRole(personnelId, { roleKey, scopeType, scopeId }) {
    const res = await apiClient.post(`/personnel/${personnelId}/roles`, {
      role_key: roleKey,
      scope_type: scopeType,
      scope_id: scopeId
    })
    return res?.data || res
  },

  async revokeSpecializedRole(personnelId, assignmentId) {
    const res = await apiClient.delete(`/personnel/${personnelId}/roles/${assignmentId}`)
    return res?.data || res
  }
}

export default roleService
