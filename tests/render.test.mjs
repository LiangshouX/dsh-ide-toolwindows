import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdir, rm } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// A tiny DOM surface is enough for module-level browser references; SSR itself
// does not touch it because no effects run.
globalThis.window = {
  innerWidth: 1440,
  innerHeight: 900,
  location: { href: 'http://localhost/' },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.self = globalThis.window
const elementStub = () => ({
  style: {}, dataset: {}, classList: { add() {}, remove() {}, contains: () => false },
  setAttribute() {}, removeAttribute() {}, remove() {}, appendChild() {}, insertBefore() {},
  addEventListener() {}, removeEventListener() {}, getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
  querySelector: () => null, querySelectorAll: () => [], closest: () => null,
  getContext: () => null,
})
globalThis.document = {
  baseURI: 'http://localhost/',
  documentElement: { ...elementStub(), style: {} },
  head: { appendChild() {} },
  body: { style: {}, appendChild() {}, removeChild() {} },
  createElement: elementStub,
  createElementNS: elementStub,
  createTextNode: () => ({ style: {}, remove() {} }),
  createRange: () => ({ setStart() {}, setEnd() {}, getBoundingClientRect: () => ({ top: 0, left: 0 }), getClientRects: () => [] }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {},
  removeEventListener() {},
}
globalThis.window.getComputedStyle = () => ({ getPropertyValue: () => '', fontSize: '13px' })
globalThis.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
globalThis.window.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0)
globalThis.window.cancelAnimationFrame = (handle) => clearTimeout(handle)
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { clipboard: { writeText: async () => {}, readText: async () => '' } },
})
globalThis.ResizeObserver = class { observe() {} disconnect() {} }

let modulePromise

async function loadModule() {
  if (modulePromise !== undefined) return modulePromise
  modulePromise = (async () => {
    // The bundle must live inside the package so Node resolves react and
    // react-dom from this package's node_modules (externalized below).
    const dir = join(root, '.render-tmp')
    await mkdir(dir, { recursive: true })
    const outfile = join(dir, 'entry.mjs')
    await rm(outfile, { force: true })
    await build({
      absWorkingDir: root,
      entryPoints: ['tests/render-entry.jsx'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: ['node20'],
      external: ['react', 'react-dom', 'react-dom/server', '@deepseek-ai/dsh-client-ui-primitives'],
      alias: {
        '@xterm/xterm': join(root, 'tests/stubs/xterm.js'),
        '@xterm/addon-fit': join(root, 'tests/stubs/addon-fit.js'),
      },
      loader: { '.css': 'text' },
      jsx: 'transform',
      define: { 'process.env.NODE_ENV': '"production"' },
      outfile,
      logLevel: 'silent',
    })
    const imported = await import(`${pathToFileURL(outfile).href}?t=${Date.now()}`)
    return imported
  })()
  return modulePromise
}

test('workbench renders the project window and welcome screen', async () => {
  const mod = await loadModule()
  const html = mod.renderProject()
  assert.match(html, /itw-root/)
  assert.match(html, /itw-stripe/)
  assert.match(html, /project\.title/)
  assert.match(html, /welcome\.title/)
  assert.match(html, /a\.ts/)
  assert.match(html, /src/)
})

test('commit and git windows render their rows and graph', async () => {
  const mod = await loadModule()
  const html = mod.renderCommitAndGit()
  assert.match(html, /itw-file-row/)
  assert.match(html, /a\.ts/)
  assert.match(html, /itw-git-row/)
  assert.match(html, /first/)
  assert.match(html, /<svg/)
  assert.match(html, /commit\.title/)
})

test('a preview tab renders italic and a code view', async () => {
  const mod = await loadModule()
  const html = mod.renderCode()
  assert.match(html, /itw-preview/)
  assert.match(html, /itw-code-line/)
  assert.match(html, /itw-tok-keyword/)
})

test('diff view renders selected-file rows', async () => {
  const mod = await loadModule()
  const html = mod.renderDiff()
  assert.match(html, /itw-diff-side/)
  assert.match(html, /itw-diff-hunk/)
  assert.match(html, /itw-diff-toolbar/)
})

test('diff component renders unified mode with hunk actions', async () => {
  const mod = await loadModule()
  const html = mod.renderDiffComponent()
  assert.match(html, /itw-diff-hunk/)
  assert.match(html, /commit\.stageAll/)
})

test('markdown preview renders the fallback document and outline', async () => {
  const mod = await loadModule()
  const html = mod.renderMarkdown()
  assert.match(html, /itw-markdown/)
  assert.match(html, /Sample Doc/)
  assert.match(html, /itw-outline/)
  assert.match(html, /itw-outline-item/)
  assert.match(html, /editor\.preview/)
  assert.match(html, /editor\.source/)
  assert.match(html, /editor\.edit/)
})

test('edit mode renders save/restore and the dirty marker', async () => {
  const mod = await loadModule()
  const html = mod.renderMarkdownEdit()
  assert.match(html, /itw-codemirror/)
  assert.match(html, /itw-tab-dirty/)
  assert.match(html, /editor\.save/)
  assert.match(html, /editor\.restore/)
  assert.match(html, /editor\.dirty/)
})
