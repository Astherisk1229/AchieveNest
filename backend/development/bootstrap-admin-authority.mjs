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
    account_type: 'hr_admin',
    admin_role_key: 'hr_staff',
  },
  {
    institutional_id: '9000000020',
    email: 'achievenest.demo.osaddirector@ndmu.edu.ph',
    first_name: 'Marcus',
    middle_name: 'Vance',
    last_name: 'Cruz',
    full_name: 'Marcus Vance Cruz',
    designation: 'OSAD Office Holder',
    account_type: 'osad_admin',
    admin_role_key: 'osad_staff',
  }
]

console.log('--- Phase 2: Bootstrapping Dedicated HR & OSAD Administrative Authority ---')

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
      user_metadata: { full_name: adminProfile.full_name, account_type: adminProfile.account_type }
    })
    if (createErr || !created.user?.id) throw new Error(`Auth user creation failed: ${createErr?.message}`)
    authUser = created.user
    await appendFile(credentialPath, `\n${adminProfile.email}:${password}`)
    console.log(`  -> Auth user created: ${authUser.id}`)
  } else {
    // Reset password for test credentials record
    await admin.auth.admin.updateUserById(authUser.id, { password, user_metadata: { account_type: adminProfile.account_type } })
    await appendFile(credentialPath, `\n${adminProfile.email}:${password}`)
    console.log(`  -> Auth user exists: ${authUser.id} (password updated in credentials file)`)
  }

  await database.query('BEGIN')
  try {
    const adminRole = (await database.query("SELECT id FROM public.roles WHERE role_key = $1", [adminProfile.admin_role_key])).rows[0]
    if (!adminRole) {
      throw new Error(`Required role definition missing for ${adminProfile.admin_role_key}`)
    }

    // Upsert profile with dedicated account_type
    const existingProfile = await database.query("SELECT id FROM public.profiles WHERE id = $1", [authUser.id])
    if (existingProfile.rowCount === 0) {
      await database.query(`
        INSERT INTO public.profiles
          (id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
           account_type, department_id, degree_program_id, year_level, designation, status, provisioning_method,
           must_change_password, provisioned_at, activated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NULL, $7,
          $8, NULL, NULL, NULL, $9, 'active', 'manual', false, now(), now())
      `, [
        authUser.id,
        adminProfile.institutional_id,
        adminProfile.email,
        adminProfile.first_name,
        adminProfile.middle_name,
        adminProfile.last_name,
        adminProfile.full_name,
        adminProfile.account_type,
        adminProfile.designation
      ])
      console.log(`  -> Dedicated admin profile record inserted (${adminProfile.account_type})`)
    } else {
      await database.query(`
        UPDATE public.profiles
        SET account_type = $1, designation = $2, status = 'active'
        WHERE id = $3
      `, [adminProfile.account_type, adminProfile.designation, authUser.id])
      console.log(`  -> Profile updated to dedicated account_type: ${adminProfile.account_type}`)
    }

    // Assign dedicated administrative role ('hr_staff' or 'osad_staff')
    const roleInsertRes = await database.query(`
      INSERT INTO public.profile_roles (profile_id, role_id, scope_type, scope_id, is_active, assigned_at)
      VALUES ($1, $2, 'university', NULL, true, now())
      ON CONFLICT (profile_id, role_id, scope_type, scope_id) WHERE is_active = true
      DO UPDATE SET is_active = true, revoked_at = NULL
      RETURNING id
    `, [authUser.id, adminRole.id])

    const profileRoleId = roleInsertRes.rows[0]?.id

    // Record lifecycle events
    await database.query(`
      INSERT INTO public.account_lifecycle_events (profile_id, event_type, reason)
      VALUES ($1, 'provisioned', 'Bootstrapped as dedicated test administrative office holder'),
             ($1, 'activated', 'Activated with dedicated top-level admin role')
    `, [authUser.id])

    // Record role assignment audit in role_assignment_events
    await database.query(`
      INSERT INTO public.role_assignment_events (profile_role_id, target_profile_id, role_id, event_type, scope_type, scope_id, reason)
      VALUES ($1, $2, $3, 'assigned', 'university', NULL, 'Initial system bootstrap of top-level administrative authority')
    `, [profileRoleId, authUser.id, adminRole.id])

    await database.query('COMMIT')
    console.log(`  -> Dedicated role assigned: ${adminProfile.admin_role_key}`)
  } catch (err) {
    await database.query('ROLLBACK')
    throw err
  }
}

await database.end()
console.log('--- Phase 2 Bootstrap Completed Successfully ---')
