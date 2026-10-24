/**
 * Git tool window: branch/date filters, lazily paged history, a lane graph,
 * and a right-hand commit Drawer.
 *
 * Selection follows the same rule as the Project tree: a single click only
 * selects a row; double click / Enter opens the detail Drawer. The log keeps
 * the full height while the Drawer is open.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GRAPH_COLORS, layoutGraph, rowGeometry } from './graph.js'
import { ContextMenu } from './ui.jsx'
import { IconBranch, IconClose, IconCopy, IconRefresh } from './icons.jsx'
import { formatGitDate } from './util.js'
import { gitLayout, DRAWER_MIN } from './git-layout.js'

const ROW_HEIGHT = 24
const CELL = 14
const GRAPH_MAX = 8

function GraphCell({ row, width, height, offset }) {
  const geometry = rowGeometry(row)
  const primaryX = 7 + row.primary * CELL
  const nodes = [row.primary, ...row.mergeLanes]
  const lines = []
  for (const lane of geometry.vertical) {
    lines.push(React.createElement('line', {
      key: `v-${lane}`,
      x1: 7 + lane * CELL, y1: 0, x2: 7 + lane * CELL, y2: height,
      stroke: GRAPH_COLORS[lane % GRAPH_COLORS.length], strokeWidth: 1.6,
    }))
  }
  for (const incoming of geometry.incoming) {
    const x = 7 + incoming.lane * CELL
    lines.push(React.createElement('path', {
      key: `in-${incoming.lane}`,
      d: `M ${x} 0 L ${x} ${height / 2} L ${primaryX} ${height / 2}`,
      fill: 'none', stroke: GRAPH_COLORS[incoming.lane % GRAPH_COLORS.length], strokeWidth: 1.6,
    }))
  }
  for (const [index, outgoing] of geometry.outgoing.entries()) {
    const x = 7 + outgoing.to * CELL
    if (outgoing.to === row.primary) {
      lines.push(React.createElement('line', {
        key: `out-${index}`,
        x1: primaryX, y1: height / 2, x2: primaryX, y2: height,
        stroke: GRAPH_COLORS[row.primary % GRAPH_COLORS.length], strokeWidth: 1.8,
      }))
    } else {
      lines.push(React.createElement('path', {
        key: `out-${index}`,
        d: `M ${primaryX} ${height / 2} C ${primaryX} ${height * 0.78}, ${x} ${height * 0.72}, ${x} ${height}`,
        fill: 'none', stroke: GRAPH_COLORS[outgoing.to % GRAPH_COLORS.length], strokeWidth: 1.8,
      }))
    }
  }
  const circles = nodes.map((lane, index) => React.createElement('circle', {
    key: `n-${lane}-${index}`,
    cx: 7 + lane * CELL, cy: height / 2, r: 3.4,
    fill: GRAPH_COLORS[lane % GRAPH_COLORS.length],
    stroke: 'var(--iwb-bg)', strokeWidth: 1.2,
  }))
  if (row.mergeLanes.length > 0) {
    lines.push(React.createElement('line', {
      key: 'merge',
      x1: primaryX, y1: height / 2, x2: 7 + row.mergeLanes[row.mergeLanes.length - 1] * CELL, y2: height / 2,
      stroke: GRAPH_COLORS[row.primary % GRAPH_COLORS.length], strokeWidth: 1.2, strokeDasharray: '2 2',
    }))
  }
  return React.createElement('svg', {
    width, height, viewBox: `0 0 ${width} ${height}`, style: { display: 'block', marginLeft: 4, transform: `translateY(${offset}px)` },
  }, ...lines, ...circles)
}

function RefChip({ value }) {
  const isHead = value.startsWith('HEAD')
  const isRemote = value.includes('/')
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', height: 15, padding: '0 5px', borderRadius: 3, fontSize: 10,
      background: isHead ? 'rgba(76,154,255,.2)' : isRemote ? 'rgba(127,127,127,.18)' : 'rgba(79,180,119,.2)',
      color: isHead ? 'var(--iwb-accent)' : isRemote ? 'var(--iwb-muted)' : 'var(--iwb-success)',
      maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
  }, value)
}

/** Split one full commit patch into per-file entries. */
export function diffFiles(diff) {
  const text = String(diff ?? '')
  const output = []
  for (const part of text.split(/^diff --git /m).slice(1)) {
    const lines = part.split('\n')
    const header = lines[0] ?? ''
    const match = /^a\/(.+?) b\/(.+)$/.exec(header)
    const path = match?.[2] ?? header
    let additions = 0
    let deletions = 0
    for (const line of lines.slice(1)) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions += 1
      else if (line.startsWith('-') && !line.startsWith('---')) deletions += 1
    }
    const status = lines.some(line => line.startsWith('new file mode'))
      ? 'A'
      : lines.some(line => line.startsWith('deleted file mode'))
        ? 'D'
        : lines.some(line => line.startsWith('rename from'))
          ? 'R'
          : 'M'
    output.push({ path, status, additions, deletions, patch: `diff --git ${part}` })
  }
  return output
}

function InlinePatch({ text }) {
  return React.createElement('div', { className: 'iwb-git-inline-diff' },
    String(text ?? '').split('\n').map((line, index) => React.createElement('div', {
      key: index,
      className: `iwb-git-inline-line ${line.startsWith('+') && !line.startsWith('+++') ? 'iwb-add' : ''} ${line.startsWith('-') && !line.startsWith('---') ? 'iwb-del' : ''} ${line.startsWith('@@') ? 'iwb-hunk' : ''}`,
    }, line === '' ? '\u00a0' : line)),
  )
}

function BranchPopover({ store, state, x, y, onClose }) {
  const t = store.t
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef(null)
  const names = useMemo(() => {
    const value = query.trim().toLowerCase()
    return state.git.branches.filter(name => value === '' || name.toLowerCase().includes(value))
  }, [query, state.git.branches])
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setIndex(0) }, [query])
  const choose = (name) => { onClose(); store.requestCheckout(name) }
  return React.createElement('div', {
    className: 'iwb-branch-popover',
    style: { left: `${x}px`, top: `${y}px` },
    onMouseDown: event => event.stopPropagation(),
  },
    React.createElement('input', {
      ref: inputRef,
      className: 'iwb-input',
      style: { width: '100%' },
      placeholder: t('git.searchBranch'),
      value: query,
      onChange: event => setQuery(event.target.value),
      onKeyDown: event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setIndex(value => Math.min(names.length - 1, value + 1)) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(value => Math.max(0, value - 1)) }
        else if (event.key === 'Enter') { event.preventDefault(); if (names[index] !== undefined) choose(names[index]) }
        else if (event.key === 'Escape') { event.preventDefault(); onClose() }
      },
    }),
    React.createElement('div', { className: 'iwb-branch-list' },
      names.length === 0
        ? React.createElement('div', { className: 'iwb-quick-empty' }, t('quickOpen.empty'))
        : names.map((name, position) => React.createElement('button', {
            key: name,
            type: 'button',
            className: `iwb-branch-row ${position === index ? 'iwb-selected' : ''}`,
            onMouseEnter: () => setIndex(position),
            onClick: () => choose(name),
          },
            React.createElement('span', { className: 'iwb-branch-check' }, name === state.status.branch ? '✓' : ''),
            React.createElement('span', { className: 'iwb-branch-name' }, name),
          )),
    ),
  )
}

function CommitDrawer({ store, state, narrow, width, onResizeStart, onClose }) {
  const t = store.t
  const git = state.git
  const [selectedFile, setSelectedFile] = useState('')
  const detail = git.detail
  const closeRef = useRef(null)
  const files = useMemo(() => diffFiles(detail?.diff), [detail?.diff])
  const additions = files.reduce((sum, file) => sum + file.additions, 0)
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0)
  const selected = files.find(file => file.path === selectedFile) ?? files[0]

  useEffect(() => {
    setSelectedFile('')
    closeRef.current?.focus()
  }, [detail?.hash])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      store.toast('success', t('common.copied'), text)
    } catch {
      store.toast('error', t('common.error'), text)
    }
  }

  return React.createElement(React.Fragment, null,
    narrow
      ? React.createElement('div', { className: 'iwb-git-drawer-backdrop', onMouseDown: onClose })
      : null,
    React.createElement('aside', {
      className: `iwb-git-drawer ${narrow ? 'iwb-git-drawer-overlay' : ''}`,
      style: narrow ? undefined : { width: `${width}px` },
      role: 'complementary',
      'aria-label': t('git.detailTitle'),
    },
      narrow ? null : React.createElement('div', { className: 'iwb-git-drawer-resizer', onPointerDown: onResizeStart }),
      React.createElement('div', { className: 'iwb-git-drawer-head' },
        React.createElement('span', { className: 'iwb-git-drawer-title', title: detail?.subject ?? '' },
          detail?.subject ?? (git.detailLoading ? t('common.loading') : '')),
        React.createElement('span', { className: 'iwb-spacer' }),
        detail !== null
          ? React.createElement('button', {
              type: 'button', className: 'iwb-iconbtn', title: t('git.copySha'),
              onClick: () => { void copy(detail.hash) },
            }, React.createElement(IconCopy, { width: 12, height: 12 }))
          : null,
        React.createElement('button', {
          ref: closeRef,
          type: 'button', className: 'iwb-iconbtn', title: t('git.closeDetail'),
          onClick: onClose,
        }, React.createElement(IconClose, { width: 13, height: 13 })),
      ),
      detail === null && git.detailLoading === true
        ? React.createElement('div', { className: 'iwb-git-drawer-body' }, React.createElement('div', { className: 'iwb-empty' }, t('common.loading')))
        : (detail === null
            ? React.createElement('div', { className: 'iwb-git-drawer-body' }, React.createElement('div', { className: 'iwb-empty' }, t('git.selectCommit')))
            : React.createElement('div', { className: 'iwb-git-drawer-body' },
                React.createElement('div', { className: 'iwb-git-drawer-meta' },
                  React.createElement('span', { className: 'iwb-git-drawer-sha', title: detail.hash }, detail.shortHash),
                  React.createElement('span', null, detail.author),
                  detail.email !== '' ? React.createElement('span', { className: 'iwb-git-detail-dim' }, detail.email) : null,
                  React.createElement('span', { className: 'iwb-git-detail-dim' }, detail.date),
                  ...(detail.refs ?? []).map(ref => React.createElement('span', { key: ref, className: 'iwb-ref-chip' }, ref)),
                  detail.parents?.length > 0
                    ? React.createElement('span', { className: 'iwb-git-detail-dim' }, `${t('git.parents')}: ${detail.parents.map(parent => parent.slice(0, 7)).join(', ')}`)
                    : null,
                ),
                React.createElement('button', {
                  type: 'button', className: 'iwb-textbtn iwb-small iwb-git-open-full', title: t('git.openFull'),
                  onClick: () => { void store.openCommit(detail.hash) },
                }, t('git.openFull')),
                detail.body !== ''
                  ? React.createElement('pre', { className: 'iwb-git-drawer-body-text' }, detail.body)
                  : null,
                React.createElement('div', { className: 'iwb-git-drawer-section-title' },
                  `${t('git.fileList')} · ${files.length}`,
                  React.createElement('span', { className: 'iwb-additions' }, ` +${additions}`),
                  React.createElement('span', { className: 'iwb-deletions' }, ` -${deletions}`),
                ),
                files.length === 0
                  ? React.createElement('div', { className: 'iwb-git-detail-dim' }, t('git.noFiles'))
                  : React.createElement(React.Fragment, null,
                      React.createElement('div', { className: 'iwb-git-drawer-files' },
                        files.map(file => React.createElement('button', {
                          key: file.path,
                          type: 'button',
                          className: `iwb-git-drawer-file ${selected?.path === file.path ? 'iwb-selected' : ''}`,
                          title: file.path,
                          onClick: () => setSelectedFile(file.path),
                          onDoubleClick: () => { void store.openCommitFile(detail.hash, file.path) },
                        },
                          React.createElement('span', { className: `iwb-git-file-status iwb-status-${file.status}` }, file.status),
                          React.createElement('span', { className: 'iwb-git-file-name' }, file.path.split('/').pop()),
                          React.createElement('span', { className: 'iwb-git-file-dir' }, file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''),
                          React.createElement('span', { className: 'iwb-additions' }, `+${file.additions}`),
                          React.createElement('span', { className: 'iwb-deletions' }, `-${file.deletions}`),
                        )),
                      ),
                      selected !== undefined
                        ? React.createElement('div', { className: 'iwb-git-drawer-inline' },
                            React.createElement('div', { className: 'iwb-git-drawer-section-title' }, selected.path),
                            React.createElement(InlinePatch, { text: selected.patch }),
                          )
                        : null,
                    ),
              )),
    ),
  )
}

export function GitPanel({ store, state }) {
  const t = store.t
  const git = state.git
  const repoProjects = (state.projects ?? []).filter(project => project.isRepo === true && project.path !== state.root)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(300)
  const [menu, setMenu] = useState(null)
  const [mainWidth, setMainWidth] = useState(0)
  const [branchMenu, setBranchMenu] = useState(null)
  const scrollRef = useRef(null)
  const mainRef = useRef(null)
  const queryTimer = useRef(null)
  const rowRefs = useRef(new Map())

  useEffect(() => {
    const element = scrollRef.current
    if (element === null) return undefined
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    setViewport(element.clientHeight)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = mainRef.current
    if (element === null) return undefined
    const observer = new ResizeObserver(() => setMainWidth(element.clientWidth))
    observer.observe(element)
    setMainWidth(element.clientWidth)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    void store.loadLog(true)
    void store.loadBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const layout = useMemo(() => layoutGraph(git.commits), [git.commits])
  const graphWidth = Math.max(40, Math.min(GRAPH_MAX, layout.maxLanes) * CELL + 16)
  const rows = layout.rows
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 6)
  const end = Math.min(rows.length, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + 6)
  const drawerOpen = git.detail !== null || git.detailLoading === true
  const geometry = gitLayout({
    mainWidth,
    configuredWidth: state.layout.gitDrawerWidth ?? 420,
    drawerOpen,
  })
  const drawerNarrow = geometry.drawerNarrow
  const drawerWidth = geometry.drawerWidth
  const tableNarrow = geometry.tableNarrow

  const onScroll = (event) => {
    const element = event.currentTarget
    setScrollTop(element.scrollTop)
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 240) store.loadMoreCommits()
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      store.toast('success', t('common.copied'), text)
    } catch {
      store.toast('error', t('common.error'), text)
    }
  }

  const openDetail = (hash) => { void store.openCommitDetail(hash) }

  const closeDetail = () => {
    const hash = git.detail?.hash ?? git.detailHash
    store.closeCommitDetail()
    if (hash !== null && hash !== undefined) {
      window.setTimeout(() => rowRefs.current.get(hash)?.focus?.(), 0)
    }
  }

  useEffect(() => {
    if (drawerOpen !== true) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeDetail()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, git.detail?.hash, git.detailHash])

  const moveSelection = (delta) => {
    const list = git.commits
    const index = list.findIndex(commit => commit.hash === git.selectedHash)
    const next = Math.max(0, Math.min(list.length - 1, index < 0 ? 0 : index + delta))
    const commit = list[next]
    if (commit !== undefined) {
      store.selectCommit(commit.hash)
      const row = rowRefs.current.get(commit.hash)
      row?.scrollIntoView?.({ block: 'nearest' })
      row?.focus?.()
    }
  }

  const onRowKeyDown = (event, commit) => {
    if (event.key === 'Enter') { event.preventDefault(); openDetail(commit.hash) }
    else if (event.key === 'Escape' && drawerOpen) { event.preventDefault(); closeDetail() }
    else if (event.key === 'ArrowDown') { event.preventDefault(); moveSelection(1) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); moveSelection(-1) }
  }

  const onContextMenu = (event, commit) => {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, commit })
  }

  const menuItems = useMemo(() => {
    if (menu === null) return []
    const commit = menu.commit
    return [
      { key: 'open', text: t('git.openDetails'), action: () => openDetail(commit.hash) },
      { key: 'copy', text: t('git.copySha'), action: () => { void copy(commit.hash) } },
      { key: 'compare-head', text: t('git.compareWithHead'), action: () => store.openCompare(commit.hash, 'HEAD') },
      null,
      {
        key: 'checkout', text: t('git.checkout'), action: () => store.requestCheckout(commit.hash),
      },
      {
        key: 'revert', text: t('git.revert'), action: () => {
          store.askConfirm(t('git.revert'), `${t('git.revertConfirm')}\n\n${commit.shortHash} ${commit.subject}`, t('git.revert'), () => { void store.revert(commit.hash) })
        },
      },
    ]
  }, [menu, t])

  useEffect(() => {
    if (branchMenu === null) return undefined
    const onDown = (event) => {
      if (event.target instanceof Element && event.target.closest('.iwb-branch-popover, .iwb-branch-switch') !== null) return
      setBranchMenu(null)
    }
    window.addEventListener('mousedown', onDown, true)
    return () => window.removeEventListener('mousedown', onDown, true)
  }, [branchMenu])

  const startDrawerResize = (event) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = drawerWidth
    const move = (moveEvent) => {
      const next = Math.max(DRAWER_MIN, Math.min(startWidth + (startX - moveEvent.clientX), Math.max(DRAWER_MIN, mainWidth * 0.6)))
      store.setLayout({ gitDrawerWidth: Math.round(next) })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const dateOptions = [
    ['', 'git.allTime'],
    ['7 days ago', 'git.last7'],
    ['30 days ago', 'git.last30'],
    ['90 days ago', 'git.last90'],
  ]

  return React.createElement('div', { className: 'iwb-git' },
    React.createElement('div', { className: 'iwb-git-filters' },
      React.createElement('button', {
        type: 'button', className: 'iwb-branch-switch', title: t('git.switchBranchTitle'),
        onClick: event => {
          const rect = event.currentTarget.getBoundingClientRect()
          setBranchMenu({ x: rect.left, y: rect.bottom + 4 })
        },
      },
        React.createElement(IconBranch, { width: 13, height: 13 }),
        React.createElement('span', null, state.status.detached === true ? t('git.detached') : (state.status.branch ?? '—')),
        React.createElement('span', { className: 'iwb-branch-caret' }, '▾'),
      ),
      (git.compare ?? []).length > 0
        ? React.createElement('span', { className: 'iwb-compare-chip', title: t('git.compareHint') },
            (git.compare ?? []).map(hash => hash.slice(0, 7)).join(' \u2194 '),
            React.createElement('button', {
              type: 'button', className: 'iwb-path-chip-clear', title: t('git.clearCompare'),
              onClick: () => store.patch('git', { compare: [] }),
            }, '\u00d7'),
          )
        : null,
      (git.compare ?? []).length === 2
        ? React.createElement('button', {
            type: 'button', className: 'iwb-textbtn iwb-small iwb-primary',
            onClick: () => store.compareSelected(),
          }, t('git.compare'))
        : null,
      React.createElement('button', {
        type: 'button',
        className: `iwb-textbtn iwb-small ${git.filters.branch === '' ? 'iwb-primary' : ''}`,
        title: t('git.branchFilter'),
        onClick: () => store.setGitFilters({ branch: git.filters.branch === '' ? (state.status.branch ?? '') : '' }),
      }, git.filters.branch === '' ? t('git.allBranches') : t('git.currentBranchOnly')),
      React.createElement('select', {
        className: 'iwb-select', title: t('git.dateFilter'),
        value: git.filters.since ?? '',
        onChange: event => store.setGitFilters({ since: event.target.value }),
      },
        dateOptions.map(([value, key]) => React.createElement('option', { key: value, value }, t(key))),
      ),
      React.createElement('input', {
        className: 'iwb-input', style: { width: 100 }, placeholder: t('git.authorFilter'),
        value: git.filters.author,
        onChange: event => {
          const value = event.target.value
          if (queryTimer.current !== null) clearTimeout(queryTimer.current)
          queryTimer.current = setTimeout(() => store.setGitFilters({ author: value }), 350)
        },
      }),
      React.createElement('input', {
        className: 'iwb-input', style: { flex: 1, minWidth: 100, width: 'auto' }, placeholder: t('git.queryFilter'),
        value: git.filters.query,
        onChange: event => {
          const value = event.target.value
          if (queryTimer.current !== null) clearTimeout(queryTimer.current)
          queryTimer.current = setTimeout(() => store.setGitFilters({ query: value }), 350)
        },
      }),
      git.filters.path !== undefined && git.filters.path !== ''
        ? React.createElement('span', { className: 'iwb-path-chip', title: git.filters.path },
            React.createElement('span', { className: 'iwb-path-chip-text' }, git.filters.path),
            React.createElement('button', {
              type: 'button', className: 'iwb-path-chip-clear', title: t('git.clearPath'),
              onClick: () => store.setGitFilters({ path: '' }),
            }, '×'),
          )
        : null,
      git.selectedHash !== null && git.selectedHash !== undefined && !drawerOpen
        ? React.createElement('button', {
            type: 'button', className: 'iwb-textbtn iwb-small',
            onClick: () => openDetail(git.selectedHash),
          }, t('git.openDetails'))
        : null,
      React.createElement('button', {
        type: 'button', className: 'iwb-iconbtn', title: t('common.refresh'),
        onClick: () => { void store.loadLog(true); void store.loadBranches(); void store.refreshStatus({ initial: true }) },
      }, React.createElement(IconRefresh, { width: 14, height: 14 })),
    ),
    React.createElement('div', { className: `iwb-git-main ${tableNarrow ? 'iwb-git-narrow' : ''}`, ref: mainRef },
      React.createElement('div', {
        className: 'iwb-git-table',
        style: { '--iwb-graph-w': `${graphWidth}px` },
      },
        React.createElement('div', { className: 'iwb-git-head' },
          React.createElement('span', null, ''),
          React.createElement('span', null, 'SHA'),
          React.createElement('span', null, t('git.message')),
          React.createElement('span', null, t('git.author')),
          React.createElement('span', null, t('git.date')),
        ),
        React.createElement('div', { className: 'iwb-git-scroll', ref: scrollRef, onScroll },
          rows.length === 0 && git.loading !== true
            ? React.createElement('div', { className: 'iwb-git-empty' },
                React.createElement('div', null,
                  state.status.isRepo === true
                    ? (git.error ?? t('git.noCommits'))
                    : t('project.noRepoHint'),
                ),
                state.status.isRepo !== true
                  ? React.createElement('button', {
                      type: 'button', className: 'iwb-textbtn iwb-primary iwb-small', style: { marginTop: 10 },
                      onClick: () => store.openProjectPicker(),
                    }, repoProjects.length > 0 ? t('project.chooseRepo') : t('project.selectProject'))
                  : (git.error !== null && git.error !== undefined
                      ? React.createElement('button', { type: 'button', className: 'iwb-textbtn iwb-small', style: { marginTop: 10 }, onClick: () => { void store.loadLog(true) } }, t('common.retry'))
                      : null),
              )
            : React.createElement('div', { className: 'iwb-git-rows', style: { height: `${rows.length * ROW_HEIGHT}px` } },
                rows.slice(start, end).map((row, index) => {
                  const commit = row.commit
                  const top = (start + index) * ROW_HEIGHT
                  const selected = git.selectedHash === commit.hash
                  const inCompare = (git.compare ?? []).includes(commit.hash)
                  return React.createElement('div', {
                    key: `${commit.hash}:${start + index}`,
                    ref: element => {
                      if (element === null) rowRefs.current.delete(commit.hash)
                      else rowRefs.current.set(commit.hash, element)
                    },
                    className: `iwb-git-row ${selected ? 'iwb-selected' : ''} ${inCompare ? 'iwb-compare' : ''}`,
                    style: { top: `${top}px` },
                    tabIndex: 0,
                    onClick: event => {
                      if (event.ctrlKey || event.metaKey) store.toggleCompare(commit.hash)
                      else store.selectCommit(commit.hash)
                    },
                    onDoubleClick: () => openDetail(commit.hash),
                    onKeyDown: event => onRowKeyDown(event, commit),
                    onContextMenu: event => onContextMenu(event, commit),
                  },
                    React.createElement('div', { className: 'iwb-git-graph' },
                      React.createElement(GraphCell, { row, width: graphWidth, height: ROW_HEIGHT, offset: 0 }),
                    ),
                    React.createElement('span', { className: 'iwb-sha' }, commit.shortHash),
                    React.createElement('span', { className: 'iwb-subject', style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                      commit.refs.length > 0
                        ? React.createElement('span', { style: { display: 'inline-flex', gap: 4, flex: '0 0 auto' } },
                            commit.refs.slice(0, 2).map(ref => React.createElement(RefChip, { key: ref, value: ref })),
                          )
                        : null,
                      React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, commit.subject),
                    ),
                    React.createElement('span', { className: 'iwb-author', title: commit.email }, commit.author),
                    React.createElement('span', { className: 'iwb-date' }, formatGitDate(commit.date, tableNarrow)),
                  )
                }),
                git.loading === true
                  ? React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, bottom: -26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--iwb-muted)', fontSize: 11 } }, t('common.loading'))
                  : null,
              ),
        ),
      ),
      drawerOpen
        ? React.createElement(CommitDrawer, {
            store, state, narrow: drawerNarrow, width: drawerWidth,
            onResizeStart: startDrawerResize, onClose: closeDetail,
          })
        : null,
    ),
    menu !== null ? React.createElement(ContextMenu, { x: menu.x, y: menu.y, items: menuItems, onClose: () => setMenu(null) }) : null,
    branchMenu !== null
      ? React.createElement(BranchPopover, {
          store, state, x: branchMenu.x, y: branchMenu.y, onClose: () => setBranchMenu(null),
        })
      : null,
  )
}
