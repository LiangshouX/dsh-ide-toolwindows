/** Client integration: a native right-sidebar tab, header entry and shortcuts. */
import React, { useEffect } from 'react'
import xtermCss from '@xterm/xterm/css/xterm.css'
import { NS, en, zh } from './i18n.js'
import { WorkbenchStore } from './store.js'
import { Workbench } from './Workbench.jsx'
import { SettingsSection } from './SettingsPanel.jsx'
import { CSS } from './styles.js'
import { setPrimitivesLoader } from './MarkdownView.jsx'
import { matchesShortcut, isTerminalTarget } from './util.js'
import { useWorkbench } from './hooks.js'

export const inject = ['slots', 'locale', 'sidebarRight', 'sidebarRightTabs']
const PANEL_ID = 'ide-toolwindows'

function PanelIcon({ size = 20 }) {
  return React.createElement('svg', {
    viewBox: '0 0 20 20', width: size, height: size, fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.3, strokeLinejoin: 'round', 'aria-hidden': true,
  },
    React.createElement('rect', { x: 2, y: 2.5, width: 16, height: 15, rx: 2 }),
    React.createElement('line', { x1: 7.4, y1: 2.5, x2: 7.4, y2: 17.5 }),
    React.createElement('line', { x1: 7.4, y1: 11.5, x2: 18, y2: 11.5 }),
    React.createElement('polyline', { points: '9.6 14.2 11 15.4 13.6 13.6' }),
  )
}

function BoundWorkbench({ getStore, sessionId, useTabInfo }) {
  const { tab } = useTabInfo()
  const store = getStore(sessionId, tab.id)
  useEffect(() => { void store.init() }, [store])
  return React.createElement(Workbench, { store, visible: tab.visible })
}

function BoundSettings({ store, close }) {
  const state = useWorkbench(store)
  return React.createElement(SettingsSection, { store, state, close })
}

function OpenButton({ open, t }) {
  return React.createElement('button', {
    type: 'button', title: t('panelLabel'), 'aria-label': t('panelLabel'),
    className: 'itw-sidebar-open', onClick: open,
  }, React.createElement(PanelIcon, { size: 18 }))
}

export function apply(ctx) {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => {
    const offZh = ctx.locale.register(NS, 'zh', zh)
    const offEn = ctx.locale.register(NS, 'en', en)
    return () => { offZh(); offEn() }
  }, 'dsh-ide-toolwindows: dictionaries')

  // Render styles through React so their lifetime follows the plugin's seats.
  const Styles = () => React.createElement('style', { 'data-dsh-ide-toolwindows': '' }, `${xtermCss}\n${CSS}`)
  const stores = new Map()
  const getStore = (sessionId, tabId) => {
    const key = `${sessionId}:${tabId}`
    if (!stores.has(key)) stores.set(key, new WorkbenchStore(ctx, t))
    return stores.get(key)
  }
  const activeStore = () => {
    const sessionId = ctx.sidebarRight.mounted.getSnapshot()
    const tab = ctx.sidebarRight.active()
    return tab?.kind === PANEL_ID ? stores.get(`${sessionId}:${tab.id}`) : undefined
  }
  const open = () => ctx.sidebarRight.openTab(PANEL_ID)

  const modules = ctx.get('modules')
  if (modules != null && typeof modules.import === 'function') {
    setPrimitivesLoader(() => modules.import('@deepseek-ai/dsh-client-ui-primitives'))
  }

  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: 'dsh-ide-toolwindows', kind: PANEL_ID,
    title: () => t('panelLabel'), keepMounted: true,
    guide: [{ id: PANEL_ID, title: () => t('panelLabel'), icon: PanelIcon, order: 35 }],
  }), 'dsh-ide-toolwindows: sidebar tab type')

  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab', key: 'dsh-ide-toolwindows',
  }, props => React.createElement(React.Fragment, null,
    React.createElement(Styles),
    React.createElement(BoundWorkbench, { ...props, getStore }),
  ))), 'dsh-ide-toolwindows: sidebar body')

  ctx.effect(() => ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities', id: PANEL_ID, order: 30,
    label: () => t('panelLabel'),
  }, () => React.createElement(React.Fragment, null,
    React.createElement(Styles), React.createElement(OpenButton, { open, t }),
  ))), 'dsh-ide-toolwindows: sidebar entry')

  const settingsStore = new WorkbenchStore(ctx, t)
  void settingsStore.init()
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section', id: PANEL_ID, order: 60, label: () => t('settings.nav'),
  }, props => React.createElement(React.Fragment, null,
    React.createElement(Styles),
    React.createElement(BoundSettings, { store: settingsStore, close: props?.close }),
  ))), 'dsh-ide-toolwindows: settings section')

  ctx.effect(() => {
    const onKeyDown = event => {
      if (event.repeat || ctx.sidebarRight.mounted.getSnapshot() === undefined) return
      const store = activeStore()
      const shortcuts = (store ?? settingsStore).state.settings?.shortcuts
      if (shortcuts == null) return
      const inTerminal = isTerminalTarget(event.target)
      const pairs = [
        ['project', shortcuts.project], ['commit', shortcuts.commit],
        ['git', shortcuts.git], ['terminal', shortcuts.terminal],
        ['focusCommit', shortcuts.focusCommit], ['push', shortcuts.push],
      ]
      for (const [action, shortcut] of pairs) {
        if (!shortcut || !matchesShortcut(shortcut, event)) continue
        if (inTerminal && (action === 'focusCommit' || action === 'push')) continue
        if (action === 'push') {
          if (store?.state.active !== true || store.state.status.isRepo !== true) return
          event.preventDefault()
          event.stopPropagation()
          void store.push()
          return
        }
        event.preventDefault()
        event.stopPropagation()
        const wasActive = store?.state.active === true
        open()
        // Opening mounts the body after this event. Apply the requested tool
        // once its store exists; do not consume shortcuts without a Session.
        requestAnimationFrame(() => {
          const target = activeStore()
          if (target === undefined) return
          if (action === 'focusCommit') target.focusCommit()
          else if (wasActive) target.toggleTool(action)
          else target.showTool(action)
        })
        return
      }
      if (store?.state.active !== true) return
      if (event.key === 'F11') {
        event.preventDefault()
        store.toggleFullscreen()
      } else if (matchesShortcut(shortcuts.hideAll ?? 'Ctrl+Shift+F12', event)) {
        event.preventDefault()
        store.toggleHideAll()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, 'dsh-ide-toolwindows: shortcuts')

  ctx.effect(() => () => {
    for (const store of [...stores.values(), settingsStore]) {
      store.deactivate()
      for (const unsubscribe of store.unsubscribers.splice(0)) unsubscribe()
    }
    stores.clear()
  }, 'dsh-ide-toolwindows: store teardown')
}
