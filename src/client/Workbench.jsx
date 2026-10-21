/**
 * The workbench root: one main-panel page that hosts the four tool windows
 * (Project / Commit left dock, Git / Terminal bottom dock) around an editor
 * area the plugin owns, so Preview / Pinned tab semantics are exact.
 */
import React, { useEffect, useRef, useState } from 'react'
import { useWorkbench } from './hooks.js'
import { IconGit, IconGear, IconRefresh, IconTerminal, StripeIcon } from './icons.jsx'
import { ProjectPanel } from './ProjectPanel.jsx'
import { CommitPanel } from './CommitPanel.jsx'
import { GitPanel } from './GitPanel.jsx'
import { TerminalPanel } from './TerminalPanel.jsx'
import { EditorArea } from './EditorArea.jsx'
import { SettingsForm } from './SettingsPanel.jsx'
import { ConfirmModal, ContextMenu, Kbd, Toast } from './ui.jsx'
import { baseName } from './util.js'

function TopBar({ store, state, onOpenSettings }) {
  const t = store.t
  const branch = state.status.branch
  const detached = state.status.detached === true
  const title = baseName(state.root) || t('project.empty')
  const [menu, setMenu] = useState(null)
  return React.createElement('div', { className: 'itw-topbar' },
    React.createElement('button', {
      type: 'button',
      className: 'itw-project-select',
      title: state.root,
      onClick: event => setMenu({ x: event.clientX, y: event.clientY + 8 }),
    },
      React.createElement(StripeIcon, { tool: 'project', size: 16 }),
      React.createElement('span', { className: 'itw-project-name' }, title),
      React.createElement('span', { className: 'itw-project-path' }, state.root),
    ),
    state.status.isRepo === true
      ? React.createElement('span', { className: 'itw-branch-chip', title: state.status.upstream ?? '' },
          React.createElement(IconGit, { width: 12, height: 12 }),
          React.createElement('span', { className: 'itw-branch-name' }, detached ? (state.status.oid ?? 'HEAD').slice(0, 7) : (branch ?? 'HEAD')),
          detached ? React.createElement('span', { className: 'itw-behind' }, t('git.detached')) : null,
          typeof state.status.ahead === 'number' && state.status.ahead > 0
            ? React.createElement('span', { className: 'itw-ahead' }, `↑${state.status.ahead}`)
            : null,
          typeof state.status.behind === 'number' && state.status.behind > 0
            ? React.createElement('span', { className: 'itw-behind' }, `↓${state.status.behind}`)
            : null,
        )
      : null,
    React.createElement('div', { className: 'itw-top-spacer' }),
    React.createElement('button', {
      type: 'button', className: 'itw-iconbtn', title: t('common.refresh'),
      onClick: () => { void store.reloadTree(); void store.refreshStatus({ initial: true }); void store.loadBranches() },
    }, React.createElement(IconRefresh, { width: 15, height: 15 })),
    React.createElement('button', {
      type: 'button', className: 'itw-iconbtn', title: t('common.settings'), onClick: onOpenSettings,
    }, React.createElement(IconGear, { width: 15, height: 15 })),
    menu !== null
      ? React.createElement(ContextMenu, {
          x: menu.x, y: menu.y, onClose: () => setMenu(null),
          items: [
            { label: t('common.root') },
            ...(state.workspaces.length > 0
              ? state.workspaces.map(workspace => ({
                  key: workspace.path,
                  text: workspace.title,
                  icon: workspace.path === state.root ? React.createElement('span', { style: { color: 'var(--itw-accent)' } }, '●') : null,
                  action: () => { void store.setRoot(workspace.path) },
                }))
              : [{ text: t('project.empty'), disabled: true }]),
            null,
            { key: 'open', text: t('project.openWorkspace'), action: () => store.openRootPicker() },
          ],
        })
      : null,
  )
}

function Stripe({ store, state }) {
  const t = store.t
  const sessions = state.terminal.sessions.length
  return React.createElement('div', { className: 'itw-stripe' },
    React.createElement('button', {
      type: 'button',
      className: `itw-stripe-btn ${state.layout.left === 'project' ? 'itw-on' : ''}`,
      title: `${t('project.title')} (${state.settings?.shortcuts?.project ?? 'Alt+1'})`,
      onClick: () => store.toggleTool('project'),
    }, React.createElement(StripeIcon, { tool: 'project', size: 20 })),
    React.createElement('button', {
      type: 'button',
      className: `itw-stripe-btn ${state.layout.left === 'commit' ? 'itw-on' : ''}`,
      title: `${t('commit.title')} (${state.settings?.shortcuts?.commit ?? 'Alt+0'})`,
      onClick: () => store.toggleTool('commit'),
    },
      React.createElement(StripeIcon, { tool: 'commit', size: 20 }),
      state.changeCount > 0 ? React.createElement('span', { className: 'itw-badge' }, state.changeCount > 99 ? '99+' : state.changeCount) : null,
    ),
    React.createElement('div', { className: 'itw-stripe-spacer' }),
    React.createElement('button', {
      type: 'button',
      className: `itw-stripe-btn ${state.layout.bottom === 'git' ? 'itw-on' : ''}`,
      title: `${t('git.title')} (${state.settings?.shortcuts?.git ?? 'Alt+9'})`,
      onClick: () => store.toggleTool('git'),
    }, React.createElement(StripeIcon, { tool: 'git', size: 20 })),
    React.createElement('button', {
      type: 'button',
      className: `itw-stripe-btn ${state.layout.bottom === 'terminal' ? 'itw-on' : ''}`,
      title: `${t('terminal.title')} (${state.settings?.shortcuts?.terminal ?? 'Alt+F12'})`,
      onClick: () => store.toggleTool('terminal'),
    },
      React.createElement(StripeIcon, { tool: 'terminal', size: 20 }),
      sessions > 0 ? React.createElement('span', { className: 'itw-badge itw-badge-dirty' }, sessions) : null,
    ),
  )
}

function BottomTabs({ store, state }) {
  const t = store.t
  const tool = state.layout.bottom
  if (tool === null || tool === undefined) return null
  return React.createElement('div', { className: 'itw-bottom-tabs' },
    React.createElement('button', {
      type: 'button', className: `itw-bottom-tab ${tool === 'terminal' ? 'itw-on' : ''}`,
      onClick: () => store.showTool('terminal'),
    },
      React.createElement(IconTerminal, { width: 13, height: 13 }), t('terminal.title'),
      state.terminal.sessions.length > 0 ? React.createElement('span', { className: 'itw-badge' }, state.terminal.sessions.length) : null,
    ),
    React.createElement('button', {
      type: 'button', className: `itw-bottom-tab ${tool === 'git' ? 'itw-on' : ''}`,
      onClick: () => store.showTool('git'),
    }, React.createElement(IconGit, { width: 13, height: 13 }), t('git.title')),
    React.createElement('button', {
      type: 'button', className: 'itw-iconbtn itw-bottom-close', title: t('common.close'),
      onClick: () => store.setLayout({ bottom: null }),
    }, React.createElement('span', { style: { fontSize: 16, lineHeight: 1 } }, '×')),
  )
}

function StatusBar({ store, state }) {
  const t = store.t
  const summary = store.summary()
  const active = state.tabs.find(tab => tab.id === state.activeId)
  const lines = active?.payload?.kind === 'text' && typeof active.payload.content === 'string'
    ? active.payload.content.split('\n').length
    : undefined
  return React.createElement('div', { className: 'itw-statusbar' },
    React.createElement('span', { className: 'itw-status-item' },
      React.createElement('span', { className: `itw-status-dot ${state.statusError !== null ? 'itw-busy' : ''}` }),
      state.status.isRepo === true ? t('status.ready') : t('welcome.noRepo'),
    ),
    summary.branch !== undefined
      ? React.createElement('span', { className: 'itw-status-item' }, summary.branch)
      : null,
    summary.changes > 0
      ? React.createElement('span', { className: 'itw-status-item' }, `${summary.changes} ${t('status.changes')}`)
      : null,
    React.createElement('div', { className: 'itw-spacer' }),
    lines !== undefined
      ? React.createElement('span', { className: 'itw-status-item' }, `${lines} ${t('editor.lines')}`)
      : null,
    React.createElement('span', { className: 'itw-status-item' },
      React.createElement(Kbd, null, state.settings?.shortcuts?.project ?? 'Alt+1'),
      React.createElement('span', { style: { marginLeft: 4 } }, t('project.title')),
    ),
    React.createElement('span', { className: 'itw-status-item' },
      React.createElement(Kbd, null, state.settings?.shortcuts?.terminal ?? 'Alt+F12'),
      React.createElement('span', { style: { marginLeft: 4 } }, t('terminal.title')),
    ),
  )
}

function RootPicker({ store, state }) {
  const t = store.t
  const [path, setPath] = useState('')
  if (state.rootPicker !== true) return null
  return React.createElement('div', { className: 'itw-modal-backdrop', onMouseDown: event => { if (event.target === event.currentTarget) store.closeRootPicker() } },
    React.createElement('div', { className: 'itw-modal', role: 'dialog', 'aria-modal': 'true' },
      React.createElement('h2', null, t('project.openWorkspace')),
      React.createElement('div', { className: 'itw-root-picker' },
        React.createElement('div', { className: 'itw-root-list' },
          state.workspaces.map(workspace => React.createElement('button', {
            key: workspace.path,
            type: 'button',
            className: 'itw-root-item',
            onClick: () => { store.closeRootPicker(); void store.setRoot(workspace.path) },
          },
            React.createElement(StripeIcon, { tool: 'project', size: 16 }),
            React.createElement('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } },
              React.createElement('b', null, workspace.title),
              React.createElement('span', { className: 'itw-root-path' }, workspace.path),
            ),
          )),
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 4 } },
          React.createElement('input', {
            className: 'itw-input',
            style: { flex: 1, width: 'auto' },
            placeholder: t('project.workspacePath'),
            value: path,
            onChange: event => setPath(event.target.value),
            onKeyDown: event => { if (event.key === 'Enter' && path.trim() !== '') { void store.addWorkspace(path.trim()) } },
          }),
          React.createElement('button', {
            type: 'button', className: 'itw-textbtn itw-primary', disabled: path.trim() === '',
            onClick: () => { void store.addWorkspace(path.trim()) },
          }, t('common.open')),
        ),
      ),
      React.createElement('div', { className: 'itw-modal-actions', style: { marginTop: 16 } },
        React.createElement('button', { type: 'button', className: 'itw-textbtn', onClick: () => store.closeRootPicker() }, t('common.cancel')),
      ),
    ),
  )
}

function SettingsModal({ store, state, onClose }) {
  return React.createElement('div', { className: 'itw-modal-backdrop', onMouseDown: event => { if (event.target === event.currentTarget) onClose() } },
    React.createElement('div', { className: 'itw-modal', style: { width: 'min(620px, calc(100% - 40px))', maxHeight: '80%', overflow: 'auto' }, role: 'dialog', 'aria-modal': 'true' },
      React.createElement('h2', null, store.t('settings.title')),
      React.createElement(SettingsForm, { store, state, compact: true }),
      React.createElement('div', { className: 'itw-modal-actions' },
        React.createElement('button', { type: 'button', className: 'itw-textbtn', onClick: onClose }, store.t('common.close')),
      ),
    ),
  )
}

export function Workbench({ store }) {
  const state = useWorkbench(store)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const leftRef = useRef(null)

  useEffect(() => {
    store.activate()
    return () => { store.deactivate() }
  }, [store])

  const startLeftResize = (event) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = state.layout.leftWidth
    const move = (moveEvent) => {
      store.setLayout({ leftWidth: Math.max(220, Math.min(680, startWidth + moveEvent.clientX - startX)) })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startBottomResize = (event) => {
    event.preventDefault()
    const startY = event.clientY
    const startHeight = state.layout.bottomHeight
    const move = (moveEvent) => {
      store.setLayout({ bottomHeight: Math.max(100, Math.min(680, startHeight - (moveEvent.clientY - startY))) })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  let left = null
  if (state.layout.left !== null && state.layout.left !== undefined) {
    left = React.createElement('div', {
      className: 'itw-left',
      ref: leftRef,
      style: { width: `${state.layout.leftWidth}px` },
    },
      state.layout.left === 'project'
        ? React.createElement(ProjectPanel, { store, state })
        : React.createElement(CommitPanel, { store, state }),
      React.createElement('div', { className: 'itw-left-resizer', onPointerDown: startLeftResize }),
    )
  }

  const bottom = state.layout.bottom !== null && state.layout.bottom !== undefined
    ? React.createElement('div', { className: 'itw-bottom', style: { height: `${state.layout.bottomHeight}px` } },
        React.createElement('div', { className: 'itw-bottom-resizer', onPointerDown: startBottomResize }),
        React.createElement(BottomTabs, { store, state }),
        React.createElement('div', { className: 'itw-bottom-body' },
          React.createElement('div', { className: 'itw-bottom-content' },
            state.layout.bottom === 'terminal'
              ? React.createElement(TerminalPanel, { store, state })
              : React.createElement(GitPanel, { store, state }),
          ),
        ),
      )
    : null

  return React.createElement('div', { className: 'itw-root' },
    React.createElement(TopBar, { store, state, onOpenSettings: () => setSettingsOpen(true) }),
    React.createElement('div', { className: 'itw-body' },
      React.createElement(Stripe, { store, state }),
      left,
      React.createElement('div', { className: 'itw-center' },
        React.createElement(EditorArea, { store, state }),
        bottom,
      ),
    ),
    React.createElement(StatusBar, { store, state }),
    state.phase === 'booting'
      ? React.createElement('div', { className: 'itw-empty', style: { position: 'absolute', inset: 0, background: 'var(--itw-bg)' } }, store.t('common.loading'))
      : null,
    state.fatal !== null && state.fatal !== undefined
      ? React.createElement('div', { className: 'itw-modal-backdrop' },
          React.createElement('div', { className: 'itw-modal' },
            React.createElement('h2', null, store.t('common.error')),
            React.createElement('p', null, state.fatal),
            React.createElement('div', { className: 'itw-modal-actions' },
              React.createElement('button', { type: 'button', className: 'itw-textbtn itw-primary', onClick: () => { store.set({ fatal: null }); void store.init() } }, store.t('common.retry')),
            ),
          ),
        )
      : null,
    React.createElement(ConfirmModal, { dialog: state.confirm, onClose: () => store.dismissConfirm() }),
    React.createElement(Toast, { toast: state.toast }),
    React.createElement(RootPicker, { store, state }),
    settingsOpen ? React.createElement(SettingsModal, { store, state, onClose: () => setSettingsOpen(false) }) : null,
  )
}
