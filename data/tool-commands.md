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
