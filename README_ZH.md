# dsh-ide-toolwindows

**IDE 工具窗口** —— 为 DeepSeek Harness 提供一套 JetBrains 式工具窗：
**Project · Commit · Terminal · Git** 四窗共享同一份实时仓库状态，中间是插件自有的编辑器区（因此预览标签 / 固定标签的语义与 IDE 完全一致）。

## 功能

| 工具窗 | 快捷键 | 行为 |
|---|---|---|
| **Project** | `Alt+1` | 懒加载文件树 + Git 着色（蓝=已修改、绿=新增/未跟踪、红=冲突）+ **按类型区分的图标**（Java 咖啡杯、JS/TS、Python、Markdown、JSON、SQL、Shell、图片…）。单击打开**预览标签**（斜体，后续单击复用同一个）；双击**固定**。右键：复制相对/绝对路径、在资源管理器中显示、刷新。 |
| **编辑器** | — | 文件默认以**只读**打开。文本标签可在只读 / **编辑** 间切换（CodeMirror 6，语法高亮）；`Ctrl+S` 保存、还原按钮丢弃修改、未保存时标签显示圆点，关闭脏标签会二次确认。 |
| **Markdown** | — | Markdown 默认用 **DSH 自身的 `MarkdownText` 渲染**（排版、表格、任务列表、代码卡片与聊天一致），并提供**文档目录**按钮快速跳转标题；预览 / 源码 可切换。 |
| **Commit** | `Alt+0` | 已暂存 / 未暂存 / 未跟踪三组，支持逐文件暂存、取消暂存、丢弃；统一或并排差异；**行级 / 块级暂存**；最近提交消息下拉；`修订提交`；`提交` 与 `提交并推送`。侧条徽标 = 未暂存文件数。 |
| **Terminal** | `Alt+F12` | 基于 WebSocket 的真实 PTY 会话，xterm.js 渲染；新建 / 重命名 / 关闭（运行中任务二次确认）；Shell 配置、UTF-8 环境、选中即复制、`Ctrl+Shift+V` 粘贴。 |
| **Git** | `Alt+9` | 懒加载提交表（每页 200 条）+ 车道**提交图谱**；分支 / 作者 / 消息过滤；完整提交详情与差异；复制 SHA、检出（游离 HEAD，需确认）、还原提交。 |
| **提交消息** | `Ctrl+K` | 打开 Commit 并聚焦消息框（对齐 IDEA）。 |
| **推送** | `Ctrl+Shift+K` | 在工作台内推送当前分支。 |

所有快捷键均可在 **设置 → IDE 工具窗口** 中重新绑定。

## 与 DSH 的集成方式

- 一个 `sidebar.panellist` 图标 + 一个 `main` 面板承载整个工作台；四个工具窗在工作台内锚定（左侧条 Project/Commit，底部 Terminal/Git，可拖拽调整尺寸）。
- Git 直接调用系统 CLI（argv 数组，绝不拼 shell 字符串），因此凭据管理器、hook 与你的 git 配置全部生效；解析使用 `status --porcelain=v2 -z`、`diff --numstat -z` 与自定义 `log` 流。
- 文件读写走带路径围栏的 `fs` API；保存为原子写入，并保留原文件的编码（UTF-8/BOM/UTF-16）与换行符。所有 HTTP/WebSocket 路由与 `/api` 使用同一 Connection 准入校验。
- 设置（快捷键、Shell、git 路径、界面几何、每个工作区的展开目录与打开的标签）持久化在 DSH 主目录的 `ide-toolwindows/settings.json`（`$DSH_HOME` / `~/.dsh`；宿主导出 `DSH_PROFILE_DIR` 时为 profile 目录）。
- UI 使用 React 渲染，样式只引用 `--dsw-alias-*` 主题令牌，明暗主题与皮肤自动跟随。

## V1 明确不做

- 树内新建 / 重命名 / 删除（V2）。
- Markdown 预览暂不重写相对图片/链接到本地文件；http(s) 外部图片可正常显示。
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
