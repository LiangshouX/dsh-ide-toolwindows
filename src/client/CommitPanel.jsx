/**
 * Commit tool window: three Git-native groups, the message editor with recent
 * messages + Amend, per-file stage/unstage/discard, and Commit / Commit+Push.
 */
import React, { useEffect, useMemo, useRef } from 'react'
import { FileTypeIcon, IconRefresh } from './icons.jsx'
import { changeLabel } from './diff.js'
import { dirName } from './util.js'

function LineStats({ stats }) {
  if (stats === undefined || stats === null) return null
  if (stats.binary === true) return React.createElement('span', { className: 'itw-file-stat' }, 'bin')
  return React.createElement('span', { className: 'itw-file-stat' },
    React.createElement('span', { className: 'itw-additions' }, `+${stats.additions}`),
    React.createElement('span', { className: 'itw-deletions' }, `-${stats.deletions}`),
  )
}

function FileRow({ store, state, entry, staged, untracked }) {
  const t = store.t
  const active = state.activeId === `diff:${untracked ? 'untracked' : staged ? 'staged' : 'worktree'}:${entry.path}`
  const name = entry.path.split(/[\\/]/).pop()
  const parent = dirName(entry.path)
  const stats = staged ? entry.stagedLines : entry.unstagedLines
  const label = changeLabel(entry.xy)
  return React.createElement('div', {
    className: `itw-file-row ${active ? 'itw-active' : ''}`,
    title: `${entry.path}${label !== '' ? ` · ${label}` : ''}`,
    onClick: () => store.openDiff({ path: entry.path, staged, untracked }),
  },
    React.createElement('input', {
      type: 'checkbox',
      checked: staged === true,
      disabled: entry.conflict === true,
      style: { accentColor: 'var(--itw-accent)', margin: 0 },
      onClick: event => event.stopPropagation(),
      onChange: event => {
        if (event.target.checked) void store.stage([entry.path], { refreshDiff: true })
        else void store.unstage([entry.path], { refreshDiff: true })
      },
    }),
    React.createElement(FileTypeIcon, { name, size: 14 }),
    React.createElement('span', { className: 'itw-file-name', style: entry.conflict === true ? { color: 'var(--itw-error)' } : undefined },
      name,
    ),
    parent !== '' ? React.createElement('span', { className: 'itw-file-dir' }, parent) : null,
    React.createElement(LineStats, { stats }),
    React.createElement('span', { className: 'itw-row-actions' },
      entry.conflict !== true
        ? React.createElement('button', {
            type: 'button',
            className: 'itw-textbtn itw-small itw-danger',
            title: t('commit.discard'),
            onClick: event => {
              event.stopPropagation()
              store.askConfirm(
                t('commit.discardTitle'),
                `${t('commit.discardBody')}\n\n${entry.path}`,
                t('commit.discard'),
                () => { void store.discardEntries([entry]) },
              )
            },
          }, t('commit.discard'))
        : null,
    ),
  )
}

function Group({ store, state, title, entries, staged, untracked, emptyText }) {
  const t = store.t
  // Only the staged group offers "Unstage all"; unstaged and untracked groups
  // offer "Stage all".
  const allStaged = staged === true
  return React.createElement('div', { className: 'itw-group' },
    React.createElement('div', { className: 'itw-group-header' },
      React.createElement('span', null, title),
      React.createElement('span', { className: 'itw-count' }, entries.length),
      React.createElement('span', { className: 'itw-spacer' }),
      entries.length > 0
        ? React.createElement('button', {
            type: 'button',
            className: 'itw-textbtn itw-small',
            onClick: () => {
              const paths = entries.filter(entry => entry.conflict !== true).map(entry => entry.path)
              if (allStaged) void store.unstage(paths, { refreshDiff: true })
              else void store.stage(paths, { refreshDiff: true })
            },
          }, allStaged ? t('commit.unstageAll') : t('commit.stageAll'))
        : null,
    ),
    entries.length === 0
      ? React.createElement('div', { className: 'itw-empty', style: { padding: '10px 12px', alignItems: 'flex-start', textAlign: 'left' } }, emptyText)
      : entries.map(entry => React.createElement(FileRow, {
          key: `${staged ? 's' : untracked ? 'u' : 'w'}:${entry.path}`,
          store, state, entry, staged, untracked,
        })),
  )
}

export function CommitPanel({ store, state }) {
  const t = store.t
  const groups = store.groups
  const commit = state.commit
  const textareaRef = useRef(null)
  const initial = state.status.oid === undefined
  const history = useMemo(() => commit.messages.map(message => ({
    value: message,
    label: message.split('\n')[0].slice(0, 70),
  })), [commit.messages])

  useEffect(() => {
    if ((commit.focusTick ?? 0) > 0) {
      window.setTimeout(() => {
        const element = textareaRef.current
        if (element !== null) {
          element.focus()
          element.setSelectionRange(element.value.length, element.value.length)
        }
      }, 30)
    }
  }, [commit.focusTick])

  const canCommit = commit.committing !== true && (groups.staged.length > 0 || commit.amend === true)

  return React.createElement('div', { className: 'itw-commit' },
    React.createElement('div', { className: 'itw-panel-header' },
      React.createElement('span', { className: 'itw-panel-title' }, t('commit.title')),
      state.status.isRepo === true
        ? React.createElement('span', { className: 'itw-panel-sub' }, state.status.detached === true ? t('git.detached') : (state.status.branch ?? ''))
        : React.createElement('span', { className: 'itw-panel-sub' }, t('welcome.noRepo')),
      React.createElement('span', { className: 'itw-spacer' }),
      React.createElement('button', {
        type: 'button', className: 'itw-iconbtn', title: t('common.refresh'),
        onClick: () => { void store.refreshStatus({ initial: true }); void store.loadCommitMessages() },
      }, React.createElement(IconRefresh, { width: 14, height: 14 })),
    ),
    React.createElement('div', { className: 'itw-commit-message' },
      React.createElement('textarea', {
        ref: textareaRef,
        placeholder: state.settings?.git?.commitTemplate || t('commit.messagePlaceholder'),
        value: commit.message,
        spellCheck: false,
        onChange: event => store.setCommitMessage(event.target.value),
        onKeyDown: event => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && canCommit) {
            event.preventDefault()
            void store.commit(commit.message, commit.amend, false)
          }
        },
      }),
      React.createElement('div', { className: 'itw-commit-actions' },
        React.createElement('label', { className: 'itw-check', title: initial ? t('commit.amendDisabled') : t('commit.amend') },
          React.createElement('input', {
            type: 'checkbox', checked: commit.amend, disabled: initial,
            onChange: event => store.setAmend(event.target.checked),
          }),
          t('commit.amend'),
        ),
        React.createElement('select', {
          className: 'itw-select',
          style: { maxWidth: 120 },
          value: '',
          title: t('commit.history'),
          disabled: history.length === 0,
          onChange: event => { if (event.target.value !== '') store.setCommitMessage(event.target.value) },
        },
          React.createElement('option', { value: '' }, t('commit.history')),
          history.map(item => React.createElement('option', { key: item.value, value: item.value }, item.label)),
        ),
        React.createElement('span', { className: 'itw-spacer' }),
        React.createElement('button', {
          type: 'button',
          className: 'itw-textbtn itw-primary itw-small',
          disabled: !canCommit,
          onClick: () => { void store.commit(commit.message, commit.amend, false) },
        }, commit.committing ? t('common.loading') : t('commit.commit')),
        React.createElement('button', {
          type: 'button',
          className: 'itw-textbtn itw-small',
          disabled: !canCommit,
          onClick: () => { void store.commit(commit.message, commit.amend, true) },
        }, t('commit.commitAndPush')),
      ),
      commit.error !== null && commit.error !== undefined
        ? React.createElement('div', { className: 'itw-error-box', style: { margin: '8px 0 0' } }, commit.error)
        : null,
    ),
    React.createElement('div', { className: 'itw-groups' },
      React.createElement(Group, {
        store, state,
        title: t('commit.staged'), entries: groups.staged, staged: true, untracked: false,
        emptyText: t('commit.noStaged'),
      }),
      React.createElement(Group, {
        store, state,
        title: t('commit.unstaged'), entries: groups.unstaged, staged: false, untracked: false,
        emptyText: t('commit.noUnstaged'),
      }),
      React.createElement(Group, {
        store, state,
        title: t('commit.untracked'), entries: groups.untracked, staged: false, untracked: true,
        emptyText: t('commit.noUntracked'),
      }),
    ),
  )
}
