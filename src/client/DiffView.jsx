/**
 * Diff viewer with Unified / Side-by-side modes and line-level staging.
 *
 * The patch builder lives in diff.js: selected `+`/`-` lines keep their marker,
 * unselected additions disappear and unselected deletions become context, so
 * `git apply --cached` changes exactly the selected lines.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { buildPatch, firstFile, hunkChangeIndexes, parseUnifiedDiff, sideBySideRows, unifiedRows, wordSegments } from './diff.js'
import { IconRefresh } from './icons.jsx'

const LINE_HEIGHT = 20

/** Build a synthetic all-added diff for an untracked file. */
export function syntheticAddDiff(rel, content) {
  const text = String(content ?? '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  if (lines.length === 0) return ''
  return `diff --git a/${rel} b/${rel}\nnew file mode 100644\n--- /dev/null\n+++ b/${rel}\n@@ -0,0 +1,${lines.length} @@\n${lines.map(line => `+${line}`).join('\n')}\n`
}

/** The diff text behind one tab, plus its stageability. */
function diffSource(tab) {
  if (tab.kind === 'commit') {
    return { text: tab.detail?.diff ?? '', staged: false, stageable: false, path: tab.detail?.subject ?? tab.hash }
  }
  const payload = tab.payload
  // A commit-scoped (or compare) diff is read-only: never offer staging on it.
  const stageable = tab.commitHash === undefined && tab.readOnly !== true
  if (payload === undefined || payload === null) return { text: '', staged: tab.staged === true, stageable, path: tab.rel }
  if (payload.untracked === true) {
    if (payload.kind === 'text') return { text: syntheticAddDiff(tab.rel, payload.content), staged: false, stageable, path: tab.rel }
    return { text: '', staged: false, stageable, path: tab.rel, binary: true }
  }
  return { text: payload.diff ?? '', staged: tab.staged === true, stageable, path: tab.rel }
}

export function DiffView({ store, state, tab }) {
  const t = store.t
  const source = useMemo(() => diffSource(tab), [tab])
  const parsed = useMemo(() => parseUnifiedDiff(source.text), [source.text])
  const mode = tab.kind === 'commit' ? 'unified' : (state.commit.mode ?? 'side')
  const [selection, setSelection] = useState(() => new Set())
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(400)
  const [applying, setApplying] = useState(false)
  const [openBlocks, setOpenBlocks] = useState(() => new Set())
  const [wordLevel, setWordLevel] = useState(false)
  const scrollRef = useRef(null)
  const selecting = useRef(false)

  useEffect(() => {
    setSelection(new Set())
    setScrollTop(0)
  }, [tab.id, mode])

  useEffect(() => {
    const onUp = () => { selecting.current = false }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (element === null) return undefined
    const observer = new ResizeObserver(() => setViewport(element.clientHeight))
    observer.observe(element)
    setViewport(element.clientHeight)
    const top = tab.scrollTop ?? 0
    element.scrollTop = top
    setScrollTop(top)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.id])

  const files = parsed.files
  const singleFile = files.length === 1 ? files[0] : null
  const additions = files.reduce((sum, file) => sum + file.additions, 0)
  const deletions = files.reduce((sum, file) => sum + file.deletions, 0)

  const rows = useMemo(() => {
    const output = []
    for (const file of files) {
      const label = file.newPath !== '' ? file.newPath : file.oldPath
      output.push({ kind: 'file', text: label, additions: file.additions, deletions: file.deletions })
      if (file.isBinary) {
        output.push({ kind: 'binary', text: t('common.binary') })
        continue
      }
      const body = mode === 'side' ? sideBySideRows(file) : unifiedRows(file)
      for (const row of body) output.push({ ...row, file })
    }
    return output
  }, [files, mode, t])

  // Read-only diffs (commit / compare) collapse long unchanged runs; editable
  // diffs keep every line so line/hunk staging indexes stay stable.
  const viewRows = useMemo(() => {
    if (source.stageable) return rows
    const output = []
    let run = []
    let key = ''
    const flush = () => {
      if (run.length === 0) return
      if (run.length > 12 && !openBlocks.has(key)) {
        output.push({ kind: 'collapsed', count: run.length, blockKey: key, file: run[0].file })
      } else {
        output.push(...run)
      }
      run = []
    }
    rows.forEach((row, index) => {
      if (row.kind === 'context') {
        if (run.length === 0) key = `block-${index}`
        run.push(row)
        return
      }
      flush()
      output.push(row)
    })
    flush()
    return output
  }, [rows, source.stageable, openBlocks])

  const start = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - 8)
  const end = Math.min(viewRows.length, Math.ceil((scrollTop + viewport) / LINE_HEIGHT) + 8)

  const addIndex = (index) => {
    if (typeof index !== 'number') return
    setSelection(previous => {
      const next = new Set(previous)
      next.add(index)
      return next
    })
  }

  const onGutterDown = (event, index) => {
    event.preventDefault()
    event.stopPropagation()
    selecting.current = true
    addIndex(index)
  }

  const onGutterEnter = (index) => {
    if (selecting.current) addIndex(index)
  }

  const applySelection = async (indexes, label) => {
    if (!Array.isArray(indexes) || indexes.length === 0) {
      store.toast('info', t('commit.noChanges'))
      return
    }
    const file = firstFile(parsed)
    if (file === null) return
    const patch = buildPatch(file, new Set(indexes))
    if (patch === '') {
      store.toast('info', t('commit.noChanges'))
      return
    }
    setApplying(true)
    try {
      await store.stagePatch(patch, source.staged ? 'unstage' : 'stage')
      setSelection(new Set())
      store.toast('success', label ?? (source.staged ? t('commit.unstageSelection') : t('commit.stageSelection')))
    } finally {
      setApplying(false)
    }
  }

  const stageLabel = source.staged ? t('commit.unstageSelection') : t('commit.stageSelection')
  const hunkLabel = source.staged ? t('commit.unstageHunk') : t('commit.stageHunk')

  const rowStyle = (offset) => ({ position: 'absolute', top: `${offset * LINE_HEIGHT}px`, left: 0, right: 0, height: `${LINE_HEIGHT}px` })

  const renderChromeRow = (row, offset) => {
    if (row.kind === 'file') {
      return React.createElement('div', {
        key: `file:${row.text}:${offset}`,
        className: 'itw-diff-hunk',
        style: { ...rowStyle(offset), background: 'var(--itw-panel-2)', color: 'var(--itw-fg)' },
      },
        React.createElement('span', { className: 'itw-hunk-text', style: { fontWeight: 600 } }, row.text),
        React.createElement('span', { className: 'itw-additions', style: { marginRight: 10 } }, `+${row.additions}`),
        React.createElement('span', { className: 'itw-deletions', style: { marginRight: 10 } }, `-${row.deletions}`),
      )
    }
    if (row.kind === 'binary') {
      return React.createElement('div', { key: `bin:${offset}`, className: 'itw-diff-hunk', style: rowStyle(offset) },
        React.createElement('span', { className: 'itw-hunk-text' }, row.text))
    }
    return React.createElement('div', { key: `hunk:${offset}`, className: 'itw-diff-hunk', style: rowStyle(offset) },
      React.createElement('span', { className: 'itw-hunk-text' }, row.text),
      source.stageable
        ? React.createElement('span', { className: 'itw-hunk-actions' },
            React.createElement('button', {
              type: 'button', className: 'itw-textbtn itw-small', disabled: applying,
              onClick: () => { void applySelection(hunkChangeIndexes(row.file, row.hunkIndex), hunkLabel) },
            }, hunkLabel),
          )
        : null,
    )
  }

  const renderUnifiedRow = (row, offset) => {
    if (row.kind === 'file' || row.kind === 'binary' || row.kind === 'hunk') return renderChromeRow(row, offset)
    const selected = typeof row.index === 'number' && selection.has(row.index)
    const cls = row.kind === 'add' ? 'itw-add' : row.kind === 'del' ? 'itw-del' : ''
    return React.createElement('div', {
      key: `line:${row.index}`,
      className: `itw-diff-row ${cls} ${selected ? 'itw-selected' : ''}`,
      style: rowStyle(offset),
    },
      React.createElement('span', {
        className: 'itw-diff-gutter',
        onMouseDown: event => { if (source.stageable && row.kind !== 'context') onGutterDown(event, row.index) },
        onMouseEnter: () => { if (source.stageable && row.kind !== 'context') onGutterEnter(row.index) },
      }, row.kind === 'add' ? '+' : row.kind === 'del' ? '−' : ''),
      React.createElement('span', { className: 'itw-diff-num' }, row.oldNo ?? ''),
      React.createElement('span', { className: 'itw-diff-num' }, row.newNo ?? ''),
      React.createElement('span', { className: 'itw-diff-sign' }, row.kind === 'add' ? '+' : row.kind === 'del' ? '-' : ' '),
      React.createElement('span', { className: 'itw-diff-text' }, row.text === '' ? '\u00a0' : row.text),
    )
  }

  const renderSideCell = (side, isLeft, segments) => {
    if (side === null || side === undefined) {
      return React.createElement('div', { className: 'itw-diff-side-cell itw-blank' },
        React.createElement('span', { className: 'itw-diff-num' }),
        React.createElement('span', { className: 'itw-diff-text' }),
      )
    }
    const selected = typeof side.index === 'number' && selection.has(side.index)
    return React.createElement('div', {
      className: `itw-diff-side-cell ${isLeft ? 'itw-del' : 'itw-add'} ${selected ? 'itw-selected' : ''}`,
    },
      React.createElement('span', {
        className: 'itw-diff-gutter',
        onMouseDown: event => { if (source.stageable) onGutterDown(event, side.index) },
        onMouseEnter: () => { if (source.stageable) onGutterEnter(side.index) },
      }, isLeft ? '−' : '+'),
      React.createElement('span', { className: 'itw-diff-num' }, side.no ?? ''),
      React.createElement('span', { className: 'itw-diff-text' },
        segments === null || segments === undefined
          ? (side.text === '' ? '\u00a0' : side.text)
          : segments.map((segment, index) => (segment.changed
              ? React.createElement('span', { key: index, className: isLeft ? 'itw-word-del' : 'itw-word-add' }, segment.text)
              : segment.text))),
    )
  }

  const renderSideRow = (row, offset) => {
    if (row.kind === 'file' || row.kind === 'binary' || row.kind === 'hunk') return renderChromeRow(row, offset)
    const segments = wordLevel && row.kind === 'change'
      ? wordSegments(row.left?.text ?? '', row.right?.text ?? '')
      : null
    return React.createElement('div', {
      key: `side:${row.left?.index ?? 'x'}:${row.right?.index ?? 'y'}`,
      className: 'itw-diff-side',
      style: { ...rowStyle(offset), display: 'grid' },
    }, renderSideCell(row.left, true, segments?.left), renderSideCell(row.right, false, segments?.right))
  }

  const toolbar = React.createElement('div', { className: 'itw-diff-toolbar' },
    React.createElement(IconRefresh, { width: 13, height: 13 }),
    React.createElement('span', { style: { color: 'var(--itw-fg)', marginLeft: 2 } }, source.path ?? ''),
    React.createElement('span', { className: 'itw-additions' }, `+${additions}`),
    React.createElement('span', { className: 'itw-deletions' }, `-${deletions}`),
    React.createElement('span', { className: 'itw-spacer' }),
    tab.kind !== 'commit'
      ? React.createElement('div', { className: 'itw-seg' },
          React.createElement('button', {
            type: 'button', className: mode === 'side' ? 'itw-on' : '',
            onClick: () => store.setDiffMode('side'),
          }, t('commit.sideBySide')),
          React.createElement('button', {
            type: 'button', className: mode === 'unified' ? 'itw-on' : '',
            onClick: () => store.setDiffMode('unified'),
          }, t('commit.unified')),
        )
      : null,
    React.createElement('button', {
      type: 'button', className: `itw-textbtn itw-small ${wordLevel ? 'itw-primary' : ''}`,
      title: t('commit.wordLevel'), onClick: () => setWordLevel(value => !value),
    }, 'Aa'),
    source.stageable && selection.size > 0
      ? React.createElement('button', {
          type: 'button', className: 'itw-textbtn itw-primary itw-small', disabled: applying,
          onClick: () => { void applySelection([...selection], stageLabel) },
        }, `${stageLabel} (${selection.size})`)
      : null,
    source.stageable && singleFile !== null
      ? React.createElement('button', {
          type: 'button', className: 'itw-textbtn itw-small',
          onClick: () => { void applySelection(singleFile.hunks.flatMap((_, index) => hunkChangeIndexes(singleFile, index)), hunkLabel) },
        }, source.staged ? t('commit.unstageAll') : t('commit.stageAll'))
      : null,
  )

  const body = React.createElement('div', {
    className: 'itw-diff-scroll',
    ref: scrollRef,
    onScroll: event => setScrollTop(event.currentTarget.scrollTop),
  },
    viewRows.length === 0
      ? React.createElement('div', { className: 'itw-empty' }, t('commit.selectFile'))
      : React.createElement('div', { className: 'itw-diff-inner', style: { height: `${viewRows.length * LINE_HEIGHT}px` } },
          viewRows.slice(start, end).map((row, index) => {
            const offset = start + index
            if (row.kind === 'collapsed') {
              return React.createElement('div', {
                key: row.blockKey,
                className: 'itw-diff-collapsed',
                onClick: () => setOpenBlocks(previous => new Set([...previous, row.blockKey])),
              }, `\u22ef ${row.count} ${t('diff.collapsedLines')}`)
            }
            return mode === 'side' ? renderSideRow(row, offset) : renderUnifiedRow(row, offset)
          }),
        ),
  )

  // The commit metadata lives in the Git tool window's bottom details pane;
  // the editor area only shows the full diff (no duplicated header block).
  return React.createElement('div', { className: 'itw-diff' }, toolbar, body)
}
