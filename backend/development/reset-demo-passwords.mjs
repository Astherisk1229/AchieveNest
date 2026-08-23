import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const credentialPath = path.join(root, 'writable', 'demo-credentials', 'achievenest-demo-credentials.txt')
const gitignorePath = path.join(root, '.gitignore')
const emails = [
  'achievenest.demo.student01@ndmu.edu.ph',
  'achievenest.demo.student02@ndmu.edu.ph',
  'achievenest.demo.student03@ndmu.edu.ph',
  'achievenest.demo.student04@ndmu.edu.ph',
  'achievenest.demo.student05@ndmu.edu.ph',
  'achievenest.demo.personnel01@ndmu.edu.ph',
  'achievenest.demo.personnel02@ndmu.edu.ph',
  'achievenest.demo.personnel03@ndmu.edu.ph',
  'achievenest.demo.personnel04@ndmu.edu.ph',
  'achievenest.demo.personnel05@ndmu.edu.ph',
]
const projectUrl = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!projectUrl || !secretKey || !publishableKey) throw new Error('Required Supabase environment is missing.')
const gitignore = await readFile(gitignorePath, 'utf8')
if (!gitignore.includes('/writable/demo-credentials/*')) throw new Error('Credentials path is not Git-ignored.')

const admin = createClient(projectUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
const userClient = createClient(projectUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
const users = []
for (let page = 1; ; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) throw new Error('Unable to inspect Auth users.')
  users.push(...data.users)
  if (data.users.length < 1000) break
}
const found = emails.map((email) => ({ email, user: users.find((user) => user.email === email) }))
if (found.some((entry) => !entry.user)) throw new Error('One or more requested Auth users were not found.')

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?/'
const credentials = []
for (const entry of found) {
  const password = Array.from({ length: 32 }, () => alphabet[randomInt(alphabet.length)]).join('')
  const { error } = await admin.auth.admin.updateUserById(entry.user.id, { password })
  if (error) throw new Error(`Password reset failed for ${entry.email}.`)
  credentials.push(`${entry.email}:${password}`)
}
await writeFile(credentialPath, `${credentials.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 })

const verify = async (email) => {
  const password = credentials.find((line) => line.startsWith(`${email}:`)).slice(email.length + 1)
  const { data, error } = await userClient.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) return { signIn: 'failure', status: '' }
  const response = await fetch('http://127.0.0.1:8080/api/v1/auth/me', { headers: { Authorization: `Bearer ${data.session.access_token}`, Accept: 'application/json' } })
  return { signIn: 'success', status: String(response.status) }
}
const student = await verify('achievenest.demo.student01@ndmu.edu.ph')
const personnel = await verify('achievenest.demo.personnel01@ndmu.edu.ph')

console.log(`accounts found: ${found.length}`)
console.log(`accounts reset: ${credentials.length}`)
console.log(`credentials file path: backend/writable/demo-credentials/achievenest-demo-credentials.txt`)
console.log('credentials file exists: yes')
console.log('credentials file Git-ignored: yes')
console.log(`student01 sign-in: ${student.signIn}`)
console.log(`student01 /auth/me status: ${student.status}`)
console.log(`personnel01 sign-in: ${personnel.signIn}`)
console.log(`personnel01 /auth/me status: ${personnel.status}`)
console.log('production touched: no')
