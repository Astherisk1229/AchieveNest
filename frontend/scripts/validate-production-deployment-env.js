import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PRODUCTION_PATH = '/api/v1'

export function requiresProductionValidation(environment = process.env) {
  return environment.VERCEL_ENV === 'production'
    || environment.ACHIEVENEST_REQUIRE_PRODUCTION_ENV === 'true'
}

export function validateProductionDeploymentEnvironment(environment = process.env) {
  if (!requiresProductionValidation(environment)) return []

  const configuredValue = environment.VITE_API_BASE_URL?.trim()
  if (!configuredValue) {
    return ['VITE_API_BASE_URL must be set by the production deployment environment.']
  }

  let apiUrl
  try {
    apiUrl = new URL(configuredValue)
  } catch {
    return ['VITE_API_BASE_URL must be an absolute HTTPS URL.']
  }

  const errors = []
  const hostname = apiUrl.hostname.toLowerCase()
  const normalizedPath = apiUrl.pathname.replace(/\/$/, '')

  if (apiUrl.protocol !== 'https:') {
    errors.push('VITE_API_BASE_URL must use HTTPS.')
  }
  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    errors.push('VITE_API_BASE_URL must not contain credentials, a query, or a fragment.')
  }
  if (normalizedPath !== PRODUCTION_PATH) {
    errors.push(`VITE_API_BASE_URL must end with ${PRODUCTION_PATH}.`)
  }
  if (
    hostname === 'localhost'
    || hostname === '0.0.0.0'
    || hostname === '[::1]'
    || hostname.startsWith('127.')
    || hostname.endsWith('.local')
  ) {
    errors.push('VITE_API_BASE_URL must not target a local host.')
  }
  if (hostname.includes('staging')) {
    errors.push('A production frontend must not target the staging API.')
  }

  return errors
}

function run() {
  if (!requiresProductionValidation()) {
    console.log('Production deployment environment check skipped outside a production deployment.')
    return
  }

  const errors = validateProductionDeploymentEnvironment()
  if (errors.length === 0) {
    console.log('Production deployment environment check passed.')
    return
  }

  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) run()
