/**
 * File-type classification for the Project tree, editor tabs and Commit rows.
 * Kept dependency-free so it is unit-testable and cheap to call per row.
 */

/**
 * Visual family of one file name.
 * @param {string} name file name or path
 * @returns {string} a kind consumed by `FileTypeIcon`
 */
export function fileTypeOf(name) {
  const lower = String(name ?? '').toLowerCase()
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.') || lower === 'docker-compose.yml' || lower === 'docker-compose.yaml') return 'docker'
  if (lower === '.gitignore' || lower === '.gitattributes' || lower === '.gitmodules' || lower === '.gitkeep') return 'git'
  if (lower === '.env' || lower.startsWith('.env.')) return 'env'
  if (lower === 'package-lock.json' || lower === 'yarn.lock' || lower === 'pnpm-lock.yaml' || lower.endsWith('.lock')) return 'lock'
  if (lower === 'makefile' || lower === 'cmakelists.txt') return 'build'
  const dot = lower.lastIndexOf('.')
  const ext = dot < 0 ? '' : lower.slice(dot)
  switch (ext) {
    case '.java': return 'java'
    case '.ts': case '.mts': case '.cts': return 'ts'
    case '.tsx': return 'tsx'
    case '.js': case '.mjs': case '.cjs': return 'js'
    case '.jsx': return 'jsx'
    case '.py': case '.pyw': case '.pyi': return 'python'
    case '.go': return 'go'
    case '.rs': return 'rust'
    case '.json': case '.jsonc': case '.json5': return 'json'
    case '.md': case '.markdown': case '.mdx': return 'markdown'
    case '.html': case '.htm': return 'html'
    case '.css': case '.scss': case '.sass': case '.less': return 'css'
    case '.sql': return 'sql'
    case '.sh': case '.bash': case '.zsh': case '.fish': case '.ps1': case '.psm1': case '.bat': case '.cmd': return 'shell'
    case '.yml': case '.yaml': case '.toml': case '.ini': case '.properties': case '.conf': return 'config'
    case '.png': case '.jpg': case '.jpeg': case '.gif': case '.webp': case '.bmp': case '.ico': case '.avif': return 'image'
    case '.svg': return 'svg'
    case '.pdf': return 'pdf'
    case '.zip': case '.tar': case '.gz': case '.tgz': case '.7z': case '.rar': case '.bz2': case '.xz': return 'archive'
    case '.c': case '.h': return 'c'
    case '.cpp': case '.cc': case '.cxx': case '.hpp': case '.hh': case '.hxx': return 'cpp'
    case '.cs': return 'csharp'
    case '.rb': return 'ruby'
    case '.php': return 'php'
    case '.kt': case '.kts': return 'kotlin'
    case '.swift': return 'swift'
    case '.vue': return 'vue'
    case '.xml': case '.xsl': case '.xsd': case '.plist': return 'xml'
    case '.log': return 'log'
    default: return 'file'
  }
}

/** Whether a file should open in the rendered Markdown view by default. */
export function isMarkdownFile(name) {
  return /\.(md|markdown|mdx)$/i.test(String(name ?? ''))
}
