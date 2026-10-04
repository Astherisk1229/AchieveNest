import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '../../../../..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

describe('Phase 5 item 5: digital certificates', () => {
  it('backend lists issued certificates with scoping', () => {
    expect(read('backend/app/Config/Routes.php')).toContain("get('certificates', 'Api\\CertificateController::index')")
    const c = read('backend/app/Controllers/Api/CertificateController.php')
    expect(c).toContain('public function index')
    expect(c).toContain('getModeratedOrganizationIds')
  })
  it('service exposes list, revoke and reissue against real routes', () => {
    const s = read('frontend/src/services/certificateService.js')
    expect(s).toContain("apiClient.get('/certificates'")
    expect(s).toContain('/revoke`')
    expect(s).toContain('/reissue`')
  })
  it('workspace no longer reads localStorage history and has no hard-coded verification claim', () => {
    const w = read('frontend/src/pages/personnel/organization-moderator/certificates/DigitalCertificatesWorkspace.jsx')
    expect(w).not.toContain('CertificateIssuanceController')
    expect(w).not.toContain('100% Verified')
    expect(w).toContain('IssuedCertificatesPanel')
  })
  it('revoke/reissue are only offered with canManage and send idempotency keys', () => {
    const p = read('frontend/src/components/certificates/IssuedCertificatesPanel.jsx')
    expect(p).toContain('canManage &&')
    expect(p).toContain('idempotency_key')
    expect(read('frontend/src/pages/osad-admin/OSADCertificateTemplatesPage.jsx')).toContain('<IssuedCertificatesPanel canManage />')
  })
})
