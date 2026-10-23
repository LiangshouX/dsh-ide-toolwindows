import test from 'node:test'
import assert from 'node:assert/strict'
import {
  basenameOfFileAddress,
  fileAddressFor,
  fileUrlForPath,
  isFileAddress,
  isIdeViewableAddress,
  parseFileAddress,
  resolveFileAddress,
  sessionFileAddress,
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

test('builds session-scoped addresses for relative, inside and outside paths', () => {
  assert.equal(
    sessionFileAddress('s1', 'src/my file.ts'),
    'dsh-resource://file/session/s1/src/my%20file.ts',
  )
  assert.equal(
    fileAddressFor('s1', 'C:\\work\\demo', 'C:\\work\\demo\\src\\a.ts'),
    'dsh-resource://file/session/s1/src/a.ts',
  )
  assert.equal(
    fileAddressFor('s1', 'C:\\work\\demo', 'C:\\other\\a.ts'),
    'dsh-resource://file/session/s1/C:/other/a.ts',
  )
  assert.equal(
    fileAddressFor('s1', 'C:\\work\\demo', 'D:\\outside\\a.ts'),
    'dsh-resource://file/session/s1/D:/outside/a.ts',
  )
})

test('builds file URLs for drive, POSIX and UNC paths', () => {
  assert.equal(fileUrlForPath('C:\\work\\a.html'), 'file:///C:/work/a.html')
  assert.equal(fileUrlForPath('C:\\work\\a b.html'), 'file:///C:/work/a%20b.html')
  assert.equal(fileUrlForPath('/home/me/a.html'), 'file:///home/me/a.html')
  assert.equal(fileUrlForPath('\\\\server\\share\\a.html'), 'file://server/share/a.html')
})
