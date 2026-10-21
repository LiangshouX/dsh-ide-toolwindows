/**
 * Git tool window: branch/sha chips, filterable lazily paged history, a lane
 * graph column, and JetBrains-style actions on one commit.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { GRAPH_COLORS, layoutGraph, rowGeometry } from './graph.js'
import { ContextMenu } from './ui.jsx'
import { IconBranch, IconRefresh } from './icons.jsx'
import { formatGitDate } from './util.js'

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
    stroke: 'var(--itw-bg)', strokeWidth: 1.2,
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
      color: isHead ? 'var(--itw-accent)' : isRemote ? 'var(--itw-muted)' : 'var(--itw-success)',
      maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
  }, value)
}

export function GitPanel({ store, state }) {
  const t = store.t
  const git = state.git
  const repoProjects = (state.projects ?? []).filter(project => project.isRepo === true && project.path !== state.root)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(300)
  const [menu, setMenu] = useState(null)
  const [narrow, setNarrow] = useState(false)
  const scrollRef = useRef(null)
  const tableRef = useRef(null)
  const queryTimer = useRef(null)

  useEffect(() => {
    const element = scrollRef.current
    if (element === null) return undefined
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    setViewport(element.clientHeight)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = tableRef.current
    if (element === null) return undefined
    // A bottom dock is often narrow: hide author/date before the subject
    // becomes a three-character stub.
    const observer = new ResizeObserver(() => setNarrow(element.clientWidth < 640))
    observer.observe(element)
    setNarrow(element.clientWidth < 640)
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

  const onContextMenu = (event, commit) => {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, commit })
  }

  const menuItems = useMemo(() => {
    if (menu === null) return []
    const commit = menu.commit
    return [
      { key: 'copy', text: t('git.copySha'), action: () => { void copy(commit.hash) } },
      null,
      {
        key: 'checkout', text: t('git.checkout'), action: () => {
          store.askConfirm(t('git.checkout'), `${t('git.checkoutConfirm')}\n\n${commit.shortHash} ${commit.subject}`, t('git.checkout'), () => { void store.checkout(commit.hash) })
        },
      },
      {
        key: 'revert', text: t('git.revert'), action: () => {
          store.askConfirm(t('git.revert'), `${t('git.revertConfirm')}\n\n${commit.shortHash} ${commit.subject}`, t('git.revert'), () => { void store.revert(commit.hash) })
        },
      },
    ]
  }, [menu, t])

  return React.createElement('div', { className: 'itw-git' },
    React.createElement('div', { className: 'itw-git-filters' },
      React.createElement(IconBranch, { width: 13, height: 13, style: { color: 'var(--itw-muted)' } }),
      React.createElement('span', { style: { color: 'var(--itw-fg)', fontWeight: 600, fontSize: 12, marginRight: 4 } },
        state.status.detached === true ? t('git.detached') : (state.status.branch ?? '—')),
      React.createElement('select', {
        className: 'itw-select', title: t('git.switchBranch'),
        value: state.status.branch ?? '',
        disabled: git.branches.length === 0,
        onChange: event => {
          const ref = event.target.value
          if (ref !== '' && ref !== state.status.branch) void store.checkout(ref)
        },
      },
        state.status.detached === true
          ? React.createElement('option', { value: '' }, t('git.detached'))
          : null,
        git.branches.map(name => React.createElement('option', { key: name, value: name }, name)),
      ),
      React.createElement('select', {
        className: 'itw-select', title: t('git.branchFilter'),
        value: git.filters.branch,
        onChange: event => store.setGitFilters({ branch: event.target.value }),
      },
        React.createElement('option', { value: '' }, t('git.allBranches')),
        git.branches.map(name => React.createElement('option', { key: name, value: name }, name)),
      ),
      React.createElement('input', {
        className: 'itw-input', style: { width: 110 }, placeholder: t('git.authorFilter'),
        value: git.filters.author,
        onChange: event => {
          const value = event.target.value
          if (queryTimer.current !== null) clearTimeout(queryTimer.current)
          queryTimer.current = setTimeout(() => store.setGitFilters({ author: value }), 350)
        },
      }),
      React.createElement('input', {
        className: 'itw-input', style: { flex: 1, minWidth: 120, width: 'auto' }, placeholder: t('git.queryFilter'),
        value: git.filters.query,
        onChange: event => {
          const value = event.target.value
          if (queryTimer.current !== null) clearTimeout(queryTimer.current)
          queryTimer.current = setTimeout(() => store.setGitFilters({ query: value }), 350)
        },
      }),
      React.createElement('button', {
        type: 'button', className: 'itw-iconbtn', title: t('common.refresh'),
        onClick: () => { void store.loadLog(true); void store.loadBranches(); void store.refreshStatus({ initial: true }) },
      }, React.createElement(IconRefresh, { width: 14, height: 14 })),
    ),
    React.createElement('div', {
      className: `itw-git-table ${narrow ? 'itw-git-narrow' : ''}`,
      ref: tableRef,
      style: { '--itw-graph-w': `${graphWidth}px` },
    },
      React.createElement('div', { className: 'itw-git-head' },
        React.createElement('span', null, ''),
        React.createElement('span', null, 'SHA'),
        React.createElement('span', null, t('git.message')),
        React.createElement('span', null, t('git.author')),
        React.createElement('span', null, t('git.date')),
      ),
      React.createElement('div', { className: 'itw-git-scroll', ref: scrollRef, onScroll },
        rows.length === 0 && git.loading !== true
          ? React.createElement('div', { className: 'itw-git-empty' },
              React.createElement('div', null,
                state.status.isRepo === true
                  ? (git.error ?? t('git.noCommits'))
                  : t('project.noRepoHint'),
              ),
              state.status.isRepo !== true
                ? React.createElement('button', {
                    type: 'button', className: 'itw-textbtn itw-primary itw-small', style: { marginTop: 10 },
                    onClick: () => store.openProjectPicker(),
                  }, repoProjects.length > 0 ? t('project.chooseRepo') : t('project.selectProject'))
                : (git.error !== null && git.error !== undefined
                    ? React.createElement('button', { type: 'button', className: 'itw-textbtn itw-small', style: { marginTop: 10 }, onClick: () => { void store.loadLog(true) } }, t('common.retry'))
                    : null),
            )
          : React.createElement('div', { className: 'itw-git-rows', style: { height: `${rows.length * ROW_HEIGHT}px` } },
              rows.slice(start, end).map((row, index) => {
                const commit = row.commit
                const top = (start + index) * ROW_HEIGHT
                const selected = git.selectedHash === commit.hash
                return React.createElement('div', {
                  key: `${commit.hash}:${start + index}`,
                  className: `itw-git-row ${selected ? 'itw-selected' : ''}`,
                  style: { top: `${top}px` },
                  onClick: () => { void store.selectCommit(commit.hash) },
                  onDoubleClick: () => { void store.openCommit(commit.hash) },
                  onContextMenu: event => onContextMenu(event, commit),
                  title: `${commit.shortHash} ${commit.subject}`,
                },
                  React.createElement('div', { className: 'itw-git-graph' },
                    React.createElement(GraphCell, { row, width: graphWidth, height: ROW_HEIGHT, offset: 0 }),
                  ),
                  React.createElement('span', { className: 'itw-sha' }, commit.shortHash),
                  React.createElement('span', { className: 'itw-subject', style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                    commit.refs.length > 0
                      ? React.createElement('span', { style: { display: 'inline-flex', gap: 4, flex: '0 0 auto' } },
                          commit.refs.slice(0, 2).map(ref => React.createElement(RefChip, { key: ref, value: ref })),
                        )
                      : null,
                    React.createElement('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, commit.subject),
                  ),
                  React.createElement('span', { className: 'itw-author', title: commit.email }, commit.author),
                  React.createElement('span', { className: 'itw-date' }, formatGitDate(commit.date)),
                )
              }),
              git.loading === true
                ? React.createElement('div', { style: { position: 'absolute', left: 0, right: 0, bottom: -26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--itw-muted)', fontSize: 11 } }, t('common.loading'))
                : null,
            ),
      ),
    ),
    menu !== null ? React.createElement(ContextMenu, { x: menu.x, y: menu.y, items: menuItems, onClose: () => setMenu(null) }) : null,
  )
}
