/**
 * JetBrains status colouring: classification and recursive directory rollup.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { aggregateStatus, fileStatusKind, statusClass } from '../src/client/git-colors.js'

test('classifies the IDEA highlight states', () => {
  assert.equal(fileStatusKind({ xy: '??', untracked: true }), 'untracked')
  assert.equal(fileStatusKind({ xy: 'A.', staged: true }), 'added')
  assert.equal(fileStatusKind({ xy: '.M' }), 'modified')
  assert.equal(fileStatusKind({ xy: 'M.' , staged: true }), 'modified')
  assert.equal(fileStatusKind({ xy: 'MD' }), 'deleted')
  assert.equal(fileStatusKind({ xy: 'D.' }), 'deleted')
  assert.equal(fileStatusKind({ xy: 'UU', conflict: true }), 'conflict')
  assert.equal(fileStatusKind({ xy: '!!', ignored: true }), 'ignored')
  assert.equal(fileStatusKind({ xy: '..' }), null)
  assert.equal(fileStatusKind(undefined), null)
})

test('class maps to the JetBrains colour classes', () => {
  assert.equal(statusClass('untracked'), 'iwb-git-untracked')
  assert.equal(statusClass('added'), 'iwb-git-added')
  assert.equal(statusClass('modified'), 'iwb-git-modified')
  assert.equal(statusClass('conflict'), 'iwb-git-conflict')
  assert.equal(statusClass('ignored'), 'iwb-git-ignored')
  assert.equal(statusClass(null), '')
})

test('a modified file wins over an untracked sibling (conflict > modified > added > untracked)', () => {
  const rollup = aggregateStatus([
    { path: 'src/new.ts', xy: '??', untracked: true },
    { path: 'src/a.ts', xy: '.M' },
  ])
  assert.equal(rollup.dirs.get('src'), 'modified')
  assert.equal(rollup.files.get('src/new.ts'), 'untracked')
  assert.equal(rollup.files.get('src/a.ts'), 'modified')
})

test('a conflict escalates every ancestor', () => {
  const rollup = aggregateStatus([
    { path: 'pkg/ui/main.ts', xy: 'UU', conflict: true },
    { path: 'pkg/ui/other.ts', xy: '??', untracked: true },
  ])
  assert.equal(rollup.dirs.get('pkg'), 'conflict')
  assert.equal(rollup.dirs.get('pkg/ui'), 'conflict')
  assert.equal(rollup.conflictDirs.has('pkg/ui'), true)
})

test('ignored entries colour nothing and are exposed as a set', () => {
  const rollup = aggregateStatus([
    { path: 'dist/bundle.js', xy: '!!', ignored: true },
    { path: 'dist/keep.ts', xy: '.M' },
  ])
  assert.equal(rollup.ignored.has('dist/bundle.js'), true)
  assert.equal(rollup.files.has('dist/bundle.js'), false)
  assert.equal(rollup.dirs.get('dist'), 'modified')
})

test('an ignored-only directory gets no colour', () => {
  const rollup = aggregateStatus([{ path: 'dist/out.js', xy: '!!', ignored: true }])
  assert.equal(rollup.dirs.get('dist'), undefined)
})

test('the root itself is never a colour key (paths are relative)', () => {
  const rollup = aggregateStatus([{ path: 'a.ts', xy: '.M' }])
  assert.equal(rollup.dirs.size, 0)
  assert.equal(rollup.files.get('a.ts'), 'modified')
})
