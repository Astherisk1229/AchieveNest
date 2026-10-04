import { describe, expect, it } from 'vitest'

import { createApiBaseUrlDefine } from '../create-api-base-url-define.js'

describe('createApiBaseUrlDefine', () => {
  it('injects the deployment API URL as a Vite string literal', () => {
    expect(createApiBaseUrlDefine({
      VITE_API_BASE_URL: '  https://api.example.test/api/v1  ',
    })).toEqual({
      __ACHIEVENEST_API_BASE_URL__: '"https://api.example.test/api/v1"',
    })
  })

  it('leaves the normal local fallback intact when no deployment URL is configured', () => {
    expect(createApiBaseUrlDefine()).toEqual({ __ACHIEVENEST_API_BASE_URL__: '""' })
    expect(createApiBaseUrlDefine({ VITE_API_BASE_URL: '   ' })).toEqual({
      __ACHIEVENEST_API_BASE_URL__: '""',
    })
  })
})
