export function createApiBaseUrlDefine(environment = {}) {
  const apiBaseUrl = environment.VITE_API_BASE_URL?.trim() || ''

  // Vercel exposes the value to Node-based prebuild checks, but Vite 8's
  // Rolldown pipeline may not forward it into import.meta.env automatically.
  // Use a dedicated compile-time constant so the tested deployment URL reaches
  // the browser before import.meta.env is normalized by the compiler.
  return {
    __ACHIEVENEST_API_BASE_URL__: JSON.stringify(apiBaseUrl),
  }
}
