import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('Personnel Evaluation Setup authentication integration', () => {
  const scaleController = read('backend/app/Controllers/Api/EvaluationScaleController.php')
  const actorService = read('backend/app/Services/AuthenticatedActorService.php')
  const periodController = read('backend/app/Controllers/Api/PersonnelEvaluationPeriodController.php')
  const page = read('frontend/src/pages/hr-admin/PersonnelEvaluationSetupPage.jsx')

  it('removes every stale undefined actor-service call from active code', () => {
    expect(scaleController).not.toContain('getAuthenticatedActor')
  })

  it('passes the real bearer header through the canonical resolver', () => {
    expect(scaleController).toContain("resolveActor($this->request->getHeaderLine('Authorization'))")
    expect(periodController).toContain("resolveActor($this->request->getHeaderLine('Authorization'))")
  })

  it('uses the canonical nested actor DTO and enforces HR roles', () => {
    expect(scaleController).toContain("$actor['profile']['id']")
    expect(scaleController).toContain("in_array('hr_staff', $roles)")
    expect(periodController).toContain("hasRole($actor, 'hr_staff')")
  })

  it('keeps actor resolution MySQL-local and rejects inactive profiles', () => {
    expect(actorService).toContain("$db->table('profiles')")
    expect(actorService).toContain("($profile['status'] ?? '') !== 'active'")
    expect(actorService).not.toMatch(/public\.|::text|::uuid|SupabaseAuthService/)
  })

  it('returns safe authentication and scale-load errors', () => {
    expect(scaleController).toContain('AUTH_TOKEN_INVALID')
    expect(scaleController).toContain('SCALE_CATALOGUE_LOAD_FAILED')
    expect(periodController).toContain('AUTH_RESOLUTION_FAILED')
  })

  it('renders mutually exclusive loading, error, and successful empty states', () => {
    expect(page).toContain('Promise.allSettled')
    expect(page).toContain('Loading ranking setup…')
    expect(page).toContain('The server could not load ranking periods.')
    expect(page).toContain('No ranking period is open for submission.')
    expect(page).toContain('if (periodError) return')
  })

  it('keeps period data usable while independently disabling create on scale failure', () => {
    expect(page).toContain('scaleError')
    expect(page).toContain('disabled={Boolean(scaleError)}')
    expect(page).toContain('Criteria sheets could not be loaded.')
  })
})
