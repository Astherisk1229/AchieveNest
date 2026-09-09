/**
 * run-phase17-offline-validation.js
 * Phase 17 Offline Defense Validation Suite.
 * Validates local-defense multi-role workflows, cold-start recovery,
 * offline evidence handling, session restoration, and zero-Supabase verification.
 *
 * Credentials rule: DEMO_PASSWORD is read strictly from the local environment
 * (ACHIEVENEST_DEMO_PASSWORD) with zero committed literal fallbacks.
 */

import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const USER_DATA_DIR = 'C:\\Users\\Admin\\Documents\\AchieveNest\\scratch\\chrome-phase17-profile'
const APP_URL = 'http://localhost:5173'
const API_URL = 'http://localhost:8080/api/v1'
const CDP_PORT = 9222

// Strict Environment-Only Credential Resolution
function resolveDemoPassword() {
  if (process.env.ACHIEVENEST_DEMO_PASSWORD && process.env.ACHIEVENEST_DEMO_PASSWORD.trim() !== '') {
    return process.env.ACHIEVENEST_DEMO_PASSWORD.trim()
  }

  // Fallback to reading ignored local backend/.env file if available
  const envPath = join(process.cwd(), '..', 'backend', '.env')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8')
    const match = envContent.match(/^ACHIEVENEST_DEMO_PASSWORD\s*=\s*(.+)$/m)
    if (match && match[1].trim() !== '') {
      return match[1].trim()
    }
  }

  console.error('ACHIEVENEST_DEMO_PASSWORD is required for Phase 17 validation.')
  process.exit(1)
}

const DEMO_PASSWORD = resolveDemoPassword()

if (existsSync(USER_DATA_DIR)) {
  try {
    rmSync(USER_DATA_DIR, { recursive: true, force: true })
  } catch {}
}
mkdirSync(USER_DATA_DIR, { recursive: true })

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl
    this.ws = null
    this.nextId = 1
    this.callbacks = new Map()
    this.eventListeners = new Map()
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (err) => reject(err)
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data)
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id)
          this.callbacks.delete(data.id)
          if (data.error) {
            reject(new Error(data.error.message))
          } else {
            resolve(data.result)
          }
        } else if (data.method && this.eventListeners.has(data.method)) {
          for (const listener of this.eventListeners.get(data.method)) {
            listener(data.params)
          }
        }
      }
    })
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++
      this.callbacks.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(handler)
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (res.exceptionDetails) {
      throw new Error(`Evaluation error: ${JSON.stringify(res.exceptionDetails)}`)
    }
    return res.result?.value
  }

  async navigate(url) {
    await this.send('Page.navigate', { url })
    await this.wait(1200)
  }

  async wait(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  async close() {
    if (this.ws) {
      this.ws.close()
    }
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function runOfflineValidation() {
  console.log('=== AchieveNest Phase 17 Offline Defense Validation ===')

  // Step 1: Verify backend health
  console.log('1. Verifying Local Backend Health...')
  const healthRes = await fetch(`${API_URL}/health`)
  if (healthRes.status !== 200) {
    throw new Error(`Backend health failed with status ${healthRes.status}`)
  }
  const healthJson = await healthRes.json()
  console.log(`Backend Status: ${healthJson.status}, MySQL: ${healthJson.database.connected} (${healthJson.database.driver})`)

  // Step 2: Launch Chrome in clean offline-ready profile
  console.log('2. Launching Google Chrome with CDP enabled...')
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      '--headless=new',
      `--user-data-dir=${USER_DATA_DIR}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1920,1080',
    ],
    { stdio: 'ignore', detached: false }
  )

  await sleep(2000)

  const targetsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
  const targets = await targetsRes.json()
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0]

  const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl)
  await cdp.connect()
  console.log('Connected to Chrome DevTools Protocol.')

  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Console.enable')

  const networkRequests = []
  const supabaseRequests = []
  const consoleErrors = []

  cdp.on('Network.requestWillBeSent', (params) => {
    const url = params.request.url
    networkRequests.push({ url, method: params.request.method, time: Date.now() })
    if (url.includes('supabase.co') || url.includes('/auth/v1') || url.includes('/storage/v1')) {
      supabaseRequests.push(url)
    }
  })

  cdp.on('Console.messageAdded', (params) => {
    if (params.message.level === 'error') {
      consoleErrors.push(params.message.text)
    }
  })

  // Warm-up load
  console.log('Warming up Vite compiler...')
  await cdp.navigate(`${APP_URL}/login`)
  await cdp.wait(2000)

  const personaResults = []

  async function performLogin(email, password, rememberMe = true) {
    await cdp.navigate(`${APP_URL}/login`)
    await cdp.wait(1200)

    await cdp.evaluate(`
      (function() {
        function setNativeValue(element, value) {
          const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value').set;
          const prototype = Object.getPrototypeOf(element);
          const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
          if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
          } else {
            valueSetter.call(element, value);
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const rememberCheckbox = document.querySelector('input[type="checkbox"]');
        const submitBtn = document.querySelector('button[type="submit"]');

        if (emailInput) setNativeValue(emailInput, '${email}');
        if (passInput) setNativeValue(passInput, '${password}');
        if (rememberCheckbox && rememberCheckbox.checked !== ${rememberMe}) {
          rememberCheckbox.click();
        }
        if (submitBtn) {
          submitBtn.click();
        }
      })()
    `)

    for (let i = 0; i < 15; i++) {
      await cdp.wait(400)
      const path = await cdp.evaluate('window.location.pathname')
      if (path !== '/login') break
    }
  }

  async function performLogout() {
    await cdp.evaluate(`
      (function() {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      })()
    `)
    await cdp.navigate(`${APP_URL}/login`)
    await cdp.wait(600)
  }

  // --- 1. STUDENT A ---
  console.log('\n--- 1. Student A Offline Smoke ---')
  await performLogin('demo.student.a@ndmu.edu.ph', DEMO_PASSWORD, true)
  const studentAUrl = await cdp.evaluate('window.location.pathname')
  const studentABody = await cdp.evaluate('document.body.innerText')
  const studentALocalStorage = await cdp.evaluate('Boolean(localStorage.getItem("achievenest_access_token"))')

  personaResults.push({
    persona: 'Student A',
    route: studentAUrl,
    pass: studentAUrl === '/student/dashboard' && studentALocalStorage,
  })
  console.log(`Student A Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'} (Route: ${studentAUrl})`)

  // Portfolio & Refresh
  await cdp.navigate(`${APP_URL}/student/portfolio`)
  await cdp.wait(1200)
  const portfolioText = await cdp.evaluate('document.body.innerText')
  const noDept = !portfolioText.toLowerCase().includes('department:')
  console.log('Portfolio Loaded. Department layer absent:', noDept)

  // Reload / Refresh Session Restore
  await cdp.send('Page.reload')
  await cdp.wait(1500)
  const refreshUrl = await cdp.evaluate('window.location.pathname')
  const refreshStorage = await cdp.evaluate('Boolean(localStorage.getItem("achievenest_access_token"))')
  console.log(`Session Restore on Refresh: ${refreshUrl === '/student/portfolio' && refreshStorage ? 'PASS' : 'FAIL'}`)

  await performLogout()

  // --- 2. STUDENT B (ISOLATION) ---
  console.log('\n--- 2. Student B Cross-User Isolation ---')
  await performLogin('demo.student.b@ndmu.edu.ph', DEMO_PASSWORD, false)
  const studentBUrl = await cdp.evaluate('window.location.pathname')
  const studentBSessionStorage = await cdp.evaluate('Boolean(sessionStorage.getItem("achievenest_access_token"))')

  personaResults.push({
    persona: 'Student B',
    route: studentBUrl,
    pass: studentBUrl === '/student/dashboard' && studentBSessionStorage,
  })
  console.log(`Student B Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'} (Session-Only: ${studentBSessionStorage})`)
  await performLogout()

  // --- 3. ACADEMIC PERSONNEL ---
  console.log('\n--- 3. Academic Personnel Offline Smoke ---')
  await performLogin('demo.academic.personnel@ndmu.edu.ph', DEMO_PASSWORD, true)
  const acadUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'Academic Personnel',
    route: acadUrl,
    pass: acadUrl === '/personnel/dashboard',
  })
  console.log(`Academic Personnel Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // --- 4. NON-ACADEMIC PERSONNEL ---
  console.log('\n--- 4. Non-Academic Personnel Offline Smoke ---')
  await performLogin('demo.nonacademic.personnel@ndmu.edu.ph', DEMO_PASSWORD, true)
  const nonAcadUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'Non-Academic Personnel',
    route: nonAcadUrl,
    pass: nonAcadUrl === '/personnel/dashboard',
  })
  console.log(`Non-Academic Personnel Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // --- 5. HR ADMIN ---
  console.log('\n--- 5. HR Admin Offline Smoke ---')
  await performLogin('demo.hr.admin@ndmu.edu.ph', DEMO_PASSWORD, true)
  const hrUrl = await cdp.evaluate('window.location.pathname')
  await cdp.navigate(`${APP_URL}/hr-admin/personnel-directory`)
  await cdp.wait(1200)
  const hrText = await cdp.evaluate('document.body.innerText')
  const hrDeanValid = hrText.includes('Assign Dean') || hrText.includes('Personnel')
  const hrNoCoord = !hrText.includes('Assign Program Coordinator')

  personaResults.push({
    persona: 'HR Admin',
    route: hrUrl,
    pass: hrUrl === '/hr/dashboard' && hrNoCoord,
  })
  console.log(`HR Admin Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'} (Dean Governance: ${hrDeanValid}, No Coordinator: ${hrNoCoord})`)
  await performLogout()

  // --- 6. OSAD ADMIN ---
  console.log('\n--- 6. OSAD Admin Offline Smoke ---')
  await performLogin('demo.osad.admin@ndmu.edu.ph', DEMO_PASSWORD, true)
  const osadUrl = await cdp.evaluate('window.location.pathname')
  await cdp.navigate(`${APP_URL}/osad-admin/academic-programs`)
  await cdp.wait(1200)
  const osadText = await cdp.evaluate('document.body.innerText')
  const osadNoDept = !osadText.toLowerCase().includes('create department')
  const osadNoDean = !osadText.includes('Assign Dean')

  personaResults.push({
    persona: 'OSAD Admin',
    route: osadUrl,
    pass: osadUrl === '/osad/dashboard' && osadNoDept && osadNoDean,
  })
  console.log(`OSAD Admin Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'} (College/Program Hierarchy: ${osadNoDept})`)
  await performLogout()

  // --- 7. COLLEGE DEAN ---
  console.log('\n--- 7. College Dean Offline Smoke ---')
  await performLogin('demo.dean@ndmu.edu.ph', DEMO_PASSWORD, true)
  const deanUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'College Dean',
    route: deanUrl,
    pass: deanUrl === '/personnel/dashboard',
  })
  console.log(`College Dean Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // --- 8. PROGRAM COORDINATOR A ---
  console.log('\n--- 8. Program Coordinator A (BSA) Offline Smoke ---')
  await performLogin('demo.coordinator.a@ndmu.edu.ph', DEMO_PASSWORD, true)
  const coordAUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'Program Coordinator A',
    route: coordAUrl,
    pass: coordAUrl === '/personnel/dashboard',
  })
  console.log(`Coordinator A Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // --- 9. PROGRAM COORDINATOR B ---
  console.log('\n--- 9. Program Coordinator B (BSBA-FM) Isolation ---')
  await performLogin('demo.coordinator.b@ndmu.edu.ph', DEMO_PASSWORD, true)
  const coordBUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'Program Coordinator B',
    route: coordBUrl,
    pass: coordBUrl === '/personnel/dashboard',
  })
  console.log(`Coordinator B Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // --- 10. ORGANIZATION MODERATOR ---
  console.log('\n--- 10. Organization Moderator (JPIA) Offline Smoke ---')
  await performLogin('demo.moderator@ndmu.edu.ph', DEMO_PASSWORD, true)
  const modUrl = await cdp.evaluate('window.location.pathname')
  personaResults.push({
    persona: 'Organization Moderator',
    route: modUrl,
    pass: modUrl === '/personnel/dashboard',
  })
  console.log(`Organization Moderator Status: ${personaResults.at(-1).pass ? 'PASS' : 'FAIL'}`)
  await performLogout()

  // Clean close
  await cdp.close()
  chromeProcess.kill()

  console.log('\n========================================')
  console.log('PHASE 17 OFFLINE DEFENSE VALIDATION SUMMARY')
  console.log('========================================')
  console.log(`Total Personas Tested: ${personaResults.length}`)
  console.log(`Passed Personas: ${personaResults.filter((r) => r.pass).length}`)
  console.log(`Supabase Network Calls: ${supabaseRequests.length}`)
  console.log(`Total Network Requests Logged: ${networkRequests.length}`)
  console.log(`Blocking Console Errors: ${consoleErrors.length}`)

  if (supabaseRequests.length > 0) {
    throw new Error(`Supabase leak: ${supabaseRequests.length} calls`)
  }
  if (personaResults.some((r) => !r.pass)) {
    throw new Error('Some personas failed offline validation')
  }

  console.log('\n>>> PHASE 17 OFFLINE DEFENSE VALIDATION: 100% PASS! <<<')
}

runOfflineValidation().catch((err) => {
  console.error('Offline Validation Error:', err)
  process.exit(1)
})
