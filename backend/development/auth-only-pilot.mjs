import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pilotEmail = 'achievenest.authpilot@ndmu.edu.ph'
const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8080'

if (!projectUrl || !secretKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.')
}

if (!publishableKey) {
  throw new Error('A publishable Supabase key is required.')
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
)

const supabaseUser = createClient(projectUrl, publishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

function generatePassword(length = 32) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?/'
  const password = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ'[randomInt(24)],
    'abcdefghijkmnopqrstuvwxyz'[randomInt(24)],
    '23456789'[randomInt(8)],
    '!@#$%^&*()-_=+[]{};:,.?/'[randomInt(23)],
  ]

  while (password.length < length) {
    password.push(alphabet[randomInt(alphabet.length)])
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[password[index], password[swapIndex]] = [password[swapIndex], password[index]]
  }

  return password.join('')
}

async function countRows(table) {
  const { count, error } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Unable to count ${table}.`)
  }

  return count ?? 0
}

const credentialDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'writable',
  'demo-credentials',
)
const credentialPath = path.join(credentialDirectory, 'achievenest-demo-credentials.txt')
const { data: initialUsersResponse, error: initialUsersError } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})
if (initialUsersError) {
  throw new Error('Unable to inspect Auth users.')
}

const existingPilot = initialUsersResponse.users.find((user) => user.email === pilotEmail)
let generatedPassword
let creationSuccess

if (existingPilot) {
  const credentialContents = await readFile(credentialPath, 'utf8')
  const credentialSeparator = credentialContents.indexOf(':')
  generatedPassword = credentialSeparator > -1
    ? credentialContents.slice(credentialSeparator + 1)
    : ''
  creationSuccess = Boolean(generatedPassword)
} else {
  generatedPassword = generatePassword()
  await mkdir(credentialDirectory, { recursive: true })
  await writeFile(credentialPath, `${pilotEmail}:${generatedPassword}`, { encoding: 'utf8', mode: 0o600 })

  const { data: createdUserResponse, error: creationError } = await supabaseAdmin.auth.admin.createUser({
    email: pilotEmail,
    password: generatedPassword,
    email_confirm: true,
  })

  creationSuccess = !creationError && Boolean(createdUserResponse?.user?.id)
  if (!creationSuccess) {
    throw new Error('Auth user creation failed.')
  }
}

const { data: usersResponse, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})
if (usersError || !usersResponse.users.some((user) => user.email === pilotEmail)) {
  throw new Error('Created Auth user was not found during confirmation.')
}

const { data: signInResponse, error: signInError } = await supabaseUser.auth.signInWithPassword({
  email: pilotEmail,
  password: generatedPassword,
})

const accessToken = signInResponse?.session?.access_token
const signInSuccess = !signInError && typeof accessToken === 'string' && accessToken.length > 0
if (!signInSuccess) {
  throw new Error('Supabase sign-in failed.')
}

const authUsersCount = usersResponse.users.length
const profilesCount = await countRows('profiles')
const profileRolesCount = await countRows('profile_roles')
const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  },
})
const responseBody = await response.json()
const applicationErrorCode = responseBody?.error?.code || ''

console.log(`pilot email: ${pilotEmail}`)
console.log(`Auth user creation: ${creationSuccess ? 'success' : 'failure'}`)
console.log(`sign-in: ${signInSuccess ? 'success' : 'failure'}`)
console.log(`/api/v1/auth/me HTTP status: ${response.status}`)
console.log(`application error code: ${applicationErrorCode}`)
console.log(`auth.users count: ${authUsersCount}`)
console.log(`profiles count: ${profilesCount}`)
console.log(`profile_roles count: ${profileRolesCount}`)

if (response.status !== 403 || applicationErrorCode !== 'PROFILE_NOT_FOUND') {
  process.exitCode = 1
}
