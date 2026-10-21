# M0 — dsh 插件 API 能力清单与决策回填

> 状态：✅ 已完成（2026-10-21，基于当前安装的 DSH Desktop / Web GUI 实测：
> `cordis_inspect_list` / `cordis_inspect_query` Service / Event / Slots / Theme，
> 以及本机 profile 中 `dsh-better-sidebar@0.28.0`、`dsh-ide-git@0.19.10` 的成品插件源码对照。）

## 7.2 决策回填表

| 决策项 | 结论 | 依据 / 说明 |
|---|---|---|
| 插件 ID 规范 | ✅ `dsh-ide-toolwindows` | 包名即插件 ID，`package.json` 的 `dsh.bundle.patch` 声明 Loader 行；profile 中 `dsh-context`、`dsh-better-sidebar` 均为无前缀包名。 |
| Project 打开语义 | ✅ 方案 B 强化版：**自建编辑器面** | DSH 客户端**没有**可编程的编辑器/标签 API（Client Service 目录只有 layout / locale / sessions / slots / theme / timer / uiWorkspace / workspaces）。但 `main` 槽是 keyed 整页容器，插件可在其中自绘编辑器区，因此直接实现真实的 Preview Tab / Pinned Tab 语义，不降级为只读预览。 |
| PTY 能力 | ✅ 有 | Host `ctx.subprocess.spawnTerminal(SubprocessTerminalSpawnSpec)`：argv/cwd/env/rows/cols/terminalType/graceMs，返回 `output: Readable`、`write()`、`resize()`、`terminate()`、`inspectActivity()`；Windows 走 ConPTY。 |
| 事件源 | ✅ 订阅 API + 2s 轮询降级 | 没有面向插件的“工作区文件已变”事件；采用 2s 轮询 `git status --porcelain=v2` + Git 操作后主动失效广播（PRD 允许的降级路径）。 |
| 锚定/折叠 | ✅ 仅四窗锚定布局（自绘） | 宿主 `sidebar.panellist` 只给图标（props `{size, active}`，无 badge），`main` 为整页；工具窗的锚定/折叠/徽标由插件自绘的 stripe + dock 实现。宿主侧条图标不提供 Badge 能力（PRD 的 Badge 落在插件自绘 stripe 上）。 |
| 设置持久化 | ✅ 插件自带 JSON | Host 侧 `%DSH_HOME%/ide-toolwindows/settings.json`（实测落在 `C:\Users\<user>\.dsh\ide-toolwindows\settings.json`；`DSH_PROFILE_DIR` 存在时优先用它）。deep-merge，含快捷键、Shell、git 路径、UI 状态；设置页通过 `settings.section` 槽注册。 |
| 快捷键注册 | ✅ 插件自管 | 客户端无公开 shortcuts Service；在 `apply` 里以 capture 阶段 `document.addEventListener('keydown')` 注册，配合 `ctx.layout.selectPanel('ide-toolwindows')` 打开本插件主面板。Alt+1/0/9/F12、Ctrl+K、Ctrl+Shift+K 均可重绑。 |

## 7.1 六个假设逐项验证

| # | 假设 | 结论 | 证据 |
|---|---|---|---|
| 1 | sidebar 扩展点可注册自定义面板、锚定、折叠、徽标 | **部分成立**：`sidebar.panellist`（list）+ `main`（keyed）可注册一级面板与图标；锚定/折叠由插件自绘；宿主图标无 badge props | `Slots.listSubTree` 的 `sidebar.panellist` ownerProps 仅 `{size, active}`；`main` 目录写明“其他 key 不获得 Session 绑定” |
| 2 | 有编辑器标签 API（打开/感知当前文件/复用固定） | **不成立**：Client Service 无 editor/tab 服务 | `Service.listService`（client）全集：layout/locale/sessions/slots/theme/timer/uiWorkspace/workspaces |
| 3 | 宿主可启动 PTY | **成立** | Host `subprocess` Service 的 `spawnTerminal` 契约 |
| 4 | 可订阅文件/仓库事件 | **不成立（无公开事件）**：只有 `ctx.fs.watch`（Host，按 FsTarget）与 session 事件 | Host Event 目录无工作区文件事件；采用轮询 |
| 5 | 可执行 git CLI 子进程、快捷键、持久化 | **成立**：`node:child_process` 直接可用（dsh-ide-git 同款做法）；快捷键/设置为插件自管 | 本插件 Host 实测 |
| 6 | manifest / 包名规范 | **成立**：`dsh.bundle.patch` + `dsh.client`（platform/immediately/inject）+ `./client` 导出 | `references/host-plugin.md`、`references/ui-plugin.md`、profile 内成品插件 |

## 关键实现契约（已实机对照）

- 客户端产物格式：`window.__ModuleLoader__.load({ id, factory(require) { ... return { inject, apply } } })`，
  `require('react')` 从模块表取；其余依赖（xterm）打进单文件 bundle。
- 槽注册：`ctx.slots.inject(slotName, () => ctx.slots.register(options, Component))`；
  keyed 槽用 `{ name: 'main', key: 'ide-toolwindows' }`。
- 面板切换：`ctx.layout.selectPanel('ide-toolwindows')`。
- 主题：只使用 `--dsw-alias-*` 令牌（14 个），编辑器自绘色仅作 fallback。
- Host 路由：`ctx.webServer.register({ kind: 'prefix', path: '/ide-toolwindows/api', handler })`，
  每个请求用 `ctx.connection.requestRejection(req)` 做同源/鉴权校验；
  WebSocket：`ctx.webServer.registerUpgrade({ path: '/ide-toolwindows/ws/terminal', handler })` + `ws`。
- 工作区根：Host `ctx.workspaceRegistry.list()`（`{id,path,title,updatedAt}`）→ 默认取最近更新且存在的目录；UI 顶栏可切换。

## 与 PRD 的唯一偏差（需知悉）

1. 宿主侧条图标无法显示数字徽标 → 徽标画在插件自绘 stripe 上（Commit 未暂存数、Terminal 会话数）。
2. 宿主没有“编辑器标签”概念 → 编辑器区完全由插件拥有，这反而使 Preview/Pinned 语义 100% 可控。
3. 浮窗/自动隐藏从规格删除，仅保留锚定（自绘左右/底部 dock）。
