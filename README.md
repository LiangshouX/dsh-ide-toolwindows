# dsh-ide-workbench

**IDE Workbench（IDE 工作台）** —— 为 DeepSeek Harness（DSH）提供一套 JetBrains 式工作台：
**Project · Commit · Terminal · Git** 四个工具窗围绕插件自有的编辑器区工作，共享同一份实时仓库模型；
预览 / 固定标签语义完全可控，键盘工作流对齐 IDEA。

> English: [README_EN.md](README_EN.md)

## 能力总览

| 工具窗 / 区域 | 快捷键 | 行为 |
|---|---|---|
| **Project** | `Alt+1` | 惰性文件树；JetBrains 状态色（红=未跟踪、绿=新增、蓝=已修改，目录递归染色）；仅品牌字形图标；单击选中、双击打开/展开；Ctrl/Shift 多选；F2 重命名、Delete 删除（优先进回收站，失败时二次确认）、F5 复制、F6 移动、Ctrl+X/C/V、拖拽（Ctrl=复制）；新建文件/目录；收藏夹；树内过滤（目录过滤 / 全项目文件名搜索两种模式）；右键菜单显示快捷键提示 |
| **Editor** | — | 文件默认只读；打开模式三档可设（自动 / 始终可编辑 / 始终只读），自动档下 ≤1 MiB 的文本可直接编辑（CodeMirror 6，语法高亮），超限以只读打开；`Ctrl+S` 保存、还原丢弃、脏点标记、关闭脏标签三选一询问；外部程序并发修改触发 stale-file 冲突提示；编辑器内查找/替换栏；原子保存并保留原编码（UTF-8 / BOM / UTF-16）与换行符 |
| **Markdown** | — | 用宿主 `MarkdownText` 渲染（与 DSH 聊天一致的排版 / 表格 / 任务列表 / 代码卡）；大纲导航按钮；Preview / Source 切换 |
| **搜索** | `Ctrl+P` / `Ctrl+Shift+F` | Quick Open 按文件名打开全项目文件；Find in Files（git grep）全项目搜索，命中以编辑器标签打开并定位行号；`Ctrl+Shift+F` 被外层占用时备用键 `Ctrl+Alt+F` |
| **Commit** | `Alt+0` | `Changes` / `Unversioned` 两组，勾选=纳入本次提交且不移动行；Changelist；按目录分组；Change View（Working Tree / Last Revision / Latest）+ Jump to Source + Revert；行/块级暂存；可选 pre-commit 命令；最近消息；Amend；`Commit` / `Commit and Push` |
| **Terminal** | `Alt+F12` | 真实 PTY（WebSocket + xterm.js）；新建 / 重命名 / 关闭（运行中先确认）；shell profiles；UTF-8 环境；选中即复制；`Ctrl+Shift+V` 粘贴 |
| **Git** | `Alt+9` | 分页提交表 + 车道式 commit graph；分支 / 作者 / 消息 / 路径过滤；单击 = 右侧 Drawer 底部详情（元信息、消息、变更文件，点文件看 diff），编辑器只显示完整 diff；Ctrl+点击两提交 Compare；折叠未变更块、单词级高亮；复制 SHA、checkout、revert、逐提交文件 diff；从 Project 树对指定路径定向查看历史 |
| **Commit message** | `Ctrl+K` | 打开 Commit 并聚焦消息框（IDEA 对齐） |
| **Push** | `Ctrl+Shift+K` | 在工作台内推送当前分支 |

所有快捷键可在 **设置 → IDE 工作台** 中重绑。

### 编辑器区与布局

- 标签体系：Preview 标签复用、双击 pin 成固定标签；diff / commit 标签有独立工具栏；
  关闭工作台面板再回来，终端会话与 scrollback 保留（切换对话不销毁 PTY）。
- 工作台 `F11` / 全屏按钮：侧栏面板在全屏与停靠间切换，保留打开的标签与分栏。
- 窗格 ≥560px 保持左右分栏（Project/Commit 在左、编辑器在右、Git/Terminal 在编辑器下方）；
  更窄时上下堆叠，Project/Commit 与 Git/Terminal 两组互斥并自动聚焦内容。
- 状态栏显示光标行列、编码 / 换行符。

### 外部 IDE 联动

- Project 树文件或编辑器标签右键 → **Open in IDE** → IntelliJ IDEA / WebStorm / Visual Studio Code。
- 设置 → IDE 工作台 → 外部 IDE：可分别指定三个可执行文件路径，留空自动探测
  （Windows 支持 `idea64.exe` / `webstorm64.exe` / `Code.exe`，并扫描 JetBrains 安装目录）。
- 外部 IDE 打开的是磁盘上的已保存文件；工作台内未保存的编辑请先保存。启动失败会显示原因。

## 工作区 vs IDE 项目根

DSH 工作区常是容器：根本身不是 Git 仓库，一级子目录才是。Project 面板头部的项目名下拉可选择
工作区根或任一一级子目录（含 `.git` 的带 Git 徽标；隐藏目录与 `node_modules` 不列出）。
选择按工作区持久化（`projectRoots`），切换后 Project 树、Git/Commit 数据、新终端会话的 cwd
与保存的标签状态一并切换；当前目录不是仓库时，四个窗口都会给出「选择 Git 子项目」引导。

## 与 DSH 的集成

- **入口**：会话头部按钮、`Ctrl+N` 新建会话行、侧栏底部常驻动作，三处均可打开工作台
  （原生 `sidebar.right.pane.tab`，与聊天并排；皮肤隐藏头部工具时底部入口仍可用）。
- **会话连续性**：同一 DSH 工作区的会话共享一份工作台状态——切换会话（含新建）保持文件树、
  打开的标签与 Git 上下文；工作台在被离开的会话中可见时，进入新会话自动重新打开。
  切换对话（面板）不销毁终端；切换 Session 时终端进程与编辑器撤销栈会重建。
- **聊天文件链接**：用户 `@` 引用与助手 Markdown 链接默认在工作台打开，展开文件树并定位到
  `#L24` 这样的行号；工作区外的文件自动降级到 DSH 自带侧栏；在工作区内但不在当前 IDE 项目内时，
  先询问是否把 IDE 项目拓宽到工作区根。设置 → IDE 工作台 → 聊天文件链接可切回始终使用 DSH 侧栏。
- **文件预览降级**：右键文件或标签 → 在侧栏标签中打开，用 DSH 自带预览查看；HTML 文件右上角
  提供两个浮动动作——在 DSH 侧栏预览（地球图标）或用系统默认浏览器打开。
- **主题**：仅使用 `--dsw-alias-*` 令牌，明暗与皮肤完全跟随宿主。

## 安全与数据

- Git 全部走系统 CLI（argv 数组，绝无 shell 字符串），凭证管理器、hooks 与 git config 原样生效；
  路径从 `status --porcelain=v2 -z`、`diff --numstat -z` 与 `log` 记录流解析。
- 文件读写经过路径围栏（越界 403），保存原子化并保留原编码与换行符。
- 每个 HTTP / WebSocket 路由都经过与 `/api` 相同的 Connection 准入围栏。
- 设置持久化在 `$DSH_HOME/ide-workbench/settings.json`（`~/.dsh`；宿主导出 `DSH_PROFILE_DIR` 时
  使用 profile 目录），含快捷键、Shell、git 路径、打开模式、UI 几何、每工作区展开目录与打开标签。

## 已知限制

- 项目选择器只扫描工作区**一级**子目录，不递归发现仓库。
- DSH 重启不恢复终端会话（PTY 随进程结束）。
- 宿主侧条图标不支持数字徽标（徽标绘制在插件自绘的 stripe 上）。
- Markdown 预览暂不把相对图片 / 链接重写为本地路径（http(s) 外链可用）。
- 不做：交互式 rebase、merge 冲突三方编辑、stash、blame、fetch/pull、分屏终端。
- `Ctrl+Shift+F` 可能被 DSH / 浏览器外层截获 → 提供备用键 `Ctrl+Alt+F`。

## 安装

本地目录：

```sh
dsh plugin install /绝对路径/dsh-ide-workbench
```

或 DSH 设置 → Plugins → 从目录安装。运行时唯一依赖 `ws`（宿主 PTY 传输）；客户端为预构建
单文件（`dist/client.js`，已打包 xterm）。

GitHub：

```sh
git clone https://github.com/LiangshouX/dsh-ide-workbench.git
cd dsh-ide-workbench
npm install --omit=dev    # 仅运行时依赖 ws；开发才需要完整 npm install
dsh plugin install .
```

仓库自带构建好的客户端，克隆后无需构建步骤。

## 开发

```sh
npm install
npm run build      # 将 src/client 打包为 dist/client.js（React 外置）
npm test           # 宿主 git/diff/graph + SSR 渲染冒烟测试
```

源码结构：

```
src/index.js            宿主半边：围栏 HTTP API + 终端 WebSocket
src/host/git.js         git CLI 适配器，status/log/numstat 解析
src/host/workspace.js   路径围栏、目录树、文件预览、shell
src/host/settings-store.js  JSON 设置持久化
src/client/             工作台 UI（store、各面板、diff、graph、xterm）
```

## 许可证

MIT。xterm.js 与 ws 遵循各自的 MIT 许可。
