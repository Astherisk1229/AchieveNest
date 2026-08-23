import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { randomInt } from 'node:crypto'
import { appendFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const email = 'achievenest.demo.student01@ndmu.edu.ph'
const institutionalId = '2026000001'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const admin = createClient(projectUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
const userClient = createClient(projectUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
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

const users = []
let page = 1
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw new Error('Unable to inspect Auth users.')
  users.push(...data.users)
  if (data.users.length < 1000) break
  page += 1
}
if (users.some((user) => user.email === email)) throw new Error('Target student Auth user already exists.')

const existingProfile = await database.query('SELECT id FROM public.profiles WHERE institutional_id = $1 OR institutional_email = $2', [institutionalId, email])
if (existingProfile.rowCount > 0) throw new Error('Target student profile already exists.')

const password = generatePassword()
const { data: created, error: creationError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
if (creationError || !created.user?.id) throw new Error('Auth user creation failed.')
const authUuid = created.user.id
await appendFile(credentialPath, `\n${email}:${password}`)

let profileCreated = false
let roleAssigned = false
let lifecycleCreated = false
try {
  await database.query('BEGIN')
  const college = await database.query('SELECT id FROM public.colleges WHERE code = $1 AND status = $2', ['CED', 'active'])
  const department = await database.query('SELECT id, college_id FROM public.departments WHERE code = $1 AND status = $2', ['PEFS', 'active'])
  const program = await database.query('SELECT id, department_id FROM public.degree_programs WHERE code = $1 AND status = $2', ['BPED', 'active'])
  const role = await database.query('SELECT id FROM public.roles WHERE role_key = $1', ['student'])
  if (college.rowCount !== 1 || department.rowCount !== 1 || program.rowCount !== 1 || role.rowCount !== 1) throw new Error('Required academic or role code did not resolve exactly.')
  if (department.rows[0].college_id !== college.rows[0].id) throw new Error('PEFS does not belong to CED.')
  if (program.rows[0].department_id !== department.rows[0].id) throw new Error('BPED does not belong to PEFS.')

  await database.query(`INSERT INTO public.profiles
    (id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
     account_type, department_id, degree_program_id, year_level, status, provisioning_method,
     must_change_password, provisioned_at, activated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now())`,
  [authUuid, institutionalId, email, 'Ari', 'Santos', 'Del Rosario', null, 'Ari Santos Del Rosario', 'student', department.rows[0].id, program.rows[0].id, '1', 'active', 'roster_xlsx', false])
  profileCreated = true

  await database.query(`INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active)
    VALUES ($1, $2, 'university', NULL, true)`, [authUuid, role.rows[0].id])
  roleAssigned = true

  await database.query(`INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
    VALUES ($1, 'provisioned', 'Created from validated OSAD student XLSX roster')`, [authUuid])
  await database.query(`INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
    VALUES ($1, 'activated', 'Activated from validated OSAD student XLSX roster')`, [authUuid])
  lifecycleCreated = true
  await database.query('COMMIT')
} catch (error) {
  await database.query('ROLLBACK')
  throw error
}

const { data: signIn, error: signInError } = await userClient.auth.signInWithPassword({ email, password })
const accessToken = signIn.session?.access_token
if (signInError || !accessToken) throw new Error('Student sign-in failed.')
const response = await fetch('http://127.0.0.1:8080/api/v1/auth/me', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
const responseBody = await response.json()
const profileCount = await database.query('SELECT count(*)::int AS count FROM public.profiles')
const roleCount = await database.query('SELECT count(*)::int AS count FROM public.profile_roles')
await database.end()

console.log(`email: ${email}`)
console.log(`auth UUID: ${authUuid}`)
console.log('Auth creation: success')
console.log(`profile creation: ${profileCreated ? 'success' : 'failure'}`)
console.log(`student role assignment: ${roleAssigned ? 'success' : 'failure'}`)
console.log(`lifecycle record creation: ${lifecycleCreated ? 'success' : 'failure'}`)
console.log('sign-in: success')
console.log(`/api/v1/auth/me HTTP status: ${response.status}`)
console.log(`returned account_type: ${responseBody.data?.user?.account_type ?? ''}`)
console.log(`returned status: ${responseBody.data?.user?.status ?? ''}`)
console.log(`returned role keys: ${(responseBody.data?.user?.roles ?? []).map((roleItem) => roleItem.role_key).join(',')}`)
console.log(`returned department: ${responseBody.data?.user?.department_id ?? ''}`)
console.log(`returned degree program: ${responseBody.data?.user?.degree_program_id ?? ''}`)
console.log(`auth.users count: ${users.length + 1}`)
console.log(`profiles count: ${profileCount.rows[0].count}`)
console.log(`profile_roles count: ${roleCount.rows[0].count}`)
console.log('production touched: no')
