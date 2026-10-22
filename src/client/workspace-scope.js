/**
 * Session → workspace helpers shared by the client entry and the store.
 *
 * DSH's session summary exposes the Session workspace root as `cwd`; the
 * right Sidebar keeps one layout per Session, so the plugin uses that path as
 * the scope key for its own store. Keeping these helpers pure makes the
 * workspace-scoping rules testable without a browser.
 */

/**
 * Normalize one path for equality/keys: both separators to `/`, collapsed
 * repeats, trailing slash dropped; Windows drive and UNC paths compare
 * case-insensitively.
 * @param {unknown} path
 * @returns {string}
 */
export function normalizeScopePath(path) {
  if (typeof path !== 'string' || path === '') return ''
  const slashed = path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/+$/, '')
  const windows = /^[A-Za-z]:\//.test(slashed) || slashed.startsWith('//')
  return windows ? slashed.toLowerCase() : slashed
}

/**
 * Whether two non-empty paths name the same workspace/project.
 * @param {unknown} left
 * @param {unknown} right
 */
export function sameScopePath(left, right) {
  const normalized = normalizeScopePath(left)
  return normalized !== '' && normalized === normalizeScopePath(right)
}

/**
 * The workspace root a Session belongs to, when the host has published it.
 * @param {any} ctx client cordis context
 * @param {string} sessionId
 * @returns {string} `''` when unknown
 */
export function sessionCwdOf(ctx, sessionId) {
  if (typeof sessionId !== 'string' || sessionId === '') return ''
  try {
    const sessions = ctx?.sessions ?? ctx?.get?.('sessions')
    const list = sessions?.list?.getSnapshot?.()
    const summary = list?.byId?.[sessionId]
    return typeof summary?.cwd === 'string' ? summary.cwd : ''
  } catch {
    return ''
  }
}

/**
 * The store key for one Session: its workspace root, or the Session itself
 * when the host has not published a cwd.
 * @param {any} ctx client cordis context
 * @param {string} sessionId
 */
export function workspaceScopeKey(ctx, sessionId) {
  const cwd = sessionCwdOf(ctx, sessionId)
  return cwd === '' ? `session:${sessionId}` : `workspace:${normalizeScopePath(cwd)}`
}

/**
 * Whether two Sessions share one workspace root.
 * @param {any} ctx client cordis context
 * @param {string} left
 * @param {string} right
 */
export function sameWorkspace(ctx, left, right) {
  return sameScopePath(sessionCwdOf(ctx, left), sessionCwdOf(ctx, right))
}

/**
 * Whether switching Sessions should reopen the IDE in the arriving Session.
 *
 * The IDE is only carried across a switch when its body was actually visible
 * in the Session being left (so a hidden/closed IDE does not pop open) and
 * both Sessions resolve to the same workspace root.
 * @param {any} ctx client cordis context
 * @param {string} previous the Session being left
 * @param {string} next the Session arriving
 * @param {string | null} visibleSession the Session whose IDE body was visible
 */
export function shouldContinueIde(ctx, previous, next, visibleSession) {
  if (typeof previous !== 'string' || typeof next !== 'string') return false
  if (previous === '' || next === '' || previous === next) return false
  if (visibleSession !== previous) return false
  return sameWorkspace(ctx, previous, next)
}
