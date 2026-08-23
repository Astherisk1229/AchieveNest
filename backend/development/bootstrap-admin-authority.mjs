import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { randomInt } from 'node:crypto'
import { appendFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const gitignorePath = path.join(root, '.gitignore')

const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!projectUrl || !secretKey || !publishableKey) {
  throw new Error('Required Supabase environment is missing.')
}

const gitignore = await readFile(gitignorePath, 'utf8')
if (!gitignore.includes('/writable/demo-credentials/*')) {
  throw new Error('Credentials path is not Git-ignored.')
}

const admin = createClient(projectUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})
const userClient = createClient(projectUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})

const database = new Pool({
  host: process.env['database.development.hostname'],
  port: Number(process.env['database.development.port']),
  database: process.env['database.development.database'],
  user: process.env['database.development.username'],
  password: process.env['database.development.password'],
  ssl: { rejectUnauthorized: false },
})

function generatePassword(length = 32) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?/'
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('')
}

const adminProfiles = [
  {
    institutional_id: '9000000010',
    email: 'achievenest.demo.hrdirector@ndmu.edu.ph',
    first_name: 'Evelyn',
    middle_name: 'Tan',
    last_name: 'Mercado',
    full_name: 'Evelyn Tan Mercado',
    designation: 'HR Director',
    admin_role_key: 'hr_staff',
    dept_code: 'HRD', // or CSD fallback
  },
  {
    institutional_id: '9000000020',
    email: 'achievenest.demo.osaddirector@ndmu.edu.ph',
    first_name: 'Marcus',
    middle_name: 'Vance',
    last_name: 'Cruz',
    full_name: 'Marcus Vance Cruz',
    designation: 'OSAD Director',
    admin_role_key: 'osad_staff',
    dept_code: 'OSAD',
  }
]

console.log('--- Phase 2: Bootstrapping HR & OSAD Administrative Authority ---')

for (const adminProfile of adminProfiles) {
  console.log(`Processing: ${adminProfile.full_name} (${adminProfile.email})...`)

  // Check if Auth user exists
  const existingAuthUsers = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  let authUser = existingAuthUsers.data?.users?.find(u => u.email === adminProfile.email)
  const password = generatePassword()

  if (!authUser) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: adminProfile.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: adminProfile.full_name, account_type: 'personnel' }
    })
    if (createErr || !created.user?.id) throw new Error(`Auth user creation failed: ${createErr?.message}`)
    authUser = created.user
    await appendFile(credentialPath, `\n${adminProfile.email}:${password}`)
    console.log(`  -> Auth user created: ${authUser.id}`)
  } else {
    // Reset password for test credentials record
    await admin.auth.admin.updateUserById(authUser.id, { password })
    await appendFile(credentialPath, `\n${adminProfile.email}:${password}`)
    console.log(`  -> Auth user exists: ${authUser.id} (password updated in credentials file)`)
  }

  // Ensure department and roles exist in database
  await database.query('BEGIN')
  try {
    const personnelRole = (await database.query("SELECT id FROM public.roles WHERE role_key = 'personnel'")).rows[0]
    const adminRole = (await database.query("SELECT id FROM public.roles WHERE role_key = $1", [adminProfile.admin_role_key])).rows[0]
    
    if (!personnelRole || !adminRole) {
      throw new Error(`Required role definition missing for ${adminProfile.admin_role_key}`)
    }

    // Get any active department for personnel department foreign key
    const dept = (await database.query("SELECT id FROM public.departments WHERE status = 'active' LIMIT 1")).rows[0]
    const deptId = dept ? dept.id : null

    // Check or upsert profile
    const existingProfile = await database.query("SELECT id FROM public.profiles WHERE id = $1", [authUser.id])
    if (existingProfile.rowCount === 0) {
      await database.query(`
        INSERT INTO public.profiles
          (id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
           account_type, department_id, degree_program_id, year_level, designation, status, provisioning_method,
           must_change_password, provisioned_at, activated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7,
          'personnel', $8, NULL, NULL, $9, 'active', 'bootstrap_admin', false, now(), now())
      `, [
        authUser.id,
        adminProfile.institutional_id,
        adminProfile.email,
        adminProfile.first_name,
        adminProfile.middle_name,
        adminProfile.last_name,
        adminProfile.full_name,
        deptId,
        adminProfile.designation
      ])
      console.log(`  -> Profile record inserted`)
    }

    // Assign base role 'personnel'
    await database.query(`
      INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active)
      VALUES ($1, $2, 'university', NULL, true)
      ON CONFLICT (profile_id, role_id, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET is_active = true
    `, [authUser.id, personnelRole.id])

    // Assign administrative role ('hr_staff' or 'osad_staff')
    await database.query(`
      INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active)
      VALUES ($1, $2, 'university', NULL, true)
      ON CONFLICT (profile_id, role_id, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
      DO UPDATE SET is_active = true
    `, [authUser.id, adminRole.id])

    // Record lifecycle events
    await database.query(`
      INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
      VALUES ($1, 'provisioned', 'Bootstrapped as test administrative office holder'),
             ($1, 'activated', 'Activated with top-level role')
    `, [authUser.id])

    await database.query('COMMIT')
    console.log(`  -> Roles assigned: personnel + ${adminProfile.admin_role_key}`)
  } catch (err) {
    await database.query('ROLLBACK')
    throw err
  }
}

await database.end()
console.log('--- Phase 2 Bootstrap Completed Successfully ---')
