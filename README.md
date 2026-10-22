# dsh-ide-toolwindows

**IDE Tool Windows** — a JetBrains-style tool-window suite for DeepSeek Harness:
**Project · Commit · Terminal · Git**, four windows sharing one live repository
model, around an editor area this plugin owns (so Preview / Pinned tabs behave
exactly like an IDE).

## What's new in 0.3 (JetBrains pass)

- **Project**: click selects, double click opens/expands; multi-select; inline rename (F2),
  delete (Delete), duplicate (F5), move (F6), cut/copy/paste, drag & drop (Ctrl = copy),
  New File/Directory, Favorites, JetBrains status colors with recursive folder tinting,
  ignored/excluded files, glyph-only brand file icons.
- **Commit**: two groups (`Changes` / `Unversioned`), checkbox = include in commit without
  moving rows, changelists, group by directory, Change View with *Show Diff with*, and
  optional pre-commit commands (tests / cleanup / import optimization).
- **Git**: details in a bottom pane (single click) while the editor only shows the diff;
  file list per commit; path-scoped history from the Project tree; two-commit Compare
  (Ctrl+click); collapsed unchanged blocks; word-level highlighting; read-only commit diffs.
- **Layout/status bar**: click to show/hide tool windows (Project and Commit are mutually
  exclusive), Hide All, full screen, cursor position and encoding/EOL in the status bar.
- Specs: [V2 PRD](docs/PRD-v2.md) · [V1 PRD (archive)](docs/PRD-v1.md).

## What you get

| Tool window | Shortcut | Behavior |
|---|---|---|
| **Project** | `Alt+1` | Lazy file tree with JetBrains status colors (red unversioned, green added, blue modified, recursive folder tinting) and **glyph-only brand icons**. The project-name dropdown selects the **IDE project root**. Single click selects, double click opens/expands; Ctrl/Shift multi-select; F2 rename, Delete, F5 duplicate, F6 move, Ctrl+X/C/V, drag & drop (Ctrl = copy), New File/Directory, Favorites. Right-click menus show shortcut hints. |
| **Editor** | — | Files open **read-only by default**. Text tabs toggle between read-only and **edit** (CodeMirror 6 with syntax highlighting); `Ctrl+S` saves, restore discards, a dot marks unsaved changes, and closing a dirty tab asks first. |
| **Markdown** | — | Markdown opens **rendered with the harness's own `MarkdownText`** (same typography/tables/task lists/code cards as DSH chat), with a **document outline** button for heading navigation. A Preview / Source switch flips to the raw document. |
| **Commit** | `Alt+0` | `Changes` / `Unversioned Files`; the checkbox means "include in this commit" and never moves a row. Changelists, group by directory, Change View (Working Tree / Last Revision / Latest) with Jump to Source and Revert, line/hunk staging, optional pre-commit commands, recent messages, `Amend`, `Commit` / `Commit and Push`. |
| **Terminal** | `Alt+F12` | Real PTY sessions over a WebSocket, rendered with xterm.js. New / rename / close (with a running-task confirmation), shell profiles, UTF-8 environment, copy-on-select, `Ctrl+Shift+V` paste. |
| **Git** | `Alt+9` | Lazily paged commit table with a lane **commit graph**; branch / author / message / path filters; details in the bottom pane (metadata, message, changed files — click a file for its diff) while the editor shows only the full diff; two-commit Compare via Ctrl+click; collapsed unchanged blocks and word-level highlighting; copy SHA, checkout, revert, per-commit file diffs. |
| **Commit message** | `Ctrl+K` | Opens Commit and focuses the message box (IDEA parity). |
| **Push** | `Ctrl+Shift+K` | Pushes the current branch from inside the workbench. |

Every shortcut can be rebound in **Settings → IDE Tool Windows**.

### Workspace vs. IDE project root

A DSH workspace is often a container: the root itself is not a Git repository,
while one or more first-level folders are. The IDE Project can be pointed at
any of them:

- Click the project-name dropdown in the Project panel header (or the workspace
  menu → **Select IDE project**).
- Pick the workspace root or a first-level folder. Folders with a `.git` entry
  show a **Git** badge; hidden folders and `node_modules` are not listed.
- The Project tree, Git/Commit data, new terminal sessions and saved tab state
  all switch to that folder. The selection is remembered **per workspace** in
  `settings.json` (`projectRoots`) and restored on the next launch/page reload.
- If the current folder is not a repository, the Project picker, Git window,
  Commit window and empty-editor welcome show a shortcut to choose a Git
  subproject.

## How it fits the harness

- One `sidebar.panellist` icon and one `main` panel page host the whole
  workbench; the four tool windows are docked inside it (left stripe for
  Project/Commit, bottom dock for Terminal/Git, resizable).
- Git is the **system CLI** (argv arrays, never shell strings), so credential
  managers, hooks and your git config all work. Paths are parsed from
  `status --porcelain=v2 -z`, `diff --numstat -z`, and a `log` record stream.
- Files are read and written through a path-fenced `fs` API; saves are atomic
  and preserve the file's original encoding (UTF-8/BOM/UTF-16) and line endings.
  Every HTTP/WebSocket route is admitted by the same Connection fence as `/api`.
- Settings (shortcuts, shell profile, git path, UI geometry, per-workspace
  expanded folders and open tabs) persist in the DSH home at
  `ide-toolwindows/settings.json` (`$DSH_HOME` / `~/.dsh`; the profile
  directory when the host exports `DSH_PROFILE_DIR`).
- UI is rendered with React and styled exclusively with `--dsw-alias-*` theme
  tokens, so light/dark and skins follow the harness.

## What V1 does not do

- No file creation / rename / delete from the tree (V2).
- Markdown previews do not rewrite relative images/links to local files yet;
  external http(s) images work through the host's renderer.
- The project-root picker lists the workspace root plus **first-level** folders
  only; it does not recursively discover repositories.
- No interactive rebase, merge-conflict 3-way editor, stash, blame, fetch/pull.
- Terminal sessions do not survive closing the workbench panel (the PTY ends
  with the panel); DSH restart never restores them.
- The host stripe icon cannot show a numeric badge, so badges live on the
  workbench's own stripe.

## Install (local)

```sh
# from the package directory (already linked in this workspace)
dsh plugin install /absolute/path/to/dsh-ide-toolwindows
```

or use DSH Settings → Plugins → install from a directory. Install depends on
`ws` (host PTY transport); the client is a prebuilt single file
(`dist/client.js`, xterm bundled).

## Install from GitHub

Repository: <https://github.com/LiangshouX/dsh-ide-toolwindows>

```sh
git clone https://github.com/LiangshouX/dsh-ide-toolwindows.git
cd dsh-ide-toolwindows
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
