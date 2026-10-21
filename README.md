# dsh-ide-toolwindows

**IDE Tool Windows** — a JetBrains-style tool-window suite for DeepSeek Harness:
**Project · Commit · Terminal · Git**, four windows sharing one live repository
model, around an editor area this plugin owns (so Preview / Pinned tabs behave
exactly like an IDE).

## What you get

| Tool window | Shortcut | Behavior |
|---|---|---|
| **Project** | `Alt+1` | Lazy file tree with Git status coloring (blue modified, green added/untracked, red conflict) and **per-type icons** (Java coffee cup, JS/TS, Python, Markdown, JSON, SQL, shell, images…). Single click opens a **preview tab** (italic, reused by every further click); double click **pins** it. Right-click: copy relative/absolute name, reveal in Explorer, refresh. |
| **Editor** | — | Files open **read-only by default**. Text tabs toggle between read-only and **edit** (CodeMirror 6 with syntax highlighting); `Ctrl+S` saves, restore discards, a dot marks unsaved changes, and closing a dirty tab asks first. |
| **Markdown** | — | Markdown opens **rendered with the harness's own `MarkdownText`** (same typography/tables/task lists/code cards as DSH chat), with a **document outline** button for heading navigation. A Preview / Source switch flips to the raw document. |
| **Commit** | `Alt+0` | `Staged Changes` / `Unstaged Changes` / `Unversioned Files` with per-file stage / unstage / discard, unified or side-by-side diff, **line-level and hunk-level staging**, recent-message dropdown, `Amend`, `Commit` and `Commit and Push`. The sidebar stripe badge is the unstaged file count. |
| **Terminal** | `Alt+F12` | Real PTY sessions over a WebSocket, rendered with xterm.js. New / rename / close (with a running-task confirmation), shell profiles, UTF-8 environment, copy-on-select, `Ctrl+Shift+V` paste. |
| **Git** | `Alt+9` | Lazily paged commit table (200 rows per page) with a lane **commit graph**, branch / author / message filters, full commit detail and diff, copy SHA, checkout (detached with confirmation), revert commit. |
| **Commit message** | `Ctrl+K` | Opens Commit and focuses the message box (IDEA parity). |
| **Push** | `Ctrl+Shift+K` | Pushes the current branch from inside the workbench. |

Every shortcut can be rebound in **Settings → IDE Tool Windows**.

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
