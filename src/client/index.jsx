/**
 * dsh-ide-toolwindows — Client half.
 *
 * Registers:
 *   - one sidebar stripe icon (`sidebar.panellist`) + its `main` panel page;
 *   - the workbench itself (Project / Commit left dock, Git / Terminal bottom
 *     dock, preview-first editor area);
 *   - a Tool Windows Settings page (`settings.section`);
 *   - the IDEA-style keyboard shortcuts (rebindable in Settings).
 */
import React from 'react'
import xtermCss from '@xterm/xterm/css/xterm.css'
import { NS, en, zh } from './i18n.js'
import { WorkbenchStore } from './store.js'
import { Workbench } from './Workbench.jsx'
import { SettingsSection } from './SettingsPanel.jsx'
import { CSS } from './styles.js'
import { IconCommit, IconGit, IconProject, IconTerminal } from './icons.jsx'
import { setPrimitivesLoader } from './MarkdownView.jsx'
import { matchesShortcut, isTerminalTarget } from './util.js'
import { useWorkbench } from './hooks.js'

/** Client services this plugin reads. */
export const inject = ['slots', 'locale', 'layout']

const PANEL_ID = 'ide-toolwindows'

/** The sidebar stripe icon: four tool-window glyphs arranged like a layout. */
function PanelIcon({ size = 20, active = false }) {
  const color = active ? 'currentColor' : 'currentColor'
  return React.createElement('span', {
    style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, color },
    'aria-hidden': true,
  },
    React.createElement('svg', { viewBox: '0 0 20 20', width: size, height: size, fill: 'none', stroke: color, strokeWidth: 1.3, strokeLinejoin: 'round' },
      React.createElement('rect', { x: 2, y: 2.5, width: 16, height: 15, rx: 2 }),
      React.createElement('line', { x1: 7.4, y1: 2.5, x2: 7.4, y2: 17.5 }),
      React.createElement('line', { x1: 7.4, y1: 11.5, x2: 18, y2: 11.5 }),
      React.createElement('line', { x1: 9.8, y1: 5.6, x2: 12.2, y2: 5.6 }),
      React.createElement('line', { x1: 14, y1: 5.6, x2: 16.6, y2: 5.6 }),
      React.createElement('polyline', { points: '9.6 14.2 11 15.4 13.6 13.6' }),
      React.createElement('line', { x1: 14.6, y1: 14.2, x2: 16.6, y2: 14.6 }),
    ),
  )
}

/** Bound workbench (the store lives in the plugin fiber, not in React). */
function BoundWorkbench({ store }) {
  const state = useWorkbench(store)
  return React.createElement(Workbench, { store, state })
}

/** Bound settings page for the native settings shell. */
function BoundSettings({ store, close }) {
  const state = useWorkbench(store)
  return React.createElement(SettingsSection, { store, state, close })
}

/** One keyboard shortcut action. */
function runShortcut(store, action) {
  if (action === 'push') {
    if (store.state.active === true && store.state.status.isRepo === true) void store.push()
    return
  }
  // From another panel the shortcut must SHOW the tool window; a second press,
  // now that the workbench is on screen, toggles it closed.
  const wasActive = store.state.active === true
  store.ctx.layout.selectPanel(PANEL_ID)
  if (action === 'focusCommit') {
    store.focusCommit()
    return
  }
  if (wasActive) store.toggleTool(action)
  else store.showTool(action)
}

/**
 * Mount the client half.
 * @param {any} ctx client cordis context
 */
export function apply(ctx) {
  const t = ctx.locale.bind(NS)

  ctx.effect(() => {
    const offZh = ctx.locale.register(NS, 'zh', zh)
    const offEn = ctx.locale.register(NS, 'en', en)
    return () => { offZh(); offEn() }
  }, 'dsh-ide-toolwindows: dictionaries')

  ctx.effect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-dsh-ide-toolwindows', '')
    style.textContent = `${xtermCss}\n${CSS}`
    document.head.appendChild(style)
    return () => { style.remove() }
  }, 'dsh-ide-toolwindows: stylesheet')

  const store = new WorkbenchStore(ctx, t)
  void store.init()

  // Markdown preview uses the harness's own MarkdownText. It is usually in the
  // synchronous module table; the client module service is the fallback for a
  // deployment that only exposes it through `ctx.modules`.
  const modules = ctx.get('modules')
  if (modules !== undefined && modules !== null && typeof modules.import === 'function') {
    setPrimitivesLoader(() => modules.import('@deepseek-ai/dsh-client-ui-primitives'))
  }

  // ── slots ─────────────────────────────────────────────────────────────
  ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 35,
    label: () => t('panelLabel'),
  }, PanelIcon)), 'dsh-ide-toolwindows: sidebar icon')

  ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
  }, () => React.createElement(BoundWorkbench, { store }))), 'dsh-ide-toolwindows: main panel')

  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: PANEL_ID,
    order: 60,
    label: () => t('settings.nav'),
  }, props => React.createElement(BoundSettings, { store, close: props?.close }))), 'dsh-ide-toolwindows: settings section')

  // ── keyboard shortcuts (IDEA-style, rebindable) ───────────────────────
  ctx.effect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return
      const shortcuts = store.state.settings?.shortcuts
      if (shortcuts === undefined || shortcuts === null) return
      const inTerminal = isTerminalTarget(event.target)
      const pairs = [
        ['project', shortcuts.project],
        ['commit', shortcuts.commit],
        ['git', shortcuts.git],
        ['terminal', shortcuts.terminal],
        ['focusCommit', shortcuts.focusCommit],
        ['push', shortcuts.push],
      ]
      for (const [action, shortcut] of pairs) {
        if (shortcut === undefined || shortcut === '') continue
        if (!matchesShortcut(shortcut, event)) continue
        if (inTerminal && (action === 'focusCommit' || action === 'push')) continue
        event.preventDefault()
        event.stopPropagation()
        runShortcut(store, action)
        return
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, 'dsh-ide-toolwindows: shortcuts')

  ctx.effect(() => () => { void store.persistNow() }, 'dsh-ide-toolwindows: store teardown')
}
