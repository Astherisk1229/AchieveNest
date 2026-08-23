import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { randomInt } from 'node:crypto'
import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const institutionalId = '9000000001'
const email = 'achievenest.demo.personnel01@ndmu.edu.ph'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const admin = createClient(projectUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
const userClient = createClient(projectUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
const database = new Pool({
  host: process.env['database.development.hostname'],
  port: Number(process.env['database.development.port']),
  database: process.env['database.development.database'],
  user: process.env['database.development.username'],
  password: process.env['database.development.password'],
  ssl: { rejectUnauthorized: false },
})

if (!projectUrl || !secretKey || !publishableKey) throw new Error('Required Supabase environment is missing.')

function generatePassword(length = 32) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?/'
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('')
}

const existingAuth = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (existingAuth.error) throw new Error('Unable to inspect Auth users.')
if (existingAuth.data.users.some((user) => user.email === email)) throw new Error('Target personnel Auth user already exists.')
const existingProfile = await database.query('SELECT id FROM public.profiles WHERE institutional_id = $1 OR institutional_email = $2', [institutionalId, email])
if (existingProfile.rowCount > 0) throw new Error('Target personnel profile already exists.')

const password = generatePassword()
const { data: created, error: creationError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (creationError || !created.user?.id) throw new Error('Auth user creation failed.')
const authUuid = created.user.id
await appendFile(credentialPath, `\n${email}:${password}`)

let profileCreated = false
let roleAssigned = false
let lifecycleCreated = false
await database.query('BEGIN')
try {
  const college = await database.query("SELECT id FROM public.colleges WHERE code = 'CEAC' AND status = 'active'")
  const department = await database.query("SELECT id, college_id FROM public.departments WHERE code = 'CSD' AND status = 'active'")
  const role = await database.query("SELECT id FROM public.roles WHERE role_key = 'personnel'")
  if (college.rowCount !== 1 || department.rowCount !== 1 || role.rowCount !== 1) throw new Error('Required college, department, or personnel role did not resolve exactly.')
  if (department.rows[0].college_id !== college.rows[0].id) throw new Error('CSD does not belong to CEAC.')

  await database.query(`INSERT INTO public.profiles
    (id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
     account_type, department_id, degree_program_id, year_level, designation, status, provisioning_method,
     must_change_password, provisioned_at, activated_at)
    VALUES ($1, $2, $3, 'Celia', 'Ramos', 'Flores', NULL, 'Celia Ramos Flores',
      'personnel', $4, NULL, NULL, 'Faculty Member', 'active', 'roster_xlsx', false, now(), now())`,
  [authUuid, institutionalId, email, department.rows[0].id])
  profileCreated = true

  await database.query(`INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active)
    VALUES ($1, $2, 'university', NULL, true)`, [authUuid, role.rows[0].id])
  roleAssigned = true

  await database.query(`INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
    VALUES ($1, 'provisioned', 'Created from validated HR personnel XLSX roster'),
           ($1, 'activated', 'Activated from validated HR personnel XLSX roster')`, [authUuid])
  lifecycleCreated = true
  await database.query('COMMIT')
} catch (error) {
  await database.query('ROLLBACK')
  throw error
}

const { data: signIn, error: signInError } = await userClient.auth.signInWithPassword({ email, password })
const accessToken = signIn.session?.access_token
if (signInError || !accessToken) throw new Error('Personnel sign-in failed.')
const response = await fetch('http://127.0.0.1:8080/api/v1/auth/me', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
const body = await response.json()
const count = async (table) => (await database.query(`SELECT count(*)::int AS count FROM public.${table}`)).rows[0].count
const profilesCount = await count('profiles')
const roleCount = await count('profile_roles')
const lifecycleCount = await count('account_lifecycle_events')
await database.end()

console.log(`institutional_id: ${institutionalId}`)
console.log(`email: ${email}`)
console.log(`auth UUID: ${authUuid}`)
console.log('Auth creation: success')
console.log(`profile creation: ${profileCreated ? 'success' : 'failure'}`)
console.log(`personnel role assignment: ${roleAssigned ? 'success' : 'failure'}`)
console.log(`lifecycle creation: ${lifecycleCreated ? 'success' : 'failure'}`)
console.log('sign-in: success')
console.log(`/auth/me HTTP status: ${response.status}`)
console.log(`returned account_type: ${body.data?.user?.account_type ?? ''}`)
console.log(`returned status: ${body.data?.user?.status ?? ''}`)
console.log(`returned role keys: ${(body.data?.user?.roles ?? []).map((item) => item.role_key).join(',')}`)
console.log(`returned department: ${body.data?.user?.department_id ?? ''}`)
console.log(`returned degree program: ${body.data?.user?.degree_program_id ?? ''}`)
console.log(`returned designation: ${body.data?.user?.designation ?? ''}`)
console.log(`auth.users count: ${existingAuth.data.users.length + 1}`)
console.log(`profiles count: ${profilesCount}`)
console.log(`profile_roles count: ${roleCount}`)
console.log(`account_lifecycle_events count: ${lifecycleCount}`)
console.log('production touched: no')
