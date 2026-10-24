# dsh-ide-workbench

**IDE Workbench** — a JetBrains-style IDE workbench for DeepSeek Harness (DSH):
**Project · Commit · Terminal · Git** tool windows around an editor area this
plugin owns, all sharing one live repository model. Preview / Pinned tab
semantics are fully controlled, and the keyboard workflow follows IDEA.

> 中文: [README.md](README.md)（主文档）

## Features at a glance

| Tool window / area | Shortcut | Behavior |
|---|---|---|
| **Project** | `Alt+1` | Lazy file tree; JetBrains status colors (red untracked, green added, blue modified, recursive folder tinting); glyph-only brand icons; single click selects, double click opens/expands; Ctrl/Shift multi-select; F2 rename, Delete delete (to trash first, with a second confirmation when trashing fails), F5 duplicate, F6 move, Ctrl+X/C/V, drag & drop (Ctrl = copy); New File/Directory; Favorites; tree filter (directory filter / whole-project file-name search modes); right-click menus show shortcut hints |
| **Editor** | — | Files open **read-only by default**; open mode is configurable (auto / always editable / always read-only); in auto mode texts up to **1 MiB** open editable (CodeMirror 6 with syntax highlighting), larger files stay read-only; `Ctrl+S` saves, restore discards, a dot marks unsaved changes, closing a dirty tab asks once (save / discard / cancel); stale-file conflict warnings when another program edits the file; find/replace bar; atomic saves preserving the original encoding (UTF-8 / BOM / UTF-16) and line endings |
| **Markdown** | — | Rendered with the harness's own `MarkdownText` (same typography / tables / task lists / code cards as DSH chat); document outline button; Preview / Source switch |
| **Search** | `Ctrl+P` / `Ctrl+Shift+F` | Quick Open finds files by name project-wide; Find in Files (git grep) opens hits as an editor tab at the right line; `Ctrl+Alt+F` fallback when the shell reserves `Ctrl+Shift+F` |
| **Commit** | `Alt+0` | `Changes` / `Unversioned` groups; the checkbox means "include in this commit" and never moves a row; changelists; group by directory; Change View (Working Tree / Last Revision / Latest) with Jump to Source and Revert; line/hunk staging; optional pre-commit commands; recent messages; Amend; `Commit` / `Commit and Push` |
| **Terminal** | `Alt+F12` | Real PTY sessions over WebSocket with xterm.js; new / rename / close (with a running-task confirmation); shell profiles; UTF-8 environment; copy-on-select; `Ctrl+Shift+V` paste |
| **Git** | `Alt+9` | Lazily paged commit table with a lane commit graph; branch / author / message / path filters; single click = bottom details in a right-side Drawer (metadata, message, changed files — click a file for its diff) while the editor shows only the full diff; two-commit Compare via Ctrl+click; collapsed unchanged blocks and word-level highlighting; copy SHA, checkout, revert, per-commit file diffs; path-scoped history from the Project tree |
| **Commit message** | `Ctrl+K` | Opens Commit and focuses the message box (IDEA parity) |
| **Push** | `Ctrl+Shift+K` | Pushes the current branch from inside the workbench |

Every shortcut can be rebound in **Settings → IDE Workbench**.

### Editor area and layout

- Tab model: Preview tabs are reused, double click pins them; diff / commit tabs
  carry their own toolbar; leaving the workbench panel keeps terminal sessions
  and scrollback (switching conversations does not kill the PTY).
- The workbench fullscreen button and `F11` switch the sidebar panel between
  fullscreen and the docked presentation, keeping tabs and splits.
- Panes ≥560 px stay side by side (Project/Commit left, editor right,
  Git/Terminal below the editor); narrower panes stack vertically with the
  Project/Commit and Git/Terminal groups mutually exclusive, focusing content.
- The status bar shows cursor position and encoding / EOL.

### External IDE integration

- Right-click a file in the Project tree or an editor file tab, hover
  **Open in IDE**, and choose **IntelliJ IDEA**, **WebStorm**, or **Visual Studio Code**.
- Settings → IDE Workbench → External IDEs accepts separate executable paths;
  empty enables auto-detection (on Windows this includes `idea64.exe`,
  `webstorm64.exe`, `Code.exe` and a scan of the JetBrains install directory).
- External IDEs open the saved file on disk. Save pending workbench edits first.
  Launch failures show their reason.

## Workspace vs. IDE project root

A DSH workspace is often a container: the root itself is not a Git repository,
while one or more first-level folders are. The project-name dropdown in the
Project panel header picks the workspace root or any first-level folder
(folders with a `.git` entry show a Git badge; hidden folders and `node_modules`
are not listed). The selection is remembered per workspace (`projectRoots`), and
switching it moves the Project tree, Git/Commit data, new terminal cwds and the
saved tab state together. Outside a repository, all four windows offer a
shortcut to pick a Git subproject.

## How it fits the harness

- **Entries**: the conversation header button, the `Ctrl+N` new-session row and
  a persistent sidebar footer action all open the workbench (a native
  `sidebar.right.pane.tab` beside the conversation; the footer entry stays
  reachable when a skin hides the header utilities).
- **Session continuity**: sessions in one DSH workspace share one workbench
  state — switching sessions (including a new one) keeps the file tree, open
  files and Git context, and the workbench reopens in the arriving session when
  it was visible in the one being left. Switching conversations (panels) does
  not kill the terminal; switching Sessions rebuilds the terminal process and
  editor undo stacks.
- **Chat file links**: user `@` references and assistant Markdown links open in
  the workbench by default, revealing the file in the tree at `#L24`; links
  outside the workspace fall back to DSH's own sidebar; a link inside the
  workspace but outside the current IDE project asks before widening the IDE
  project to the workspace root. Settings → IDE Workbench → Chat file links
  switches back to DSH's sidebar entirely.
- **Sidebar preview fallback**: right-click a file or tab → Open in sidebar tab
  to view it with DSH's own preview; HTML files also show two floating actions —
  preview in the DSH sidebar (globe) or open in the OS default browser.
- **Theming**: styled exclusively with `--dsw-alias-*` tokens, so light/dark
  and skins follow the harness.

## Safety and data

- Git runs the **system CLI** (argv arrays, never shell strings), so credential
  managers, hooks and your git config all work; paths are parsed from
  `status --porcelain=v2 -z`, `diff --numstat -z` and a `log` record stream.
- Files are read and written through a path-fenced `fs` API; saves are atomic
  and preserve the original encoding and line endings.
- Every HTTP/WebSocket route is admitted by the same Connection fence as `/api`.
- Settings (shortcuts, shell profile, git path, open mode, UI geometry,
  per-workspace expanded folders and open tabs) persist in
  `$DSH_HOME/ide-workbench/settings.json` (`~/.dsh`; the profile directory when
  the host exports `DSH_PROFILE_DIR`).

## Known limitations

- The project-root picker lists the workspace root plus **first-level** folders
  only; it does not recursively discover repositories.
- A DSH restart never restores terminal sessions (the PTY ends with the process).
- The host stripe icon cannot show a numeric badge (badges live on the
  workbench's own stripe).
- Markdown previews do not rewrite relative images/links to local files yet
  (external http(s) images work through the host's renderer).
- Out of scope: interactive rebase, merge-conflict 3-way editor, stash, blame,
  fetch/pull, split terminals.
- `Ctrl+Shift+F` may be swallowed by DSH/Chromium → the `Ctrl+Alt+F` fallback.

## Install

From a local directory:

```sh
dsh plugin install /absolute/path/to/dsh-ide-workbench
```

or use DSH Settings → Plugins → install from a directory. The only runtime
dependency is `ws` (host PTY transport); the client is a prebuilt single file
(`dist/client.js`, xterm bundled).

From GitHub:

```sh
git clone https://github.com/LiangshouX/dsh-ide-workbench.git
cd dsh-ide-workbench
npm install --omit=dev    # only the host runtime dependency (ws)
dsh plugin install .
```

The repository ships the built client, so no client build step is needed.
Use `npm install` (without `--omit=dev`) only when developing.

## Development

```sh
npm install
npm run build      # bundles src/client into dist/client.js (React external)
npm test           # host git/diff/graph + SSR render smoke tests
```

Source layout:

```
src/index.js            Host half: fenced HTTP API + terminal WebSocket
src/host/git.js         git CLI adapter, status/log/numstat parsers
src/host/workspace.js   path fence, tree listing, file preview, shells
src/host/settings-store.js  durable JSON settings
src/client/             Workbench UI (store, panels, diff, graph, xterm)
```

## License

MIT. xterm.js and ws are bundled/resolved under their own MIT licenses.
