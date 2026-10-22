# dsh-ide-toolwindows

**IDE 工具窗口** —— 为 DeepSeek Harness 提供一套 JetBrains 式工具窗：
**Project · Commit · Terminal · Git** 四窗共享同一份实时仓库状态，中间是插件自有的编辑器区（因此预览标签 / 固定标签的语义与 IDE 完全一致）。

## 0.3 更新（JetBrains 化）

- **Project**：单击选中、双击打开/展开；多选；F2 重命名、Delete 删除、F5 复制、F6 移动、Ctrl+X/C/V、拖拽移动（Ctrl=复制）、新建文件/目录、收藏夹；IDEA 语义着色（红=未跟踪、绿=已 add、蓝=修改）与目录递归上色；忽略/排除文件；纯图形品牌图标。
- **Commit**：两组（改动 / 未版本控制），勾选=纳入提交且行不移动；变更列表、按目录分组；Change View（工作区 / 上次修订 / 最新）；可选提交前任务（测试 / 清理 / 优化导入）。
- **Git**：详情在底部面板（单击），编辑区只显示 diff；提交内文件列表与单文件 diff；Project 右键按路径查看历史；Ctrl+点击两个提交 Compare；未变更块折叠、单词级高亮；提交 diff 只读。
- **布局/状态栏**：点击开合工具窗（Project 与 Commit 互斥）、收起全部、全屏；状态栏显示行列与编码/换行符。
- 规格：[V2 PRD](docs/PRD-v2.md) · [V1 PRD（归档）](docs/PRD-v1.md)。

## 功能

| 工具窗 | 快捷键 | 行为 |
|---|---|---|
| **Project** | `Alt+1` | 懒加载文件树 + IDEA 语义着色（红=未跟踪、绿=已 add、蓝=修改，目录递归上色）+ **纯图形品牌图标**。项目名下拉框选择 **IDE 项目根目录**。单击选中、双击打开/展开；Ctrl/Shift 多选；F2 重命名、Delete 删除、F5 复制、F6 移动、Ctrl+X/C/V、拖拽（Ctrl=复制）、新建文件/目录、收藏夹；右键菜单带快捷键提示。 |
| **编辑器** | — | 文件默认以**只读**打开。文本标签可在只读 / **编辑** 间切换（CodeMirror 6，语法高亮）；`Ctrl+S` 保存、还原按钮丢弃修改、未保存时标签显示圆点，关闭脏标签会二次确认。 |
| **Markdown** | — | Markdown 默认用 **DSH 自身的 `MarkdownText` 渲染**（排版、表格、任务列表、代码卡片与聊天一致），并提供**文档目录**按钮快速跳转标题；预览 / 源码 可切换。 |
| **Commit** | `Alt+0` | `改动` / `未版本控制的文件` 两组，勾选=纳入提交且行不移动；变更列表、按目录分组；Change View（工作区 / 上次修订 / 最新）+ 跳转源码 / 还原；行级/块级暂存；可选提交前任务；最近消息；`修订提交`；`提交` 与 `提交并推送`。 |
| **Terminal** | `Alt+F12` | 基于 WebSocket 的真实 PTY 会话，xterm.js 渲染；新建 / 重命名 / 关闭（运行中任务二次确认）；Shell 配置、UTF-8 环境、选中即复制、`Ctrl+Shift+V` 粘贴。 |
| **Git** | `Alt+9` | 懒加载提交表 + 车道**提交图谱**；分支 / 作者 / 消息 / 路径过滤；详情在底部面板（元信息、消息、变更文件列表，点文件看该提交内 diff），编辑区只显示完整 diff；Ctrl+点击两个提交 Compare；未变更块折叠、单词级高亮；复制 SHA、检出、还原、单文件提交 diff。 |
| **提交消息** | `Ctrl+K` | 打开 Commit 并聚焦消息框（对齐 IDEA）。 |
| **推送** | `Ctrl+Shift+K` | 在工作台内推送当前分支。 |

所有快捷键均可在 **设置 → IDE 工具窗口** 中重新绑定。

### 工作区 vs. IDE 项目根目录

DSH 工作区经常只是一个「容器」：根目录本身不是 Git 仓库，而它的一级子目录才是
独立仓库。IDE 的 Project 可以指向其中任意一个：

- 点击 Project 面板标题旁的项目名下拉框（或顶部工作区菜单 → **选择 IDE 项目**）。
- 选择工作区根目录或一级子目录；带 `.git` 的目录显示 **Git** 标记，隐藏目录和
  `node_modules` 不会列出。
- Project 文件树、Git/Commit 数据、新建终端会话和标签状态都会切换到该目录；
  选择按**工作区**记忆在 `settings.json` 的 `projectRoots` 中，下次启动/刷新页面自动恢复。
- 当前目录不是仓库时，项目选择器、Git 窗口、Commit 窗口和空编辑器欢迎页都会
  提供「选择 Git 子项目」入口。

## 与 DSH 的集成方式

- 在聊天顶部点击 **IDE 工具窗口** 图标，或在右侧边栏添加页面中选择 **IDE 工具窗口**；工作台作为 `sidebar.right.pane.tab` 标签与聊天并排展示。需要先选中一个会话。
- 快捷键会打开右侧边栏。窄栏中项目树与编辑区上下排列；拉宽后恢复左右分栏。可通过 DSH 原生标签条拆分、浮动或全屏。每个会话的工作台独立，隐藏时暂停刷新。
- Git 直接调用系统 CLI（argv 数组，绝不拼 shell 字符串），因此凭据管理器、hook 与你的 git 配置全部生效；解析使用 `status --porcelain=v2 -z`、`diff --numstat -z` 与自定义 `log` 流。
- 文件读写走带路径围栏的 `fs` API；保存为原子写入，并保留原文件的编码（UTF-8/BOM/UTF-16）与换行符。所有 HTTP/WebSocket 路由与 `/api` 使用同一 Connection 准入校验。
- 设置（快捷键、Shell、git 路径、界面几何、每个工作区的展开目录与打开的标签）持久化在 DSH 主目录的 `ide-toolwindows/settings.json`（`$DSH_HOME` / `~/.dsh`；宿主导出 `DSH_PROFILE_DIR` 时为 profile 目录）。
- UI 使用 React 渲染，样式只引用 `--dsw-alias-*` 主题令牌，明暗主题与皮肤自动跟随。

## V1 明确不做

- 树内新建 / 重命名 / 删除（V2）。
- Markdown 预览暂不重写相对图片/链接到本地文件；http(s) 外部图片可正常显示。
- 项目根目录选择器只列出工作区根目录和**一级**子目录，不会递归发现多级仓库。
- 交互式 rebase、三方合并冲突编辑器、stash、blame、fetch/pull。
- 关闭工作台面板后终端会话结束（PTY 随面板销毁）；DSH 重启不恢复会话。
- 宿主侧条图标无法显示数字徽标，徽标画在工作台自绘侧条上。

## 本地安装

```sh
dsh plugin install /绝对路径/dsh-ide-toolwindows
```

或在 DSH 设置 → 插件中从目录安装。宿主依赖 `ws`（PTY 传输）；客户端是预构建单文件（`dist/client.js`，xterm 已内联）。

## 从 GitHub 安装

仓库：<https://github.com/LiangshouX/dsh-ide-toolwindows>

```sh
git clone https://github.com/LiangshouX/dsh-ide-toolwindows.git
cd dsh-ide-toolwindows
npm install --omit=dev    # 只安装宿主运行时依赖 ws
dsh plugin install .
```

仓库中已包含构建好的客户端，无需再执行客户端构建；仅在开发时需要完整 `npm install`。

## 开发

```sh
npm install
npm run build      # 将 src/client 打包为 dist/client.js（React 外置）
npm test           # 宿主 git/diff/graph + SSR 渲染冒烟测试
```

## 许可证

MIT。xterm.js 与 ws 遵循各自的 MIT 许可。
