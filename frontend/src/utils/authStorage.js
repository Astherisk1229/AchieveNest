const USER_KEY = 'achievenest_current_user'
const TOKEN_KEY = 'achievenest_access_token'

function parseUser(rawUser) {
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}
function readCandidate(storage, persistence) {
  const user = parseUser(storage.getItem(USER_KEY))
  const token = storage.getItem(TOKEN_KEY) || user?.token || user?.access_token || null
  const loggedInAt = user?.logged_in_at ? Date.parse(user.logged_in_at) : 0

  return {
    persistence,
    user,
    token,
    isComplete: Boolean(user && token),
    loggedInAt: Number.isFinite(loggedInAt) ? loggedInAt : 0
  }
}
/**
 * Resolve one coherent browser session instead of independently preferring
 * localStorage values. A stale persistent token must never override an active
 * sessionStorage login (or vice versa).
 */
export function resolveStoredAuthSession() {
  const local = readCandidate(localStorage, 'local')
  const session = readCandidate(sessionStorage, 'session')

  if (local.isComplete && session.isComplete) {
    return session.loggedInAt > local.loggedInAt ? session : local
  }

  if (local.isComplete) return local
  if (session.isComplete) return session

  if (local.token) return local
  if (session.token) return session
  if (local.user) return local
  if (session.user) return session

  return { persistence: null, user: null, token: null, isComplete: false, loggedInAt: 0 }
}
