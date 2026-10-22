/**
 * One stylesheet for the whole workbench, inserted through the package-owned
 * `styles` builtin (removed with the Client run). Every surface uses the
 * `--dsw-alias-*` tokens with a neutral fallback, so the panel follows the
 * harness light/dark theme and transparent skins.
 */
export const CSS = `
.itw-root {
  --itw-bg: var(--dsw-alias-bg-base, #15171c);
  --itw-panel: var(--dsw-alias-bg-layer-1, #1b1e24);
  --itw-panel-2: var(--dsw-alias-bg-layer-2, #22262e);
  --itw-overlay: var(--dsw-alias-bg-overlay, #262b34);
  --itw-border: var(--dsw-alias-border-l1, #2c313a);
  --itw-border-strong: var(--dsw-alias-border-l2, #3b424e);
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
}
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

.itw-git { display: flex; flex-direction: column; height: 100%; min-height: 0; }
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
  grid-template-columns: var(--itw-graph-w, 96px) 68px minmax(120px, 1fr);
}
.itw-git-narrow .itw-git-head > span:nth-child(4),
.itw-git-narrow .itw-git-head > span:nth-child(5),
.itw-git-narrow .itw-git-row > span:nth-child(4),
.itw-git-narrow .itw-git-row > span:nth-child(5) { display: none; }
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

.itw-settings { padding: 4px 4px 24px; max-width: 640px; }
.itw-settings-group { margin-bottom: 22px; }
.itw-settings-group h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--itw-muted); margin: 0 0 8px; }
.itw-settings-row { display: flex; align-items: center; gap: 12px; min-height: 34px; padding: 4px 0; border-bottom: 1px solid var(--itw-border); }
.itw-settings-row .itw-settings-label { flex: 1; min-width: 0; }
.itw-settings-row .itw-settings-hint { color: var(--itw-muted); font-size: 11px; }
.itw-settings-row input[type="text"], .itw-settings-row input[type="number"], .itw-settings-row select {
  height: 26px; border-radius: 5px; border: 1px solid var(--itw-border); background: var(--itw-panel-2);
  padding: 0 8px; font-size: 12px; outline: none; min-width: 160px;
}
.itw-settings-row input[type="checkbox"] { accent-color: var(--itw-accent); width: 15px; height: 15px; }
.itw-settings-shortcut {
  display: inline-flex; align-items: center; justify-content: center; min-width: 110px; height: 26px; padding: 0 10px;
  border: 1px solid var(--itw-border); border-radius: 6px; background: var(--itw-panel-2); font-family: var(--itw-mono);
  font-size: 11.5px; cursor: pointer;
}
.itw-settings-shortcut.itw-capturing { border-color: var(--itw-accent); color: var(--itw-accent); }
.itw-settings-saved { color: var(--itw-success); font-size: 11.5px; }

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
`
