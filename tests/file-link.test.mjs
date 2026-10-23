import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultSidebarKind, openInDefaultSidebar } from '../src/client/file-link.js'

const ADDRESS = 'dsh-resource://file/session/s1/src/a.ts'

test('defaultSidebarKind skips the IDE and names the next ranked type', () => {
  const ctx = {
    sidebarRightTabs: { candidates: () => [{ kind: 'ide-toolwindows' }, { kind: 'editor' }, { kind: 'text' }] },
  }
  assert.equal(defaultSidebarKind(ctx, ADDRESS, 'ide-toolwindows'), 'editor')
  const onlySelf = { sidebarRightTabs: { candidates: () => [{ kind: 'ide-toolwindows' }] } }
  assert.equal(defaultSidebarKind(onlySelf, ADDRESS, 'ide-toolwindows'), undefined)
})

test('openInDefaultSidebar opens the default kind and carries the line and carrier tab', () => {
  const calls = []
  const ctx = {
    sidebarRightTabs: { candidates: () => [{ kind: 'ide-toolwindows' }, { kind: 'editor' }] },
    sidebarRight: { openResource: (address, options) => { calls.push({ address, options }) } },
  }
  const opened = openInDefaultSidebar(ctx, ADDRESS, {
    ownKind: 'ide-toolwindows', line: 24, replaceTab: 'tab-1',
  })
  assert.equal(opened, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].address, ADDRESS)
  assert.equal(calls[0].options.kind, 'editor')
  assert.deepEqual(calls[0].options.params, { line: 24 })
  assert.equal(calls[0].options.replaceTab, 'tab-1')
  assert.equal(calls[0].options.revealIfOpened, true)
})

test('openInDefaultSidebar honors an explicit viewer kind before the ranking', () => {
  const calls = []
  const ctx = {
    sidebarRightTabs: { candidates: () => [{ kind: 'ide-toolwindows' }, { kind: 'editor' }] },
    sidebarRight: { openResource: (address, options) => { calls.push({ address, options }) } },
  }
  const opened = openInDefaultSidebar(ctx, ADDRESS, { ownKind: 'ide-toolwindows', kind: 'text' })
  assert.equal(opened, true)
  assert.equal(calls[0].options.kind, 'text')
})

test('openInDefaultSidebar falls back to the ranked kind when the named viewer refuses', () => {
  const calls = []
  const ctx = {
    sidebarRightTabs: { candidates: () => [{ kind: 'ide-toolwindows' }, { kind: 'editor' }] },
    sidebarRight: {
      openResource: (address, options) => {
        calls.push(options.kind)
        if (options.kind === 'text') throw new Error('no text viewer')
      },
    },
  }
  const opened = openInDefaultSidebar(ctx, ADDRESS, { ownKind: 'ide-toolwindows', kind: 'text' })
  assert.equal(opened, true)
  assert.deepEqual(calls, ['text', 'editor'])
})

test('openInDefaultSidebar declines its own address when candidates are unavailable', () => {
  let released = 0
  const calls = []
  const ctx = {
    sidebarRight: { openResource: (address, options) => { calls.push({ address, options }) } },
  }
  const opened = openInDefaultSidebar(ctx, ADDRESS, {
    ownKind: 'ide-toolwindows',
    suppressSelf: () => { released += 1; return () => { released += 1 } },
  })
  assert.equal(opened, true)
  assert.equal(released, 2)
  assert.equal(calls[0].options.kind, undefined)
})

test('openInDefaultSidebar reports failure without a sidebar service', () => {
  assert.equal(openInDefaultSidebar({}, ADDRESS, { ownKind: 'ide-toolwindows' }), false)
})
