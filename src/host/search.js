/**
 * Project-wide file index and text search.
 *
 * The repository is the fast path: `git ls-files`/`git grep` respect
 * `.gitignore`, skip binaries and are fast enough for a 10k-file project.
 * A non-repository workspace falls back to a bounded directory walk.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { ApiError } from './wire.js'
import { runGit } from './git.js'
import { toRelative } from './workspace.js'

/** Directories never walked by the fallback. */
const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out', 'coverage', '.next', '.nuxt',
  '.cache', '.turbo', '.parcel-cache', 'target', 'vendor', '__pycache__',
])
/** Pathspec excludes for the git grep fast path. */
const DEFAULT_EXCLUDES = [
  'dist/**', 'build/**', 'out/**', 'node_modules/**', 'coverage/**',
  '.next/**', '.nuxt/**', '.cache/**', '.turbo/**', '.parcel-cache/**',
  'target/**', 'vendor/**', '__pycache__/**',
]
/** A single source file larger than this is never searched. */
const MAX_SEARCH_BYTES = 2 << 20
/** Hard cap on the fallback walk. */
const MAX_FILES = 50_000
/** Hard cap on returned matches. */
const MAX_RESULTS = 2000

function isRepo(env) {
  return env?.isRepo === true || (typeof env?.repoRoot === 'string' && env.repoRoot !== '')
}

/** Repository-relative path → workspace-relative path. */
function mapPath(env, path) {
  const normalized = String(path).split('\\').join('/')
  return env.prefix === '' || env.prefix === undefined ? normalized : `${env.prefix}/${normalized}`
}

/** One recursive workspace walk, used outside git repositories. */
async function walkFiles(root, prefix = '') {
  const output = []
  const walk = async (dir) => {
    if (output.length >= MAX_FILES) return
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (output.length >= MAX_FILES) return
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue
        await walk(join(dir, entry.name))
      } else if (entry.isFile()) {
        const absolute = join(dir, entry.name)
        output.push(toRelative(root, absolute))
      }
    }
  }
  await walk(root)
  return output.map(path => `${prefix}${path}`)
}

/**
 * List every project file (workspace-relative, forward slashes).
 * @param {{ root: string, workspaceRoot: string, prefix?: string, isRepo?: boolean }} env
 */
export async function listFiles(env) {
  const started = Date.now()
  if (isRepo(env)) {
    const result = await runGit(env, ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { allowFailure: true })
    if (result.code === 0) {
      const files = [...new Set(result.stdout.split('\0').filter(Boolean).map(path => mapPath(env, path)))]
        .sort((left, right) => left.localeCompare(right))
      return { files, tookMs: Date.now() - started }
    }
  }
  const files = await walkFiles(env.workspaceRoot ?? env.root)
  return { files: [...new Set(files)].sort((left, right) => left.localeCompare(right)), tookMs: Date.now() - started }
}

/** Escape a literal string for a regular expression. */
export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Build the search regular expression (throws on a bad user pattern). */
export function buildPattern(query, options = {}) {
  const source = options.regexp === true ? String(query) : escapeRegExp(query)
  const word = options.wholeWord === true ? `\\b(?:${source})\\b` : source
  try {
    return new RegExp(word, options.caseSensitive === true ? 'g' : 'gi')
  } catch (error) {
    throw new ApiError('bad-pattern', error instanceof Error ? error.message : String(error))
  }
}

function previewOf(line) {
  const text = line.replace(/\r$/, '').trim()
  return text.length > 240 ? `${text.slice(0, 240)}…` : text
}

function addMatch(groups, path, line, column, preview) {
  let entry = groups.get(path)
  if (entry === undefined) {
    entry = { path, matches: [] }
    groups.set(path, entry)
  }
  if (entry.matches.length < 200) entry.matches.push({ line, column, preview })
}

/** The git grep fast path. Returns null when git cannot serve the request. */
function parseGitGrep(env, stdout, groups) {
  for (const raw of stdout.split('\n')) {
    if (raw === '') continue
    const match = /^(.+?):(\d+):(\d+):(.*)$/.exec(raw)
    if (match === null) continue
    addMatch(groups, mapPath(env, match[1]), Number(match[2]), Number(match[3]), previewOf(match[4]))
  }
}

async function searchWithGit(env, query, options) {
  const base = ['grep', '--no-color', '-n', '-I', '--column', '--untracked']
  if (options.caseSensitive !== true) base.push('-i')
  if (options.wholeWord === true) base.push('-w')
  base.push(options.regexp === true ? '-E' : '-F', '-e', query, '--')
  const include = Array.isArray(options.include) ? options.include.filter(Boolean) : []
  if (include.length > 0) base.push(...include)
  // Generated/vendor trees are noise for a code search. The fallback walk
  // already skips them; keep the fast git path consistent.
  else base.push(...DEFAULT_EXCLUDES.map(path => `:(exclude)${path}`))
  const result = await runGit(env, base, { allowFailure: true })
  if (result.code === 1) return [] // no match
  if (result.code !== 0) {
    // A bad user regex is an input error; anything else may be an old git
    // without --untracked/--column, so let the caller fall back to the walk.
    if (/fatal:|error:/i.test(result.stderr) && /regex|pattern|invalid/i.test(result.stderr)) {
      throw new ApiError('bad-pattern', result.stderr.trim())
    }
    return null
  }
  const groups = new Map()
  parseGitGrep(env, result.stdout, groups)
  return [...groups.values()]
}

async function searchWithWalk(env, query, options) {
  const pattern = buildPattern(query, options)
  const { files } = await listFiles(env)
  const include = Array.isArray(options.include) ? options.include.filter(Boolean) : []
  const exclude = Array.isArray(options.exclude) ? options.exclude.filter(Boolean) : []
  const groups = new Map()
  let total = 0
  for (const path of files) {
    if (total >= (options.maxResults ?? MAX_RESULTS)) break
    if (include.length > 0 && !include.some(prefix => path.startsWith(prefix))) continue
    if (exclude.some(prefix => path.startsWith(prefix))) continue
    const absolute = join(env.workspaceRoot ?? env.root, path)
    let buffer
    try {
      buffer = await readFile(absolute)
    } catch {
      continue
    }
    if (buffer.length > MAX_SEARCH_BYTES || buffer.subarray(0, 8192).includes(0)) continue
    const lines = buffer.toString('utf8').split('\n')
    for (let index = 0; index < lines.length; index += 1) {
      pattern.lastIndex = 0
      let match
      while ((match = pattern.exec(lines[index])) !== null) {
        addMatch(groups, path, index + 1, match.index + 1, previewOf(lines[index]))
        total += 1
        if (total >= (options.maxResults ?? MAX_RESULTS)) break
        if (match[0] === '') pattern.lastIndex += 1
      }
      if (total >= (options.maxResults ?? MAX_RESULTS)) break
    }
  }
  return [...groups.values()]
}

/**
 * Search every project text file.
 * @param {{ root: string, workspaceRoot: string, prefix?: string, isRepo?: boolean, gitPath?: string }} env
 * @param {{ query: string, caseSensitive?: boolean, wholeWord?: boolean, regexp?: boolean,
 *   include?: string[], exclude?: string[], maxResults?: number }} options
 */
export async function searchFiles(env, options = {}) {
  const started = Date.now()
  const query = typeof options.query === 'string' ? options.query : ''
  if (query === '') return { files: [], truncated: false, tookMs: 0 }
  buildPattern(query, options) // validate before crossing the git/fallback boundary
  const maxResults = Math.min(Math.max(options.maxResults ?? MAX_RESULTS, 1), MAX_RESULTS)
  let files = null
  if (isRepo(env)) files = await searchWithGit(env, query, { ...options, maxResults })
  if (files === null) files = await searchWithWalk(env, query, { ...options, maxResults })
  let seen = 0
  const truncated = files.some((file) => {
    seen += file.matches.length
    return seen > maxResults
  })
  if (seen > maxResults) {
    let left = maxResults
    files = files.map(file => {
      if (left <= 0) return { ...file, matches: [] }
      const matches = file.matches.slice(0, left)
      left -= matches.length
      return { ...file, matches }
    }).filter(file => file.matches.length > 0)
  }
  return { files, truncated, tookMs: Date.now() - started }
}
