/** Native IntelliJ IDEA launcher. All paths are argv entries, never shell text. */
import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readdir, realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { posix, win32 } from 'node:path'
import { canonicalRoot, resolveInside } from './workspace.js'
import { ApiError, requireString } from './wire.js'

/** Resolve an executable with injectable filesystem/environment for portable tests. */
export async function resolveIdeaExecutable(configuredPath = '', options = {}) {
  const platform = options.platform ?? process.platform
  const env = options.env ?? process.env
  const paths = platform === 'win32' ? win32 : posix
  const fileStat = options.stat ?? stat
  const fileAccess = options.access ?? access
  const list = options.readdir ?? readdir
  const home = options.home ?? homedir()
  const usable = async (candidate) => {
    // Windows batch launchers require cmd.exe and introduce a second parser.
    if (platform === 'win32' && /\.(cmd|bat)$/i.test(candidate)) return false
    try {
      if (!(await fileStat(candidate)).isFile()) return false
      await fileAccess(candidate, platform === 'win32' ? constants.F_OK : constants.X_OK)
      return true
    } catch { return false }
  }
  const fromPath = (names) => {
    const value = Object.entries(env).find(([key]) => key.toUpperCase() === 'PATH')?.[1] ?? ''
    return names.flatMap(name => value.split(platform === 'win32' ? ';' : ':')
      .map(dir => dir.replace(/^"(.*)"$/, '$1'))
      .filter(dir => paths.isAbsolute(dir))
      .map(dir => paths.join(dir, name)))
  }
  if (typeof configuredPath !== 'string' || configuredPath.includes('\0')) {
    throw new ApiError('bad-request', 'idea.path must be a string without NUL characters')
  }
  if (configuredPath !== '') {
    let configured = configuredPath
    if (platform === 'darwin' && /\.app\/?$/.test(configured)) configured = paths.join(configured, 'Contents/MacOS/idea')
    const candidates = paths.isAbsolute(configured) ? [configured] : fromPath([configured])
    if (!paths.isAbsolute(configured) && /[\\/]/.test(configured)) candidates.length = 0
    for (const candidate of candidates) if (await usable(candidate)) return candidate
    throw new ApiError('idea-unavailable', `Configured IntelliJ IDEA launcher is not an executable file: ${configuredPath}. Set idea.path to the native launcher (not a .cmd/.bat file).`, 400)
  }
  const candidates = fromPath(platform === 'win32' ? ['idea64.exe', 'idea.exe', 'idea'] : ['idea', 'idea.sh'])
  if (platform === 'win32') {
    const bases = [...new Set([env.ProgramFiles ?? 'C:\\Program Files', env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'])]
    for (const base of bases) {
      const jetbrains = paths.join(base, 'JetBrains')
      let entries = []
      try { entries = await list(jetbrains, { withFileTypes: true }) } catch { /* optional installation directory */ }
      for (const entry of entries.filter(entry => entry.isDirectory() && /IntelliJ IDEA/i.test(entry.name)).sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))) {
        candidates.push(paths.join(jetbrains, entry.name, 'bin', 'idea64.exe'), paths.join(jetbrains, entry.name, 'bin', 'idea.exe'))
      }
    }
  } else if (platform === 'darwin') {
    for (const base of ['/Applications', paths.join(home, 'Applications')]) {
      for (const app of ['IntelliJ IDEA.app', 'IntelliJ IDEA Ultimate.app', 'IntelliJ IDEA CE.app']) {
        candidates.push(paths.join(base, app, 'Contents/MacOS/idea'))
      }
    }
  }
  for (const candidate of candidates) if (await usable(candidate)) return candidate
  throw new ApiError('idea-unavailable', 'IntelliJ IDEA launcher was not found. Set idea.path in Settings to its executable path.', 404)
}

/** Open the original selected project and a regular file contained within it. */
export async function openInIdea(payload, configuredPath = '', options = {}) {
  const root = await canonicalRoot(requireString(payload, 'root'))
  const requested = resolveInside(root, requireString(payload, 'path'))
  let file
  try { file = await realpath(requested) } catch {
    throw new ApiError('not-found', 'Selected file does not exist', 404)
  }
  resolveInside(root, file) // Recheck after symlink/junction resolution.
  let info
  try { info = await stat(file) } catch {
    throw new ApiError('not-found', 'Selected file does not exist', 404)
  }
  if (!info.isFile()) throw new ApiError('bad-request', 'Select a regular file to open in IntelliJ IDEA')
  const executable = await (options.resolveExecutable ?? resolveIdeaExecutable)(configuredPath, options)
  await new Promise((resolve, reject) => {
    let child
    const fail = error => reject(new ApiError('idea-launch-failed', `Cannot launch IntelliJ IDEA: ${error instanceof Error ? error.message : String(error)}`, 500))
    try {
      child = (options.spawn ?? spawn)(executable, [root, file], {
        cwd: root,
        detached: true,
        stdio: 'ignore',
        shell: false,
        windowsHide: false,
      })
      child.once('error', fail)
      child.once('spawn', () => { child.unref(); resolve() })
    } catch (error) { fail(error) }
  })
  return { accepted: true, root, path: file, executable, message: 'IntelliJ IDEA launch accepted; opening is not guaranteed.' }
}
