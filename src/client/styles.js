/**
 * One stylesheet for the whole workbench, inserted through the package-owned
 * `styles` builtin (removed with the Client run). Every surface uses the
 * `--dsw-alias-*` tokens with a neutral fallback, so the panel follows the
 * harness light/dark theme and transparent skins.
 */
export const CSS = `
.itw-root, .itw-settings {
  --itw-bg: var(--dsw-alias-bg-base, #15171c);
  --itw-panel: var(--dsw-alias-bg-layer-1, #1b1e24);
  --itw-panel-2: var(--dsw-alias-bg-layer-2, #22262e);
  --itw-overlay: var(--dsw-alias-bg-overlay, #262b34);
  --itw-border: var(--dsw-alias-border-l1, #2c313a);
  --itw-border-strong: var(--dsw-alias-border-l2, #3b424e);
  --itw-divider: var(--dsw-alias-border-l2, #3b424e);
  --itw-fg: var(--dsw-alias-label-primary, #d8dce3);
  --itw-muted: var(--dsw-alias-label-secondary, #8a93a1);
  --itw-accent: var(--dsw-alias-brand-primary, #4c9aff);
  --itw-error: var(--dsw-alias-state-error-primary, #e2686f);
  --itw-success: var(--dsw-alias-state-success-primary, #4fb477);
  --itw-warn: var(--dsw-alias-state-warn-primary, #d7a24a);
  --itw-sidebar: var(--dsw-specific-sidebar-fill, #181b21);
  --itw-mod: #4c9aff;
  --itw-add: #4fb477;
  --itw-del: #e2686f;
  --itw-conflict: #e2686f;
  /* JetBrains default VCS highlights (IntelliJ Light / Darcula semantics). */
  --itw-git-untracked: #e2686f;
  --itw-git-added: #4fb477;
  --itw-git-modified: #4c9aff;
  --itw-git-deleted: #e2686f;
  --itw-git-conflict: #f14c4c;
  --itw-git-ignored: #b08b4f;
  --itw-excluded-bg: rgba(176, 139, 79, .16);
  --itw-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei UI", "PingFang SC", sans-serif;
  --itw-mono: "JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, "Courier New", monospace;
}
.itw-root {
  container-type: inline-size;
  container-name: ide-workbench;
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--itw-bg);
  color: var(--itw-fg);
  font-family: var(--itw-font);
  font-size: 13px;
  line-height: 1.45;
  user-select: none;
  -webkit-app-region: no-drag;
}
.itw-root *, .itw-root *::before, .itw-root *::after { box-sizing: border-box; }
.itw-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.itw-root input, .itw-root textarea, .itw-root select { font: inherit; color: inherit; }
.itw-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.itw-root ::-webkit-scrollbar-thumb { background: var(--itw-border-strong); border-radius: 6px; border: 2px solid transparent; background-clip: content-box; }
.itw-root ::-webkit-scrollbar-thumb:hover { background: var(--itw-muted); border: 2px solid transparent; background-clip: content-box; }
.itw-root ::-webkit-scrollbar-track { background: transparent; }
.itw-root ::-webkit-scrollbar-corner { background: transparent; }

.itw-topbar {
  height: 36px; flex: 0 0 36px; display: flex; align-items: center; gap: 8px;
  padding: 0 10px; border-bottom: 1px solid var(--itw-border); background: var(--itw-panel);
  position: relative; z-index: 6;
}
.itw-topbar button { position: relative; z-index: 7; }
.itw-project-select {
  display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px;
  border-radius: 6px; max-width: 320px; min-width: 0; cursor: pointer;
}
.itw-project-select:hover { background: rgba(127, 127, 127, .12); }
.itw-project-select .itw-project-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-project-select .itw-project-path { color: var(--itw-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-branch-chip {
  display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
  border: 1px solid var(--itw-border); border-radius: 999px; color: var(--itw-muted); font-size: 11.5px;
  max-width: 240px; overflow: hidden;
}
.itw-branch-chip .itw-branch-name { color: var(--itw-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-ahead { color: var(--itw-success); font-variant-numeric: tabular-nums; }
.itw-behind { color: var(--itw-warn); font-variant-numeric: tabular-nums; }
.itw-top-spacer { flex: 1; }
.itw-iconbtn {
  width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  color: var(--itw-muted);
}
.itw-iconbtn:hover { background: rgba(127, 127, 127, .14); color: var(--itw-fg); }
.itw-iconbtn:disabled { opacity: .4; cursor: default; }
.itw-iconbtn.itw-on { color: var(--itw-accent); }
.itw-textbtn {
  height: 26px; padding: 0 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--itw-border); color: var(--itw-fg); background: var(--itw-panel-2);
}
.itw-textbtn:hover { border-color: var(--itw-border-strong); }
.itw-textbtn.itw-primary { background: var(--itw-accent); border-color: transparent; color: #fff; }
.itw-textbtn.itw-primary:hover { filter: brightness(1.08); }
.itw-textbtn:disabled { opacity: .45; cursor: default; }
.itw-textbtn.itw-danger { color: var(--itw-error); }
.itw-textbtn.itw-danger-solid { background: var(--itw-error); color: #fff; border-color: transparent; }
.itw-textbtn.itw-small { height: 22px; padding: 0 8px; font-size: 11.5px; }

.itw-body { flex: 1; min-height: 0; display: flex; }
.itw-stripe {
  width: 44px; flex: 0 0 44px; background: var(--itw-sidebar); border-right: 1px solid var(--itw-border);
  display: flex; flex-direction: column; align-items: center; padding: 6px 0; gap: 4px;
}
.itw-stripe-spacer { flex: 1; }
.itw-stripe-btn {
  position: relative; width: 34px; height: 34px; border-radius: 7px; display: flex; align-items: center; justify-content: center;
  color: var(--itw-muted);
}
.itw-stripe-btn:hover { background: rgba(127, 127, 127, .12); color: var(--itw-fg); }
.itw-stripe-btn.itw-on { color: var(--itw-accent); background: rgba(76, 154, 255, .13); }
.itw-stripe-btn.itw-on::before {
  content: ''; position: absolute; left: -6px; top: 8px; bottom: 8px; width: 2px; border-radius: 2px; background: var(--itw-accent);
}
.itw-badge {
  position: absolute; top: 2px; right: 1px; min-width: 15px; height: 15px; padding: 0 4px;
  border-radius: 999px; background: var(--itw-accent); color: #fff; font-size: 10px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center; line-height: 1;
}
.itw-badge.itw-badge-dirty { background: var(--itw-success); }

.itw-left {
  position: relative; flex: 0 0 auto; min-width: 200px; max-width: 640px; display: flex; flex-direction: column;
  background: var(--itw-panel); border-right: 1px solid var(--itw-border);
}
.itw-left-resizer {
  position: absolute; top: 0; right: -3px; bottom: 0; width: 6px; cursor: col-resize; z-index: 5;
}
.itw-left-resizer:hover { background: rgba(76, 154, 255, .25); }
.itw-panel-header {
  height: 32px; flex: 0 0 32px; display: flex; align-items: center; gap: 6px; padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--itw-border); background: var(--itw-panel);
}
.itw-panel-title { font-size: 12px; font-weight: 700; letter-spacing: .02em; }
.itw-panel-sub { color: var(--itw-muted); font-size: 11px; }
.itw-project-sub-btn {
  display: flex; align-items: center; gap: 4px; min-width: 0; max-width: 64%; padding: 2px 5px;
  border-radius: 5px; color: var(--itw-muted); font-size: 11px; text-align: left;
}
.itw-project-sub-btn:hover { background: rgba(127, 127, 127, .12); color: var(--itw-fg); }
.itw-project-workspace-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 110px; }
.itw-project-sep { opacity: .55; }
.itw-project-sub-name { color: var(--itw-fg); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-project-current { color: var(--itw-accent); font-weight: 500; }
.itw-panel-header .itw-spacer { flex: 1; }
.itw-panel-body { flex: 1; min-height: 0; overflow: auto; position: relative; }

.itw-center { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--itw-bg); }
.itw-tabbar {
  height: 34px; flex: 0 0 34px; display: flex; align-items: stretch; border-bottom: 1px solid var(--itw-border);
  background: var(--itw-panel); overflow-x: auto; overflow-y: hidden; scrollbar-width: none;
}
.itw-tabbar::-webkit-scrollbar { height: 0; }
.itw-tab {
  display: flex; align-items: center; gap: 6px; padding: 0 8px 0 10px; min-width: 90px; max-width: 220px;
  border-right: 1px solid var(--itw-border); color: var(--itw-muted); position: relative; cursor: pointer; flex: 0 0 auto;
}
.itw-tab:hover { background: rgba(127, 127, 127, .07); }
.itw-tab.itw-active { background: var(--itw-bg); color: var(--itw-fg); }
.itw-tab.itw-active::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px; background: var(--itw-accent); }
.itw-tab .itw-tab-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
.itw-tab.itw-preview .itw-tab-name { font-style: italic; }
.itw-tab .itw-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--itw-muted); flex: 0 0 6px; }
.itw-tab.itw-preview .itw-tab-dot { background: var(--itw-accent); }
.itw-tab .itw-tab-dirty { width: 7px; height: 7px; border-radius: 50%; background: var(--itw-warn); flex: 0 0 7px; box-shadow: 0 0 0 2px rgba(215, 162, 74, .18); }
.itw-toolbar-dirty { color: var(--itw-warn); font-size: 10.5px; margin-left: 6px; }
.itw-tab .itw-tab-close {
  width: 18px; height: 18px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center;
  color: var(--itw-muted); opacity: 0; margin-left: auto; flex: 0 0 18px;
}
.itw-tab:hover .itw-tab-close, .itw-tab.itw-active .itw-tab-close { opacity: 1; }
.itw-tab .itw-tab-close:hover { background: rgba(127, 127, 127, .2); color: var(--itw-fg); }
.itw-tabbar-actions { display: flex; align-items: center; gap: 2px; padding: 0 6px; margin-left: auto; position: sticky; right: 0; background: var(--itw-panel); }

.itw-editor { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; overflow: hidden; }
.itw-editor-toolbar {
  height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 8px; padding: 0 10px;
  border-bottom: 1px solid var(--itw-border); background: var(--itw-bg); color: var(--itw-muted); font-size: 11.5px;
}
.itw-breadcrumb { display: flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; }
.itw-breadcrumb .itw-sep { opacity: .5; }
.itw-breadcrumb b { color: var(--itw-fg); font-weight: 600; }
.itw-editor-toolbar .itw-spacer { flex: 1; }
.itw-seg {
  display: inline-flex; border: 1px solid var(--itw-border); border-radius: 6px; overflow: hidden; background: var(--itw-panel);
}
.itw-seg button { height: 22px; padding: 0 8px; font-size: 11.5px; color: var(--itw-muted); }
.itw-seg button.itw-on { background: var(--itw-active-bg, rgba(76,154,255,.16)); color: var(--itw-fg); }
.itw-seg button + button { border-left: 1px solid var(--itw-border); }

.itw-code {
  flex: 1; min-height: 0; overflow: auto; font-family: var(--itw-mono); font-size: 12.5px; line-height: var(--itw-line, 20px);
  background: var(--itw-bg);
}
.itw-code-inner { position: relative; min-width: 100%; }
.itw-code-line { display: flex; align-items: flex-start; height: var(--itw-line, 20px); white-space: pre; }
.itw-code-line:hover { background: rgba(127, 127, 127, .055); }
.itw-ln {
  flex: 0 0 var(--itw-gutter, 52px); width: var(--itw-gutter, 52px); text-align: right; padding-right: 12px;
  color: var(--itw-muted); opacity: .65; font-variant-numeric: tabular-nums; user-select: none;
}
.itw-code-text { flex: 1; padding-right: 24px; tab-size: 4; }
.itw-tok-comment { color: #7a8596; font-style: italic; }
.itw-tok-string { color: #5f8f3f; }
.itw-tok-number { color: #b57a2a; }
.itw-tok-keyword { color: #a15fb0; }
.itw-tok-type { color: #2f8f83; }
.itw-tok-fn { color: #8a6a1f; }
.itw-tok-tag { color: #c05a63; }
.itw-tok-attr { color: #3f6f9f; }
.itw-editor-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--itw-muted); padding: 24px; text-align: center; }

.itw-codemirror { flex: 1; min-height: 0; min-width: 0; display: flex; }
.itw-codemirror .cm-content, .itw-codemirror .cm-line { user-select: text; }
.itw-codemirror > .cm-editor { flex: 1; min-width: 0; height: 100%; }
.itw-markdown-wrap { flex: 1; min-height: 0; min-width: 0; position: relative; display: flex; }
.itw-markdown {
  flex: 1; min-width: 0; overflow: auto; padding: 22px max(24px, calc((100% - 920px) / 2)) 80px;
  font-size: 13.5px; line-height: 1.72; color: var(--itw-fg); user-select: text;
}
.itw-markdown img { max-width: 100%; height: auto; }
.itw-markdown table { border-collapse: collapse; }
.itw-markdown .itw-markdown-fallback h1, .itw-markdown .itw-markdown-fallback h2, .itw-markdown .itw-markdown-fallback h3 { margin: 1.2em 0 .5em; }
.itw-markdown .itw-markdown-fallback p { margin: .7em 0; }
.itw-markdown .itw-markdown-fallback pre { background: var(--itw-panel); border: 1px solid var(--itw-border); border-radius: 7px; padding: 10px 12px; overflow: auto; }
.itw-markdown .itw-markdown-fallback code { font-family: var(--itw-mono); font-size: 11.5px; }
.itw-outline {
  position: absolute; top: 10px; right: 14px; width: 274px; max-height: min(62%, 520px); z-index: 12;
  display: flex; flex-direction: column; border-radius: 8px; border: 1px solid var(--itw-border-strong);
  background: var(--itw-overlay); box-shadow: 0 14px 40px rgba(0, 0, 0, .35); overflow: hidden;
}
.itw-outline-head { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 10px; color: var(--itw-muted); font-size: 11px; border-bottom: 1px solid var(--itw-border); }
.itw-outline-list { overflow: auto; padding: 4px; }
.itw-outline-item {
  display: block; width: 100%; text-align: left; padding: 4px 8px; border-radius: 5px;
  color: var(--itw-fg); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.itw-outline-item:hover { background: rgba(127, 127, 127, .14); }
.itw-outline-item.itw-active { background: rgba(76, 154, 255, .16); color: var(--itw-accent); }
.itw-outline-empty { padding: 14px; color: var(--itw-muted); font-size: 11.5px; text-align: center; }

.itw-welcome { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px; overflow: auto; }
.itw-welcome-card { max-width: 560px; width: 100%; }
.itw-welcome-title { font-size: 26px; font-weight: 700; letter-spacing: -.01em; margin: 0 0 6px; }
.itw-welcome-sub { color: var(--itw-muted); margin: 0 0 22px; font-size: 13px; }
.itw-welcome-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
.itw-welcome-action {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--itw-border);
  border-radius: 8px; background: var(--itw-panel); color: var(--itw-fg); text-align: left;
}
.itw-welcome-action:hover { border-color: var(--itw-border-strong); background: var(--itw-panel-2); }
.itw-welcome-action .itw-kbd { margin-left: auto; }
.itw-welcome-meta { display: flex; gap: 16px; color: var(--itw-muted); font-size: 12px; border-top: 1px solid var(--itw-border); padding-top: 14px; }
.itw-welcome-hint { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; padding: 8px 10px; border: 1px solid var(--itw-border); border-radius: 7px; color: var(--itw-muted); font-size: 12px; }
.itw-commit-hint { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 7px 10px; border-bottom: 1px solid var(--itw-border); color: var(--itw-muted); font-size: 11.5px; background: var(--itw-panel-2); }
.itw-kbd {
  display: inline-flex; align-items: center; height: 19px; padding: 0 6px; border-radius: 4px;
  border: 1px solid var(--itw-border-strong); border-bottom-width: 2px; background: var(--itw-panel-2);
  color: var(--itw-muted); font-size: 10.5px; font-family: var(--itw-mono); white-space: nowrap;
}

.itw-bottom {
  position: relative; flex: 0 0 auto; display: flex; flex-direction: column; min-height: 90px;
  border-top: 1px solid var(--itw-border); background: var(--itw-panel);
}
.itw-bottom-resizer {
  position: absolute; top: -3px; left: 0; right: 0; height: 6px; cursor: row-resize; z-index: 5;
}
.itw-bottom-resizer:hover { background: rgba(76, 154, 255, .22); }
.itw-bottom-tabs {
  height: 30px; flex: 0 0 30px; display: flex; align-items: stretch; gap: 2px; padding: 0 8px;
  border-bottom: 1px solid var(--itw-border); background: var(--itw-panel);
}
.itw-bottom-tab {
  display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border-radius: 6px 6px 0 0;
  color: var(--itw-muted); font-size: 12px; border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.itw-bottom-tab:hover { color: var(--itw-fg); background: rgba(127, 127, 127, .07); }
.itw-bottom-tab.itw-on { color: var(--itw-fg); border-bottom-color: var(--itw-accent); }
.itw-bottom-tab .itw-badge { position: static; margin-left: 2px; }
.itw-bottom-body { flex: 1; min-height: 0; display: flex; }
.itw-bottom-content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.itw-bottom-hidden { min-height: 0 !important; border-top: 0 !important; overflow: hidden; }
.itw-bottom-hidden .itw-bottom-body { display: none; }
.itw-term-hidden { display: none; }
.itw-bottom-close { margin-left: auto; align-self: center; }

.itw-statusbar {
  height: 22px; flex: 0 0 22px; display: flex; align-items: center; gap: 12px; padding: 0 10px;
  border-top: 1px solid var(--itw-border); background: var(--itw-sidebar); color: var(--itw-muted); font-size: 11px;
}
.itw-statusbar .itw-spacer { flex: 1; }
.itw-status-item { display: inline-flex; align-items: center; gap: 4px; }
.itw-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--itw-success); }
.itw-status-dot.itw-busy { background: var(--itw-warn); }

.itw-tree { padding: 4px 0 12px; font-size: 12.5px; }
.itw-tree-row {
  display: flex; align-items: center; gap: 5px; height: 22px; padding-right: 8px; white-space: nowrap;
  cursor: pointer; position: relative;
}
.itw-tree-row:hover { background: rgba(127, 127, 127, .1); }
.itw-tree-row.itw-selected { background: rgba(76, 154, 255, .18); }
.itw-tree:focus { outline: none; }
.itw-tree:focus-visible { outline: 1px solid rgba(76, 154, 255, .35); outline-offset: -1px; }
.itw-tree-twisty { width: 16px; flex: 0 0 16px; display: inline-flex; align-items: center; justify-content: center; color: var(--itw-muted); }
.itw-tree-name { overflow: hidden; text-overflow: ellipsis; }
.itw-tree-name.itw-dir { font-weight: 500; }
.itw-tree-row.itw-git-untracked .itw-tree-name { color: var(--itw-git-untracked); }
.itw-tree-row.itw-git-added .itw-tree-name { color: var(--itw-git-added); }
.itw-tree-row.itw-git-modified .itw-tree-name { color: var(--itw-git-modified); }
.itw-tree-row.itw-git-conflict .itw-tree-name { color: var(--itw-git-conflict); font-weight: 600; }
.itw-tree-row.itw-git-conflict .itw-tree-name::after { content: ' !'; color: var(--itw-git-conflict); font-weight: 700; }
.itw-tree-row.itw-git-deleted .itw-tree-name { color: var(--itw-git-deleted); text-decoration: line-through; }
.itw-tree-row.itw-git-ignored .itw-tree-name { color: var(--itw-git-ignored); }
.itw-tree-row.itw-git-ignored { opacity: .65; }
.itw-tree-row.itw-excluded { background: var(--itw-excluded-bg); }
.itw-tree-row.itw-excluded .itw-tree-name { color: var(--itw-git-ignored); }
.itw-tree-row.itw-drop-target { outline: 1px solid var(--itw-accent); outline-offset: -1px; background: rgba(76, 154, 255, .12); }
.itw-rename-input {
  flex: 1; min-width: 0; height: 18px; padding: 0 4px; border: 1px solid var(--itw-accent); border-radius: 3px;
  background: var(--itw-panel-2); color: var(--itw-fg); font-size: 12px; outline: none;
}
.itw-tree-msg { color: var(--itw-muted); font-style: italic; padding: 2px 8px 2px 30px; font-size: 11.5px; }
.itw-vlist { position: relative; }
.itw-vlist-row { position: absolute; left: 0; right: 0; height: 22px; }

.itw-filter {
  display: flex; align-items: center; gap: 6px; margin: 6px 8px; height: 26px; padding: 0 8px;
  border: 1px solid var(--itw-border); border-radius: 6px; background: var(--itw-panel-2); color: var(--itw-muted);
}
.itw-filter input { flex: 1; min-width: 0; background: none; border: 0; outline: none; color: var(--itw-fg); font-size: 12px; }
.itw-filter input::placeholder { color: var(--itw-muted); }

.itw-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 26px 20px; color: var(--itw-muted); text-align: center; font-size: 12px; }
.itw-empty-title { color: var(--itw-fg); font-size: 13px; font-weight: 600; }
.itw-error-box { margin: 8px; padding: 8px 10px; border: 1px solid rgba(226, 104, 111, .4); border-radius: 6px; background: rgba(226, 104, 111, .08); color: var(--itw-error); font-size: 11.5px; white-space: pre-wrap; word-break: break-word; user-select: text; }

.itw-menu {
  position: fixed; z-index: 40; padding: 4px; border-radius: 8px;
  border: 1px solid var(--itw-border-strong); background: var(--itw-overlay);
  box-shadow: 0 12px 32px rgba(0, 0, 0, .38);
  max-height: calc(100vh - 12px); overflow-y: auto; overflow-x: hidden;
}
.itw-menu-sub { z-index: 41; }
.itw-menu .itw-menu-item {
  display: flex; align-items: center; gap: 6px; width: 100%; padding: 5px 6px 5px 4px; border-radius: 5px;
  text-align: left; font-size: 12px; color: var(--itw-fg); white-space: nowrap;
}
.itw-menu .itw-menu-item:hover:not(:disabled) { background: rgba(127, 127, 127, .16); }
.itw-menu .itw-menu-item:disabled { opacity: .4; }
.itw-menu .itw-menu-item.itw-menu-danger { color: var(--itw-error); }
.itw-menu-check { width: 12px; flex: 0 0 12px; text-align: center; color: var(--itw-accent); }
.itw-menu-icon { width: 14px; flex: 0 0 14px; display: inline-flex; align-items: center; justify-content: center; }
.itw-menu-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.itw-menu-shortcut { flex: 0 0 auto; margin-left: 22px; color: var(--itw-muted); font-size: 10.5px; font-family: var(--itw-font); letter-spacing: .01em; }
.itw-menu-arrow { width: 10px; flex: 0 0 10px; text-align: right; color: var(--itw-muted); }
.itw-menu .itw-menu-sep { height: 1px; margin: 4px 2px; background: var(--itw-border); }
.itw-menu .itw-menu-label { padding: 5px 8px; color: var(--itw-muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; }

.itw-favorites { max-height: 160px; overflow: auto; border-bottom: 1px solid var(--itw-border); padding: 4px 6px; }
.itw-favorite-row { display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 4px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.itw-favorite-row:hover { background: rgba(127, 127, 127, .1); }
.itw-favorite-star { color: var(--itw-warn); }
.itw-favorite-name { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.itw-favorite-remove { width: 18px; height: 18px; opacity: .6; }
.itw-field { display: flex; flex-direction: column; gap: 5px; margin: 10px 0; font-size: 12px; color: var(--itw-muted); }
.itw-field input, .itw-field select {
  height: 30px; padding: 0 9px; border-radius: 6px; border: 1px solid var(--itw-border);
  background: var(--itw-panel-2); color: var(--itw-fg); font-size: 12.5px; outline: none;
}
.itw-field input:focus, .itw-field select:focus { border-color: var(--itw-accent); }

.itw-commit { display: flex; flex-direction: column; min-height: 0; height: 100%; }
.itw-commit-message { padding: 8px; border-bottom: 1px solid var(--itw-border); }
.itw-commit-message textarea {
  width: 100%; resize: vertical; min-height: 76px; max-height: 220px; padding: 8px 10px; border-radius: 6px;
  border: 1px solid var(--itw-border); background: var(--itw-panel-2); outline: none; font-size: 12.5px;
  line-height: 1.5; user-select: text;
}
.itw-commit-message textarea:focus { border-color: var(--itw-accent); }
.itw-commit-actions { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.itw-commit-actions .itw-spacer { flex: 1; }
.itw-commit-tasks { display: flex; align-items: center; gap: 14px; margin-top: 6px; flex-wrap: wrap; }
.itw-check { display: inline-flex; align-items: center; gap: 5px; color: var(--itw-muted); font-size: 12px; cursor: pointer; }
.itw-check input { accent-color: var(--itw-accent); }
.itw-groups { flex: 1; min-height: 0; overflow: auto; padding-bottom: 8px; }
.itw-group { border-bottom: 1px solid var(--itw-border); }
.itw-group-header {
  display: flex; align-items: center; gap: 6px; height: 27px; padding: 0 8px; color: var(--itw-muted);
  font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; position: sticky; top: 0;
  background: var(--itw-panel); z-index: 2;
}
.itw-group-header .itw-count {
  min-width: 16px; height: 16px; padding: 0 5px; border-radius: 999px; background: rgba(127, 127, 127, .18);
  color: var(--itw-fg); font-size: 10px; display: inline-flex; align-items: center; justify-content: center;
}
.itw-group-header .itw-spacer { flex: 1; }
.itw-file-row {
  display: flex; align-items: center; gap: 6px; height: 23px; padding: 0 8px 0 12px; cursor: pointer; font-size: 12px;
}
.itw-file-row:hover { background: rgba(127, 127, 127, .1); }
.itw-file-row.itw-active { background: rgba(76, 154, 255, .16); }
.itw-file-row.itw-selected { background: rgba(76, 154, 255, .16); }
.itw-file-row.itw-file-untracked .itw-file-name { color: var(--itw-git-untracked); }
.itw-file-row.itw-file-conflict .itw-file-name { color: var(--itw-git-conflict); font-weight: 600; }
.itw-file-row .itw-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-file-row .itw-file-dir { color: var(--itw-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-file-row .itw-file-status { color: var(--itw-muted); font-size: 10px; width: 12px; text-align: center; font-family: var(--itw-mono); }
.itw-group-empty { padding: 8px 12px; color: var(--itw-muted); font-size: 11.5px; font-style: italic; }
.itw-commit-toolbar { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-top: 1px solid var(--itw-border); border-bottom: 1px solid var(--itw-border); }
.itw-changelist-head { height: 24px; display: flex; align-items: center; gap: 6px; padding: 0 10px; color: var(--itw-muted); font-size: 11px; background: rgba(127, 127, 127, .06); }
.itw-changelist-head .itw-count { font-size: 10px; }
.itw-dir-heading { height: 22px; display: flex; align-items: center; padding: 0 10px 0 22px; color: var(--itw-muted); font-size: 11px; }
.itw-file-row .itw-file-stat { margin-left: auto; display: flex; gap: 5px; font-size: 10.5px; font-variant-numeric: tabular-nums; }
.itw-additions { color: var(--itw-add); }
.itw-deletions { color: var(--itw-del); }
.itw-file-row .itw-row-actions { display: none; margin-left: auto; gap: 2px; }
.itw-file-row:hover .itw-row-actions { display: flex; }
.itw-file-row:hover .itw-file-stat { display: none; }

.itw-diff { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.itw-diff-scroll { flex: 1; min-height: 0; overflow: auto; font-family: var(--itw-mono); font-size: 12.5px; line-height: 20px; position: relative; }
.itw-diff-inner { position: relative; min-width: 100%; }
.itw-diff-row { display: flex; height: 20px; white-space: pre; }
.itw-diff-row.itw-add { background: rgba(79, 180, 119, .12); }
.itw-diff-row.itw-del { background: rgba(226, 104, 111, .12); }
.itw-diff-row .itw-diff-gutter {
  width: 22px; flex: 0 0 22px; display: flex; align-items: center; justify-content: center; color: var(--itw-muted);
  cursor: pointer; user-select: none; font-size: 11px;
}
.itw-diff-row.itw-add:hover .itw-diff-gutter { color: var(--itw-add); background: rgba(79, 180, 119, .2); }
.itw-diff-row.itw-del:hover .itw-diff-gutter { color: var(--itw-del); background: rgba(226, 104, 111, .2); }
.itw-diff-num {
  width: 44px; flex: 0 0 44px; text-align: right; padding-right: 8px; color: var(--itw-muted); opacity: .6;
  font-variant-numeric: tabular-nums; user-select: none;
}
.itw-diff-sign { width: 16px; flex: 0 0 16px; text-align: center; user-select: none; color: var(--itw-muted); }
.itw-diff-text { flex: 1; padding-right: 24px; }
.itw-diff-row.itw-selected { outline: 1px solid rgba(76, 154, 255, .55); background: rgba(76, 154, 255, .22) !important; }
.itw-diff-row.itw-diff-find, .itw-diff-side.itw-diff-find { outline: 1px solid rgba(215,162,74,.65); outline-offset: -1px; }
.itw-diff-row.itw-diff-find-active, .itw-diff-side.itw-diff-find-active { outline: 2px solid var(--itw-accent); outline-offset: -2px; background: rgba(76,154,255,.2); }
.itw-word-add { background: rgba(79, 180, 119, .38); border-radius: 2px; }
.itw-word-del { background: rgba(226, 104, 111, .38); border-radius: 2px; }
.itw-diff-hunk { display: flex; align-items: center; height: 22px; background: rgba(127, 127, 127, .09); color: var(--itw-muted); font-size: 11.5px; }
.itw-diff-collapsed {
  display: flex; align-items: center; justify-content: center; height: 20px; cursor: pointer;
  color: var(--itw-muted); font-size: 11px; background: rgba(127, 127, 127, .07);
  border-top: 1px dashed var(--itw-border); border-bottom: 1px dashed var(--itw-border);
}
.itw-diff-collapsed:hover { color: var(--itw-fg); background: rgba(127, 127, 127, .14); }
.itw-diff-hunk .itw-hunk-text { padding: 0 12px; flex: 1; overflow: hidden; text-overflow: ellipsis; }
.itw-diff-hunk .itw-hunk-actions { display: none; padding-right: 6px; }
.itw-diff-hunk:hover .itw-hunk-actions { display: flex; }
.itw-diff-toolbar {
  height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 8px; padding: 0 10px;
  border-bottom: 1px solid var(--itw-border); background: var(--itw-bg); font-size: 11.5px; color: var(--itw-muted);
}
.itw-diff-toolbar .itw-spacer { flex: 1; }
.itw-diff-side { display: grid; grid-template-columns: 1fr 1fr; min-width: 100%; }
.itw-diff-side-cell { display: flex; height: 20px; min-width: 0; border-right: 1px solid var(--itw-border); overflow: hidden; }
.itw-diff-side-cell.itw-add { background: rgba(79, 180, 119, .12); }
.itw-diff-side-cell.itw-del { background: rgba(226, 104, 111, .12); }
.itw-diff-side-cell .itw-diff-text { overflow: hidden; }
.itw-diff-side-cell.itw-blank { background: rgba(127, 127, 127, .05); }
.itw-diff-side .itw-diff-num { width: 44px; flex: 0 0 44px; }
.itw-diff-side-head { display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; color: var(--itw-muted); font-size: 11px; background: var(--itw-panel); border-bottom: 1px solid var(--itw-border); }
.itw-binary { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--itw-muted); }

.itw-git { display: flex; flex-direction: column; height: 100%; min-height: 0; flex: 1 1 auto; width: 100%; min-width: 0; }
.itw-git-filters { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-bottom: 1px solid var(--itw-border); flex-wrap: wrap; }
.itw-path-chip {
  display: inline-flex; align-items: center; gap: 4px; max-width: 260px; height: 22px; padding: 0 4px 0 8px;
  border: 1px solid var(--itw-border-strong); border-radius: 999px; background: var(--itw-panel-2);
  color: var(--itw-fg); font-size: 11px;
}
.itw-path-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--itw-mono); }
.itw-path-chip-clear { width: 16px; height: 16px; border-radius: 50%; color: var(--itw-muted); font-size: 13px; line-height: 1; }
.itw-path-chip-clear:hover { background: rgba(127, 127, 127, .2); color: var(--itw-fg); }
.itw-select, .itw-input {
  height: 24px; border-radius: 5px; border: 1px solid var(--itw-border); background: var(--itw-panel-2);
  padding: 0 7px; font-size: 11.5px; outline: none; color: var(--itw-fg);
}
.itw-input { width: 150px; }
.itw-select:focus, .itw-input:focus { border-color: var(--itw-accent); }
.itw-git-table { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.itw-git-head, .itw-git-row {
  display: grid; grid-template-columns: var(--itw-graph-w, 96px) 70px minmax(160px, 1fr) 110px 120px;
  align-items: center; height: 24px; padding-right: 10px; white-space: nowrap;
}
.itw-git-narrow .itw-git-head, .itw-git-narrow .itw-git-row {
  grid-template-columns: var(--itw-graph-w, 96px) 54px minmax(60px, 1fr) 66px 78px;
  padding-right: 4px;
}
/* Never remove the author/date columns; compress them instead. */
.itw-git-head { height: 26px; flex: 0 0 26px; border-bottom: 1px solid var(--itw-border); color: var(--itw-muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: .05em; background: var(--itw-panel); }
.itw-git-head > span, .itw-git-row > span { overflow: hidden; text-overflow: ellipsis; }
.itw-git-scroll { flex: 1; min-height: 0; overflow: auto; position: relative; }
.itw-git-rows { position: relative; }
.itw-git-row { position: absolute; left: 0; right: 0; cursor: pointer; font-size: 12px; }
.itw-git-row:hover { background: rgba(127, 127, 127, .09); }
.itw-git-row.itw-selected { background: rgba(76, 154, 255, .16); }
.itw-git-row.itw-compare { box-shadow: inset 2px 0 0 var(--itw-warn); background: rgba(215, 162, 74, .12); }
.itw-compare-chip {
  display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 4px 0 8px;
  border: 1px solid var(--itw-warn); border-radius: 999px; color: var(--itw-warn); font-size: 11px;
  font-family: var(--itw-mono);
}
.itw-git-row .itw-sha { font-family: var(--itw-mono); color: var(--itw-accent); font-size: 11.5px; }
.itw-git-row .itw-subject { font-size: 12.5px; }
.itw-git-row .itw-author, .itw-git-row .itw-date { color: var(--itw-muted); font-size: 11px; }
.itw-git-graph { height: 100%; display: flex; align-items: center; }
.itw-git-empty { padding: 24px; text-align: center; color: var(--itw-muted); }
.itw-git-detail {
  flex: 0 0 auto; max-height: 42%; overflow: auto; border-top: 1px solid var(--itw-border);
  background: var(--itw-panel); padding: 6px 10px 8px;
}
.itw-git-detail-head { display: flex; align-items: center; gap: 6px; }
.itw-git-detail-subject { font-weight: 600; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-git-detail-meta { display: flex; gap: 10px; flex-wrap: wrap; color: var(--itw-muted); font-size: 11px; margin-top: 3px; }
.itw-git-detail-sha { font-family: var(--itw-mono); color: var(--itw-accent); }
.itw-git-detail-dim { opacity: .75; }
.itw-git-detail-body { margin: 6px 0 0; white-space: pre-wrap; color: var(--itw-muted); font-size: 11.5px; font-family: var(--itw-font); }
.itw-git-detail-foot { display: flex; align-items: center; gap: 10px; margin-top: 6px; font-size: 11px; }
.itw-git-detail-hint { color: var(--itw-muted); margin-left: auto; }
.itw-git-files { display: flex; flex-direction: column; gap: 1px; margin-top: 6px; max-height: 120px; overflow: auto; }
.itw-git-file {
  display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; padding: 2px 6px; border-radius: 4px;
  font-size: 11.5px; color: var(--itw-fg);
}
.itw-git-file:hover { background: rgba(127, 127, 127, .14); }
.itw-git-file-name { font-family: var(--itw-mono); }
.itw-git-file-dir { color: var(--itw-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.itw-term { display: flex; flex-direction: column; height: 100%; min-height: 0; }
.itw-term-tabs { display: flex; align-items: center; gap: 2px; padding: 3px 6px; border-bottom: 1px solid var(--itw-border); overflow-x: auto; }
.itw-term-tab {
  display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 8px; border-radius: 5px;
  color: var(--itw-muted); font-size: 11.5px; cursor: pointer; white-space: nowrap;
}
.itw-term-tab:hover { background: rgba(127, 127, 127, .12); }
.itw-term-tab.itw-on { color: var(--itw-fg); background: rgba(76, 154, 255, .16); }
.itw-term-tab .itw-term-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--itw-success); }
.itw-term-tab .itw-term-dot.itw-exited { background: var(--itw-muted); }
.itw-term-panes { flex: 1; min-height: 0; position: relative; }
.itw-term-pane { position: absolute; inset: 0; padding: 4px 0 0 8px; }
.itw-term-pane.itw-hidden { visibility: hidden; pointer-events: none; }
.itw-term-host { width: 100%; height: 100%; }
.itw-term-host .xterm { height: 100%; }
.itw-term-error { padding: 16px; color: var(--itw-error); font-size: 12px; white-space: pre-wrap; user-select: text; }

/*
 * Settings also render outside the .itw-root pane (the native settings.section
 * page), so the block above carries the design tokens and this section
 * re-declares only what it needs. Hierarchy: group title -> row title -> row
 * hint -> control.
 */
.itw-settings-section { width: 100%; }
.itw-settings {
  container-type: inline-size;
  container-name: itw-settings;
  width: 100%;
  max-width: 720px;
  padding: 8px 0;
  color: var(--itw-fg);
  font-family: var(--itw-font);
  font-size: 14px;
  line-height: 1.45;
}
.itw-settings *, .itw-settings *::before, .itw-settings *::after { box-sizing: border-box; }
.itw-settings :where(button, input, select) { font: inherit; color: inherit; }
.itw-settings :where(button) { background: none; border: 0; padding: 0; cursor: pointer; }
.itw-settings-group { margin: 0; }
.itw-settings-group + .itw-settings-group {
  margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--itw-divider);
}
.itw-settings-group-title {
  margin: 0; color: var(--itw-fg); font-size: 15px; font-weight: 600; line-height: 24px;
  letter-spacing: 0; text-transform: none;
}
.itw-settings-group-desc { margin: 2px 0 0; max-width: 560px; color: var(--itw-muted); font-size: 12px; line-height: 18px; }
.itw-settings-rows { display: flex; flex-direction: column; margin-top: 4px; }
.itw-settings-row {
  display: flex; align-items: center; gap: 24px; min-height: 48px; padding: 12px 0;
  border-bottom: .5px solid var(--itw-divider);
}
.itw-settings-rows > .itw-settings-row:last-child { border-bottom: 0; }
.itw-settings-label { flex: 1 1 auto; min-width: 0; }
.itw-settings-title { color: var(--itw-fg); font-size: 14px; line-height: 22px; }
.itw-settings-hint { margin-top: 2px; color: var(--itw-muted); font-size: 12px; line-height: 18px; }
.itw-settings-control {
  flex: 0 0 auto; margin-left: auto; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
}
.itw-settings-control input[type="text"], .itw-settings-control input[type="number"],
.itw-settings-control select {
  height: 32px; min-width: 0; padding: 0 10px; color: var(--itw-fg);
  border: 1px solid var(--itw-border-strong); border-radius: 6px; background: var(--itw-bg);
  font-size: 13px; outline: none; transition: border-color .12s ease, box-shadow .12s ease;
}
.itw-settings-control input[type="text"] { width: 300px; }
.itw-settings-control select { width: 220px; padding-right: 26px; }
.itw-settings-control input[type="number"] {
  width: 96px; padding-right: 8px; text-align: right; font-variant-numeric: tabular-nums;
}
.itw-settings-control :is(input[type="text"], input[type="number"], select):hover { border-color: var(--itw-muted); }
.itw-settings-control :is(input[type="text"], input[type="number"], select):focus {
  border-color: var(--itw-accent); box-shadow: 0 0 0 1px var(--itw-accent);
}
.itw-settings-control input[type="checkbox"] {
  width: 16px; height: 16px; margin: 0; accent-color: var(--itw-accent); cursor: pointer;
}
.itw-settings-value { color: var(--itw-muted); font-size: 13px; }
.itw-settings-shortcut {
  display: inline-flex; align-items: center; justify-content: center; min-width: 150px; height: 32px; padding: 0 12px;
  border: 1px solid var(--itw-border-strong); border-radius: 7px; background: var(--itw-panel-2);
  color: var(--itw-fg); font-family: var(--itw-mono); font-size: 12px; letter-spacing: .02em;
  cursor: pointer; transition: border-color .12s ease, background .12s ease, color .12s ease;
}
.itw-settings-shortcut:hover { border-color: var(--itw-muted); background: var(--itw-bg); }
.itw-settings-shortcut:focus-visible { outline: 2px solid var(--itw-accent); outline-offset: 1px; }
.itw-settings-shortcut.itw-capturing {
  border-color: var(--itw-accent); color: var(--itw-accent); background: var(--itw-bg);
}
.itw-settings .itw-textbtn {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 6px;
  border: 1px solid var(--itw-border-strong); color: var(--itw-fg); background: transparent; font-size: 12.5px;
}
.itw-settings .itw-textbtn:hover { border-color: var(--itw-muted); background: var(--itw-panel-2); }
.itw-settings-footer {
  display: flex; align-items: center; gap: 12px; margin-top: 22px; padding-top: 16px;
  border-top: 1px solid var(--itw-divider);
}
.itw-settings-saved { margin-left: auto; color: var(--itw-success); font-size: 12px; }
@container itw-settings (max-width: 520px) {
  .itw-settings-row { flex-wrap: wrap; gap: 8px 16px; padding: 12px 0; }
  .itw-settings-control { width: 100%; justify-content: flex-start; }
  .itw-settings-control input[type="text"] { width: 100%; }
  .itw-settings-control select { width: 100%; }
  .itw-settings-shortcut { min-width: 132px; }
}

.itw-modal-backdrop {
  position: absolute; inset: 0; background: rgba(0, 0, 0, .45); display: flex; align-items: center; justify-content: center; z-index: 50;
}
.itw-modal {
  width: min(440px, calc(100% - 40px)); border-radius: 10px; border: 1px solid var(--itw-border-strong);
  background: var(--itw-overlay); box-shadow: 0 24px 60px rgba(0, 0, 0, .45); padding: 16px 18px;
}
.itw-modal h2 { font-size: 15px; margin: 0 0 8px; }
.itw-modal p { margin: 0 0 16px; color: var(--itw-muted); font-size: 12.5px; white-space: pre-wrap; user-select: text; }
.itw-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.itw-toast {
  position: absolute; right: 14px; bottom: 34px; max-width: 420px; padding: 9px 12px; border-radius: 8px;
  border: 1px solid var(--itw-border-strong); background: var(--itw-overlay); box-shadow: 0 10px 30px rgba(0,0,0,.4);
  font-size: 12px; z-index: 60; display: flex; gap: 8px; align-items: flex-start;
}
.itw-toast.itw-error { border-color: rgba(226, 104, 111, .55); }
.itw-toast.itw-success { border-color: rgba(79, 180, 119, .55); }
.itw-toast-text { min-width: 0; }
.itw-toast-detail { color: var(--itw-muted); font-size: 11px; margin-top: 3px; white-space: pre-wrap; word-break: break-word; user-select: text; }
.itw-root-picker { display: flex; flex-direction: column; gap: 8px; }
.itw-root-list { display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow: auto; }
.itw-root-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 6px; border: 1px solid var(--itw-border); text-align: left; }
.itw-root-item:hover { background: rgba(127, 127, 127, .1); }
.itw-root-item .itw-root-path { color: var(--itw-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
.itw-project-picker { width: min(620px, calc(100% - 40px)); max-height: min(80vh, 720px); display: flex; flex-direction: column; }
.itw-modal-hint { color: var(--itw-muted); font-size: 12px; margin: -2px 0 12px; }
.itw-project-picker-list { display: flex; flex-direction: column; gap: 3px; overflow: auto; min-height: 0; margin-bottom: 12px; }
.itw-project-group { color: var(--itw-muted); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 8px 4px 3px; }
.itw-project-choice {
  display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 8px; border-radius: 7px;
  border: 1px solid transparent; text-align: left;
}
.itw-project-choice:hover { background: rgba(127, 127, 127, .1); }
.itw-project-choice.itw-current { border-color: var(--itw-border-strong); background: rgba(76, 154, 255, .07); }
.itw-project-choice-icon { display: flex; align-items: center; justify-content: center; flex: 0 0 18px; color: var(--itw-muted); }
.itw-project-choice-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.itw-project-choice-text b { font-size: 12.5px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-project-choice-path { color: var(--itw-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-project-repo-badge { font-size: 9.5px; color: var(--itw-git-add, #57a86b); border: 1px solid currentColor; border-radius: 999px; padding: 1px 6px; flex: 0 0 auto; }
.itw-project-current-badge { font-size: 9.5px; color: var(--itw-accent); border: 1px solid currentColor; border-radius: 999px; padding: 1px 6px; flex: 0 0 auto; }
.itw-project-empty { padding: 10px 8px; color: var(--itw-muted); font-size: 11.5px; }
.itw-sidebar-open {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: 0; border-radius: 8px; padding: 0;
  color: var(--dsw-alias-label-secondary); background: transparent; cursor: pointer;
}
.itw-sidebar-open:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.itw-sidebar-open:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.itw-center { min-height: 0; }

/* ── editor FindBar / Search / Quick Open ─────────────────────────────── */
.itw-findbar {
  flex: 0 0 auto; padding: 4px 8px; border-bottom: 1px solid var(--itw-border);
  background: var(--itw-panel); display: flex; flex-direction: column; gap: 4px;
}
.itw-find-row { display: flex; align-items: center; gap: 5px; min-width: 0; }
.itw-find-label { width: 34px; flex: 0 0 34px; color: var(--itw-muted); font-size: 11px; text-align: right; }
.itw-find-input {
  flex: 1; min-width: 80px; height: 24px; padding: 0 7px; border-radius: 5px;
  border: 1px solid var(--itw-border); background: var(--itw-panel-2); color: var(--itw-fg);
  font-size: 12px; outline: none; user-select: text;
}
.itw-find-input:focus { border-color: var(--itw-accent); }
.itw-find-input.itw-invalid { border-color: var(--itw-error); }
.itw-find-count { min-width: 44px; text-align: center; color: var(--itw-muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.itw-find-count.itw-invalid { color: var(--itw-error); }
.itw-find-btn {
  width: 24px; height: 24px; border-radius: 5px; color: var(--itw-muted); display: inline-flex;
  align-items: center; justify-content: center; font-size: 13px;
}
.itw-find-btn:hover:not(:disabled) { background: rgba(127,127,127,.14); color: var(--itw-fg); }
.itw-find-btn:disabled { opacity: .35; }
.itw-find-flag {
  min-width: 26px; height: 22px; padding: 0 5px; border-radius: 4px; border: 1px solid transparent;
  color: var(--itw-muted); font-family: var(--itw-mono); font-size: 10.5px;
}
.itw-find-flag:hover { background: rgba(127,127,127,.14); color: var(--itw-fg); }
.itw-find-flag.itw-on { border-color: var(--itw-accent); color: var(--itw-accent); background: rgba(76,154,255,.12); }
.itw-dom-findbar { position: absolute; top: 0; left: 0; right: 0; z-index: 14; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
::highlight(itw-dom-find) { background-color: rgba(215, 162, 74, .38); }
::highlight(itw-dom-find-active) { background-color: rgba(76, 154, 255, .55); color: inherit; }
.itw-conflict-chip {
  display: inline-flex; align-items: center; gap: 4px; color: var(--itw-warn); font-size: 11px;
  padding: 0 4px; border: 1px solid rgba(215,162,74,.45); border-radius: 5px;
}

.itw-search { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; z-index: 8; pointer-events: auto; }
.itw-search * { pointer-events: auto; }
.itw-search-head {
  display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--itw-border);
  background: var(--itw-panel);
}
.itw-search-input {
  flex: 1; min-width: 100px; height: 28px; padding: 0 9px; border-radius: 6px;
  border: 1px solid var(--itw-border); background: var(--itw-panel-2); color: var(--itw-fg);
  outline: none; font-size: 12.5px; user-select: text;
}
.itw-search-input:focus { border-color: var(--itw-accent); }
.itw-search-meta { display: flex; align-items: center; gap: 8px; padding: 5px 12px; color: var(--itw-muted); font-size: 11px; border-bottom: 1px solid var(--itw-border); }
.itw-search-warn { color: var(--itw-warn); }
.itw-search-results { flex: 1; min-height: 0; overflow: auto; padding: 4px 0 20px; }
.itw-search-file { border-bottom: 1px solid var(--itw-border); }
.itw-search-file-head {
  display: flex; align-items: center; gap: 7px; height: 27px; padding: 0 12px;
  background: rgba(127,127,127,.06); position: sticky; top: 0; z-index: 1;
}
.itw-search-file-name { font-weight: 600; font-size: 12px; }
.itw-search-file-dir { color: var(--itw-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; }
.itw-search-file-head .itw-count { margin-left: auto; }
.itw-search-hit {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 23px; padding: 0 12px 0 20px;
  text-align: left; font-family: var(--itw-mono); font-size: 11.5px; color: var(--itw-fg);
}
.itw-search-hit:hover { background: rgba(76,154,255,.12); }
.itw-search-line { width: 42px; flex: 0 0 42px; text-align: right; color: var(--itw-muted); font-variant-numeric: tabular-nums; }
.itw-search-preview { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-search-error { padding: 12px; color: var(--itw-error); font-size: 12px; white-space: pre-wrap; }

.itw-quick-backdrop { position: absolute; inset: 0; z-index: 70; background: rgba(0,0,0,.38); display: flex; align-items: flex-start; justify-content: center; padding-top: 9vh; }
.itw-quick {
  width: min(680px, calc(100% - 32px)); max-height: 72%; display: flex; flex-direction: column;
  border-radius: 10px; border: 1px solid var(--itw-border-strong); background: var(--itw-overlay);
  box-shadow: 0 24px 70px rgba(0,0,0,.5); overflow: hidden;
}
.itw-quick-head { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-bottom: 1px solid var(--itw-border); }
.itw-quick-title { color: var(--itw-muted); font-size: 11px; white-space: nowrap; }
.itw-quick-input { flex: 1; min-width: 80px; height: 30px; padding: 0 7px; border: 0; background: transparent; color: var(--itw-fg); outline: none; font-size: 14px; user-select: text; }
.itw-quick-list { overflow: auto; padding: 4px; min-height: 40px; }
.itw-quick-row { display: flex; align-items: center; gap: 10px; width: 100%; height: 27px; padding: 0 9px; border-radius: 5px; text-align: left; }
.itw-quick-row.itw-selected { background: rgba(76,154,255,.2); }
.itw-quick-name { font-size: 12.5px; white-space: nowrap; }
.itw-quick-dir { color: var(--itw-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-quick-empty { padding: 18px; text-align: center; color: var(--itw-muted); font-size: 12px; }
.itw-quick-foot { padding: 6px 10px; border-top: 1px solid var(--itw-border); color: var(--itw-muted); font-size: 10.5px; }

/* ── Project filter modes / opened-vs-selected ───────────────────────── */
.itw-filter-mode { display: inline-flex; border: 1px solid var(--itw-border); border-radius: 4px; overflow: hidden; flex: 0 0 auto; }
.itw-filter-mode button { height: 20px; padding: 0 6px; color: var(--itw-muted); font-size: 10.5px; }
.itw-filter-mode button.itw-on { background: rgba(76,154,255,.18); color: var(--itw-fg); }
.itw-filter-mode button + button { border-left: 1px solid var(--itw-border); }
.itw-filter-hint { padding: 0 12px 5px; color: var(--itw-muted); font-size: 10.5px; }
.itw-error-text { color: var(--itw-error); }
.itw-tree-row.itw-opened .itw-tree-name { color: var(--itw-accent); font-weight: 600; }
.itw-tree-row.itw-opened::before {
  content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 2px; border-radius: 2px;
  background: var(--itw-accent);
}
.itw-tree-relative { margin-left: auto; color: var(--itw-muted); font-size: 10.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 46%; }

/* ── Git Drawer ──────────────────────────────────────────────────────── */
.itw-branch-switch {
  display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 7px; border-radius: 5px;
  border: 1px solid var(--itw-border); color: var(--itw-fg); font-size: 11.5px; max-width: 210px;
}
.itw-branch-switch:hover { border-color: var(--itw-border-strong); background: rgba(127,127,127,.08); }
.itw-branch-caret { color: var(--itw-muted); font-size: 9px; }
.itw-branch-popover {
  position: fixed; z-index: 42; width: 260px; padding: 6px; border-radius: 8px;
  border: 1px solid var(--itw-border-strong); background: var(--itw-overlay);
  box-shadow: 0 14px 36px rgba(0,0,0,.4);
}
.itw-branch-list { max-height: 280px; overflow: auto; margin-top: 5px; }
.itw-branch-row {
  display: flex; align-items: center; gap: 6px; width: 100%; height: 25px; padding: 0 6px;
  border-radius: 4px; text-align: left; font-size: 12px;
}
.itw-branch-row.itw-selected { background: rgba(76,154,255,.2); }
.itw-branch-check { width: 12px; flex: 0 0 12px; color: var(--itw-accent); }
.itw-git-main { flex: 1; min-height: 0; display: flex; position: relative; }
.itw-git-table { flex: 1; min-width: 0; }
.itw-git-drawer {
  position: relative; flex: 0 0 auto; min-width: 300px; display: flex; flex-direction: column; min-height: 0;
  border-left: 1px solid var(--itw-border-strong); background: var(--itw-panel);
}
.itw-git-drawer-overlay {
  position: absolute; inset: 0; width: 100% !important; min-width: 0; z-index: 12; border-left: 0;
}
.itw-git-drawer-backdrop { position: absolute; inset: 0; z-index: 11; background: rgba(0,0,0,.42); }
.itw-git-drawer-resizer { position: absolute; left: -3px; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 13; }
.itw-git-drawer-resizer:hover { background: rgba(76,154,255,.28); }
.itw-git-drawer-head {
  display: flex; align-items: center; gap: 6px; min-height: 34px; padding: 5px 6px 5px 10px;
  border-bottom: 1px solid var(--itw-border); background: var(--itw-panel);
}
.itw-git-drawer-title { font-weight: 600; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-git-drawer-head .itw-spacer { flex: 1; }
.itw-git-drawer-body { flex: 1; min-height: 0; overflow: auto; padding: 8px 10px 24px; }
.itw-git-drawer-meta { display: flex; flex-wrap: wrap; gap: 7px 10px; color: var(--itw-muted); font-size: 11px; }
.itw-git-drawer-sha { font-family: var(--itw-mono); color: var(--itw-accent); }
.itw-git-open-full { margin-top: 7px; }
.itw-git-drawer-body-text {
  margin: 7px 0 0; white-space: pre-wrap; color: var(--itw-muted); font-size: 11.5px;
  font-family: var(--itw-font); max-height: 120px; overflow: auto; user-select: text;
}
.itw-git-drawer-section-title {
  display: flex; align-items: center; gap: 5px; margin: 10px 0 4px; color: var(--itw-muted);
  font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}
.itw-git-drawer-files { display: flex; flex-direction: column; gap: 1px; }
.itw-git-drawer-file {
  display: flex; align-items: center; gap: 5px; width: 100%; min-height: 23px; padding: 0 5px;
  border-radius: 4px; text-align: left; font-size: 11.5px;
}
.itw-git-drawer-file:hover { background: rgba(127,127,127,.12); }
.itw-git-drawer-file.itw-selected { background: rgba(76,154,255,.16); }
.itw-git-drawer-file .itw-git-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-git-drawer-file .itw-git-file-dir { color: var(--itw-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.itw-git-drawer-file .itw-additions, .itw-git-drawer-file .itw-deletions { margin-left: 0; font-size: 10px; }
.itw-git-file-status { width: 13px; flex: 0 0 13px; text-align: center; font-family: var(--itw-mono); font-size: 10px; color: var(--itw-muted); }
.itw-status-A { color: var(--itw-add); } .itw-status-D { color: var(--itw-del); } .itw-status-R { color: var(--itw-warn); }
.itw-git-drawer-inline { margin-top: 8px; border-top: 1px solid var(--itw-border); }
.itw-git-inline-diff {
  max-height: 320px; overflow: auto; border: 1px solid var(--itw-border); border-radius: 5px;
  background: var(--itw-bg); font-family: var(--itw-mono); font-size: 11px; line-height: 17px;
  user-select: text; padding: 4px 0;
}
.itw-git-inline-line { white-space: pre; padding: 0 8px; }
.itw-git-inline-line.itw-add { background: rgba(79,180,119,.12); }
.itw-git-inline-line.itw-del { background: rgba(226,104,111,.12); }
.itw-git-inline-line.itw-hunk { color: var(--itw-accent); background: rgba(76,154,255,.08); }

/* Read-only code / diff must be copyable despite the root user-select:none. */
.itw-code, .itw-diff-text, .itw-diff-side-cell, .itw-diff-row { user-select: text; }
.itw-diff-row .itw-diff-num, .itw-diff-row .itw-diff-sign, .itw-diff-row .itw-diff-gutter { user-select: none; }

@container ide-workbench (max-width: 760px) {
  .itw-topbar { gap: 4px; padding: 0 6px; }
  .itw-project-select { flex: 1; padding: 0 3px; }
  .itw-project-path, .itw-top-spacer { display: none; }
  .itw-branch-chip { max-width: 100px; padding: 0 4px; }
  .itw-topbar > button { flex-shrink: 0; }
  .itw-body { flex-direction: column; }
  .itw-stripe { width: 100%; flex: 0 0 38px; flex-direction: row; padding: 2px 6px; border-right: 0; border-bottom: 1px solid var(--itw-border); }
  .itw-stripe-spacer { flex: 1; }
  .itw-stripe-btn { width: 30px; height: 30px; }
  .itw-stripe-btn.itw-on::before { left: 6px; right: 6px; top: auto; bottom: -3px; width: auto; height: 2px; }
  .itw-left { width: 100% !important; min-width: 0; max-width: none; flex: 0 1 38%; min-height: 120px; border-right: 0; border-bottom: 1px solid var(--itw-border); }
  .itw-left-resizer { display: none; }
  .itw-center { min-height: 140px; }
  .itw-bottom { max-height: 65%; min-height: 100px; }
  .itw-statusbar { overflow-x: auto; white-space: nowrap; }
  .itw-status-item { flex-shrink: 0; }
  .itw-editor-toolbar { overflow-x: auto; flex-shrink: 0; }
  .itw-modal { max-width: calc(100% - 16px); }
}
`
