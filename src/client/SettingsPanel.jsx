/**
 * Tool Windows Settings: shortcuts, terminal profile, file tree, Git and
 * appearance. The same form serves the in-workbench modal and the native
 * settings.section page.
 */
import React, { useEffect, useRef, useState } from 'react'
import { ShortcutCapture } from './ui.jsx'
import { IDE_OPTIONS } from './ide-menu.js'

const SHORTCUT_FIELDS = [
  ['project', 'projectShortcut'],
  ['commit', 'commitShortcut'],
  ['git', 'gitShortcut'],
  ['terminal', 'terminalShortcut'],
  ['focusCommit', 'focusCommitShortcut'],
  ['push', 'pushShortcut'],
  ['findInFiles', 'findInFilesShortcut'],
  ['findInFilesAlt', 'findInFilesAltShortcut'],
  ['quickOpen', 'quickOpenShortcut'],
]

export function SettingsForm({ store, state, compact }) {
  const t = store.t
  const settings = state.settings ?? {}
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const timer = useRef(null)
  const savedTimer = useRef(null)

  useEffect(() => {
    setDraft(settings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current)
    if (savedTimer.current !== null) clearTimeout(savedTimer.current)
  }, [])

  const commit = (patch) => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      void store.updateSettings(patch).then(() => {
        setSaved(true)
        if (savedTimer.current !== null) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setSaved(false), 1600)
      })
    }, 350)
  }

  const update = (patch) => {
    const next = {
      ...draft,
      ...patch,
      git: { ...draft.git, ...(patch.git ?? {}) },
      idea: { ...draft.idea, ...(patch.idea ?? {}) },
      webstorm: { ...draft.webstorm, ...(patch.webstorm ?? {}) },
      vscode: { ...draft.vscode, ...(patch.vscode ?? {}) },
      terminal: { ...draft.terminal, ...(patch.terminal ?? {}) },
      project: { ...draft.project, ...(patch.project ?? {}) },
      commit: { ...draft.commit, ...(patch.commit ?? {}) },
      delete: { ...draft.delete, ...(patch.delete ?? {}) },
      layout: { ...draft.layout, ...(patch.layout ?? {}) },
      editor: { ...draft.editor, ...(patch.editor ?? {}) },
      shortcuts: { ...draft.shortcuts, ...(patch.shortcuts ?? {}) },
    }
    setDraft(next)
    commit(patch)
  }

  const Row = ({ label, hint, children }) => React.createElement('div', { className: 'itw-settings-row' },
    React.createElement('div', { className: 'itw-settings-label' },
      React.createElement('div', null, label),
      hint !== undefined ? React.createElement('div', { className: 'itw-settings-hint' }, hint) : null,
    ),
    children,
  )

  return React.createElement('div', { className: 'itw-settings' },
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.shortcuts')),
      SHORTCUT_FIELDS.map(([field, labelKey]) => React.createElement(Row, {
        key: field,
        label: t(`settings.${labelKey}`),
        hint: t(`settings.${labelKey}Hint`),
      },
        React.createElement(ShortcutCapture, {
          value: draft.shortcuts?.[field] ?? '',
          active: capturing,
          onActivate: setCapturing,
          onCapture: value => update({ shortcuts: { [field]: value } }),
        }),
      )),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.terminalGroup')),
      React.createElement(Row, { label: t('settings.defaultShell'), hint: t('settings.defaultShellHint') },
        React.createElement('select', {
          className: 'itw-select',
          value: draft.terminal?.shell ?? 'auto',
          onChange: event => update({ terminal: { shell: event.target.value } }),
        },
          React.createElement('option', { value: 'auto' }, t('settings.auto')),
          state.terminal.shells.map(shell => React.createElement('option', { key: shell.id, value: shell.id }, shell.label)),
        ),
      ),
      React.createElement(Row, { label: t('settings.copyOnSelect') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.terminal?.copyOnSelect === true,
          onChange: event => update({ terminal: { copyOnSelect: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.terminalFontSize') },
        React.createElement('input', {
          type: 'number', min: 10, max: 20,
          value: draft.terminal?.fontSize ?? 13,
          onChange: event => update({ terminal: { fontSize: Number(event.target.value) || 13 } }),
        }),
      ),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.filesGroup')),
      React.createElement(Row, { label: t('project.alwaysSelect') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.project?.alwaysSelectOpened !== false,
          onChange: event => update({ project: { alwaysSelectOpened: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('project.gitColors') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.git?.colors !== false,
          onChange: event => update({ git: { colors: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.showHidden') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.project?.showHidden !== false,
          onChange: event => update({ project: { showHidden: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.singleClickOpen'), hint: t('settings.singleClickOpenHint') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.project?.singleClickOpen === true,
          onChange: event => update({ project: { singleClickOpen: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.showIgnored'), hint: t('settings.showIgnoredHint') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.project?.showIgnored === true,
          onChange: event => update({ project: { showIgnored: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.groupByDirectory'), hint: t('settings.groupByDirectoryHint') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.commit?.groupByDirectory === true,
          onChange: event => update({ commit: { groupByDirectory: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.useRecycleBin'), hint: t('settings.useRecycleBinHint') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.delete?.useRecycleBin !== false,
          onChange: event => update({ delete: { useRecycleBin: event.target.checked } }),
        }),
      ),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.ideGroup')),
      IDE_OPTIONS.map(ide => React.createElement(Row, { key: ide.id, label: ide.title, hint: t('settings.idePathHint') },
        React.createElement('input', {
          type: 'text', className: 'itw-input', 'aria-label': ide.title,
          value: draft[ide.id]?.path ?? '',
          placeholder: t('settings.ideAuto'),
          onChange: event => update({ [ide.id]: { path: event.target.value } }),
        }),
      )),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.editorGroup')),
      React.createElement(Row, { label: t('settings.openMode'), hint: t('settings.openModeHint') },
        React.createElement('select', {
          value: draft.editor?.openMode ?? 'auto',
          onChange: event => update({ editor: { openMode: event.target.value } }),
        },
          React.createElement('option', { value: 'auto' }, t('settings.openModeAuto')),
          React.createElement('option', { value: 'editable' }, t('settings.openModeEditable')),
          React.createElement('option', { value: 'readonly' }, t('settings.openModeReadonly')),
        ),
      ),
      React.createElement(Row, { label: t('settings.editableMaxBytes'), hint: t('settings.editableMaxBytesHint') },
        React.createElement('input', {
          type: 'number', min: 64, max: 16384, step: 64,
          value: Math.round((draft.editor?.editableMaxBytes ?? (1 << 20)) / 1024),
          onChange: event => update({ editor: { editableMaxBytes: (Number(event.target.value) || 1024) * 1024 } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.editorFontSize') },
        React.createElement('input', {
          type: 'number', min: 10, max: 20,
          value: draft.editor?.fontSize ?? 13,
          onChange: event => update({ editor: { fontSize: Number(event.target.value) || 13 } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.markdownPreview'), hint: t('settings.markdownPreviewHint') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.editor?.markdownPreview !== false,
          onChange: event => update({ editor: { markdownPreview: event.target.checked } }),
        }),
      ),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.gitGroup')),
      React.createElement(Row, { label: t('settings.gitPath'), hint: t('settings.gitPathHint') },
        React.createElement('input', {
          type: 'text',
          placeholder: 'git',
          value: draft.git?.path ?? '',
          onChange: event => update({ git: { path: event.target.value } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.commitTemplate'), hint: t('settings.commitTemplateHint') },
        React.createElement('input', {
          type: 'text',
          style: { minWidth: 240 },
          value: draft.git?.commitTemplate ?? '',
          onChange: event => update({ git: { commitTemplate: event.target.value } }),
        }),
      ),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.commitGroup')),
      React.createElement(Row, { label: t('settings.testCommand'), hint: t('settings.testCommandHint') },
        React.createElement('input', {
          type: 'text',
          style: { minWidth: 240 },
          placeholder: 'npm test',
          value: draft.commit?.testCommand ?? '',
          onChange: event => update({ commit: { testCommand: event.target.value } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.optimizeCommand'), hint: t('settings.optimizeCommandHint') },
        React.createElement('input', {
          type: 'text',
          style: { minWidth: 240 },
          value: draft.commit?.optimizeImportsCommand ?? '',
          onChange: event => update({ commit: { optimizeImportsCommand: event.target.value } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.cleanupCommand'), hint: t('settings.cleanupCommandHint') },
        React.createElement('input', {
          type: 'text',
          style: { minWidth: 240 },
          value: draft.commit?.cleanupCommand ?? '',
          onChange: event => update({ commit: { cleanupCommand: event.target.value } }),
        }),
      ),
    ),
    React.createElement('div', { className: 'itw-settings-group' },
      React.createElement('h3', null, t('settings.appearanceGroup')),
      React.createElement(Row, { label: t('settings.highlight') },
        React.createElement('input', {
          type: 'checkbox',
          checked: draft.editor?.highlight !== false,
          onChange: event => update({ editor: { highlight: event.target.checked } }),
        }),
      ),
      React.createElement(Row, { label: t('settings.language'), hint: t('settings.languageHint') },
        React.createElement('span', { style: { color: 'var(--itw-muted)', fontSize: 12 } }, t('settings.followDsh')),
      ),
    ),
    saved === true
      ? React.createElement('div', { className: 'itw-settings-saved' }, t('settings.saved'))
      : null,
    compact === true ? null : React.createElement('div', { style: { marginTop: 8 } },
      React.createElement('button', {
        type: 'button', className: 'itw-textbtn itw-small',
        onClick: () => {
          const reset = {
            git: { path: '', colors: true, commitTemplate: '' },
            idea: { path: '' },
            webstorm: { path: '' },
            vscode: { path: '' },
            terminal: { shell: 'auto', copyOnSelect: false },
            project: { alwaysSelectOpened: true, showHidden: true },
            editor: { fontSize: 13, highlight: true, openMode: 'auto', editableMaxBytes: 1 << 20, markdownPreview: true },
            shortcuts: {
              project: 'Alt+1', commit: 'Alt+0', git: 'Alt+9', terminal: 'Alt+F12',
              focusCommit: 'Ctrl+K', push: 'Ctrl+Shift+K', findInFiles: 'Ctrl+Shift+F', findInFilesAlt: 'Ctrl+Alt+F', openCommitDetail: 'Ctrl+Alt+D', quickOpen: 'Ctrl+Shift+N',
            },
          }
          setDraft({ ...draft, ...reset })
          commit(reset)
        },
      }, t('settings.reset')),
    ),
  )
}

/** The native settings.section page (owner props: close). */
export function SettingsSection({ store, state, close }) {
  return React.createElement('div', { style: { padding: '8px 4px 24px' } },
    React.createElement(SettingsForm, { store, state }),
    React.createElement('div', { style: { marginTop: 12 } },
      React.createElement('button', { type: 'button', className: 'itw-textbtn itw-small', onClick: () => close?.() }, store.t('common.close')),
    ),
  )
}
