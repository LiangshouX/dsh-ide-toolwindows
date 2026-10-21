/**
 * Durable plugin settings.
 *
 * DSH has no "plugin KV" service in this build; the profile directory is the
 * one durable, profile-scoped location every deployment has. One JSON file per
 * profile, written atomically (temp + rename), read once and cached in memory.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** Deep defaults; a saved document is merged over this at load time. */
export const DEFAULT_SETTINGS = {
  version: 1,
  /** Last root the user worked in (absolute path). */
  lastRoot: '',
  git: {
    path: '',
    colors: true,
    commitTemplate: '',
  },
  terminal: {
    /** 'auto' or a shell id from terminal.shells. */
    shell: 'auto',
    cwdMode: 'root',
    copyOnSelect: false,
    fontSize: 13,
  },
  project: {
    alwaysSelectOpened: true,
    showHidden: true,
  },
  editor: {
    fontSize: 13,
    wordWrap: false,
    sideBySide: true,
    highlight: true,
    /** Newly opened files start in the read-only viewer. */
    defaultReadOnly: true,
    /** Markdown files open rendered rather than as source. */
    markdownPreview: true,
  },
  shortcuts: {
    project: 'Alt+1',
    commit: 'Alt+0',
    git: 'Alt+9',
    terminal: 'Alt+F12',
    focusCommit: 'Ctrl+K',
    push: 'Ctrl+Shift+K',
  },
  /** Selected IDE project root per workspace root. */
  projectRoots: {},
  /** Per-project UI state: expanded dirs, open tabs, dock geometry. */
  workspaceState: {},
}

/** The directory of the active DSH profile (falls back to the home install). */
export function profileBase() {
  const profileDir = process.env.DSH_PROFILE_DIR
  if (typeof profileDir === 'string' && profileDir !== '') return profileDir
  const dshHome = process.env.DSH_HOME
  if (typeof dshHome === 'string' && dshHome !== '') return dshHome
  return join(homedir(), '.dsh')
}

/** Absolute settings file path. */
export function settingsFile() {
  return join(profileBase(), 'ide-toolwindows', 'settings.json')
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Recursive merge of `patch` into a clone of `base`. */
export function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return base
  const output = isPlainObject(base) ? { ...base } : {}
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value) && isPlainObject(output[key])) output[key] = deepMerge(output[key], value)
    else output[key] = value
  }
  return output
}

/**
 * One settings document for the lifetime of the plugin fiber.
 */
export class SettingsStore {
  constructor() {
    this.value = DEFAULT_SETTINGS
    this.ready = null
    this.pending = Promise.resolve()
  }

  /** Load (once) and return the current document. */
  async get() {
    if (this.ready === null) this.ready = this.#load()
    return this.ready
  }

  async #load() {
    try {
      const text = await readFile(settingsFile(), 'utf8')
      const parsed = JSON.parse(text)
      this.value = deepMerge(DEFAULT_SETTINGS, isPlainObject(parsed) ? parsed : {})
    } catch {
      this.value = structuredClone(DEFAULT_SETTINGS)
    }
    return this.value
  }

  /** Merge one patch and persist atomically (serialized). */
  async update(patch) {
    await this.get()
    this.value = deepMerge(this.value, patch)
    const snapshot = structuredClone(this.value)
    this.pending = this.pending.then(() => this.#write(snapshot)).catch(() => {})
    await this.pending
    return this.value
  }

  async #write(snapshot) {
    const file = settingsFile()
    await mkdir(dirname(file), { recursive: true })
    const temp = `${file}.${process.pid}.tmp`
    await writeFile(temp, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
    await rename(temp, file)
  }
}
