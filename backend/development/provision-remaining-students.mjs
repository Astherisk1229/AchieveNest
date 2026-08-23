import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { randomInt } from 'node:crypto'
import { appendFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const workbookPath = 'C:/Users/Admin/Downloads/AchieveNest_OSAD_Student_Demo_Roster_Updated.xlsx'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const targetIds = new Set(['2026000002', '2026000003', '2026000004', '2026000005'])
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

function readRosterRows() {
  const workbook = XLSX.readFile(workbookPath, { cellDates: false })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false })
  const headers = rows[3].map((header) => String(header ?? '').trim().toLowerCase())
  return rows.slice(4)
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? null])))
    .filter((row) => targetIds.has(String(row.institutional_id)))
}

async function listAuthUsers() {
  const users = []
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error('Unable to inspect Auth users.')
    users.push(...data.users)
    if (data.users.length < 1000) return users
  }
}

const results = []
const rosterRows = readRosterRows()
if (rosterRows.length !== targetIds.size) throw new Error('The workbook did not contain exactly the four requested student rows.')

for (const row of rosterRows) {
  const institutionalId = String(row.institutional_id)
  const email = String(row.institutional_email).trim()
  const result = { institutionalId, email, authUuid: '', authCreation: 'failure', profileCreation: 'failure', roleAssignment: 'failure', lifecycleCreation: 'failure', signIn: 'failure', httpStatus: '', accountType: '', status: '', role: '', department: '', degreeProgram: '', failure: '' }
  let password = generatePassword()
  let authCreated = false

  try {
    const existingUsers = await listAuthUsers()
    if (existingUsers.some((user) => user.email === email)) throw new Error('Auth user already exists.')
    const existingProfile = await database.query('SELECT id FROM public.profiles WHERE institutional_id = $1 OR institutional_email = $2', [institutionalId, email])
    if (existingProfile.rowCount > 0) throw new Error('Profile already exists.')

    const { data: created, error: creationError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (creationError || !created.user?.id) throw new Error('Auth user creation failed.')
    authCreated = true
    result.authUuid = created.user.id
    result.authCreation = 'success'
    await appendFile(credentialPath, `\n${email}:${password}`)

    await database.query('BEGIN')
    try {
      const college = await database.query('SELECT id FROM public.colleges WHERE code = $1 AND status = $2', [String(row.college_code).trim().toUpperCase(), 'active'])
      const department = await database.query('SELECT id, college_id FROM public.departments WHERE code = $1 AND status = $2', [String(row.department_code).trim().toUpperCase(), 'active'])
      const program = await database.query('SELECT id, department_id FROM public.degree_programs WHERE code = $1 AND status = $2', [String(row.degree_program_code).trim().toUpperCase(), 'active'])
      const role = await database.query("SELECT id FROM public.roles WHERE role_key = 'student'")
      if (college.rowCount !== 1 || department.rowCount !== 1 || program.rowCount !== 1 || role.rowCount !== 1) throw new Error('Academic or role code did not resolve exactly.')
      if (department.rows[0].college_id !== college.rows[0].id) throw new Error('Department does not belong to college.')
      if (program.rows[0].department_id !== department.rows[0].id) throw new Error('Degree program does not belong to department.')

      await database.query(`INSERT INTO public.profiles
        (id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
         account_type, department_id, degree_program_id, year_level, status, provisioning_method,
         must_change_password, provisioned_at, activated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'student', $9, $10, $11, $12, 'roster_xlsx', false, now(), now())`,
      [result.authUuid, institutionalId, email, String(row.first_name).trim(), row.middle_name ? String(row.middle_name).trim() : null, String(row.last_name).trim(), row.suffix ? String(row.suffix).trim() : null, `${String(row.first_name).trim()}${row.middle_name ? ` ${String(row.middle_name).trim()}` : ''} ${String(row.last_name).trim()}`, department.rows[0].id, program.rows[0].id, String(row.year_level).trim(), String(row.account_status).trim().toLowerCase()])
      result.profileCreation = 'success'

      await database.query(`INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active)
        VALUES ($1, $2, 'university', NULL, true)`, [result.authUuid, role.rows[0].id])
      result.roleAssignment = 'success'

      await database.query(`INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
        VALUES ($1, 'provisioned', 'Created from validated OSAD student XLSX roster'), ($1, 'activated', 'Activated from validated OSAD student XLSX roster')`, [result.authUuid])
      result.lifecycleCreation = 'success'
      await database.query('COMMIT')
    } catch (error) {
      await database.query('ROLLBACK')
      throw error
    }

    const { data: signIn, error: signInError } = await userClient.auth.signInWithPassword({ email, password })
    const accessToken = signIn.session?.access_token
    if (signInError || !accessToken) throw new Error('Student sign-in failed.')
    result.signIn = 'success'
    const response = await fetch('http://127.0.0.1:8080/api/v1/auth/me', { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
    const body = await response.json()
    result.httpStatus = String(response.status)
    result.accountType = body.data?.user?.account_type ?? ''
    result.status = body.data?.user?.status ?? ''
    result.role = (body.data?.user?.roles ?? []).map((item) => item.role_key).join(',')
    result.department = body.data?.user?.department_id ?? ''
    result.degreeProgram = body.data?.user?.degree_program_id ?? ''
  } catch (error) {
    result.failure = error instanceof Error ? error.message : 'Unknown provisioning failure.'
    if (authCreated && !result.httpStatus) result.signIn = 'failure'
  }
  results.push(result)
}

const finalUsers = await listAuthUsers()
const count = async (table) => (await database.query(`SELECT count(*)::int AS count FROM public.${table}`)).rows[0].count
const profilesCount = await count('profiles')
const rolesCount = await count('profile_roles')
const lifecycleCount = await count('account_lifecycle_events')
await database.end()

for (const result of results) {
  console.log(`institutional_id: ${result.institutionalId}`)
  console.log(`email: ${result.email}`)
  console.log(`auth UUID: ${result.authUuid}`)
  console.log(`auth creation: ${result.authCreation}`)
  console.log(`profile creation: ${result.profileCreation}`)
  console.log(`role assignment: ${result.roleAssignment}`)
  console.log(`lifecycle creation: ${result.lifecycleCreation}`)
  console.log(`sign-in: ${result.signIn}`)
  console.log(`/auth/me HTTP status: ${result.httpStatus}`)
  console.log(`returned account_type: ${result.accountType}`)
  console.log(`returned status: ${result.status}`)
  console.log(`returned role: ${result.role}`)
  console.log(`returned department: ${result.department}`)
  console.log(`returned degree program: ${result.degreeProgram}`)
}
console.log(`auth.users count: ${finalUsers.length}`)
console.log(`profiles count: ${profilesCount}`)
console.log(`profile_roles count: ${rolesCount}`)
console.log(`account_lifecycle_events count: ${lifecycleCount}`)
console.log(`failed Student rows: ${results.filter((result) => result.failure).map((result) => `${result.institutionalId} (${result.failure})`).join(', ') || 'none'}`)
console.log('production touched: no')
