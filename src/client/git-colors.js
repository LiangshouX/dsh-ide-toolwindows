/**
 * JetBrains file-status model (IntelliJ default highlight scheme).
 *
 *   red    = unversioned (untracked, not added)
 *   green  = added to VCS / index (new file staged)
 *   blue   = tracked file with uncommitted changes (index or working tree)
 *   red + ! = merge conflict
 *   brown  = ignored (.gitignore)  / excluded directories get a tinted background
 *
 * Directories aggregate their descendants recursively, so a collapsed folder
 * already shows that something below it changed. Precedence (V2 decision):
 *   conflict > modified > added > unversioned.
 *
 * Dependency-free so it stays unit-testable and cheap per visible row.
 */

/** Precedence of one file status inside a directory aggregate. */
const RANK = { conflict: 4, modified: 3, added: 2, untracked: 1 }

/** Status kinds in descending precedence, for documentation/tests. */
export const STATUS_PRECEDENCE = ['conflict', 'modified', 'added', 'untracked']

/**
 * Classify one `git.status` entry.
 * @param {{ xy?: string, untracked?: boolean, conflict?: boolean, ignored?: boolean }} entry
 * @returns {'conflict'|'untracked'|'added'|'modified'|'deleted'|'ignored'|null}
 */
export function fileStatusKind(entry) {
  if (entry === undefined || entry === null) return null
  if (entry.ignored === true) return 'ignored'
  if (entry.conflict === true) return 'conflict'
  if (entry.untracked === true) return 'untracked'
  const xy = typeof entry.xy === 'string' ? entry.xy : ''
  if (xy[0] === 'D' || xy[1] === 'D') return 'deleted'
  if (xy[0] === 'A') return 'added'
  if (xy === '' || xy === '..') return null
  // Any other tracked difference (index or working tree) is "modified" in the
  // IDEA sense: the file differs from its last committed revision.
  return 'modified'
}

/** CSS class carrying the colour for one status kind. */
export function statusClass(kind) {
  switch (kind) {
    case 'untracked': return 'iwb-git-untracked'
    case 'added': return 'iwb-git-added'
    case 'modified': return 'iwb-git-modified'
    case 'conflict': return 'iwb-git-conflict'
    case 'deleted': return 'iwb-git-deleted'
    case 'ignored': return 'iwb-git-ignored'
    default: return ''
  }
}

/** Short row badge (optional column, hidden by default in V2). */
export function statusBadge(kind) {
  switch (kind) {
    case 'untracked': return 'U'
    case 'added': return 'A'
    case 'modified': return 'M'
    case 'conflict': return '!'
    case 'deleted': return 'D'
    case 'ignored': return 'I'
    default: return ''
  }
}

/** Every ancestor directory rel-path of `rel` (`a/b/c.txt` → `a`, `a/b`). */
function ancestorsOf(rel) {
  const parts = String(rel).split('/')
  const output = []
  for (let index = 1; index < parts.length; index += 1) output.push(parts.slice(0, index).join('/'))
  return output
}

/**
 * Build the recursive status map.
 *
 * @param {Array<{ path: string, xy?: string, untracked?: boolean, conflict?: boolean, ignored?: boolean }>} entries
 *   entries carry workspace-relative `path` values
 * @returns {{ dirs: Map<string, string>, files: Map<string, string>,
 *   ignored: Set<string>, conflictDirs: Set<string> }}
 */
export function aggregateStatus(entries) {
  const dirs = new Map()
  const files = new Map()
  const ignored = new Set()
  const conflictDirs = new Set()
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (entry === null || typeof entry !== 'object' || typeof entry.path !== 'string') continue
    const kind = fileStatusKind(entry)
    if (kind === null) continue
    if (kind === 'ignored') {
      ignored.add(entry.path)
      continue
    }
    files.set(entry.path, kind)
    const rank = RANK[kind] ?? 0
    for (const dir of ancestorsOf(entry.path)) {
      const previous = dirs.get(dir)
      if (previous === undefined || (RANK[previous] ?? 0) < rank) dirs.set(dir, kind)
      if (kind === 'conflict') conflictDirs.add(dir)
    }
  }
  return { dirs, files, ignored, conflictDirs }
}
