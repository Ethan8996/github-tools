# github-tools

## Mermaid 画布

首页的「Mermaid 画布」入口打开 `#/mermaid-canvas`。可以编辑 Mermaid 源码、切换六种主题、缩放预览并导出 SVG 或 PNG；源码和主题保存在当前浏览器中。流程图节点可加 `:::decision` 显示虚线判断框。

本地运行 `npm install && npm run serve`，再打开终端显示的地址。现有 GitHub Pages 构建使用 `/github-tools/` 作为资源根路径和 hash 路由，部署后入口为 `https://ethan8996.github.io/github-tools/#/mermaid-canvas`。部署流程沿用 `.github/workflows/deploy.yml`，推送到 `main` 后由工作流构建发布。

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).



作为一个Vue工程师，我很乐意帮你创建一个基于Vue3的GitHub Pages项目，并通过GitHub Actions实现自动部署。下面是详细的步骤指南：

## 步骤1：创建Vue3项目

首先，我们需要创建一个新的Vue3项目：

1. 确保你已安装Node.js和npm
2. 使用Vue CLI创建项目

```bash
# 安装Vue CLI（如果尚未安装）
npm install -g @vue/cli

# 创建新项目
vue create github-tools

# 选择Vue3配置（在交互提示中选择Vue 3）

# 进入项目目录
cd github-tools
```

## 步骤2：配置项目适应GitHub Pages

GitHub Pages有特定的路径要求，我们需要添加一个vue.config.js文件来配置：

```javascript
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/github-tools/' // 这里替换为你的仓库名
    : '/',
  outputDir: 'dist'
}
```

## 步骤3：创建工具页面

让我们创建一个简单的工具页面布局：

```bash
# 创建页面组件
mkdir -p src/views
touch src/views/Home.vue
touch src/views/Tool1.vue
touch src/views/Tool2.vue
```

在`src/views/Home.vue`添加内容：

```vue
<template>
  <div class="home">
    <h1>我的日常工作工具集</h1>
    <div class="tools-grid">
      <router-link to="/tool1" class="tool-card">
        <h2>工具1</h2>
        <p>工具1的简短描述</p>
      </router-link>
      <router-link to="/tool2" class="tool-card">
        <h2>工具2</h2>
        <p>工具2的简短描述</p>
      </router-link>
      <!-- 可以继续添加更多工具卡片 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  padding: 20px;
}
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.tool-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s, box-shadow 0.3s;
}
.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
</style>
```

## 步骤4：配置路由

我们需要设置Vue Router来管理不同工具页面之间的导航：

```bash
# 安装Vue Router（如果创建项目时未选择）
npm install vue-router@4
```

创建路由配置文件：

```bash
mkdir -p src/router
touch src/router/index.js

mkdir -p src/router; new-item src/router/index.js
```

在`src/router/index.js`中添加：

```javascript
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tool1',
    name: 'Tool1',
    component: () => import('../views/Tool1.vue')
  },
  {
    path: '/tool2',
    name: 'Tool2',
    component: () => import('../views/Tool2.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
```

修改`src/main.js`：

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

## 步骤5：创建GitHub仓库

1. 登录GitHub账号
2. 点击右上角"+"图标，选择"New repository"
3. 仓库名称输入"github-tools"（或你喜欢的名称）
4. 描述可选
5. 选择"Public"（GitHub Pages需要公开仓库，除非你有Pro账户）
6. 点击"Create repository"

## 步骤6：配置GitHub Actions自动部署

在本地项目中创建GitHub Actions工作流程文件：

```bash
mkdir -p .github/workflows
touch .github/workflows/deploy.yml

mkdir -p .github/workflows ; new-item .github/workflows/deploy.yml
```

在`.github/workflows/deploy.yml`中添加：

```yaml
name: Build and Deploy
on:
  push:
    branches:
      - main  # 或者你的默认分支名，如master
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 🛎️
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install and Build 🔧
        run: |
          npm ci
          npm run build
          
      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

## 步骤7：将项目推送到GitHub

现在，将项目推送到GitHub仓库：

```bash
# 初始化Git仓库（如果尚未初始化）
git init

# 添加远程仓库
git remote add origin https://github.com/你的用户名/github-tools.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit"

# 推送到GitHub
git push -u origin main  # 或者你的默认分支名
```

## 步骤8：启用GitHub Pages

推送后，等待GitHub Actions完成构建和部署，然后：

1. 前往你的GitHub仓库
2. 点击"Settings" -> "Pages"
3. 在"Source"部分，选择"gh-pages" 分支和"/ (root)"目录
4. 点击"Save"

几分钟后，你的网站应该会在`https://你的用户名.github.io/github-tools/`上线。

## 步骤9：添加你的实际工具

现在你可以在`Tool1.vue`和`Tool2.vue`中添加你的实际工具逻辑。例如，一个简单的JSON格式化工具：

```vue
<!-- src/views/Tool1.vue -->
<template>
  <div class="tool">
    <h1>JSON格式化工具</h1>
    <div class="tool-container">
      <div class="input-area">
        <h3>输入JSON</h3>
        <textarea v-model="inputJson" placeholder="在这里粘贴JSON文本..."></textarea>
        <button @click="formatJson">格式化</button>
      </div>
      <div class="output-area">
        <h3>格式化结果</h3>
        <pre>{{ formattedJson }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputJson: '',
      formattedJson: ''
    }
  },
  methods: {
    formatJson() {
      try {
        const parsed = JSON.parse(this.inputJson);
        this.formattedJson = JSON.stringify(parsed, null, 2);
      } catch (error) {
        this.formattedJson = '解析错误: ' + error.message;
      }
    }
  }
}
</script>

<style scoped>
.tool {
  padding: 20px;
}
.tool-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}
textarea {
  width: 100%;
  height: 300px;
  padding: 10px;
  font-family: monospace;
}
pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  height: 300px;
  overflow: auto;
  white-space: pre-wrap;
}
button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
button:hover {
  background: #45a049;
}
@media (max-width: 768px) {
  .tool-container {
    grid-template-columns: 1fr;
  }
}
</style>
```

每次你将更改推送到主分支，GitHub Actions都会自动构建和部署你的项目。

希望这个指南对你有所帮助！如果你需要添加更多具体工具或遇到任何问题，请随时告诉我。
