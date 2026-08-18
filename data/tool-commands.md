# macOS 常用工具命令手册

这份手册记录当前 Mac 开发环境中常用的检查、安装、切换和维护命令。命令默认在 zsh 中执行，项目级语言版本由 mise 管理，PostgreSQL 由 Homebrew 管理。

## 环境与版本检查

**查看 macOS、芯片架构和当前 Shell**

确认系统版本、Apple Silicon 或 Intel 架构，以及当前登录 Shell。

```bash
sw_vers
uname -m
echo $SHELL
```

**检查常用工具版本**

快速确认 Homebrew、mise、Python、Node.js、npm、Java 和 PostgreSQL 客户端是否可用。

```bash
brew --version
mise --version
python --version
node --version
npm --version
java -version
psql --version
```

**确认命令实际来源**

排查 PATH 或版本切换问题时，先确认终端最终调用了哪个可执行文件。

```bash
which brew
which mise
which python
which node
which java
which psql
```

**查看当前 PATH**

按行查看 PATH，便于确认 Homebrew 和 mise 的路径顺序。

```bash
echo $PATH | tr ':' '\n'
```

## Homebrew

**更新 Homebrew 元数据**

获取最新的软件包定义，不会直接升级已经安装的软件。

```bash
brew update
```

**搜索和查看软件信息**

安装前先确认包名、版本、依赖和安装提示。

```bash
brew search postgresql
brew info postgresql@18
```

**安装软件包**

安装命令行软件使用 formula，图形应用通常使用 cask。

```bash
brew install postgresql@18
brew install --cask visual-studio-code
```

**查看已安装的软件**

分别列出 formula 和 cask，也可以查看指定包的文件。

```bash
brew list
brew list --cask
brew list postgresql@18
```

**检查可升级的软件**

只查看当前有哪些软件存在新版本，不执行升级。

```bash
brew outdated
```

**升级软件包**

警告：升级可能改变运行时或数据库行为。重要项目应先查看变更说明并备份数据。

```bash
brew upgrade
brew upgrade postgresql@18
```

**卸载软件包**

警告：卸载数据库等服务前先确认数据目录和备份，避免误删仍需使用的环境。

```bash
brew uninstall postgresql@18
brew uninstall --cask visual-studio-code
```

**检查 Homebrew 环境**

诊断常见配置问题，并清理旧版本下载缓存。

```bash
brew doctor
brew cleanup
```

**管理后台服务**

查看、启动、停止或重启由 Homebrew 管理的服务。

```bash
brew services list
brew services start postgresql@18
brew services stop postgresql@18
brew services restart postgresql@18
```

## mise

**查看当前生效版本**

显示当前目录最终解析出的工具版本及其配置来源。

```bash
mise current
mise current node
mise current java
```

**查看已安装版本**

列出全部工具，或只查看某一种语言的已安装版本。

```bash
mise ls
mise ls node
mise ls java
mise ls python
```

**查询可安装版本**

从版本列表中查找 Node、Python 或 Temurin JDK 的可用版本。

```bash
mise ls-remote node | tail
mise ls-remote python | tail
mise ls-remote java | rg 'temurin-(17|25)'
```

**安装指定版本**

下载并安装版本，但不会自动修改全局或项目配置。

```bash
mise install node@22.23.2
mise install python@3.13.15
mise install java@temurin-17.0.20+8
mise install java@temurin-25.0.4+7.0.LTS
```

**设置项目版本**

在当前项目写入 mise.toml。进入目录后自动使用项目版本，不影响用户全局配置。

```bash
mise use node@22.23.2
mise use java@temurin-17.0.20+8
```

**设置全局默认版本**

警告：这会改变没有项目级配置时的默认版本，执行前确认其他项目的兼容性。

```bash
mise use -g python@3.13.15
mise use -g node@24.19.0
mise use -g java@temurin-25.0.4+7.0.LTS
```

**临时使用指定版本运行命令**

不改配置文件，只让单次命令在指定版本环境中执行。

```bash
mise exec node@22.23.2 -- node --version
mise exec java@temurin-17.0.20+8 -- java -version
```

**安装配置中缺少的版本**

进入含 mise.toml 的项目后，一次安装所有尚未安装的工具。

```bash
mise install
```

## Python 与虚拟环境

**检查 Python 和 pip**

使用模块方式调用 pip，可确保 pip 与当前 Python 版本一致。

```bash
python --version
python -m pip --version
```

**创建项目虚拟环境**

在项目根目录创建 .venv，使依赖与系统及其他项目隔离。

```bash
python -m venv .venv
```

**激活和退出虚拟环境**

激活后，python 和 pip 会指向当前项目的 .venv。

```bash
source .venv/bin/activate
deactivate
```

**升级 pip 基础工具**

在虚拟环境中更新 pip、setuptools 和 wheel。

```bash
python -m pip install --upgrade pip setuptools wheel
```

**安装和查看依赖**

从 requirements.txt 安装项目依赖，并检查当前环境已安装内容。

```bash
python -m pip install -r requirements.txt
python -m pip list
```

**导出依赖版本**

将当前环境的精确依赖版本写入 requirements.txt，提交前应复查是否包含无关包。

```bash
python -m pip freeze > requirements.txt
```

**删除虚拟环境**

警告：确认当前目录确实是目标项目，删除后需要重新安装项目依赖。

```bash
rm -rf .venv
```

## Node.js、npm、Corepack、pnpm、yarn

**检查 Node.js 和包管理器**

确认当前项目使用的 Node.js、npm、Corepack、pnpm 和 yarn 版本。

```bash
node --version
npm --version
corepack --version
pnpm --version
yarn --version
```

**为当前项目启用 Node 22**

github-tools 项目固定使用 Node 22.23.2，mise 会把版本写入项目的 mise.toml。

```bash
mise install node@22.23.2
mise use node@22.23.2
```

**按锁文件安装 npm 依赖**

CI 和已有项目优先使用 npm ci，它要求 package-lock.json 与 package.json 一致并执行可重复安装。

```bash
npm ci
```

**新增或更新 npm 依赖**

npm install 会更新 node_modules，并可能更新 package-lock.json。

```bash
npm install
npm install <package-name>
npm install --save-dev <package-name>
```

**运行项目脚本**

查看可用脚本，并执行测试、代码检查、构建或开发服务器。

```bash
npm run
npm test
npm run lint
npm run build
npm run serve
```

**启用 Corepack**

Node 22 可通过 Corepack 管理 pnpm 和 yarn 的版本，避免直接全局安装多个包管理器。

```bash
corepack enable
corepack prepare pnpm@latest --activate
corepack prepare yarn@stable --activate
```

**使用 pnpm 安装依赖**

有 pnpm-lock.yaml 的项目使用冻结锁文件安装，避免意外改写锁文件。

```bash
pnpm install --frozen-lockfile
pnpm add <package-name>
pnpm add --save-dev <package-name>
```

**使用 yarn 安装依赖**

有 yarn.lock 的项目使用不可变安装，新增依赖时再由 yarn 更新锁文件。

```bash
yarn install --immutable
yarn add <package-name>
yarn add --dev <package-name>
```

**检查和升级 npm 依赖**

警告：升级依赖可能带来破坏性变更。先查看 outdated，再在分支中升级并运行测试。

```bash
npm outdated
npm update
```

**清理并重新安装 npm 依赖**

警告：删除 node_modules 前确认当前目录，随后使用锁文件重新安装。

```bash
rm -rf node_modules
npm ci
```

## JDK 17 与 JDK 25

**查看已安装的 JDK**

当前机器通过 mise 安装了 Temurin JDK 17 和 JDK 25。

```bash
mise ls java
```

**检查当前 Java 编译和运行版本**

java 与 javac 应来自同一套 JDK。

```bash
java -version
javac -version
which java
```

**项目使用 JDK 17**

在需要 Java 17 的项目目录执行，写入该项目的 mise.toml。

```bash
mise use java@temurin-17.0.20+8
java -version
```

**项目使用 JDK 25**

在需要最新 LTS 环境的项目目录执行，不影响其他已有项目。

```bash
mise use java@temurin-25.0.4+7.0.LTS
java -version
```

**临时运行 JDK 17 或 JDK 25**

不修改项目配置，适合临时验证构建在不同 JDK 上的兼容性。

```bash
mise exec java@temurin-17.0.20+8 -- java -version
mise exec java@temurin-25.0.4+7.0.LTS -- java -version
```

**查看 JDK 安装目录**

排查 IDE 或 JAVA_HOME 配置时，获取 mise 管理的实际 JDK 路径。

```bash
mise where java@temurin-17.0.20+8
mise where java@temurin-25.0.4+7.0.LTS
```

## PostgreSQL

**检查 PostgreSQL 版本和服务**

当前机器使用 Homebrew 的 PostgreSQL 18，先确认客户端版本与服务状态。

```bash
psql --version
brew services list
```

**启动、停止和重启 PostgreSQL**

停止或重启前确认没有正在执行的写入、迁移或长事务。

```bash
brew services start postgresql@18
brew services stop postgresql@18
brew services restart postgresql@18
```

**检查数据库是否可连接**

pg_isready 会快速报告本地 PostgreSQL 是否接受连接。

```bash
pg_isready
```

**连接本地 PostgreSQL**

默认连接 postgres 数据库，也可以明确指定数据库名和用户。

```bash
psql postgres
psql -d <database-name> -U <user-name>
```

**使用 psql 元命令查看对象**

进入 psql 后查看数据库、角色、表，切换数据库并退出。

```bash
\l
\du
\c <database-name>
\dt
\q
```

**创建数据库和角色**

创建本地开发数据库及角色，密码应在交互提示中输入，不要写进脚本或仓库。

```bash
createdb <database-name>
createuser --interactive --pwprompt <user-name>
```

**删除数据库**

警告：dropdb 会永久删除目标数据库。执行前确认名称并完成可恢复备份。

```bash
dropdb <database-name>
```

**备份数据库**

使用自定义格式便于通过 pg_restore 选择性恢复。

```bash
pg_dump --format=custom --file=<backup-file>.dump <database-name>
```

**恢复数据库备份**

警告：恢复可能覆盖现有对象。建议恢复到新建数据库并先验证数据。

```bash
createdb <restore-database-name>
pg_restore --dbname=<restore-database-name> <backup-file>.dump
```

**查看 Homebrew 安装位置**

查找 PostgreSQL 二进制、配置示例和版本目录时使用。

```bash
brew --prefix postgresql@18
brew info postgresql@18
```

## zsh 与本地代理

**重新加载 zsh 配置**

修改 ~/.zshrc 后让当前终端立即应用新配置。

```bash
source ~/.zshrc
```

**查看代理函数定义**

确认 proxy_on 和 proxy_off 已由 ~/.zshrc 加载。

```bash
type proxy_on
type proxy_off
```

**手动开启或关闭代理**

本机 10808 端口可用时开启 SOCKS5 代理，不需要时清除相关环境变量。

```bash
proxy_on
proxy_off
```

**检查当前代理环境变量**

验证当前命令行会话是否已经继承 ALL_PROXY 和 NO_PROXY。

```bash
env | rg -i '^(all_proxy|no_proxy)='
```

**检查本地代理端口**

返回成功表示 127.0.0.1:10808 正在监听，可用于自动启用代理。

```bash
/usr/bin/nc -z 127.0.0.1 10808
echo $?
```

**按端口状态自动切换代理**

这段逻辑适合放在 ~/.zshrc：端口打开时执行 proxy_on，否则执行 proxy_off。

```bash
if /usr/bin/nc -z 127.0.0.1 10808 2>/dev/null; then
  proxy_on
else
  proxy_off
fi
```

**只为单条命令使用代理**

不改变当前 Shell 的长期状态，只让这次网络请求经过本地 SOCKS5 代理。

```bash
ALL_PROXY=socks5h://127.0.0.1:10808 curl -I https://github.com
```

**验证代理出口**

分别查看直连和启用本地代理后的出口地址，便于确认配置是否生效。

```bash
curl https://api.ipify.org
proxy_on
curl https://api.ipify.org
proxy_off
```

---

# macOS 常用快捷键速查与组合逻辑

这份速查表面向从 Windows 切换到 Mac 的开发者。快捷键使用 macOS 的符号表示，默认以苹果自带键盘和常见应用为准。应用可以覆盖系统快捷键，输入法快捷键也可能在系统设置中被改过。

> 记法：`⌘C` 表示按住 Command 再按 C，修饰键和字母的先后顺序不影响结果。带 `+` 的 Windows 写法只是为了方便对照。

## 先记住五个键

| 符号 | 英文名称 | 可以怎样理解 | 常见作用 |
| --- | --- | --- | --- |
| `⌘` | Command | Mac 上最接近 Windows 的 `Ctrl` | 应用命令，例如复制、保存、关闭窗口 |
| `⌥` | Option | 选择另一种动作或更细的粒度 | 单词级移动、备用菜单项、特殊字符 |
| `⌃` | Control | 控制系统行为，或发送控制字符 | 切换输入法、终端中断、窗口管理 |
| `⇧` | Shift | 扩展、反向或选择范围 | 选中范围、撤销的反向操作、截图组合 |
| `Fn` / `🌐` | Function / Globe | 调用键盘第二层功能 | Home、End、Page Up、输入法和表情 |

### 为什么 Mac 常用 Command，而不是 Control

早期 Mac 把 Command 设计成应用命令键，菜单中的复制、保存等动作都绑定在它上面。Windows 后来普遍使用 `Ctrl` 完成同类动作，所以从 Windows 迁移时，可以先把“应用级 Ctrl”整体替换成 `⌘`。

`⌃` 在 macOS 仍有自己的职责。它更常用于系统级动作、输入法切换，以及终端里的控制字符。不要把所有 Windows 的 `Ctrl` 都机械地换成 `⌃`。

### 为什么字母经常这样选

很多字母来自英文功能名：`C` 是 Copy，`S` 是 Save，`F` 是 Find，`Q` 是 Quit，`W` 是 Window。`X`、`C`、`V` 是一组历史悠久的编辑快捷键，`V` 并不是某个中文词的首字母。

方向键和修饰键则采用统一的层级：方向键负责移动，`⇧` 把移动变成选择，`⌥` 把移动粒度变成单词，`⌘` 把移动范围扩展到行或文档，`Fn` 把方向键变成 Home、End 或翻页。

## 从 Windows 迁移的第一组

| Windows 习惯 | macOS | 作用 | 组合逻辑 |
| --- | --- | --- | --- |
| `Ctrl+C` | `⌘C` | 复制 | `C` 是 Copy，应用命令使用 Command |
| `Ctrl+X` | `⌘X` | 剪切 | `X` 形成剪刀形状，沿用编辑器传统 |
| `Ctrl+V` | `⌘V` | 粘贴 | 与剪切、复制组成固定编辑键组 |
| `Ctrl+Z` | `⌘Z` | 撤销 | `Z` 是图形界面长期沿用的 Undo 约定 |
| `Ctrl+Y` | `⌘⇧Z` | 重做 | `⇧` 把撤销动作反向，部分应用另支持 `⌘Y` |
| `Ctrl+A` | `⌘A` | 全选 | `A` 是 All |
| `Ctrl+F` | `⌘F` | 查找 | `F` 是 Find |
| `Ctrl+S` | `⌘S` | 保存 | `S` 是 Save |
| `Ctrl+P` | `⌘P` | 打印 | `P` 是 Print |
| `Ctrl+N` | `⌘N` | 新建窗口或文档 | `N` 是 New |
| `Ctrl+O` | `⌘O` | 打开文件 | `O` 是 Open |
| `Alt+Tab` | `⌘Tab` | 切换应用 | Tab 在应用之间循环，Command 负责应用层级 |
| `Alt+F4` | `⌘W` / `⌘Q` | 关闭窗口 / 退出应用 | `W` 是 Window，`Q` 是 Quit |
| `Ctrl+Shift+Esc` | `⌥⌘Esc` | 强制退出应用 | `Esc` 表示退出当前状态，Option+Command 提升为系统动作 |
| `Win+Shift+S` | `⇧⌘4` / `⇧⌘5` | 截图 | Shift+Command 进入截图功能，数字区分范围或工具 |

## 高频编辑和窗口快捷键

| 快捷键 | 作用 | 为什么这样组合 |
| --- | --- | --- |
| `⌘W` | 关闭当前窗口、标签页或文档 | `W` 是 Window；它只关闭当前容器，不退出应用 |
| `⌘Q` | 退出当前应用 | `Q` 是 Quit；这是关闭应用的更强动作 |
| `⌘H` | 隐藏当前应用 | `H` 是 Hide，应用仍在运行 |
| `⌘M` | 最小化当前窗口 | `M` 是 Minimize |
| `⌘,` | 打开当前应用设置 | 逗号是 macOS 菜单中 Preferences 的传统快捷键 |
| `⌘?` | 打开帮助 | 问号表示 Help 问题入口 |
| `⌘`` | 在同一应用的多个窗口间切换 | 反引号位于 Tab 附近，适合在应用内循环窗口 |
| `⇧⌘`` | 反向切换同一应用的窗口 | Shift 通常表示反向循环 |
| `⌘Tab` | 切换应用 | Tab 是循环焦点，按住 Command 可继续选择 |
| `⌃⌘F` | 进入或退出全屏 | `F` 是 Full Screen |
| `⌃↑` | 打开 Mission Control | 向上表示把所有窗口展开到桌面视图 |
| `⌃↓` | 查看当前应用的所有窗口 | 向下把视角收回到当前应用 |
| `⌘Space` | 打开 Spotlight | Space 是快速呼出的全局搜索入口 |
| `⌥⌘D` | 显示或隐藏 Dock | `D` 是 Dock |
| `⌃⌘Q` | 锁定屏幕 | Control+Command 组合用于系统级安全动作 |
| `⇧⌘Q` | 注销当前用户 | Shift+Command 表示离开当前会话 |
| `⌘.` | 取消当前操作 | 句点是“停止当前动作”的传统约定 |

## 文本移动和删除

这些组合在 Cocoa 文本框、编辑器和浏览器中通常有效，具体应用可能有差异。

| 快捷键 | 作用 | 组合逻辑 |
| --- | --- | --- |
| `←` / `→` | 移动一个字符 | 方向键直接控制光标 |
| `⌥←` / `⌥→` | 按单词移动 | Option 把移动粒度扩大到一个词 |
| `⌘←` / `⌘→` | 移到行首或行尾 | Command 把范围扩大到当前行 |
| `⌘↑` / `⌘↓` | 移到文档开头或结尾 | Command 再扩大一级，作用于整个文档 |
| `⇧` 加任意移动键 | 选中移动经过的文本 | Shift 把“移动”变成“扩展选择” |
| `⌥⇧←` / `⌥⇧→` | 按单词选择 | Option 定义粒度，Shift 定义选择 |
| `⌘⇧←` / `⌘⇧→` | 选到行首或行尾 | Command 定义范围，Shift 定义选择 |
| `Fn←` / `Fn→` | Home / End | MacBook 没有独立 Home、End，Fn 加方向键补足物理按键 |
| `Fn↑` / `Fn↓` | Page Up / Page Down | Fn 把上下方向键映射为翻页 |
| `⌥Delete` | 删除前一个单词 | Option 把 Delete 的粒度扩大到一个词 |
| `⌘Delete` | 删除到行首 | Command 把删除范围扩大到当前行 |

## Finder 文件操作

先按 `⌘Tab` 切到 Finder，再使用以下快捷键。文件删除和清空废纸篓属于有风险操作。

| 快捷键 | 作用 | 为什么这样组合 |
| --- | --- | --- |
| `⌘N` | 新建 Finder 窗口 | `N` 是 New |
| `⇧⌘N` | 新建文件夹 | Shift 表示新建的专用容器，`N` 仍是 New |
| `⌘I` | 显示简介 | `I` 是 Info |
| `⌘D` | 复制项目 | `D` 是 Duplicate |
| `⌘Delete` | 将项目移到废纸篓 | Command 把 Delete 应用于文件对象 |
| `⇧⌘Delete` | 清倒废纸篓 | Shift 提升为更彻底的删除动作，执行前会确认 |
| `Space` | Quick Look 预览 | 空格打开预览，不需要进入文件 |
| `⌘↑` | 返回上一级文件夹 | 向上表示父级目录 |
| `⌘↓` | 打开选中的文件或文件夹 | 向下进入当前选择 |
| `⇧⌘G` | 前往文件夹 | `G` 是 Go |
| `⌘K` | 连接服务器 | K 是 Finder 传统快捷键，属于约定而非英文首字母 |
| `⌘1` / `⌘2` / `⌘3` / `⌘4` | 图标、列表、分栏、画廊视图 | 数字直接对应四种视图，不依赖字母 |
| `⌥⌘V` | 把已复制项目移动到当前位置 | Option 把 Paste 的动作改成 Move |

## 截图和录屏

| 快捷键 | 作用 | 组合逻辑 |
| --- | --- | --- |
| `⇧⌘3` | 截取整个屏幕 | 数字 3 代表完整屏幕快捷入口 |
| `⇧⌘4` | 选择区域截图 | 数字 4 进入区域选择 |
| `⇧⌘4` 后按 `Space` | 截取窗口 | 在区域模式中用 Space 切换到窗口选择 |
| `⇧⌘5` | 打开截图和录屏控制栏 | 数字 5 进入完整工具面板 |
| `⇧⌘6` | 截取 Touch Bar | 仅适用于带 Touch Bar 的 Mac |

这组快捷键都使用 `⇧⌘`，因为截图属于系统级动作；数字让 3、4、5 形成从“全屏、区域、工具栏”的记忆顺序。

## 输入法和中文标点

| 快捷键 | 作用 | 为什么这样组合 |
| --- | --- | --- |
| `⌃Space` | 切换输入来源 | Control 用于输入法这一系统层级；如果与应用冲突，可在系统设置中改键 |
| `Caps Lock` | 在中英文之间切换 | 这是部分 macOS 中文输入法的默认设置，是否生效取决于输入法选项 |
| `⌥⇧H` | 切换“使用半角标点” | `H` 是 Half-width 的首字母 |
| `⌥⇧B` | 打开颜文字和标点窗口 | B 是苹果输入法的历史约定，不是中文“标点”的拼音首字母 |
| `⌥⇧E` | 打开当前输入法帮助 | E 是输入法帮助入口的历史快捷键 |
| `⌃⇧P` | 切换到简体拼音输入源 | P 是 Pinyin |
| `⌃⇧S` | 切换到双拼输入源 | S 是 Shuangpin |
| `⌃⇧W` | 切换到五笔输入源 | W 是 Wubi |

苹果自带简体拼音中，`⇧Space` 用于候选词相关操作，不是半角标点切换。搜狗等第三方输入法可能把 `⇧Space` 或 `⌃.` 用作全角、半角切换，需以该输入法的设置为准。

## 浏览器和常见应用

| 快捷键 | 作用 | 组合逻辑 |
| --- | --- | --- |
| `⌘L` | 聚焦地址栏 | `L` 是 Location |
| `⌘T` | 新建标签页 | `T` 是 Tab |
| `⇧⌘T` | 恢复刚关闭的标签页 | Shift 常表示恢复或反向动作 |
| `⌘W` | 关闭当前标签页 | `W` 是 Window，也适用于标签页容器 |
| `⌘R` | 刷新页面 | `R` 是 Reload |
| `⌘F` | 查找页面文字 | `F` 是 Find |
| `⌘+` / `⌘-` | 放大或缩小 | 加减号直接表达缩放方向 |
| `⌘0` | 恢复默认缩放 | 0 表示回到基准值 |
| `⌘[` / `⌘]` | 后退 / 前进 | 方括号方向对应历史记录方向 |
| `⌘1` 到 `⌘9` | 切换到对应标签页 | 数字直接对应标签页位置 |
| `⌘K` | 插入链接或打开快速命令 | 编辑器和浏览器都把 K 作为历史快捷键，含义随应用变化 |

## 终端快捷键

终端里以 `⌃` 开头的组合通常不是 macOS 应用菜单快捷键，而是 shell 的控制字符。它们由 readline、zsh 或终端程序解释。

| 快捷键 | 作用 | 为什么这样组合 |
| --- | --- | --- |
| `⌃C` | 中断当前命令 | C 是 Control-C，中断信号的 Unix 传统 |
| `⌃D` | 输入 EOF，或退出当前 shell | D 是终止输入流的控制字符 |
| `⌃Z` | 暂停当前前台任务 | 终端控制字符，不是图形界面的 Undo |
| `⌃L` | 清除可见终端内容 | L 是 Line，刷新当前显示区域 |
| `⌃R` | 反向搜索命令历史 | R 是 Reverse search |
| `⌃A` / `⌃E` | 移到命令行首 / 尾 | 沿用 Emacs 行编辑约定，A 是 beginning，E 是 end |
| `⌃U` | 删除光标前的整段命令 | shell 行编辑的 Unix 传统控制字符 |
| `⌃K` | 删除光标后的整段命令 | 与 `⌃U` 成对，分别处理前后内容 |
| `⌃W` | 删除前一个单词 | W 是 Word |
| `⌃Y` | 粘回刚删除的内容 | Y 是 Yank，来自 Emacs 行编辑术语 |
| `⌘K` | 清除终端滚动缓冲区 | 这是 Terminal 或 iTerm2 的应用快捷键，不是 shell 控制字符 |
| `⌘T` | 新建终端标签页 | T 是 Tab |
| `⌘N` | 新建终端窗口 | N 是 New |
| `⇧⌘[` / `⇧⌘]` | 切换上一个 / 下一个标签页 | Shift 扩展 Tab 的方向切换 |
| `⌘1` 到 `⌘9` | 跳到指定终端标签页 | 数字直接对应标签页位置 |

## 一套好记的学习顺序

### 第一天

先熟悉 `⌘C`、`⌘V`、`⌘X`、`⌘Z`、`⌘A`、`⌘F`、`⌘S`、`⌘W`、`⌘Q`、`⌘Tab`、`⌘Space` 和 `⇧⌘4`。

### 第二天

加入文本导航：`⌥←/→`、`⌘←/→`、`⇧` 加方向键、`⌥Delete`。这组快捷键能明显减少鼠标拖选和反复按退格键。

### 第三天

加入 Finder 和终端：`⌘I`、`⇧⌘G`、`Space`、`⌃C`、`⌃R`、`⌃A`、`⌃E`。先在无风险命令上练习，删除和清空废纸篓相关快捷键要单独确认。

## 快捷键冲突和自定义

1. 系统级快捷键可以在“系统设置 > 键盘 > 键盘快捷键”中查看和修改。
2. 输入法快捷键位于“键盘 > 文本输入 > 编辑”以及“键盘快捷键 > 输入法”。
3. 如果一个快捷键在某个应用中无效，先确认焦点是否在正确的窗口，再查看应用自己的菜单。菜单右侧显示的按键是当前应用真正采用的绑定。
4. `⌘Space`、`⌃Space` 和 `Caps Lock` 可能互相影响。只保留一组主要的输入法切换方式，日常操作会更稳定。
5. 远程桌面、虚拟机和终端复用器可能先截获快捷键。遇到失效时，先在 TextEdit 或 Finder 中测试，能区分系统问题和应用问题。

## 相关资料

- [Apple：Mac 键盘快捷键](https://support.apple.com/102650)
- [Apple：简体中文输入法键盘快捷键](https://support.apple.com/guide/chinese-input-method/keyboard-shortcuts-for-simplified-chinese-cimkeys36647/mac)
- [Apple：Mac 截图和录屏](https://support.apple.com/guide/mac-help/take-a-screenshot-mh26782/mac)
