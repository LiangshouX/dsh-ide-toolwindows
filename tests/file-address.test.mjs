import test from 'node:test'
import assert from 'node:assert/strict'
import {
  basenameOfFileAddress,
  isFileAddress,
  isIdeViewableAddress,
  parseFileAddress,
  resolveFileAddress,
} from '../src/client/file-address.js'

test('parses a session-scoped file address', () => {
  const parsed = parseFileAddress('dsh-resource://file/session/s1/src/main.ts')
  assert.deepEqual(parsed, { scope: 'session', sessionId: 's1', path: 'src/main.ts' })
  assert.equal(isFileAddress('dsh-resource://file/session/s1/src/main.ts'), true)
  assert.equal(isFileAddress('sidebar://ide-toolwindows'), false)
})

test('decodes encoded segments and ignores query/fragment suffixes', () => {
  const parsed = parseFileAddress('dsh-resource://file/session/s1/src/my%20file.ts#L24')
  assert.deepEqual(parsed, { scope: 'session', sessionId: 's1', path: 'src/my file.ts' })
  assert.equal(basenameOfFileAddress('dsh-resource://file/session/s1/src/my%20file.ts'), 'my file.ts')
})

test('parses absolute and UNC file addresses', () => {
  assert.deepEqual(
    parseFileAddress('dsh-resource://file/absolute/C:/work/a.ts'),
    { scope: 'absolute', path: 'C:/work/a.ts' },
  )
  assert.deepEqual(
    parseFileAddress('dsh-resource://file/absolute//server/share/a.ts'),
    { scope: 'absolute', path: '//server/share/a.ts' },
  )
  assert.deepEqual(
    parseFileAddress('dsh-resource://file/absolute/home/me/a.ts'),
    { scope: 'absolute', path: '/home/me/a.ts' },
  )
})

test('rejects malformed addresses', () => {
  assert.equal(parseFileAddress('dsh-resource://file/other/x'), undefined)
  assert.equal(parseFileAddress('dsh-resource://file/session/'), undefined)
  assert.equal(parseFileAddress('dsh-resource://file/session/s1/%ZZ'), undefined)
  assert.equal(parseFileAddress(''), undefined)
})

test('resolves relative session paths with the workspace separator', () => {
  const parsed = parseFileAddress('dsh-resource://file/session/s1/src/main.ts')
  assert.equal(resolveFileAddress(parsed, 'C:\\work\\demo'), 'C:\\work\\demo\\src\\main.ts')
  assert.equal(resolveFileAddress(parsed, 'C:/work/demo'), 'C:/work/demo/src/main.ts')
  assert.equal(resolveFileAddress(parsed, '/home/me'), '/home/me/src/main.ts')
})

test('resolves dot segments and absolute paths', () => {
  const relative = parseFileAddress('dsh-resource://file/session/s1/src/../lib/a.ts')
  assert.equal(resolveFileAddress(relative, 'C:\\work\\demo'), 'C:\\work\\demo\\lib\\a.ts')
  const absolute = parseFileAddress('dsh-resource://file/session/s1/C:/other/a.ts')
  assert.equal(resolveFileAddress(absolute, 'C:\\work\\demo'), 'C:\\other\\a.ts')
  const outside = parseFileAddress('dsh-resource://file/absolute/D:/outside/a.ts')
  assert.equal(resolveFileAddress(outside, 'C:\\work\\demo'), 'D:\\outside\\a.ts')
})

test('claims text and images but leaves office/binary formats to the sidebar', () => {
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/src/a.ts'), true)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/README.md'), true)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/logo.png'), true)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/report.pdf'), false)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/sheet.xlsx'), false)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/spec.docx'), false)
  assert.equal(isIdeViewableAddress('dsh-resource://file/session/s1/LICENSE'), true)
})
