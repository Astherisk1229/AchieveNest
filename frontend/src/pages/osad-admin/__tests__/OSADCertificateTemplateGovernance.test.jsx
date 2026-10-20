import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const sourceRoot = new URL('../../../../', import.meta.url)
const read = path => readFileSync(new URL(path, sourceRoot), 'utf8')

describe('OSAD certificate administration retirement', () => {
  it('removes certificate authoring from OSAD navigation, permissions, and dashboard', () => {
    expect(read('src/config/navigationCatalog.js')).not.toContain('osad-certificate-templates')
    expect(read('src/security/permissionResolver.js')).not.toContain('osad.certificate_template.manage')
    expect(read('src/pages/osad-admin/OSADDashboardPage.jsx')).not.toContain('OSADCertificateTemplatesPage')
    expect(existsSync(new URL('../OSADCertificateTemplatesPage.jsx', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../CertificateStudioPage.jsx', import.meta.url))).toBe(false)
  })

  it('removes template editor and asset management API routes', () => {
    const routes = read('../backend/app/Config/Routes.php')
    expect(routes).not.toContain('Api\\CertificateTemplateController')
    expect(routes).not.toContain('Api\\CertificateAssetController')
    expect(read('src/App.jsx')).not.toContain('CertificateStudioPage')
  })

  it('redirects old OSAD editor links and template tabs to the dashboard', () => {
    expect(read('src/App.jsx')).toContain('/osad/certificate-templates/*')
    expect(read('src/pages/osad-admin/OSADDashboardPage.jsx')).toContain("'certificate-templates'")
  })
})
