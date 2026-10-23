/**
 * The DSH file-resource address grammar used by the right Sidebar.
 *
 * `dsh-resource://file/session/<sessionId>/<path>` addresses a file relative
 * to one Session's workspace (an absolute path keeps its leading `/`), and
 * `dsh-resource://file/absolute/<path>` addresses a file by absolute path with
 * the leading `/` dropped. The chat's own file opener always produces the
 * session-scoped form; the absolute form is parsed for legacy/third-party
 * addresses.
 *
 * Kept dependency-free and pure so the bundle stays small and the grammar is
 * unit-testable.
 */

/** The scheme and type every file address opens with. */
export const FILE_ADDRESS_PREFIX = 'dsh-resource://file/'

/**
 * @typedef {{ scope: 'session', sessionId: string, path: string }
 *   | { scope: 'absolute', path: string }} FileAddress
 */

/**
 * Read one file address without resolving `.` or `..`.
 * Query and fragment suffixes are ignored; encoded segments are decoded.
 * @param {string} address
 * @returns {FileAddress | undefined}
 */
export function parseFileAddress(address) {
  if (typeof address !== 'string' || !address.startsWith(FILE_ADDRESS_PREFIX)) return undefined
  try {
    const end = address.search(/[?#]/)
    const body = address.slice(FILE_ADDRESS_PREFIX.length, end === -1 ? undefined : end)
    const [scope, ...rest] = body.split('/')
    if (scope === 'session') {
      const [id, ...segments] = rest
      if (id === undefined || id === '' || segments.length === 0) return undefined
      return { scope, sessionId: decodeURIComponent(id), path: segments.map(decodeURIComponent).join('/') }
    }
    if (scope === 'absolute') {
      // An empty first segment with more behind it is a UNC path's `//`; alone
      // it is no path.
      const unc = rest[0] === '' && rest.length > 1
      const segments = (unc ? rest.slice(1) : rest).map(decodeURIComponent)
      if (segments.length === 0 || segments[0] === '') return undefined
      if (unc) return { scope, path: `//${segments.join('/')}` }
      return { scope, path: /^[A-Za-z]:$/.test(segments[0]) ? segments.join('/') : `/${segments.join('/')}` }
    }
    return undefined
  } catch {
    // `decodeURIComponent` throws URIError on a malformed escape.
    return undefined
  }
}

/** Whether one string looks like a file resource address. */
export function isFileAddress(address) {
  return typeof address === 'string' && address.startsWith(FILE_ADDRESS_PREFIX)
}

/** The decoded file name of one address (the tab chip title). */
export function basenameOfFileAddress(address) {
  const parsed = parseFileAddress(address)
  if (parsed === undefined) return undefined
  const parts = parsed.path.split('/').filter(part => part !== '')
  return parts.length === 0 ? undefined : parts[parts.length - 1]
}

/** Whether a decoded path is absolute in either spelling the host accepts. */
function isAbsoluteFilePath(path) {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\')
}

/**
 * Normalize one path for the workbench: backslashes become the platform
 * separator of `cwd`, `.`/`..` are resolved, duplicate separators collapse.
 * @param {string} input
 * @param {string} [cwd] used only to choose the separator style
 */
function normalizeFilePath(input, cwd) {
  const separator = typeof cwd === 'string' && cwd.includes('\\') ? '\\' : '/'
  let value = String(input).replace(/\\/g, '/')
  let prefix = ''
  if (value.startsWith('//')) {
    prefix = '//'
    value = value.slice(2)
  } else if (/^[A-Za-z]:\//.test(value)) {
    prefix = value.slice(0, 2)
    value = value.slice(2).replace(/^\/+/, '')
  } else if (value.startsWith('/')) {
    prefix = '/'
    value = value.slice(1)
  }
  const parts = []
  for (const part of value.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (parts.length > 0) parts.pop()
      continue
    }
    parts.push(part)
  }
  const joined = parts.join(separator)
  if (prefix === '//') return joined === '' ? `${separator}${separator}` : `${separator}${separator}${joined}`
  if (prefix === '/') return joined === '' ? separator : `${separator}${joined}`
  if (prefix !== '') return joined === '' ? `${prefix}${separator}` : `${prefix}${separator}${joined}`
  return joined
}

/**
 * Resolve one parsed address to an absolute, native-separator path.
 * @param {FileAddress | undefined} parsed
 * @param {string} [cwd] the Session workspace that resolves a relative path
 * @returns {string | undefined}
 */
export function resolveFileAddress(parsed, cwd) {
  if (parsed === undefined || parsed === null) return undefined
  if (parsed.scope === 'absolute') return normalizeFilePath(parsed.path, cwd)
  const path = parsed.path
  if (typeof path !== 'string' || path === '') return undefined
  if (isAbsoluteFilePath(path)) return normalizeFilePath(path, cwd)
  if (typeof cwd !== 'string' || cwd === '') return undefined
  return normalizeFilePath(`${cwd.replace(/[\\/]+$/, '')}/${path}`, cwd)
}

/** Office/PDF/archive/binary formats the IDE should leave to the sidebar. */
const NON_IDE_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.odt', '.ods', '.odp', '.rtf', '.epub',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.bz2', '.xz',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.iso', '.jar', '.class', '.wasm',
])

/**
 * Whether the IDE can render this file address. Text, Markdown and images are
 * claimed; Office documents, PDFs, archives and obvious binaries keep the
 * product's own preview.
 */
export function isIdeViewableAddress(address) {
  const name = basenameOfFileAddress(address)
  if (name === undefined) return false
  const dot = name.lastIndexOf('.')
  if (dot < 0) return true
  return !NON_IDE_EXTENSIONS.has(name.slice(dot).toLowerCase())
}

/** Component-encode one id or path segment, keeping `:` literal for drive letters. */
function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%3A/gi, ':')
}

/** Encode a `/`-separated path segment by segment. */
function encodePath(path) {
  return path.split('/').map(encodeSegment).join('/')
}

/**
 * Build the session-scoped address for one file path.
 * @param {string} sessionId
 * @param {string} path absolute or session-relative, either separator
 * @returns {string}
 */
export function sessionFileAddress(sessionId, path) {
  const normalized = String(path).replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
  return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(String(sessionId))}/${encodePath(normalized)}`
}

/**
 * Build the session-scoped address DSH uses for a path as a caller holds it.
 *
 * A relative path, or an absolute path inside the session's workspace, becomes
 * the relative spelling; an absolute path outside it keeps its absolute
 * spelling inside the session scope.
 * @param {string} sessionId
 * @param {string | undefined} cwd the session workspace root
 * @param {string} path
 * @returns {string}
 */
export function fileAddressFor(sessionId, cwd, path) {
  const normalized = String(path).replace(/\\/g, '/')
  if (!isAbsoluteFilePath(normalized)) return sessionFileAddress(sessionId, normalized)
  const root = typeof cwd === 'string' ? cwd.replace(/\\/g, '/').replace(/\/+$/, '') : ''
  if (root !== '' && normalized === root) return sessionFileAddress(sessionId, '')
  if (root !== '' && normalized.startsWith(`${root}/`)) return sessionFileAddress(sessionId, normalized.slice(root.length + 1))
  return sessionFileAddress(sessionId, normalized)
}

/**
 * Build a `file://` URL the OS default browser can open.
 * @param {string} path absolute native path
 * @returns {string}
 */
export function fileUrlForPath(path) {
  const normalized = String(path).replace(/\\/g, '/')
  const encoded = normalized.split('/').map(segment => encodeURIComponent(segment).replace(/%3A/gi, ':')).join('/')
  if (/^[A-Za-z]:\//.test(normalized)) return `file:///${encoded}`
  if (normalized.startsWith('//')) return `file:${encoded}`
  return `file://${encoded}`
}
