import test from 'node:test'
import assert from 'node:assert/strict'
import { fileTypeOf, isMarkdownFile } from '../src/client/file-types.js'

test('classifies the common IDE file types', () => {
  assert.equal(fileTypeOf('Main.java'), 'java')
  assert.equal(fileTypeOf('Main.JAVA'), 'java')
  assert.equal(fileTypeOf('app.tsx'), 'tsx')
  assert.equal(fileTypeOf('app.ts'), 'ts')
  assert.equal(fileTypeOf('README.md'), 'markdown')
  assert.equal(fileTypeOf('script.py'), 'python')
  assert.equal(fileTypeOf('main.go'), 'go')
  assert.equal(fileTypeOf('lib.rs'), 'rust')
  assert.equal(fileTypeOf('package.json'), 'json')
  assert.equal(fileTypeOf('index.html'), 'html')
  assert.equal(fileTypeOf('style.scss'), 'css')
  assert.equal(fileTypeOf('query.sql'), 'sql')
  assert.equal(fileTypeOf('run.ps1'), 'shell')
  assert.equal(fileTypeOf('config.yaml'), 'config')
  assert.equal(fileTypeOf('photo.PNG'), 'image')
  assert.equal(fileTypeOf('archive.tar.gz'), 'archive')
  assert.equal(fileTypeOf('LICENSE'), 'file')
})

test('classifies special file names before extensions', () => {
  assert.equal(fileTypeOf('.env.local'), 'env')
  assert.equal(fileTypeOf('.gitignore'), 'git')
  assert.equal(fileTypeOf('Dockerfile'), 'docker')
  assert.equal(fileTypeOf('docker-compose.yml'), 'docker')
  assert.equal(fileTypeOf('package-lock.json'), 'lock')
  assert.equal(fileTypeOf('Makefile'), 'build')
})

test('markdown detection', () => {
  assert.equal(isMarkdownFile('README.md'), true)
  assert.equal(isMarkdownFile('doc.MARKDOWN'), true)
  assert.equal(isMarkdownFile('main.ts'), false)
})
