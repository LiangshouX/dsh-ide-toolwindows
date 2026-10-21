/**
 * The workbench store: one shared repository snapshot behind all four tool
 * windows (Project / Commit / Git / Terminal).
 *
 * The store lives for the lifetime of the plugin fiber (created in `apply`),
 * not for the lifetime of the rendered panel, so switching back to the
 * Conversation and returning keeps tabs, expanded folders and layout.
 */
import { call } from './api.js'
import { isMarkdownFile } from './file-types.js'
import { baseName, debounce, dirName, formatGitDate } from './util.js'

let sequence = 0
/** A process-local id for transient UI keys. */
export function nextId(prefix = 'id') {
  sequence += 1
  return `${prefix}-${sequence}`
}

/** Coarse file kind used for the welcome screen and icons. */
export function extOf(name) {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot).toLowerCase()
}

/** Whether a file opens in the rendered Markdown view by default. */
export function isMarkdownPath(path) {
  return isMarkdownFile(path)
}

/** Parent directory path (both separators). */
function parentPath(path) {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return index <= 0 ? path : path.slice(0, index)
}

/** Join a workspace-relative path to an absolute root using the root's own separator. */
function joinPath(root, rel) {
  const separator = root.includes('\\') ? '\\' : '/'
  return `${root.replace(/[\\/]$/, '')}${separator}${String(rel).split('/').join(separator)}`
}

/** The initial state, also the shape persisted UI is merged into. */
function initialState() {
  return {
    phase: 'booting',
    active: false,
    error: null,
    fatal: null,
    /** The DSH workspace root (the outer boundary). */
    workspaceRoot: '',
    /** The selected IDE project root (workspace root or a first-level child). */
    root: '',
    /** Root + first-level folders offered by the project picker. */
    projects: [],
    projectPicker: false,
    home: '',
    workspaces: [],
    settings: null,
    status: { isRepo: false, entries: [], branch: undefined, detached: false, ahead: undefined, behind: undefined, root: null },
    statusError: null,
    statusAt: 0,
    layout: { left: 'project', leftWidth: 300, bottom: null, bottomHeight: 270 },
    dirs: new Map(),
    expanded: new Set(),
    selectedPath: '',
    filter: '',
    tabs: [],
    activeId: null,
    commit: {
      message: '',
      amend: false,
      messages: [],
      messagesLoading: false,
      committing: false,
      error: null,
      mode: 'side',
    },
    git: {
      commits: [],
      skip: 0,
      hasMore: true,
      loading: false,
      error: null,
      filters: { branch: '', author: '', query: '' },
      branches: [],
      selectedHash: null,
      detail: null,
      detailLoading: false,
    },
    terminal: {
      sessions: [],
      activeKey: null,
      shells: [],
      shellsLoaded: false,
    },
    rootPicker: false,
    confirm: null,
    toast: null,
    localeTick: 0,
  }
}

export class WorkbenchStore {
  /**
   * @param {any} ctx client cordis context
   * @param {() => string} t bound translate function
   */
  constructor(ctx, t) {
    this.ctx = ctx
    this.t = t
    this.state = initialState()
    this.listeners = new Set()
    this.pollTimer = null
    this.polling = false
    this.persist = debounce(() => { void this.#persist() }, 700)
    this.toastTimer = null
    this.treeReloadToken = 0
    this.gitRequestToken = 0
    this.settingsFile = ''
    this.unsubscribers = []
  }

  // ── subscription ──────────────────────────────────────────────────────
  subscribe = (listener) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  getSnapshot = () => this.state

  /** Replace state and notify (one render per change). */
  set(patch) {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }

  /** Patch one nested slice. */
  patch(key, patch) {
    this.set({ [key]: { ...this.state[key], ...patch } })
  }

  /** Show a transient toast. */
  toast(kind, text, detail) {
    const id = nextId('toast')
    this.set({ toast: { id, kind, text, detail: detail ?? '' } })
    if (this.toastTimer !== null) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => {
      this.toastTimer = null
      if (this.state.toast?.id === id) this.set({ toast: null })
    }, kind === 'error' ? 9000 : 4500)
  }

  /** Ask the user to confirm one destructive action. */
  askConfirm(title, body, confirmLabel, onConfirm, danger = true) {
    this.set({
      confirm: {
        title,
        body,
        confirmLabel,
        cancelLabel: this.t('common.cancel'),
        danger,
        onConfirm,
      },
    })
  }

  dismissConfirm() {
    this.set({ confirm: null })
  }

  // ── boot ──────────────────────────────────────────────────────────────
  async init() {
    this.unsubscribers.push(this.ctx.locale.subscribe(() => {
      this.set({ localeTick: this.state.localeTick + 1 })
    }))
    try {
      const settingsResult = await call('settings.get')
      this.settingsFile = settingsResult.file
      const workspaces = await call('workspace.list')
      const settings = settingsResult.value
      const preferred = this.#pickRoot(settings, workspaces)
      const savedProject = preferred !== undefined ? settings?.projectRoots?.[preferred] : undefined
      this.set({
        settings,
        workspaces: workspaces.items,
        home: workspaces.defaultDirectory ?? '',
        workspaceRoot: preferred ?? '',
        root: typeof savedProject === 'string' && savedProject !== '' ? savedProject : (preferred ?? ''),
        phase: 'ready',
      })
      if (preferred !== undefined && preferred !== '') {
        await this.loadProjects(preferred)
        const projectRoot = this.#projectRootFor(preferred)
        this.set({ root: projectRoot })
        this.#restoreWorkspace(projectRoot)
        this.patch('commit', { mode: settings?.editor?.sideBySide === false ? 'unified' : 'side' })
        void this.refreshStatus({ initial: true })
        void this.refreshShells()
        if (settings?.lastRoot === undefined || settings.lastRoot === '') {
          // First run: remember the chosen root so the next launch opens the
          // same workspace. Later activations must NOT rewrite lastRoot: an
          // in-flight init from a hot reload could otherwise overwrite a root
          // the user just switched to.
          this.state.settings = { ...(this.state.settings ?? settings), lastRoot: preferred }
          void call('settings.update', { patch: { lastRoot: preferred } })
            .then((result) => { this.state.settings = result.value })
            .catch(() => {})
        }
      } else {
        this.set({ rootPicker: true })
      }
    } catch (error) {
      this.set({ phase: 'ready', fatal: error instanceof Error ? error.message : String(error) })
    }
  }

  /** Choose the durable root: last used → most recent workspace → default dir. */
  #pickRoot(settings, workspaces) {
    const candidates = [settings?.lastRoot, workspaces.defaultRoot, workspaces.defaultDirectory]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate !== '') return candidate
    }
    return workspaces.items[0]?.path
  }

  /**
   * Load the IDE project candidates (workspace root + first-level folders).
   * A failure is non-fatal: the workspace root is always a usable candidate.
   * @param {string} [workspaceRoot]
   */
  async loadProjects(workspaceRoot = this.state.workspaceRoot) {
    if (typeof workspaceRoot !== 'string' || workspaceRoot === '') return []
    let projects = []
    try {
      const result = await call('workspace.projects', { root: workspaceRoot })
      projects = Array.isArray(result?.projects)
        ? result.projects
            .filter(project => project !== null && typeof project === 'object' && typeof project.path === 'string')
            .map(project => ({
              path: project.path,
              name: typeof project.name === 'string' && project.name !== '' ? project.name : baseName(project.path),
              isRepo: project.isRepo === true,
              isRoot: project.isRoot === true || project.path === workspaceRoot,
            }))
        : []
    } catch {
      projects = []
    }
    if (!projects.some(project => project.path === workspaceRoot)) {
      projects.unshift({ path: workspaceRoot, name: baseName(workspaceRoot), isRepo: false, isRoot: true })
    }
    this.set({ projects })
    return projects
  }

  /** The persisted project root for a workspace, when the folder still exists. */
  #projectRootFor(workspaceRoot) {
    const saved = this.state.settings?.projectRoots?.[workspaceRoot]
    if (typeof saved === 'string' && this.state.projects.some(project => project.path === saved)) return saved
    return workspaceRoot
  }

  /** Persist the selected project immediately (does not wait for debounce). */
  #rememberProjectRoot(projectRoot) {
    const workspaceRoot = this.state.workspaceRoot
    if (workspaceRoot === '' || projectRoot === '') return
    const projectRoots = { ...(this.state.settings?.projectRoots ?? {}), [workspaceRoot]: projectRoot }
    this.state.settings = { ...(this.state.settings ?? {}), projectRoots }
    void call('settings.update', { patch: { projectRoots: { [workspaceRoot]: projectRoot } } })
      .then((result) => { this.state.settings = result.value })
      .catch(() => {})
  }

  /** Switch the DSH workspace; its project root is restored from settings. */
  async setRoot(workspaceRoot) {
    if (typeof workspaceRoot !== 'string' || workspaceRoot === '') return
    if (workspaceRoot === this.state.workspaceRoot) return
    if (this.state.tabs.some(tab => tab.dirty === true)) {
      this.askConfirm(
        this.t('editor.unsavedTitle'),
        this.t('editor.unsavedSwitchRoot'),
        this.t('editor.discardChanges'),
        () => { void this.#switchWorkspace(workspaceRoot) },
      )
      return
    }
    await this.#switchWorkspace(workspaceRoot)
  }

  async #switchWorkspace(workspaceRoot) {
    await this.loadProjects(workspaceRoot)
    const projectRoot = this.#projectRootFor(workspaceRoot)
    this.set({
      workspaceRoot,
      root: projectRoot,
      projectPicker: false,
      dirs: new Map(),
      expanded: new Set(),
      selectedPath: '',
      filter: '',
      tabs: [],
      activeId: null,
      status: initialState().status,
      git: { ...initialState().git },
    })
    this.#rememberProjectRoot(projectRoot)
    this.#restoreWorkspace(projectRoot)
    void this.loadDir(projectRoot)
    await this.refreshStatus({ initial: true })
    void this.refreshShells()
    void this.loadLog(true)
    void this.persistNow()
  }

  /** Switch the IDE project root inside the current workspace. */
  async selectProject(projectRoot) {
    if (typeof projectRoot !== 'string' || projectRoot === '') return
    if (!this.state.projects.some(project => project.path === projectRoot)) return
    if (projectRoot === this.state.root) {
      this.set({ projectPicker: false })
      return
    }
    if (this.state.tabs.some(tab => tab.dirty === true)) {
      this.askConfirm(
        this.t('editor.unsavedTitle'),
        this.t('editor.unsavedSwitchRoot'),
        this.t('editor.discardChanges'),
        () => { void this.#switchProject(projectRoot) },
      )
      return
    }
    await this.#switchProject(projectRoot)
  }

  async #switchProject(projectRoot) {
    this.set({
      root: projectRoot,
      projectPicker: false,
      dirs: new Map(),
      expanded: new Set(),
      selectedPath: '',
      filter: '',
      tabs: [],
      activeId: null,
      status: initialState().status,
      git: { ...initialState().git },
    })
    this.#rememberProjectRoot(projectRoot)
    this.#restoreWorkspace(projectRoot)
    void this.loadDir(projectRoot)
    await this.refreshStatus({ initial: true })
    void this.refreshShells()
    void this.loadLog(true)
    void this.persistNow()
  }

  openProjectPicker() {
    if (this.state.workspaceRoot === '') {
      this.openRootPicker()
      return
    }
    this.set({ projectPicker: true })
    void this.loadProjects()
  }

  closeProjectPicker() {
    this.set({ projectPicker: false })
  }

  #restoreWorkspace(root) {
    const saved = this.state.settings?.workspaceState?.[root]
    if (saved === null || typeof saved !== 'object') {
      this.set({ expanded: new Set(), tabs: [], activeId: null })
      return
    }
    const expanded = new Set(Array.isArray(saved.expanded) ? saved.expanded.filter(item => typeof item === 'string') : [])
    const tabs = Array.isArray(saved.tabs)
      ? saved.tabs
          .filter(tab => tab !== null && typeof tab === 'object' && typeof tab.path === 'string')
          .slice(-24)
          .map(tab => ({
            id: `file:${tab.path}`,
            kind: 'file',
            path: tab.path,
            name: baseName(tab.path),
            rel: tab.rel ?? tab.path,
            preview: tab.preview === true,
            pinned: tab.pinned !== false,
            loading: false,
            content: null,
            error: null,
            scrollTop: typeof tab.scrollTop === 'number' ? tab.scrollTop : 0,
            editing: this.state.settings?.editor?.defaultReadOnly === false,
            view: isMarkdownPath(tab.path) && this.state.settings?.editor?.markdownPreview !== false ? 'preview' : 'code',
            draft: null,
            dirty: false,
            saving: false,
          }))
      : []
    const activeId = typeof saved.activePath === 'string' && tabs.some(tab => tab.path === saved.activePath)
      ? `file:${saved.activePath}`
      : (tabs[0]?.id ?? null)
    const layout = {
      left: saved.layout?.left === undefined ? 'project' : saved.layout.left,
      leftWidth: typeof saved.layout?.leftWidth === 'number' ? saved.layout.leftWidth : 300,
      bottom: saved.layout?.bottom === undefined ? null : saved.layout.bottom,
      bottomHeight: typeof saved.layout?.bottomHeight === 'number' ? saved.layout.bottomHeight : 270,
    }
    this.set({ expanded, tabs, activeId, layout })
    for (const tab of tabs) void this.ensureTabContent(tab.id)
  }

  async #persist() {
    const state = this.state
    if (state.workspaceRoot === '' || state.root === '') return
    const fileTabs = state.tabs
      .filter(tab => tab.kind === 'file')
      .map(tab => ({
        path: tab.path,
        rel: tab.rel,
        preview: tab.preview,
        pinned: tab.pinned,
        scrollTop: tab.scrollTop ?? 0,
      }))
    const active = state.tabs.find(tab => tab.id === state.activeId)
    const workspaceState = {
      expanded: [...state.expanded].slice(0, 3000),
      tabs: fileTabs.slice(-24),
      activePath: active?.kind === 'file' ? active.path : undefined,
      layout: state.layout,
    }
    try {
      const result = await call('settings.update', {
        patch: {
          lastRoot: state.workspaceRoot,
          projectRoots: { [state.workspaceRoot]: state.root },
          workspaceState: { [state.root]: workspaceState },
        },
      })
      const next = { ...state.settings, ...result.value }
      // Keep the in-memory document in sync without a render (the tree reads
      // settings.project.showHidden on every list call).
      this.state.settings = next
    } catch {
      // Persisting is best effort; the session keeps working in memory.
    }
  }

  async persistNow() {
    this.persist.cancel()
    await this.#persist()
  }

  // ── status polling ────────────────────────────────────────────────────
  activate() {
    this.set({ active: true })
    if (this.pollTimer === null) {
      this.pollTimer = setInterval(() => { void this.pollStatus() }, 2000)
    }
    if (this.state.root !== '' && this.state.statusAt === 0) void this.refreshStatus({ initial: true })
    if (this.state.root !== '' && !this.state.dirs.has(this.state.root)) void this.loadDir(this.state.root)
    // A restored dock with no session would just eat space: terminals die with
    // the panel, so a bottom dock only makes sense once a session exists.
    if (this.state.layout.bottom === 'terminal' && this.state.terminal.sessions.length === 0) {
      this.set({ layout: { ...this.state.layout, bottom: null } })
    }
  }

  deactivate() {
    // Terminal sockets are owned by the mounted views; leaving the panel
    // closes them, so the session list goes with it.
    this.set({ active: false, terminal: { ...this.state.terminal, sessions: [], activeKey: null } })
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    void this.persistNow()
  }

  async pollStatus() {
    if (!this.state.active || this.state.root === '' || this.polling) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    await this.refreshStatus({ silent: true })
  }

  async refreshStatus(options = {}) {
    if (this.state.root === '') return
    if (this.polling && options.silent !== false) return
    this.polling = true
    const root = this.state.root
    try {
      const status = await call('git.status', { root })
      if (this.state.root !== root) return
      const previousPaths = new Set(this.state.status.entries.map(entry => entry.path))
      const nextPaths = new Set(status.entries.map(entry => entry.path))
      const changed = status.entries.some(entry => !previousPaths.has(entry.path))
        || [...previousPaths].some(path => !nextPaths.has(path))
      this.set({
        status,
        statusError: null,
        statusAt: Date.now(),
      })
      if (changed || options.initial === true) {
        this.#invalidateChangedDirs(status)
        this.#refreshActiveFile(status)
        if (this.state.layout.bottom === 'git') void this.loadLog(true, { silent: true })
      }
      if (options.initial === true) {
        void this.loadLog(true, { silent: true })
        void this.loadBranches()
        void this.loadCommitMessages()
      }
    } catch (error) {
      this.set({ statusError: error instanceof Error ? error.message : String(error) })
    } finally {
      this.polling = false
    }
  }

  /** Reload only the expanded directories that contain a changed path. */
  #invalidateChangedDirs(status) {
    const dirtyParents = new Set()
    for (const entry of status.entries) {
      dirtyParents.add(parentPath(joinPath(this.state.root, entry.path)))
    }
    const opened = [...this.state.expanded]
    for (const dir of opened) {
      if (dirtyParents.has(dir)) void this.loadDir(dir, { force: true })
    }
    // The root level itself changed (new/deleted top-level entries).
    if (status.entries.some(entry => !entry.path.includes('/') && !entry.path.includes('\\'))) {
      void this.loadDir(this.state.root, { force: true })
    }
  }

  /** Refresh one open file when its content changed on disk. */
  #refreshActiveFile(status) {
    const active = this.state.tabs.find(tab => tab.id === this.state.activeId)
    if (active === undefined || active.kind !== 'file') return
    // Never yank the document out from under an open editor: a clean editor
    // would otherwise keep showing stale text and overwrite the external
    // change on the next keystroke.
    if (active.editing === true) return
    const entry = status.entries.find(item => item.path === active.rel)
    if (entry === undefined) return
    void this.ensureTabContent(active.id, { force: true })
  }

  // ── file tree ─────────────────────────────────────────────────────────
  async loadDir(path, options = {}) {
    if (this.state.root === '') return
    const existing = this.state.dirs.get(path)
    if (existing !== undefined && existing.loading) return
    if (existing !== undefined && existing.entries !== undefined && options.force !== true) return
    const dirs = new Map(this.state.dirs)
    dirs.set(path, { ...(existing ?? {}), loading: true, error: null })
    this.set({ dirs })
    const token = ++this.treeReloadToken
    try {
      const listing = await call('fs.tree', { root: this.state.root, path })
      if (token < this.treeReloadToken - 1) return
      const next = new Map(this.state.dirs)
      next.set(path, { loading: false, entries: listing.entries, truncated: listing.truncated, error: null })
      this.set({ dirs: next })
    } catch (error) {
      const next = new Map(this.state.dirs)
      next.set(path, { loading: false, entries: existing?.entries, error: error instanceof Error ? error.message : String(error) })
      this.set({ dirs: next })
    }
  }

  async reloadTree() {
    const expanded = [...this.state.expanded]
    const dirs = new Map()
    this.set({ dirs })
    await this.loadDir(this.state.root, { root: true, force: true })
    for (const dir of expanded) {
      if (dir !== this.state.root) await this.loadDir(dir, { force: true })
    }
  }

  toggleDir(path) {
    const expanded = new Set(this.state.expanded)
    if (expanded.has(path)) {
      expanded.delete(path)
    } else {
      expanded.add(path)
      void this.loadDir(path)
    }
    this.set({ expanded })
    this.persist()
  }

  collapseAll() {
    this.set({ expanded: new Set([this.state.root]) })
    this.persist()
  }

  setSelectedPath(path) {
    this.set({ selectedPath: path })
    const expanded = new Set(this.state.expanded)
    let parent = parentPath(path)
    let guard = 0
    while (parent.length >= this.state.root.length && guard < 64) {
      if (!expanded.has(parent)) {
        expanded.add(parent)
        void this.loadDir(parent)
      }
      if (parent === this.state.root) break
      parent = parentPath(parent)
      guard += 1
    }
    this.set({ expanded })
    this.persist()
  }

  setFilter(filter) {
    this.set({ filter })
  }

  /** Reveal one path in the native file manager. */
  async reveal(path) {
    try {
      await call('fs.reveal', { root: this.state.root, path })
    } catch (error) {
      this.toast('error', this.t('common.error'), error instanceof Error ? error.message : String(error))
    }
  }

  // ── editor tabs ───────────────────────────────────────────────────────
  get activeTab() {
    return this.state.tabs.find(tab => tab.id === this.state.activeId) ?? null
  }

  /**
   * Open a file with IDEA semantics:
   * - a pinned tab for the path is focused;
   * - a single click reuses the one preview tab (or creates it);
   * - a double click pins the tab (creating a pinned one when needed).
   * @param {string} path absolute path
   * @param {{ rel?: string, preview?: boolean }} [options]
   */
  openFile(path, options = {}) {
    if (typeof path !== 'string' || path === '') return
    const rel = options.rel ?? path
    const existing = this.state.tabs.find(tab => tab.kind === 'file' && tab.path === path)
    if (existing !== undefined) {
      const tabs = this.state.tabs.map(tab => (tab === existing ? { ...tab, preview: tab.preview && options.preview === true } : tab))
      this.set({ tabs, activeId: existing.id })
      this.setSelectedPath(path)
      if (options.preview !== true) void this.pinTab(existing.id, { silent: true })
      void this.ensureTabContent(existing.id)
      this.persist()
      return
    }
    const preview = options.preview === true
    const tab = {
      id: `file:${path}`,
      kind: 'file',
      path,
      name: baseName(path),
      rel,
      preview,
      pinned: !preview,
      loading: false,
      content: null,
      error: null,
      scrollTop: 0,
      editing: this.state.settings?.editor?.defaultReadOnly === false,
      view: isMarkdownPath(path) && this.state.settings?.editor?.markdownPreview !== false ? 'preview' : 'code',
      draft: null,
      dirty: false,
      saving: false,
    }
    let tabs = this.state.tabs
    if (preview) {
      const previewIndex = tabs.findIndex(item => item.kind === 'file' && item.preview)
      if (previewIndex >= 0) {
        const current = tabs[previewIndex]
        if (current.dirty === true) {
          // Never drop unsaved edits: pin the dirty preview first, then open the
          // new file in a fresh preview tab.
          tabs = [...tabs.map((item, index) => (index === previewIndex ? { ...item, preview: false, pinned: true } : item)), tab]
        } else {
          tabs = tabs.map((item, index) => (index === previewIndex ? tab : item))
        }
      } else {
        tabs = [...tabs, tab]
      }
    } else {
      tabs = [...tabs, tab]
    }
    this.set({ tabs, activeId: tab.id })
    this.setSelectedPath(path)
    void this.ensureTabContent(tab.id)
    this.persist()
  }

  /** Load (or reload) one tab's payload. */
  async ensureTabContent(id, options = {}) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined) return
    if (tab.loading === true) return
    if (options.force !== true) {
      if (tab.kind === 'file' && tab.content !== null) return
      if (tab.kind === 'diff' && tab.payload !== undefined) return
      if (tab.kind === 'commit' && tab.detail !== undefined) return
    }
    this.#updateTab(id, { loading: true, error: null })
    try {
      if (tab.kind === 'file') {
        const result = await call('fs.read', { root: this.state.root, path: tab.path })
        const latest = this.state.tabs.find(item => item.id === id)
        const text = result.kind === 'text' ? result.content : null
        const eol = typeof text === 'string' && text.includes('\r\n') ? '\r\n' : '\n'
        const keepDraft = latest?.dirty === true && options.force === true
        this.#updateTab(id, {
          loading: false,
          payload: { ...result, eol },
          content: text,
          // A forced refresh (external change) must not clobber unsaved edits.
          ...(keepDraft ? {} : { draft: text, dirty: false }),
        })
      } else if (tab.kind === 'diff') {
        const result = await call('git.diff', {
          root: this.state.root,
          path: tab.rel,
          staged: tab.staged === true,
          untracked: tab.untracked === true,
        })
        this.#updateTab(id, { loading: false, payload: result })
      } else if (tab.kind === 'commit') {
        const detail = await call('git.detail', { root: this.state.root, hash: tab.hash })
        this.#updateTab(id, { loading: false, detail })
      }
    } catch (error) {
      this.#updateTab(id, { loading: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  #updateTab(id, patch) {
    const tabs = this.state.tabs.map(tab => (tab.id === id ? { ...tab, ...patch } : tab))
    this.set({ tabs })
  }

  updateActiveTab(patch) {
    if (this.state.activeId === null) return
    this.#updateTab(this.state.activeId, patch)
  }

  activateTab(id) {
    if (!this.state.tabs.some(tab => tab.id === id)) return
    this.set({ activeId: id })
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab?.kind === 'file') this.setSelectedPath(tab.path)
    this.persist()
  }

  async pinTab(id, options = {}) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file' || tab.pinned) return
    this.#updateTab(id, { preview: false, pinned: true })
    this.persist()
    if (options.silent !== true) this.toast('info', this.t('common.pinTab'))
  }

  closeTab(id, options = {}) {
    const index = this.state.tabs.findIndex(tab => tab.id === id)
    if (index < 0) return
    const tab = this.state.tabs[index]
    if (tab.dirty === true && options.force !== true) {
      this.askConfirm(
        this.t('editor.unsavedTitle'),
        this.t('editor.unsavedClose'),
        this.t('editor.discardChanges'),
        () => this.closeTab(id, { force: true }),
      )
      return
    }
    const tabs = this.state.tabs.filter(item => item.id !== id)
    let activeId = this.state.activeId
    if (activeId === id) {
      const next = tabs[Math.min(index, tabs.length - 1)]
      activeId = next?.id ?? null
    }
    this.set({ tabs, activeId })
    this.persist()
  }

  closeOtherTabs(id) {
    this.set({ tabs: this.state.tabs.filter(tab => tab.id === id || tab.dirty === true), activeId: id })
    this.persist()
  }

  /** Switch one file tab between read-only and edit mode. */
  setTabEditing(id, editing) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file' || tab.payload?.kind !== 'text') return
    if (editing === true) {
      this.#updateTab(id, {
        editing: true,
        view: 'code',
        draft: tab.draft ?? tab.payload.content ?? '',
      })
    } else {
      this.#updateTab(id, {
        editing: false,
        view: isMarkdownPath(tab.path) ? 'preview' : 'code',
      })
    }
  }

  /** Switch the read-only renderer between rendered Markdown and source. */
  setTabView(id, view) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file') return
    this.#updateTab(id, { view: view === 'preview' ? 'preview' : 'code' })
  }

  /** Record one editor keystroke (dirty = differs from the saved buffer). */
  updateDraft(id, text) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file') return
    const saved = tab.payload?.kind === 'text' ? tab.payload.content : (tab.content ?? '')
    this.#updateTab(id, { draft: text, dirty: text !== saved })
  }

  /** Throw the buffer away and return to the saved content. */
  discardDraft(id) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file') return
    const saved = tab.payload?.kind === 'text' ? tab.payload.content : ''
    this.#updateTab(id, {
      draft: saved,
      dirty: false,
      // Force the CodeMirror instance to rebuild with the saved document.
      resetToken: (tab.resetToken ?? 0) + 1,
    })
  }

  /** Persist one edited file through the host's fenced writer. */
  async saveTab(id) {
    const tab = this.state.tabs.find(item => item.id === id)
    if (tab === undefined || tab.kind !== 'file' || tab.dirty !== true || tab.saving === true) return
    const text = tab.draft ?? ''
    const payload = tab.payload ?? {}
    const eol = payload.eol === '\r\n' ? '\r\n' : '\n'
    const normalized = text.replace(/\r\n/g, '\n')
    const out = eol === '\r\n' ? normalized.replace(/\n/g, '\r\n') : normalized
    this.#updateTab(id, { saving: true })
    try {
      const result = await call('fs.write', {
        root: this.state.root,
        path: tab.path,
        content: out,
        encoding: payload.encoding ?? 'utf-8',
      })
      const latest = this.state.tabs.find(item => item.id === id)
      const latestDraft = latest?.draft ?? text
      this.#updateTab(id, {
        saving: false,
        // Keystrokes typed while the write was in flight stay dirty.
        dirty: latestDraft !== text,
        content: text,
        draft: latestDraft,
        payload: { ...payload, content: text, size: result.size, mtimeMs: result.mtimeMs, encoding: result.encoding ?? payload.encoding },
      })
      this.toast('success', this.t('editor.saved'), baseName(tab.path))
      void this.refreshStatus({ initial: false })
    } catch (error) {
      this.#updateTab(id, { saving: false })
      this.toast('error', this.t('editor.saveFailed'), error instanceof Error ? error.message : String(error))
    }
  }

  /** Open the diff of one changed file (Commit / Git windows). */
  openDiff({ path, staged = false, untracked = false }) {
    if (typeof path !== 'string' || path === '') return
    const id = `diff:${untracked ? 'untracked' : staged ? 'staged' : 'worktree'}:${path}`
    const existing = this.state.tabs.find(tab => tab.id === id)
    if (existing !== undefined) {
      this.set({ activeId: id })
      void this.ensureTabContent(id, { force: true })
      return
    }
    const tab = {
      id,
      kind: 'diff',
      path,
      name: baseName(path),
      rel: path,
      staged,
      untracked,
      preview: false,
      pinned: true,
      loading: false,
      error: null,
      scrollTop: 0,
      mode: this.state.commit.mode,
    }
    this.set({ tabs: [...this.state.tabs, tab], activeId: id })
    void this.ensureTabContent(id)
  }

  async openCommit(hash) {
    const id = `commit:${hash}`
    const existing = this.state.tabs.find(tab => tab.id === id)
    if (existing !== undefined) {
      this.set({ activeId: id })
      void this.ensureTabContent(id)
      return
    }
    const tab = {
      id,
      kind: 'commit',
      hash,
      name: hash.slice(0, 7),
      rel: hash,
      preview: false,
      pinned: true,
      loading: false,
      error: null,
      scrollTop: 0,
    }
    this.set({ tabs: [...this.state.tabs, tab], activeId: id })
    void this.ensureTabContent(id)
  }

  setDiffMode(mode) {
    this.patch('commit', { mode })
    const tabs = this.state.tabs.map(tab => (tab.kind === 'diff' ? { ...tab, mode } : tab))
    this.set({ tabs })
    void this.updateSettings({ editor: { sideBySide: mode === 'side' } })
  }

  // ── commit window ─────────────────────────────────────────────────────
  get groups() {
    const entries = this.state.status.entries ?? []
    return {
      staged: entries.filter(entry => entry.staged === true),
      unstaged: entries.filter(entry => entry.unstaged === true),
      untracked: entries.filter(entry => entry.untracked === true),
    }
  }

  get changeCount() {
    const groups = this.groups
    return groups.unstaged.length + groups.untracked.length
  }

  setCommitMessage(message) {
    this.patch('commit', { message, error: null })
  }

  setAmend(amend) {
    this.patch('commit', { amend })
  }

  async loadCommitMessages() {
    if (this.state.root === '') return
    this.patch('commit', { messagesLoading: true })
    try {
      const result = await call('git.messages', { root: this.state.root, count: 10 })
      this.patch('commit', { messages: result.messages, messagesLoading: false })
    } catch {
      this.patch('commit', { messagesLoading: false })
    }
  }

  async stage(paths, options = {}) {
    if (paths.length === 0) return
    try {
      await call('git.stage', { root: this.state.root, paths })
      await this.refreshStatus({ initial: false })
      if (options.refreshDiff === true) this.#reloadActiveDiff()
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  async unstage(paths, options = {}) {
    if (paths.length === 0) return
    try {
      await call('git.unstage', { root: this.state.root, paths })
      await this.refreshStatus({ initial: false })
      if (options.refreshDiff === true) this.#reloadActiveDiff()
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  async stagePatch(patch, direction) {
    if (typeof patch !== 'string' || patch === '') {
      this.toast('info', this.t('commit.noChanges'))
      return
    }
    try {
      await call('git.apply-patch', { root: this.state.root, patch, direction })
      await this.refreshStatus({ initial: false })
      this.#reloadActiveDiff()
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  async discardEntries(entries) {
    if (entries.length === 0) return
    const untracked = entries.filter(entry => entry.untracked === true).map(entry => entry.path)
    const tracked = entries.filter(entry => entry.untracked !== true).map(entry => entry.path)
    try {
      await call('git.discard', { root: this.state.root, paths: tracked, untracked })
      await this.refreshStatus({ initial: false })
      this.toast('success', this.t('common.success'))
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  #reloadActiveDiff() {
    const active = this.state.tabs.find(tab => tab.id === this.state.activeId)
    if (active?.kind === 'diff') void this.ensureTabContent(active.id, { force: true })
  }

  async commit(message, amend, pushAfter) {
    const state = this.state.commit
    if (state.committing) return
    if (typeof message !== 'string' || message.trim() === '') {
      this.patch('commit', { error: this.t('commit.messageRequired') })
      return
    }
    this.patch('commit', { committing: true, error: null })
    try {
      const result = await call('git.commit', { root: this.state.root, message, amend })
      this.patch('commit', { committing: false, message: '', amend: false, error: null })
      this.toast('success', this.t('commit.committed'), result.hash ?? '')
      await this.refreshStatus({ initial: false })
      void this.loadCommitMessages()
      void this.loadLog(true)
      if (this.state.layout.bottom === 'git') void this.loadLog(true, { silent: true })
      if (pushAfter) await this.push({ afterCommit: true })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      this.patch('commit', { committing: false, error: messageText })
      this.toast('error', this.t('commit.commitFailed'), messageText)
    }
  }

  async push(options = {}) {
    try {
      await call('git.push', { root: this.state.root })
      this.toast('success', this.t('commit.pushed'))
      await this.refreshStatus({ initial: false })
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      this.toast('error', options.afterCommit === true ? this.t('commit.pushFailed') : this.t('commit.failed'), text)
    }
  }

  // ── git window ────────────────────────────────────────────────────────
  setGitFilters(patch) {
    this.patch('git', { filters: { ...this.state.git.filters, ...patch } })
    void this.loadLog(true)
  }

  async loadBranches() {
    if (this.state.root === '') return
    try {
      const result = await call('git.branches', { root: this.state.root })
      this.patch('git', { branches: result.names ?? [] })
    } catch {
      this.patch('git', { branches: [] })
    }
  }

  async loadLog(reset, options = {}) {
    if (this.state.root === '') return
    if (this.state.git.loading && !reset) return
    const token = ++this.gitRequestToken
    const pageSize = 200
    const skip = reset ? 0 : this.state.git.skip
    this.patch('git', { loading: true, error: null })
    try {
      const result = await call('git.log', {
        root: this.state.root,
        skip,
        count: pageSize,
        ...this.state.git.filters,
      })
      if (token !== this.gitRequestToken) return
      const commits = reset ? result.commits : [...this.state.git.commits, ...result.commits]
      this.patch('git', {
        commits,
        skip: skip + result.commits.length,
        hasMore: result.commits.length >= pageSize,
        loading: false,
        error: null,
      })
      if (reset && commits.length > 0 && this.state.git.selectedHash === null) {
        // Leave selection empty: the details pane shows its empty state.
      }
    } catch (error) {
      if (token !== this.gitRequestToken) return
      this.patch('git', { loading: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  loadMoreCommits() {
    if (this.state.git.hasMore && !this.state.git.loading) void this.loadLog(false)
  }

  async selectCommit(hash) {
    this.patch('git', { selectedHash: hash, detailLoading: true, detail: null })
    try {
      const detail = await call('git.detail', { root: this.state.root, hash })
      if (this.state.git.selectedHash !== hash) return
      this.patch('git', { detail, detailLoading: false })
      void this.openCommit(hash)
    } catch (error) {
      this.patch('git', { detailLoading: false, detail: null, error: error instanceof Error ? error.message : String(error) })
    }
  }

  async checkout(ref) {
    try {
      await call('git.checkout', { root: this.state.root, ref })
      this.toast('success', this.t('git.branchSwitched'), ref)
      await this.refreshStatus({ initial: true })
      void this.loadBranches()
      void this.loadLog(true)
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  async revert(hash) {
    try {
      await call('git.revert', { root: this.state.root, hash })
      this.toast('success', this.t('git.reverted'))
      await this.refreshStatus({ initial: true })
      void this.loadLog(true)
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  // ── terminal ──────────────────────────────────────────────────────────
  async refreshShells() {
    try {
      const result = await call('terminal.shells')
      this.patch('terminal', { shells: result.shells, shellsLoaded: true })
    } catch {
      this.patch('terminal', { shellsLoaded: true })
    }
  }

  /** Create one terminal session key (the view owns the socket). */
  addTerminal(options = {}) {
    const id = nextId('term')
    const shells = this.state.terminal.shells
    const preferred = this.state.settings?.terminal?.shell
    const shell = options.shellId ?? (preferred === 'auto' || preferred === undefined ? shells[0]?.id : preferred)
    const session = {
      key: id,
      id: undefined,
      title: shells.find(item => item.id === shell)?.label ?? this.t('terminal.title'),
      shell: shell ?? '',
      cwd: options.cwd ?? this.state.root,
      status: 'starting',
      exitCode: null,
      error: null,
    }
    const sessions = [...this.state.terminal.sessions, session]
    const layout = { ...this.state.layout, bottom: 'terminal' }
    this.set({
      terminal: { ...this.state.terminal, sessions, activeKey: id },
      layout,
    })
    this.persist()
    return id
  }

  patchTerminal(key, patch) {
    const sessions = this.state.terminal.sessions.map(session => (session.key === key ? { ...session, ...patch } : session))
    this.set({ terminal: { ...this.state.terminal, sessions } })
  }

  activateTerminal(key) {
    const layout = { ...this.state.layout, bottom: 'terminal' }
    this.set({ terminal: { ...this.state.terminal, activeKey: key }, layout })
    this.persist()
  }

  async closeTerminal(key) {
    const session = this.state.terminal.sessions.find(item => item.key === key)
    if (session === undefined) return
    const remove = () => {
      const sessions = this.state.terminal.sessions.filter(item => item.key !== key)
      const activeKey = this.state.terminal.activeKey === key ? (sessions[sessions.length - 1]?.key ?? null) : this.state.terminal.activeKey
      const layout = sessions.length === 0 ? { ...this.state.layout, bottom: null } : this.state.layout
      this.set({ terminal: { ...this.state.terminal, sessions, activeKey }, layout })
      this.persist()
    }
    if (session.id !== undefined && session.status === 'running') {
      try {
        const activity = await call('terminal.activity', { id: session.id })
        if (activity.state === 'busy') {
          this.askConfirm(
            this.t('terminal.close'),
            this.t('terminal.closeRunning'),
            this.t('terminal.close'),
            remove,
            false,
          )
          return
        }
      } catch {
        // Unknown activity: closing is still allowed.
      }
    }
    remove()
  }

  closeActiveTerminal() {
    if (this.state.terminal.activeKey !== null) void this.closeTerminal(this.state.terminal.activeKey)
  }

  // ── layout ────────────────────────────────────────────────────────────
  toggleTool(tool) {
    if (tool === 'project' || tool === 'commit') {
      const layout = { ...this.state.layout, left: this.state.layout.left === tool ? null : tool }
      this.set({ layout })
      if (layout.left === 'commit') this.#focusCommitLater()
    } else {
      const next = this.state.layout.bottom === tool ? null : tool
      if (next === 'terminal' && this.state.terminal.sessions.length === 0) {
        this.addTerminal()
        return
      }
      this.set({ layout: { ...this.state.layout, bottom: next } })
    }
    this.persist()
  }

  showTool(tool) {
    if (tool === 'project' || tool === 'commit') {
      this.set({ layout: { ...this.state.layout, left: tool } })
      if (tool === 'commit') this.#focusCommitLater()
      this.persist()
    } else if (tool === 'terminal' && this.state.terminal.sessions.length === 0) {
      this.addTerminal()
    } else {
      this.set({ layout: { ...this.state.layout, bottom: tool } })
      this.persist()
    }
  }

  setLayout(patch) {
    this.set({ layout: { ...this.state.layout, ...patch } })
    this.persist()
  }

  #focusCommitLater() {
    // The Commit panel focuses its textarea when this counter changes.
    this.patch('commit', { focusTick: (this.state.commit.focusTick ?? 0) + 1 })
  }

  focusCommit() {
    this.set({ layout: { ...this.state.layout, left: 'commit' } })
    this.#focusCommitLater()
    this.persist()
  }

  // ── settings ──────────────────────────────────────────────────────────
  async updateSettings(patch) {
    try {
      const result = await call('settings.update', { patch })
      this.set({ settings: result.value })
    } catch (error) {
      this.toast('error', this.t('commit.failed'), error instanceof Error ? error.message : String(error))
    }
  }

  openRootPicker() {
    this.set({ rootPicker: true })
  }

  closeRootPicker() {
    this.set({ rootPicker: false })
  }

  async addWorkspace(path) {
    try {
      const workspace = await call('workspace.add', { path })
      const items = this.state.workspaces.some(item => item.path === workspace.path)
        ? this.state.workspaces
        : [...this.state.workspaces, workspace]
      this.set({ workspaces: items, rootPicker: false })
      await this.setRoot(workspace.path)
    } catch (error) {
      this.toast('error', this.t('project.openWorkspace'), error instanceof Error ? error.message : String(error))
    }
  }

  /** Human summary for the status bar. */
  summary() {
    const status = this.state.status
    if (status.isRepo !== true) return { branch: undefined, changes: 0, ahead: undefined, behind: undefined }
    return {
      branch: status.branch,
      changes: (status.entries ?? []).length,
      ahead: status.ahead,
      behind: status.behind,
    }
  }
}
