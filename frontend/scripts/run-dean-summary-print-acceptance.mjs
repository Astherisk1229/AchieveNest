import { writeFile } from 'node:fs/promises'

const cdpPort = process.env.DEAN_PRINT_CDP_PORT || '9223'
const appUrl = process.env.DEAN_PRINT_APP_URL
const token = process.env.DEAN_PRINT_TOKEN
const outputPath = process.env.DEAN_PRINT_OUTPUT
if (!appUrl || !token || !outputPath) throw new Error('Print acceptance environment is incomplete.')

const target = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' }).then(response => response.json())
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let nextId = 1
const pending = new Map()
const diagnostics = []
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') diagnostics.push(message.params?.exceptionDetails?.text || 'Runtime exception')
  if (message.method === 'Log.entryAdded') diagnostics.push(message.params?.entry?.text || 'Browser log entry')
  if (message.method === 'Network.loadingFailed') diagnostics.push(`${message.params?.errorText || 'Network failure'} ${message.params?.blockedReason || ''}`.trim())
  if (!message.id || !pending.has(message.id)) return
  const { resolve, reject } = pending.get(message.id)
  pending.delete(message.id)
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result)
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

await send('Page.enable')
await send('Runtime.enable')
await send('Log.enable')
await send('Network.enable')
await send('Page.navigate', { url: new URL('/', appUrl).href })
await wait(1500)
const session = {
  id: 'd0000000-0000-0000-0001-000000000007',
  institutional_id: '2026-DEMO-007',
  institutional_email: 'demo.dean@ndmu.edu.ph',
  email: 'demo.dean@ndmu.edu.ph',
  full_name: 'Demo Dean (CBA)',
  account_type: 'personnel',
  user_type: 'personnel',
  status: 'active',
  active_role_context: 'dean',
  roles: ['personnel', 'dean'],
  assigned_roles: ['personnel', 'dean'],
  role_assignments: [],
  must_change_password: false,
  token,
  access_token: token,
}
await send('Runtime.evaluate', { expression: `localStorage.setItem('achievenest_access_token', ${JSON.stringify(token)}); localStorage.setItem('achievenest_current_user', ${JSON.stringify(JSON.stringify(session))});` })
await send('Page.navigate', { url: appUrl })
await wait(30000)
const state = await send('Runtime.evaluate', { expression: `JSON.stringify({title:document.title,ready:document.readyState,scripts:[...document.scripts].map(s=>s.src),resources:performance.getEntriesByType('resource').map(r=>r.name).slice(-20),text:document.body.innerText,root:document.querySelector('#root')?.innerHTML?.slice(0,500),summary:Boolean(document.querySelector('[data-evaluation-summary]')),printAction:[...document.querySelectorAll('button')].some(button=>button.textContent.includes('Print / Export PDF'))})`, returnByValue: true })
if (state.result.value === undefined) throw new Error(`Browser state evaluation failed: ${JSON.stringify({ state, diagnostics })}`)
const rendered = JSON.parse(state.result.value)
if (!rendered.summary || !rendered.printAction || !rendered.text.includes('Faculty Portfolio Evaluation Summary')) throw new Error(`Summary did not render: ${JSON.stringify({ ...rendered, diagnostics })}`)
const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, paperWidth: 8.2677, paperHeight: 11.6929, marginTop: 0.55, marginBottom: 0.55, marginLeft: 0.55, marginRight: 0.55 })
await writeFile(outputPath, Buffer.from(pdf.data, 'base64'))
socket.close()
console.log(JSON.stringify({ rendered_summary: rendered.summary, print_action: rendered.printAction, title: rendered.title, pdf_bytes: Buffer.byteLength(pdf.data, 'base64'), output: outputPath }))
