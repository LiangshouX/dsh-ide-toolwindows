import test from 'node:test'
import assert from 'node:assert/strict'
import { WorkbenchStore } from '../src/client/store.js'

function fakeStore() {
  const ctx = { locale: { subscribe: () => () => {} } }
  const t = (key) => key
  const store = new WorkbenchStore(ctx, t)
  store.state = {
    ...store.state,
    workspaceRoot: 'C:\\work\\demo',
    root: 'C:\\work\\demo',
    phase: 'ready',
    settings: { editor: { openMode: 'auto', editableMaxBytes: 1 << 20 }, shortcuts: {} },
  }
  return store
}

test('openSearchTab creates one search tab and focuses it', () => {
  const store = fakeStore()
  store.openSearchTab()
  assert.equal(store.state.tabs.length, 1)
  assert.equal(store.state.tabs[0].kind, 'search')
  assert.equal(store.state.activeId, 'search:in-files')
  store.openSearchTab()
  assert.equal(store.state.tabs.length, 1)
})

test('single-click commit selection does not open the drawer', () => {
  const store = fakeStore()
  store.selectCommit('abc1234')
  assert.equal(store.state.git.selectedHash, 'abc1234')
  assert.equal(store.state.git.detail, null)
  assert.equal(store.state.git.detailLoading, false)
  store.closeCommitDetail()
  assert.equal(store.state.git.selectedHash, 'abc1234')
})

test('open mode C: editable up to the byte limit, read-only above it', () => {
  const store = fakeStore()
  assert.equal(store.editorOpenMode(), 'auto')
  assert.equal(store.defaultEditing(1024), true)
  assert.equal(store.defaultEditing(2 << 20), false)
  store.state.settings.editor.openMode = 'readonly'
  assert.equal(store.defaultEditing(10), false)
  store.state.settings.editor.openMode = 'editable'
  assert.equal(store.defaultEditing(2 << 20), true)
})

test('closeTab on a clean tab removes it; dirty tabs open a choice dialog', () => {
  const store = fakeStore()
  store.state.tabs = [
    { id: 'file:a', kind: 'file', path: 'C:\\work\\demo\\a', dirty: false },
    { id: 'file:b', kind: 'file', path: 'C:\\work\\demo\\b', dirty: true, payload: { content: 'x' }, draft: 'y' },
  ]
  store.state.activeId = 'file:a'
  store.closeTab('file:a')
  assert.deepEqual(store.state.tabs.map(tab => tab.id), ['file:b'])
  store.closeTab('file:b')
  assert.equal(store.state.confirm?.actions?.[0]?.key, 'cancel')
  assert.equal(store.state.confirm?.actions?.[2]?.key, 'save')
})

test('openCommitDetail loads git.detail and closeCommitDetail keeps the row selected', async () => {
  const store = fakeStore()
  const calls = []
  const original = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    calls.push({ url: String(url), body })
    return {
      ok: true,
      status: 200,
      async json() { return { ok: true, value: { hash: body.hash, shortHash: 'abc1234', diff: '', files: [] } } },
    }
  }
  try {
    await store.openCommitDetail('abc1234')
    assert.equal(store.state.git.detail?.hash, 'abc1234')
    assert.equal(store.state.git.detailHash, 'abc1234')
    assert.match(calls[0].url, /git\.detail/)
    store.closeCommitDetail()
    assert.equal(store.state.git.detail, null)
    assert.equal(store.state.git.selectedHash, 'abc1234')
  } finally {
    globalThis.fetch = original
  }
})

test('requestCheckout refuses a dirty worktree without calling the host', () => {
  const store = fakeStore()
  store.state.status = { ...store.state.status, isRepo: true, branch: 'main', entries: [{ path: 'a', ignored: false }] }
  store.requestCheckout('feature')
  assert.equal(store.state.confirm, null)
  assert.match(store.state.toast?.text ?? '', /git\.checkoutBlocked/)
})

test('runSearch stores grouped Find in Files results', async () => {
  const store = fakeStore()
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        ok: true,
        value: {
          files: [{ path: 'src/a.ts', matches: [{ line: 3, column: 7, preview: 'const needle = 1' }] }],
          truncated: false,
          tookMs: 8,
        },
      }
    },
  })
  try {
    store.openSearchTab()
    await store.runSearch('needle')
    assert.equal(store.state.search.query, 'needle')
    assert.equal(store.state.search.results.length, 1)
    assert.equal(store.state.search.results[0].path, 'src/a.ts')
    assert.equal(store.state.search.tookMs, 8)
  } finally {
    globalThis.fetch = original
  }
})

test('openSearchResult opens the hit at its line', () => {
  const store = fakeStore()
  let requested
  const original = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    requested = JSON.parse(init.body)
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, value: { kind: 'text', content: 'a\nb\nc\n', encoding: 'utf-8', size: 6, mtimeMs: 1, truncated: false } }
      },
    }
  }
  try {
    store.openSearchResult('src/a.ts', 3)
    const tab = store.state.tabs.find(item => item.id === store.state.activeId)
    assert.equal(tab.kind, 'file')
    assert.equal(tab.path, 'C:\\work\\demo\\src\\a.ts')
    assert.equal(tab.revealLine, 3)
    assert.equal(requested.path, 'C:\\work\\demo\\src\\a.ts')
  } finally {
    globalThis.fetch = original
  }
})

test('stale-file save keeps the draft and offers reload / overwrite', async () => {
  const store = fakeStore()
  store.state.tabs = [{
    id: 'file:a', kind: 'file', path: 'C:\\work\\demo\\a.txt', dirty: true, draft: 'mine',
    payload: { content: 'old', mtimeMs: 1, encoding: 'utf-8', eol: '\n' },
  }]
  store.state.activeId = 'file:a'
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    async json() { return { ok: false, error: { code: 'stale-file', message: 'changed on disk' } } },
  })
  try {
    await store.saveTab('file:a')
    const tab = store.state.tabs[0]
    assert.equal(tab.dirty, true)
    assert.equal(tab.conflict?.message, 'changed on disk')
    assert.deepEqual(store.state.confirm?.actions?.map(action => action.key), ['cancel', 'reload', 'overwrite'])
  } finally {
    globalThis.fetch = original
  }
})

test('trash failure asks before a permanent delete', async () => {
  const store = fakeStore()
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { ok: true, value: { results: [{ path: 'a.txt', ok: false, code: 'trash-failed', message: 'recycle failed' }] } }
    },
  })
  try {
    await store.deleteEntries(['C:\\work\\demo\\a.txt'])
    assert.deepEqual(store.state.confirm?.actions?.map(action => action.key), ['cancel', 'permanent'])
  } finally {
    globalThis.fetch = original
  }
})

test('Close Others saves dirty tabs before closing them', async () => {
  const store = fakeStore()
  store.state.tabs = [
    { id: 'file:a', kind: 'file', path: 'C:\\work\\demo\\a.txt', dirty: false },
    { id: 'file:b', kind: 'file', path: 'C:\\work\\demo\\b.txt', dirty: true, draft: 'b', payload: { content: 'old', mtimeMs: 1, encoding: 'utf-8', eol: '\n' } },
  ]
  store.state.activeId = 'file:a'
  const writes = []
  const original = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    writes.push(JSON.parse(init.body))
    return {
      ok: true,
      status: 200,
      async json() {
        return { ok: true, value: { path: 'b.txt', size: 1, mtimeMs: 2, encoding: 'utf-8' } }
      },
    }
  }
  try {
    await store.closeOtherTabs('file:a')
    const fileWrites = writes.filter(body => body.content !== undefined)
    assert.equal(fileWrites.length, 1)
    assert.equal(fileWrites[0].content, 'b')
    assert.deepEqual(store.state.tabs.map(tab => tab.id), ['file:a'])
  } finally {
    globalThis.fetch = original
  }
})

test('a restored tab whose file disappeared is closed instead of staying as an error', async () => {
  const store = fakeStore()
  store.state.tabs = [{ id: 'file:gone', kind: 'file', path: 'C:\\work\\demo\\gone.txt', dirty: false, loading: false, content: null, payload: null }]
  store.state.activeId = 'file:gone'
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    async json() { return { ok: false, error: { code: 'not-found', message: 'file not found' } } },
  })
  try {
    await store.ensureTabContent('file:gone')
    assert.deepEqual(store.state.tabs, [])
  } finally {
    globalThis.fetch = original
  }
})
