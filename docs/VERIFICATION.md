# 验收记录（V1.1 / M0–M4 合并验收）

> 环境：DSH Desktop（Web GUI 由 Desktop 内嵌），Windows 11，zh-CN，Claude 皮肤；
> 实测窗口 1938×1038 物理像素（1.25 DPI）。插件以本地 linked bundle 安装，
> `plugin_manager install_bundle` 结果 `application: applied`、`warnings: []`。

## 自动化测试（33 项全部通过）

```sh
cd dsh-ide-toolwindows && npm test
# 33 pass / 0 fail
```

覆盖：

| 文件 | 覆盖 |
|---|---|
| `tests/diff.test.mjs` | unified diff 解析、行号、hunk、side-by-side 配对、patch 选择重建（含新增文件）、未选行上下文转换 |
| `tests/graph.test.mjs` | 线性/分支/合并的 lane 布局与几何 |
| `tests/git.test.mjs` | porcelain v2、numstat、路径围栏 |
| `tests/staging.git.test.mjs` | **真实 git**：仅暂存选中新增行、整块暂存、反向取消暂存后 index 精确归零 |
| `tests/file-types.test.mjs` | Java/TS/Python/Markdown/JSON/SQL/Shell/图片等图标分类与特殊文件名（`.env`、`Dockerfile`、锁文件） |
| `tests/markdown-outline.test.mjs` | 标题提取（忽略 fenced code）、slug、重复标题去重 |
| `tests/workspace-write.test.mjs` | 原子写入、UTF-8/BOM/UTF-16 编码保持、路径越界与缺失文件拒绝 |
| `tests/render.test.mjs` | 真实 React SSR：Workbench / Project / Commit / Git / Diff / Code / **Markdown 预览 + 目录** / **编辑态工具栏** |

另用 `.verify/patch-test.mjs`（临时脚本，已随 `.verify` 清理）在真实 git 仓库中复核：
选择 2 个新增行 → `git diff --cached` 恰好只有这 2 行；整块 → 删除+新增；
`git apply -R` 取消暂存后 index 为空。

## 实机验收（截图人工核对）

| 验收点 | 结果 | 证据 |
|---|---|---|
| 侧条图标 + 一级面板注册 | ✅ | `Slots.listSubTree`：`sidebar.panellist` 与 `main` 均出现 `ide-toolwindows`，active |
| 设置分区注册 | ✅ | 设置页导航出现「IDE 工具窗口」 |
| 单击文件 → 预览标签；内容渲染 + 语法高亮 | ✅ | 打开 `patch-test.mjs`，标签斜体+圆点，行号/高亮/面包屑正确 |
| 双击固定、固定标签不被替换 | ✅（代码路径 + SSR） | `pinTab`/preview 复用逻辑；实机预览标签存在 |
| Git 着色 | ✅ | 深色/浅色皮肤下 modified=蓝、untracked=绿；状态栏「2 项改动」 |
| Commit 三组 + 徽标 | ✅ | 真实仓库：已暂存 0 / 未暂存 0 / 未版本控制 2；未跟踪行复选框未勾选，组按钮为「全部暂存」 |
| Commit 详情 + Diff | ✅ | 非合并提交显示元信息、full SHA、refs、作者/日期、+222 −222 与逐文件 hunk diff |
| 合并提交详情 | ✅ | 重启后实测：`Merge pull request #2519` 显示元信息 + **+445 −446** 首父差异（`apps/cli/package.json` 的 version/access 变更） |
| Git 日志 + 提交图谱 | ✅ | 真实仓库 200 条分页表，Graph 车道/节点/合并连线渲染；HEAD→master / origin/master 标签 |
| 分支区 + 快速切换 | ✅（UI） | 当前分支 chip + 切换分支下拉 + 历史过滤下拉 |
| 终端 PTY | ✅ | PowerShell 7 会话启动，提示符 `PS D:\...`，xterm 渲染 |
| **Windows 中文编码** | ✅ | 粘贴并执行 `echo 中文你好` → 输出 `中文你好`，无乱码 |
| 多终端会话 + 徽标 | ✅ | 侧条/底部 Terminal 徽标显示会话数 |
| 快捷键 | ✅ | Alt+1 打开/聚焦 Project、Alt+0 Commit、Alt+9 Git、Alt+F12 Terminal；从会话页首次按下会“显示”而非“关闭” |
| 设置持久化 | ✅ | `C:\Users\<user>\.dsh\ide-toolwindows\settings.json` 由客户端写入 lastRoot/workspaceState |
| 路径围栏 / 同源准入 | ✅ | 未认证请求返回 403；`..` 越界被拒绝 |
| 主题跟随 | ✅ | 全部使用 `--dsw-alias-*`；Claude 皮肤下按钮/高亮随品牌色 |
| **按类型文件图标** | ✅ | 实机放大核对：`Main.java` 咖啡杯、`app.ts` TS、`data.json` `{}`、`SVG` 图片、`query.sql` 数据库、`README.md` M↓、`run.ps1` `>_`、`style.css` `#`、普通文件灰色文档 |
| **Markdown 只读渲染** | ✅ | 打开 PRD：标题、表格、任务列表、emoji、代码卡片与 DSH 聊天一致（复用宿主 `MarkdownText`） |
| **Markdown 目录** | ✅ | 工具栏目录按钮打开右上角浮层；标题按层级缩进、当前标题高亮；点击标题滚动定位 |
| **只读 / 编辑开关** | ✅ | 默认只读；点击「编辑」进入 CodeMirror（行号、Markdown 语法高亮）；点击「只读」回到渲染预览 |
| **未保存状态** | ✅ | 编辑后标签出现橙点、工具栏「未保存」、保存按钮变主色；`Ctrl+Z` 回到原文后脏标记消失 |
| **保存（Ctrl+S / 按钮）** | ✅ | 实机保存 `save-test.md`：toast「已保存」、脏标记清除；磁盘内容更新且 **UTF-8 BOM 保持不变**（`EF BB BF` 开头，49 字节） |
| **未保存关闭确认** | ✅ | 修改后点标签 × 打开「未保存的修改」确认；「放弃修改」关闭标签并丢弃草稿，磁盘保持已保存版本 |
| 设置新增项 | ✅（实机） | 设置 → IDE 工具窗口 → 编辑器：打开文件默认只读、渲染 Markdown，默认均开启；说明文案正确 |

## 已知限制（V1 规格内）

- 终端会话随面板卸载结束；DSH 重启不恢复（规格允许）。
- 宿主侧条图标无法显示数字徽标，徽标画在插件自绘 stripe。
- 关闭工作台面板即关闭所有终端会话（`deactivate` 清空会话）。
- 开发期直接改 `dist/client.js` 会触发 Client HMR 重载并重置面板选择；
  正式使用无此现象。

## 最终状态

- **全部验收项均已通过**（33 项自动化测试 + 实机核对，含重启后合并提交 first-parent 差异）。
- V1.1 增强（0.2.0）：按类型文件图标、Markdown 只读渲染 + 目录、默认只读的编辑开关（CodeMirror）、
  脏标记 / 保存 / 还原 / 关闭确认、BOM 与换行保持；`fs.write` 已由 bundle reload 加载并实机保存成功。
- Git 表新增窄宽响应：底部面板宽度 < 640px 时隐藏作者/日期两列，把空间留给提交消息。
- 验收过程只读取了 `D:\Harness\deepseek-harness`（打开日志/差异、输入消息但未提交）；
  曾弹出的 Discard 对话框已取消，文件与 index 均未改动（`git status` 仍为两个 untracked 文件）。
- 本插件测试用的临时仓库、演示文件、截图与 `.render-tmp` 均已清理；`settings.json` 的 `lastRoot`
  恢复为 `D:\Code\Node\DSH-IDE-TOOLWINDOWS-ROOT`，`workspaceState` 清空。
