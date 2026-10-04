import { describe, expect, it } from 'vitest'
import {
  requiresProductionValidation,
  validateProductionDeploymentEnvironment,
} from '../validate-production-deployment-env.js'

describe('production deployment environment validation', () => {
  it('runs for Vercel production and an explicit release rehearsal', () => {
    expect(requiresProductionValidation({ VERCEL_ENV: 'production' })).toBe(true)
    expect(requiresProductionValidation({ ACHIEVENEST_REQUIRE_PRODUCTION_ENV: 'true' })).toBe(true)
    expect(requiresProductionValidation({ VERCEL_ENV: 'preview' })).toBe(false)
  })

  it('does not block local, CI, or preview builds', () => {
    expect(validateProductionDeploymentEnvironment({ VERCEL_ENV: 'preview' })).toEqual([])
  })

  it.each([
    [undefined, 'must be set'],
    ['/api/v1', 'absolute HTTPS URL'],
    ['http://api.example.com/api/v1', 'must use HTTPS'],
    ['https://localhost/api/v1', 'must not target a local host'],
    ['https://127.0.0.2/api/v1', 'must not target a local host'],
    ['https://achievenest-staging.example.com/api/v1', 'must not target the staging API'],
    ['https://api.example.com/', 'must end with /api/v1'],
    ['https://user:pass@api.example.com/api/v1?debug=1', 'must not contain credentials'],
  ])('rejects an unsafe production API value %#', (apiBaseUrl, expectedMessage) => {
    const errors = validateProductionDeploymentEnvironment({
      VERCEL_ENV: 'production',
      VITE_API_BASE_URL: apiBaseUrl,
    })

    expect(errors.join(' ')).toContain(expectedMessage)
  })

  it('accepts an exact HTTPS production API base URL', () => {
    expect(validateProductionDeploymentEnvironment({
      VERCEL_ENV: 'production',
      VITE_API_BASE_URL: 'https://api.achievenest.example/api/v1',
    })).toEqual([])
  })
})
