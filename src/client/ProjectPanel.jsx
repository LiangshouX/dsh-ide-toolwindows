/**
 * Project tool window: lazy directory tree with Git coloring, preview-first
 * opening semantics, reverse locate and the V1 context menu.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, ContextMenu } from './ui.jsx'
import { FileTypeIcon, IconExternal, IconRefresh, IconSearch } from './icons.jsx'
import { baseName } from './util.js'

const ROW_HEIGHT = 22

/** Git status class + marker for one repo-relative path. */
function gitStateOf(status, rel, enabled) {
  if (enabled !== true || status?.isRepo !== true) return null
  const entry = status.entries.find(item => item.path === rel)
  if (entry === undefined) return null
  const xy = entry.xy ?? ''
  if (entry.untracked) return { className: 'itw-git-add', badge: 'U' }
  if (entry.conflict || xy.includes('U')) return { className: 'itw-git-conflict', badge: '!' }
  if (xy[0] === 'A') return { className: 'itw-git-add', badge: 'A' }
  if (xy.includes('D')) return { className: 'itw-git-del', badge: 'D' }
  return { className: 'itw-git-mod', badge: 'M' }
}

/** Flatten the expanded tree into render rows. */
function flatten(state, filter) {
  const rows = []
  const dirs = state.dirs
  const normalized = filter.trim().toLowerCase()
  const root = state.root
  if (root === '') return rows

  const isExpanded = path => state.expanded.has(path) || normalized !== ''

  const walk = (path, depth) => {
    const dir = dirs.get(path)
    if (dir === undefined || dir.entries === undefined) {
      rows.push({ kind: 'loading', key: `loading:${path}`, depth })
      return
    }
    if (dir.error !== undefined && dir.error !== null) {
      rows.push({ kind: 'error', key: `error:${path}`, depth, message: dir.error })
      return
    }
    if (dir.entries === undefined) return
    for (const entry of dir.entries) {
      if (entry.isDir) {
        const open = isExpanded(entry.path)
        rows.push({ kind: 'dir', key: entry.path, entry, depth, open })
        if (open) walk(entry.path, depth + 1)
      } else {
        if (normalized !== '' && !entry.name.toLowerCase().includes(normalized) && !entry.rel.toLowerCase().includes(normalized)) continue
        rows.push({ kind: 'file', key: entry.path, entry, depth })
      }
    }
    if (dir.truncated === true) rows.push({ kind: 'note', key: `trunc:${path}`, depth, message: '…' })
    if (dir.loading === true && dir.entries !== undefined) {
      rows.push({ kind: 'note', key: `busy:${path}`, depth, message: '…' })
    }
  }

  for (const entry of (dirs.get(root)?.entries ?? [])) {
    if (entry.isDir) {
      const open = isExpanded(entry.path)
      rows.push({ kind: 'dir', key: entry.path, entry, depth: 0, open })
      if (open) walk(entry.path, 1)
    } else {
      if (normalized !== '' && !entry.name.toLowerCase().includes(normalized) && !entry.rel.toLowerCase().includes(normalized)) continue
      rows.push({ kind: 'file', key: entry.path, entry, depth: 0 })
    }
  }
  return rows
}

export function ProjectPanel({ store, state }) {
  const t = store.t
  const [filterOpen, setFilterOpen] = useState(false)
  const [menu, setMenu] = useState(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(600)
  const scrollRef = useRef(null)
  const rows = useMemo(() => flatten(state, state.filter), [state, state.filter])
  const gitEnabled = state.settings?.git?.colors !== false

  useEffect(() => {
    if (scrollRef.current === null) return undefined
    const element = scrollRef.current
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    setViewport(element.clientHeight)
    return () => observer.disconnect()
  }, [])

  // Reverse locate: reveal the selected path after any navigation source.
  useEffect(() => {
    if (state.selectedPath === '' || scrollRef.current === null) return
    const index = rows.findIndex(row => row.entry?.path === state.selectedPath)
    if (index < 0) return
    const top = index * ROW_HEIGHT
    const element = scrollRef.current
    if (top < element.scrollTop || top > element.scrollTop + element.clientHeight - ROW_HEIGHT * 2) {
      element.scrollTop = Math.max(0, top - element.clientHeight / 2)
    }
  }, [state.selectedPath, rows.length])

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6)
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + 6)
  const visible = rows.slice(start, end)

  const openMenu = (event, row) => {
    event.preventDefault()
    event.stopPropagation()
    setMenu({ x: event.clientX, y: event.clientY, row })
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      store.toast('success', t('common.copied'), text)
    } catch {
      store.toast('error', t('common.error'), text)
    }
  }

  const menuItems = useMemo(() => {
    if (menu === null) return []
    const entry = menu.row.entry
    if (entry === undefined) return []
    const parent = entry.isDir ? entry.path : entry.path.slice(0, Math.max(0, entry.path.length - entry.name.length - 1))
    return [
      { key: 'rel', text: t('project.copyRelative'), action: () => { void copy(entry.rel) } },
      { key: 'abs', text: t('project.copyAbsolute'), action: () => { void copy(entry.path) } },
      { key: 'name', text: t('project.copyName'), action: () => { void copy(entry.name) } },
      null,
      { key: 'reveal', text: t('project.reveal'), icon: React.createElement(IconExternal, { width: 13, height: 13 }), action: () => { void store.reveal(entry.path) } },
      { key: 'refresh', text: t('common.refresh'), icon: React.createElement(IconRefresh, { width: 13, height: 13 }), action: () => { void store.loadDir(parent, { force: true }) } },
    ]
  }, [menu, t])

  const rootRow = state.root === ''
    ? React.createElement('div', { className: 'itw-empty' },
        React.createElement('div', { className: 'itw-empty-title' }, t('project.empty')),
        React.createElement('button', { type: 'button', className: 'itw-textbtn itw-primary', onClick: () => store.openRootPicker() }, t('project.openWorkspace')),
      )
    : React.createElement('div', { className: 'itw-vlist', style: { height: `${rows.length * ROW_HEIGHT}px` } },
        visible.map((row, index) => {
          const top = (start + index) * ROW_HEIGHT
          const style = { top: `${top}px`, paddingLeft: `${8 + row.depth * 14}px` }
          if (row.kind === 'loading') {
            return React.createElement('div', { key: row.key, className: 'itw-tree-msg', style: { ...style, position: 'absolute', left: 0, right: 0 } }, t('common.loading'))
          }
          if (row.kind === 'error') {
            return React.createElement('div', { key: row.key, className: 'itw-error-box', style: { ...style, position: 'absolute', left: 8, right: 8 }, title: row.message }, row.message)
          }
          if (row.kind === 'note') {
            return React.createElement('div', { key: row.key, className: 'itw-tree-msg', style: { ...style, position: 'absolute', left: 0, right: 0 } }, row.message)
          }
          const entry = row.entry
          const git = gitStateOf(state.status, entry.rel, gitEnabled)
          const selected = state.selectedPath === entry.path
          if (row.kind === 'dir') {
            return React.createElement('div', {
              key: row.key,
              className: `itw-vlist-row itw-tree-row ${selected ? 'itw-selected' : ''} ${git?.className ?? ''}`,
              style,
              title: entry.rel,
              onClick: () => { store.setSelectedPath(entry.path); store.toggleDir(entry.path) },
              onContextMenu: event => openMenu(event, row),
            },
              React.createElement('span', { className: 'itw-tree-twisty' }, row.open ? React.createElement(ChevronDown, null) : React.createElement(ChevronRight, null)),
              React.createElement(FileTypeIcon, { name: entry.name, isDir: true, open: row.open, size: 15 }),
              React.createElement('span', { className: 'itw-tree-name itw-dir' }, entry.name),
            )
          }
          const active = state.tabs.find(tab => tab.kind === 'file' && tab.path === entry.path && tab.id === state.activeId)
          return React.createElement('div', {
            key: row.key,
            className: `itw-vlist-row itw-tree-row ${selected ? 'itw-selected' : ''} ${active !== undefined ? 'itw-selected' : ''} ${git?.className ?? ''}`,
            style,
            title: entry.rel,
            onClick: () => store.openFile(entry.path, { rel: entry.rel, preview: true }),
            onDoubleClick: () => store.openFile(entry.path, { rel: entry.rel, preview: false }),
            onContextMenu: event => openMenu(event, row),
          },
            React.createElement('span', { className: 'itw-tree-twisty' }),
            React.createElement(FileTypeIcon, { name: entry.name, size: 15 }),
            React.createElement('span', { className: 'itw-tree-name' }, entry.name),
            git !== null ? React.createElement('span', { style: { marginLeft: 'auto', fontSize: 10, opacity: .8 } }, git.badge) : null,
          )
        }),
      )

  return React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'itw-panel-header' },
      React.createElement('span', { className: 'itw-panel-title' }, t('project.title')),
      React.createElement('span', { className: 'itw-panel-sub' }, baseName(state.root)),
      React.createElement('span', { className: 'itw-spacer' }),
      React.createElement('button', {
        type: 'button', className: `itw-iconbtn ${filterOpen ? 'itw-on' : ''}`, title: t('project.filter'),
        onClick: () => { setFilterOpen(!filterOpen); if (filterOpen) store.setFilter('') },
      }, React.createElement(IconSearch, { width: 14, height: 14 })),
      React.createElement('button', {
        type: 'button', className: 'itw-iconbtn', title: t('common.refresh'),
        onClick: () => { void store.reloadTree(); void store.refreshStatus({ initial: true }) },
      }, React.createElement(IconRefresh, { width: 14, height: 14 })),
    ),
    filterOpen || state.filter !== ''
      ? React.createElement('div', { className: 'itw-filter' },
          React.createElement(IconSearch, { width: 13, height: 13 }),
          React.createElement('input', {
            autoFocus: true,
            placeholder: t('project.filter'),
            value: state.filter,
            onChange: event => store.setFilter(event.target.value),
            onKeyDown: event => { if (event.key === 'Escape') { store.setFilter(''); setFilterOpen(false) } },
          }),
        )
      : null,
    React.createElement('div', {
      className: 'itw-panel-body itw-tree',
      ref: scrollRef,
      onScroll: event => setScrollTop(event.currentTarget.scrollTop),
    }, rootRow),
    menu !== null ? React.createElement(ContextMenu, { x: menu.x, y: menu.y, items: menuItems, onClose: () => setMenu(null) }) : null,
  )
}
