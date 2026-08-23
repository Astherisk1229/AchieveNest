import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { randomInt } from 'node:crypto'
import { appendFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { Pool } = pg
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const gitignorePath = path.join(root, '.gitignore')

// 1. Load and parse environment variables from backend/.env if not already set
try {
  const envContent = await readFile(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (process.env[key] === undefined) {
        process.env[key] = val
      }
    }
  }
} catch (e) {
  // If .env file cannot be read, proceed with existing process.env
}

// 2. Validate required environment variables
const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const dbHost = process.env['database.development.hostname']
const dbPort = Number(process.env['database.development.port'] || 5432)
const dbName = process.env['database.development.database'] || 'postgres'
const dbUser = process.env['database.development.username']
const dbPassword = process.env['database.development.password']

if (!projectUrl || !secretKey || !publishableKey) {
  throw new Error('Preflight Error: Required Supabase environment variables are missing.')
}

if (!dbHost || !dbUser || !dbPassword) {
  throw new Error('Preflight Error: Required development database credentials are missing.')
}

// 3. Verify target project is AchieveNest-Test only (ref: gliqcruavudrjehgbfei)
const TEST_REF = 'gliqcruavudrjehgbfei'
const PROD_REF = 'atlicalzumfunolhukbz'

if (projectUrl.includes(PROD_REF) || dbUser.includes(PROD_REF)) {
  throw new Error('CRITICAL SAFETY STOP: Execution attempted against Production environment! Production must remain untouched.')
}

if (!projectUrl.includes(TEST_REF) || !dbUser.includes(TEST_REF)) {
  throw new Error(`CRITICAL SAFETY STOP: Environment is not connected to AchieveNest-Test (Ref: ${TEST_REF}). Target URL: ${projectUrl}`)
}

// 4. Verify Git-ignored credential storage path
const gitignore = await readFile(gitignorePath, 'utf8')
if (!gitignore.includes('/writable/demo-credentials/*')) {
  throw new Error('Preflight Error: Credentials path is not Git-ignored in backend/.gitignore.')
}

// 5. Initialize Supabase Admin and Database Pool
const admin = createClient(projectUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
})

const database = new Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
})

// 6. Strong guaranteed password generation
function generateStrongPassword(length = 32) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const specials = '!@#$%^&*()-_=+[]{};:,.?/'
  const all = upper + lower + numbers + specials

  // Guarantee at least 1 character of each category
  const guaranteed = [
    upper[randomInt(upper.length)],
    lower[randomInt(lower.length)],
    numbers[randomInt(numbers.length)],
    specials[randomInt(specials.length)],
  ]

  const remaining = Array.from({ length: length - guaranteed.length }, () => all[randomInt(all.length)])
  const combined = [...guaranteed, ...remaining]

  // Crypto shuffle Fisher-Yates
  for (let i = combined.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}

const adminSpecs = [
  {
    institutional_id: '9000000010',
    email: 'hr.admin01@ndmu.edu.ph',
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
    email: 'osad.admin01@ndmu.edu.ph',
    first_name: 'Marcus',
    middle_name: 'Vance',
    last_name: 'Cruz',
    full_name: 'Marcus Vance Cruz',
    designation: 'OSAD Office Holder',
    account_type: 'osad_admin',
    admin_role_key: 'osad_staff',
  }
]

console.log('=== AchieveNest Dedicated Admin Authority Bootstrap ===')
console.log(`Target: AchieveNest-Test (${TEST_REF})`)

// 7. Full Preflight Checks Before ANY Write
console.log('\n[1/4] Running preflight catalog & conflict checks...')

// Verify roles exist in public.roles
const hrRoleRes = await database.query("SELECT id FROM public.roles WHERE role_key = 'hr_staff'")
const osadRoleRes = await database.query("SELECT id FROM public.roles WHERE role_key = 'osad_staff'")

if (hrRoleRes.rowCount === 0 || osadRoleRes.rowCount === 0) {
  await database.end()
  throw new Error('Preflight Error: Required admin roles (hr_staff, osad_staff) not found in public.roles catalog.')
}

const roleIds = {
  hr_staff: hrRoleRes.rows[0].id,
  osad_staff: osadRoleRes.rows[0].id,
}

// Check database constraints exist
const constraintCheck = await database.query(`
  SELECT conname FROM pg_constraint
  WHERE conname IN ('profiles_admin_null_academic_fields_check', 'profiles_admin_designation_check')
`)
if (constraintCheck.rowCount < 2) {
  await database.end()
  throw new Error('Preflight Error: Dedicated admin profile integrity constraints missing. Ensure migration 000004 has run.')
}

// Fetch Supabase Auth existing users
const existingAuthUsers = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
const authUsersList = existingAuthUsers.data?.users || []

// Fetch existing profiles and role assignments
const existingProfiles = (await database.query(`
  SELECT id, institutional_id, institutional_email, account_type
  FROM public.profiles
  WHERE institutional_id IN ('9000000010', '9000000020')
     OR institutional_email IN ('hr.admin01@ndmu.edu.ph', 'osad.admin01@ndmu.edu.ph')
     OR account_type IN ('hr_admin', 'osad_admin')
`)).rows

const existingAdminRoles = (await database.query(`
  SELECT pr.id, pr.profile_id, r.role_key
  FROM public.profile_roles pr
  JOIN public.roles r ON r.id = pr.role_id
  WHERE r.role_key IN ('hr_staff', 'osad_staff') AND pr.is_active = true
`)).rows

// Check for existing bootstrap or partial conflict
const hrAuthExists = authUsersList.some(u => u.email === 'hr.admin01@ndmu.edu.ph')
const osadAuthExists = authUsersList.some(u => u.email === 'osad.admin01@ndmu.edu.ph')
const hrProfileExists = existingProfiles.some(p => p.institutional_email === 'hr.admin01@ndmu.edu.ph' || p.account_type === 'hr_admin')
const osadProfileExists = existingProfiles.some(p => p.institutional_email === 'osad.admin01@ndmu.edu.ph' || p.account_type === 'osad_admin')

const isAlreadyBootstrapped = hrAuthExists && osadAuthExists && hrProfileExists && osadProfileExists

if (isAlreadyBootstrapped) {
  console.log('[BOOTSTRAP SKIPPED] Existing administrative bootstrap detected. All accounts are already provisioned.')
  console.log('Zero modifications performed.')
  await database.end()
  process.exit(0)
}

if (hrAuthExists || osadAuthExists || existingProfiles.length > 0 || existingAdminRoles.length > 0) {
  await database.end()
  throw new Error(`Conflict Detected: System contains partial administrative accounts or orphaned data.
    Auth HR: ${hrAuthExists}, Auth OSAD: ${osadAuthExists}, Profiles: ${existingProfiles.length}, Active Admin Roles: ${existingAdminRoles.length}
    Strict one-time bootstrap policy forbids automatic repair or partial overwrite. Manual review required.`)
}

console.log('[PASS] Preflight passed. No conflicting admin accounts found.')

// 8. Phase B & C — Admin Account Creation with failure tracking
console.log('\n[2/4] Creating dedicated administrative accounts...')

const createdAuthUserIds = []
const credentialsToWrite = []

try {
  // Step A: Create Supabase Auth Users
  const authUsers = {}
  for (const spec of adminSpecs) {
    const password = generateStrongPassword(32)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: spec.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: spec.full_name,
        account_type: spec.account_type,
      }
    })

    if (createErr || !created.user?.id) {
      throw new Error(`Auth user creation failed for ${spec.email}: ${createErr?.message}`)
    }

    const authUser = created.user
    createdAuthUserIds.push(authUser.id)
    authUsers[spec.email] = { authUser, password }
    credentialsToWrite.push(`${spec.email}:${password}`)
    console.log(`  -> Auth user created: ${spec.email} (ID: ${authUser.id})`)
  }

  // Step B: Atomic Database Insertion
  console.log('\n[3/4] Recording profiles, role assignments, and audit logs...')
  await database.query('BEGIN')

  for (const spec of adminSpecs) {
    const { authUser } = authUsers[spec.email]
    const roleId = roleIds[spec.admin_role_key]

    // 1. Insert Profile
    await database.query(`
      INSERT INTO public.profiles (
        id, institutional_id, institutional_email, first_name, middle_name, last_name, suffix, full_name,
        account_type, department_id, degree_program_id, year_level, designation, status, provisioning_method,
        must_change_password, provisioned_at, activated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NULL, $7,
        $8, NULL, NULL, NULL, $9, 'active', 'manual',
        false, now(), now()
      )
    `, [
      authUser.id,
      spec.institutional_id,
      spec.email,
      spec.first_name,
      spec.middle_name,
      spec.last_name,
      spec.full_name,
      spec.account_type,
      spec.designation
    ])

    // 2. Insert Profile Role (active, scope: university)
    const roleInsertRes = await database.query(`
      INSERT INTO public.profile_roles (
        profile_id, role_id, scope_type, scope_id, is_active, assigned_by, assigned_at
      ) VALUES (
        $1, $2, 'university', NULL, true, NULL, now()
      )
      RETURNING id
    `, [authUser.id, roleId])

    const profileRoleId = roleInsertRes.rows[0].id

    // 3. Record Lifecycle Events (provisioned and activated)
    await database.query(`
      INSERT INTO public.account_lifecycle_events (profile_id, event_type, performed_by, reason, occurred_at)
      VALUES
        ($1, 'provisioned', NULL, 'Bootstrapped as dedicated test administrative office holder', now()),
        ($1, 'activated', NULL, 'Activated with dedicated top-level admin role', now())
    `, [authUser.id])

    // 4. Record Role Assignment Event
    await database.query(`
      INSERT INTO public.role_assignment_events (
        profile_role_id, target_profile_id, role_id, event_type, scope_type, scope_id, performed_by, reason, occurred_at
      ) VALUES (
        $1, $2, $3, 'assigned', 'university', NULL, NULL, 'Initial system bootstrap of top-level administrative authority', now()
      )
    `, [profileRoleId, authUser.id, roleId])

    console.log(`  -> Configured ${spec.account_type} (${spec.full_name}) with role [${spec.admin_role_key}]`)
  }

  await database.query('COMMIT')
  console.log('[PASS] Database transaction committed.')

  // Step C: Securely append credentials
  console.log('\n[4/4] Writing credentials to Git-ignored path...')
  const existingCredContent = await readFile(credentialPath, 'utf8').catch(() => '')
  const newLines = credentialsToWrite.filter(c => !existingCredContent.includes(c.split(':')[0]))
  if (newLines.length > 0) {
    await appendFile(credentialPath, (existingCredContent.endsWith('\n') ? '' : '\n') + newLines.join('\n') + '\n')
  }
  console.log(`[PASS] Saved credentials for ${newLines.length} admin accounts in: ${path.relative(root, credentialPath)}`)

} catch (err) {
  console.error('\n[FATAL ERROR] Bootstrap failed during execution. Initiating cleanup...')
  try {
    await database.query('ROLLBACK')
  } catch (rbErr) {
    // Ignore rollback errors if transaction was not started
  }

  for (const userId of createdAuthUserIds) {
    try {
      await admin.auth.admin.deleteUser(userId)
      console.log(`  -> Cleaned up created Auth user: ${userId}`)
    } catch (cleanupErr) {
      console.error(`  -> Failed to delete Auth user ${userId}: ${cleanupErr.message}`)
    }
  }

  await database.end()
  throw err
}

await database.end()
console.log('\n=== Dedicated Admin Authority Bootstrap COMPLETED Successfully ===')
