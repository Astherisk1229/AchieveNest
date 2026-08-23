import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')

// 1. Load env
const envContent = await readFile(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx !== -1) {
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
  }
}

const projectUrl = env.SUPABASE_URL
const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY
const baseUrl = env['app.baseURL'] || 'http://localhost:8080/'

const database = new Pool({
  host: env['database.development.hostname'],
  port: Number(env['database.development.port'] || 5432),
  database: env['database.development.database'] || 'postgres',
  user: env['database.development.username'],
  password: env['database.development.password'],
  ssl: { rejectUnauthorized: false },
})

console.log('=== Post-Bootstrap Verification Suite ===\n')

// Test 1: Profiles count and composition
console.log('1. Verifying Profiles in Database...')
const profilesRes = await database.query(`
  SELECT id, institutional_id, institutional_email, full_name, account_type, designation,
         department_id, degree_program_id, year_level, status
  FROM public.profiles
  ORDER BY account_type, institutional_id
`)
const profiles = profilesRes.rows

const students = profiles.filter(p => p.account_type === 'student')
const personnel = profiles.filter(p => p.account_type === 'personnel')
const hrAdmins = profiles.filter(p => p.account_type === 'hr_admin')
const osadAdmins = profiles.filter(p => p.account_type === 'osad_admin')

console.log(`Total Profiles: ${profiles.length} (Students: ${students.length}, Personnel: ${personnel.length}, HR Admins: ${hrAdmins.length}, OSAD Admins: ${osadAdmins.length})`)

if (students.length !== 5 || personnel.length !== 5 || hrAdmins.length !== 1 || osadAdmins.length !== 1) {
  throw new Error(`Profile count mismatch! Expected 5 student, 5 personnel, 1 hr_admin, 1 osad_admin. Total: 12. Got ${profiles.length}`)
}
console.log('  [PASS] Exactly 12 application profiles verified.')

// Test 2: Admin Profile Integrity
const hr = hrAdmins[0]
const osad = osadAdmins[0]

if (hr.institutional_id !== '9000000010' || hr.institutional_email !== 'hr.admin01@ndmu.edu.ph' || hr.designation !== 'HR Director' || hr.department_id !== null || hr.degree_program_id !== null || hr.year_level !== null || hr.status !== 'active') {
  throw new Error(`HR Admin profile integrity check failed: ${JSON.stringify(hr)}`)
}
console.log('  [PASS] HR Admin profile integrity verified (null academic fields, nonblank designation, active).')

if (osad.institutional_id !== '9000000020' || osad.institutional_email !== 'osad.admin01@ndmu.edu.ph' || osad.designation !== 'OSAD Office Holder' || osad.department_id !== null || osad.degree_program_id !== null || osad.year_level !== null || osad.status !== 'active') {
  throw new Error(`OSAD Admin profile integrity check failed: ${JSON.stringify(osad)}`)
}
console.log('  [PASS] OSAD Admin profile integrity verified (null academic fields, nonblank designation, active).')

// Test 3: Role Assignments
console.log('\n2. Verifying Role Assignments & Isolation...')
const hrRoles = (await database.query(`
  SELECT r.role_key FROM public.profile_roles pr
  JOIN public.roles r ON r.id = pr.role_id
  WHERE pr.profile_id = $1 AND pr.is_active = true
`, [hr.id])).rows.map(r => r.role_key)

const osadRoles = (await database.query(`
  SELECT r.role_key FROM public.profile_roles pr
  JOIN public.roles r ON r.id = pr.role_id
  WHERE pr.profile_id = $1 AND pr.is_active = true
`, [osad.id])).rows.map(r => r.role_key)

if (!hrRoles.includes('hr_staff') || hrRoles.includes('personnel')) {
  throw new Error(`HR Admin roles invalid! Expected ['hr_staff'] without 'personnel'. Found: ${JSON.stringify(hrRoles)}`)
}
console.log('  [PASS] HR Admin has only hr_staff (personnel role absent).')

if (!osadRoles.includes('osad_staff') || osadRoles.includes('personnel')) {
  throw new Error(`OSAD Admin roles invalid! Expected ['osad_staff'] without 'personnel'. Found: ${JSON.stringify(osadRoles)}`)
}
console.log('  [PASS] OSAD Admin has only osad_staff (personnel role absent).')

// Test 4: Audit Trail Records
console.log('\n3. Verifying Audit Events...')
for (const admin of [hr, osad]) {
  const lifecycleEvents = (await database.query(`
    SELECT event_type FROM public.account_lifecycle_events WHERE profile_id = $1 ORDER BY occurred_at
  `, [admin.id])).rows.map(e => e.event_type)

  if (lifecycleEvents.length !== 2 || lifecycleEvents[0] !== 'provisioned' || lifecycleEvents[1] !== 'activated') {
    throw new Error(`Lifecycle events invalid for ${admin.account_type}: ${JSON.stringify(lifecycleEvents)}`)
  }

  const roleEvents = (await database.query(`
    SELECT event_type, scope_type FROM public.role_assignment_events WHERE target_profile_id = $1
  `, [admin.id])).rows

  if (roleEvents.length !== 1 || roleEvents[0].event_type !== 'assigned') {
    throw new Error(`Role assignment events invalid for ${admin.account_type}: ${JSON.stringify(roleEvents)}`)
  }
}
console.log('  [PASS] Lifecycle and role assignment audit events exist exactly once per admin.')

// Test 5: Authentication with Credentials
console.log('\n4. Verifying Supabase Authentication with Test Credentials...')
const credsText = await readFile(credentialPath, 'utf8')
const credMap = {}
for (const line of credsText.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed) continue
  const [email, pwd] = trimmed.split(':')
  if (email && pwd) credMap[email.trim()] = pwd.trim()
}

const authClient = createClient(projectUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})

const hrPassword = credMap['hr.admin01@ndmu.edu.ph']
const osadPassword = credMap['osad.admin01@ndmu.edu.ph']

if (!hrPassword || !osadPassword) {
  throw new Error('Could not find generated passwords for HR or OSAD admin in credentials file!')
}

const { data: hrAuth, error: hrAuthErr } = await authClient.auth.signInWithPassword({
  email: 'hr.admin01@ndmu.edu.ph',
  password: hrPassword,
})
if (hrAuthErr || !hrAuth.session?.access_token) {
  throw new Error(`HR Admin login failed: ${hrAuthErr?.message}`)
}
console.log(`  [PASS] HR Admin login succeeded (Session UUID: ${hrAuth.user.id}).`)

const { data: osadAuth, error: osadAuthErr } = await authClient.auth.signInWithPassword({
  email: 'osad.admin01@ndmu.edu.ph',
  password: osadPassword,
})
if (osadAuthErr || !osadAuth.session?.access_token) {
  throw new Error(`OSAD Admin login failed: ${osadAuthErr?.message}`)
}
console.log(`  [PASS] OSAD Admin login succeeded (Session UUID: ${osadAuth.user.id}).`)

await database.end()
console.log('\n=== All Post-Bootstrap Verifications PASSED Successfully ===')
