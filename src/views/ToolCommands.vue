<template>
  <main class="commands-page" lang="zh-CN">
    <header class="page-header">
      <button class="back-button" type="button" @click="goToHome">← 返回首页</button>
      <div class="header-copy">
        <p class="eyebrow">开发环境参考</p>
        <h1>常用命令</h1>
        <p>集中查阅并维护当前 Mac 上的开发工具、版本切换、数据库和本地代理命令。</p>
      </div>
    </header>

    <div class="commands-layout">
      <aside class="sidebar" aria-label="命令手册控制区">
        <section class="sidebar-section">
          <h2>状态</h2>
          <div class="status-block" :class="{ dirty: hasUnsavedChanges }" aria-live="polite">
            <span class="status-dot" aria-hidden="true"></span>
            <div>
              <strong>{{ statusText }}</strong>
              <p>{{ statusDescription }}</p>
            </div>
          </div>
          <button
            class="secondary-button full-button"
            type="button"
            :disabled="!hasUnsavedChanges"
            @click="discardChanges"
          >
            放弃本地修改
          </button>
        </section>

        <section class="sidebar-section outline-section">
          <h2>分类目录</h2>
          <div v-show="mode === 'preview'" ref="outline" class="outline"></div>
          <p v-if="mode === 'edit'" class="muted-copy">切换到预览模式后可使用分类目录。</p>
        </section>

        <section class="sidebar-section github-section">
          <h2>保存到 GitHub</h2>

          <label class="field-label" for="commands-github-repository">仓库</label>
          <input
            id="commands-github-repository"
            v-model="github.repository"
            class="text-input"
            type="text"
            placeholder="owner/repo"
          >

          <label class="field-label" for="commands-github-branch">分支</label>
          <input
            id="commands-github-branch"
            v-model="github.branch"
            class="text-input"
            type="text"
            placeholder="main"
          >

          <label class="field-label" for="commands-github-token">Token</label>
          <div class="token-row">
            <input
              id="commands-github-token"
              v-model="github.token"
              class="text-input token-input"
              :type="showToken ? 'text' : 'password'"
              placeholder="GitHub Personal Access Token"
              autocomplete="off"
            >
            <button class="secondary-button token-button" type="button" @click="toggleTokenVisibility">
              {{ showToken ? '隐藏' : '显示' }}
            </button>
          </div>

          <label class="checkbox-row">
            <input v-model="rememberConfig" type="checkbox">
            <span>记住仓库、分支和 token</span>
          </label>

          <div class="github-actions">
            <button
              class="primary-button full-button"
              type="button"
              :disabled="isSaving || loading || !markdownContent.trim()"
              @click="saveToGithub"
            >
              {{ isSaving ? '保存中...' : '保存到 GitHub' }}
            </button>
            <button class="secondary-button full-button" type="button" @click="openGithubTarget">
              快速打开 GitHub
            </button>
            <button class="quiet-button full-button" type="button" @click="clearStoredConfig">
              清除已保存配置
            </button>
          </div>

          <p v-if="saveMessage" class="feedback success" aria-live="polite">{{ saveMessage }}</p>
          <p v-if="saveError" class="feedback error" role="alert">{{ saveError }}</p>
        </section>
      </aside>

      <section class="workspace" aria-labelledby="workspace-title">
        <div class="workspace-toolbar">
          <div>
            <p class="workspace-label">内容源</p>
            <h2 id="workspace-title">public/data/tool-commands.md</h2>
          </div>
          <div class="mode-switch" role="tablist" aria-label="内容模式">
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'preview'"
              :class="{ active: mode === 'preview' }"
              @click="switchMode('preview')"
            >
              预览
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'edit'"
              :class="{ active: mode === 'edit' }"
              @click="switchMode('edit')"
            >
              编辑
            </button>
          </div>
        </div>

        <div v-if="loading" class="workspace-state" aria-live="polite">
          <strong>正在加载命令手册</strong>
          <p>读取 public/data/tool-commands.md 中的内容。</p>
        </div>

        <div v-else-if="loadError" class="workspace-state error-state" role="alert">
          <strong>命令手册加载失败</strong>
          <p>{{ loadError }}</p>
          <button class="primary-button" type="button" @click="loadMarkdown">重新加载</button>
        </div>

        <template v-else>
          <article
            v-show="mode === 'preview'"
            ref="markdownPreview"
            class="markdown-preview"
          ></article>
          <div v-if="mode === 'edit'" id="tool-commands-editor" class="editor-container"></div>
        </template>
      </section>
    </div>
  </main>
</template>

<script>
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { loadGithubConfig, saveGithubConfig, clearGithubConfig } from '../utils/githubConfigStorage'
import { fetchRepositoryFile, updateRepositoryFile } from '../utils/githubContents'
import { normalizeGithubRepository, buildGithubFileUrl } from '../utils/githubRepository'

const DEFAULT_GITHUB_REPOSITORY = 'https://github.com/Ethan8996/github-tools'
const DEFAULT_GITHUB_BRANCH = 'main'
const COMMANDS_PATH = 'public/data/tool-commands.md'

function createGithubState() {
  const savedConfig = loadGithubConfig()
  const hasSavedConfig = Boolean(savedConfig.repository || savedConfig.branch || savedConfig.token)

  return {
    github: {
      repository: savedConfig.repository || DEFAULT_GITHUB_REPOSITORY,
      branch: savedConfig.branch || DEFAULT_GITHUB_BRANCH,
      token: savedConfig.token || ''
    },
    hasSavedConfig
  }
}

export default {
  name: 'ToolCommands',
  data() {
    const { github, hasSavedConfig } = createGithubState()

    return {
      markdownContent: '',
      originalContent: '',
      mode: 'preview',
      editor: null,
      loading: true,
      loadError: '',
      github,
      rememberConfig: hasSavedConfig,
      showToken: false,
      isSaving: false,
      saveMessage: '',
      saveError: ''
    }
  },
  computed: {
    hasUnsavedChanges() {
      return this.markdownContent !== this.originalContent
    },
    statusText() {
      if (this.loading) {
        return '正在读取内容'
      }

      if (this.loadError) {
        return '内容尚未加载'
      }

      return this.hasUnsavedChanges ? '有未保存的修改' : '内容已同步'
    },
    statusDescription() {
      if (this.loading) {
        return '请稍候，正在加载 Markdown 文件。'
      }

      if (this.loadError) {
        return '重新加载后才能预览或编辑。'
      }

      return this.hasUnsavedChanges
        ? '当前编辑内容只保存在本页面中。'
        : '当前内容与最近加载或保存的版本一致。'
    }
  },
  mounted() {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    this.loadMarkdown()
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    this.destroyEditor()
  },
  beforeRouteLeave(to, from, next) {
    if (!this.hasUnsavedChanges || window.confirm('存在未保存的命令修改，确定离开当前页面吗？')) {
      next()
      return
    }

    next(false)
  },
  methods: {
    goToHome() {
      this.$router.push('/')
    },
    async loadMarkdown() {
      this.loading = true
      this.loadError = ''
      this.saveMessage = ''
      this.saveError = ''

      try {
        const response = await fetch(process.env.BASE_URL + 'data/tool-commands.md', {
          cache: 'no-store'
        })

        if (!response || !response.ok) {
          const status = response && response.status ? '（HTTP ' + response.status + '）' : ''
          throw new Error('无法读取 Markdown 文件' + status)
        }

        const content = await response.text()
        this.markdownContent = content
        this.originalContent = content
        this.mode = 'preview'
        this.destroyEditor()
        this.loading = false
        await this.$nextTick()
        this.renderPreview()
      } catch (error) {
        this.loadError = error && error.message ? error.message : '无法读取 Markdown 文件，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    renderPreview() {
      const previewElement = this.$refs.markdownPreview

      if (!previewElement) {
        return
      }

      Vditor.preview(previewElement, this.markdownContent, {
        mode: 'light',
        i18n: {
          copy: '复制',
          copied: '已复制'
        },
        anchor: 1,
        hljs: {
          enable: true,
          lineNumber: false,
          style: 'github'
        },
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true
        },
        after: () => {
          Vditor.codeRender(previewElement)

          if (this.$refs.outline) {
            Vditor.outlineRender(previewElement, this.$refs.outline)
          }
        }
      })
    },
    initEditor() {
      if (this.editor || !document.getElementById('tool-commands-editor')) {
        return
      }

      this.editor = new Vditor('tool-commands-editor', {
        height: 720,
        minHeight: 520,
        mode: 'ir',
        value: this.markdownContent,
        placeholder: '请输入 Markdown 内容...',
        theme: 'classic',
        icon: 'ant',
        lang: 'zh_CN',
        cache: {
          enable: false
        },
        counter: {
          enable: true,
          type: 'markdown'
        },
        preview: {
          hljs: {
            enable: true,
            lineNumber: false,
            style: 'github'
          },
          markdown: {
            toc: true,
            mark: true,
            footnotes: true,
            autoSpace: true
          }
        },
        input: (value) => {
          this.markdownContent = value
          this.saveMessage = ''
          this.saveError = ''
        }
      })
    },
    destroyEditor() {
      if (this.editor) {
        this.editor.destroy()
        this.editor = null
      }
    },
    syncEditorContent() {
      if (this.editor && typeof this.editor.getValue === 'function') {
        this.markdownContent = this.editor.getValue()
      }
    },
    async switchMode(nextMode) {
      if (nextMode === this.mode || this.loading || this.loadError) {
        return
      }

      if (this.mode === 'edit') {
        this.syncEditorContent()
        this.destroyEditor()
      }

      this.mode = nextMode
      await this.$nextTick()

      if (nextMode === 'edit') {
        this.initEditor()
      } else {
        this.renderPreview()
      }
    },
    discardChanges() {
      if (!this.hasUnsavedChanges) {
        return
      }

      if (!window.confirm('确定放弃尚未保存的命令修改吗？')) {
        return
      }

      this.markdownContent = this.originalContent
      this.saveMessage = '已放弃本地修改'
      this.saveError = ''

      if (this.editor) {
        this.editor.setValue(this.originalContent)
      } else {
        this.$nextTick(() => this.renderPreview())
      }
    },
    handleBeforeUnload(event) {
      if (!this.hasUnsavedChanges) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    },
    toggleTokenVisibility() {
      this.showToken = !this.showToken
    },
    clearStoredConfig() {
      clearGithubConfig()
      this.github.repository = ''
      this.github.branch = ''
      this.github.token = ''
      this.rememberConfig = false
      this.saveMessage = '已清除已保存的 GitHub 配置'
      this.saveError = ''
    },
    openGithubTarget() {
      const repository = normalizeGithubRepository(this.github.repository)

      if (!repository) {
        this.saveMessage = ''
        this.saveError = 'repository 不能为空，无法跳转到 GitHub'
        return
      }

      const githubTarget = buildGithubFileUrl({
        repository,
        branch: this.github.branch,
        path: COMMANDS_PATH
      })

      this.saveMessage = ''
      this.saveError = ''
      window.open(githubTarget, '_blank', 'noopener')
    },
    async saveToGithub() {
      this.syncEditorContent()

      const repository = normalizeGithubRepository(this.github.repository)
      const branch = String(this.github.branch || '').trim()
      const token = String(this.github.token || '').trim()
      const content = String(this.markdownContent || '')

      if (!content.trim()) {
        this.saveMessage = ''
        this.saveError = 'Markdown 内容不能为空'
        return
      }

      if (!repository) {
        this.saveMessage = ''
        this.saveError = 'repository 不能为空'
        return
      }

      if (!token) {
        this.saveMessage = ''
        this.saveError = 'token 不能为空'
        return
      }

      this.isSaving = true
      this.saveMessage = ''
      this.saveError = ''

      try {
        const fileInfo = await fetchRepositoryFile(fetch, {
          token,
          repository,
          branch,
          path: COMMANDS_PATH
        })

        await updateRepositoryFile(fetch, {
          token,
          repository,
          branch,
          path: COMMANDS_PATH,
          sha: fileInfo.sha,
          message: 'docs: update tool commands',
          content
        })

        if (this.rememberConfig) {
          saveGithubConfig(null, {
            token,
            repository,
            branch
          })
        } else {
          clearGithubConfig()
        }

        this.originalContent = content
        this.saveMessage = '已成功保存到 GitHub'
      } catch (error) {
        this.saveError = error && error.message ? error.message : '保存失败，请稍后重试'
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style scoped>
.commands-page {
  min-height: 100vh;
  padding: 24px 28px 48px;
  background: #f2f4ef;
  color: #17201a;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Noto Sans SC', sans-serif;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}

.page-header {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(23, 32, 26, 0.14);
}

.back-button {
  align-self: start;
  justify-self: start;
}

.header-copy {
  max-width: 760px;
}

.eyebrow,
.workspace-label {
  margin: 0 0 6px;
  color: #60705d;
  font-size: 13px;
  font-weight: 750;
}

.header-copy h1 {
  margin: 0;
  color: #101712;
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
}

.header-copy > p:last-child {
  max-width: 680px;
  margin: 10px 0 0;
  color: #566158;
  font-size: 15px;
  line-height: 1.75;
  text-wrap: pretty;
}

.commands-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  max-width: 1440px;
  margin: 0 auto;
}

.sidebar {
  position: sticky;
  top: 20px;
  overflow: hidden;
  border: 1px solid rgba(23, 32, 26, 0.12);
  border-radius: 8px;
  background: #e8ece4;
  box-shadow: 0 1px 3px rgba(23, 32, 26, 0.1);
}

.sidebar-section {
  padding: 18px;
  border-bottom: 1px solid rgba(23, 32, 26, 0.11);
}

.sidebar-section:last-child {
  border-bottom: 0;
}

.sidebar-section h2 {
  margin: 0 0 13px;
  color: #1e2920;
  font-size: 15px;
  font-weight: 800;
}

.status-block {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.status-dot {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: #5f774c;
  box-shadow: 0 0 0 4px rgba(95, 119, 76, 0.12);
}

.status-block.dirty .status-dot {
  background: #b76a29;
  box-shadow: 0 0 0 4px rgba(183, 106, 41, 0.13);
}

.status-block strong {
  display: block;
  color: #202b22;
  font-size: 14px;
  line-height: 1.4;
}

.status-block p,
.muted-copy {
  margin: 4px 0 0;
  color: #647066;
  font-size: 13px;
  line-height: 1.6;
}

.field-label {
  display: block;
  margin: 12px 0 6px;
  color: #344238;
  font-size: 13px;
  font-weight: 700;
}

.text-input {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  box-sizing: border-box;
  padding: 9px 11px;
  border: 1px solid #bdc7ba;
  border-radius: 4px;
  background: #fbfcfa;
  color: #17201a;
  font: inherit;
  font-size: 13px;
}

.text-input:focus-visible {
  outline: 3px solid rgba(93, 118, 77, 0.22);
  outline-offset: 1px;
  border-color: #5d764d;
}

.token-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.token-input {
  min-width: 0;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 14px 0;
  color: #465248;
  font-size: 13px;
  line-height: 1.5;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  margin: 2px 0 0;
  accent-color: #5d764d;
}

.github-actions {
  display: grid;
  gap: 8px;
}

.primary-button,
.secondary-button,
.quiet-button,
.back-button,
.mode-switch button {
  min-height: 40px;
  padding: 9px 13px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 130ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.primary-button:active,
.secondary-button:active,
.quiet-button:active,
.back-button:active,
.mode-switch button:active {
  transform: scale(0.96);
}

.primary-button:focus-visible,
.secondary-button:focus-visible,
.quiet-button:focus-visible,
.back-button:focus-visible,
.mode-switch button:focus-visible {
  outline: 3px solid rgba(93, 118, 77, 0.24);
  outline-offset: 2px;
}

.primary-button {
  border: 1px solid #4d653f;
  background: #5d764d;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(23, 32, 26, 0.16);
}

.secondary-button,
.back-button {
  border: 1px solid #aab7a6;
  background: #f8faf6;
  color: #263329;
}

.quiet-button {
  border: 1px solid transparent;
  background: transparent;
  color: #566158;
}

.primary-button:disabled,
.secondary-button:disabled,
.quiet-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  transform: none;
}

.full-button {
  width: 100%;
}

.token-button {
  min-width: 56px;
}

.feedback {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.55;
}

.feedback.success {
  color: #3f653f;
}

.feedback.error {
  color: #a33c32;
}

.outline {
  display: block;
  width: auto;
  max-height: 260px;
  overflow: auto;
  padding-right: 4px;
  border: 0;
  background: transparent;
}

.outline :deep(ul) {
  margin: 0;
  padding: 0;
  list-style: none;
}

.outline :deep(ul ul) {
  margin-top: 4px;
  padding-left: 12px;
}

.outline :deep(li) {
  margin: 0;
}

.outline :deep(li > span) {
  min-height: 30px;
  padding: 5px 0;
  color: #4b5d4d;
  font-size: 13px;
  line-height: 1.4;
}

.outline :deep(li > span > span) {
  white-space: normal;
  text-overflow: clip;
}

.workspace {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(23, 32, 26, 0.11);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(23, 32, 26, 0.1);
}

.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 74px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(23, 32, 26, 0.11);
  background: #fafbf8;
}

.workspace-toolbar h2 {
  margin: 0;
  color: #263329;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(64px, 1fr));
  padding: 3px;
  border: 1px solid #bdc7ba;
  border-radius: 8px;
  background: #edf0e9;
}

.mode-switch button {
  min-height: 36px;
  padding: 7px 12px;
  border: 0;
  background: transparent;
  color: #5d685f;
  box-shadow: none;
}

.mode-switch button.active {
  background: #ffffff;
  color: #203022;
  box-shadow: 0 1px 2px rgba(23, 32, 26, 0.14);
}

.workspace-state {
  display: flex;
  min-height: 480px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 36px clamp(24px, 6vw, 72px);
}

.workspace-state strong {
  color: #202b22;
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
  font-size: 24px;
}

.workspace-state p {
  margin: 10px 0 18px;
  color: #647066;
  line-height: 1.7;
}

.error-state strong,
.error-state p {
  color: #8c372f;
}

.markdown-preview {
  min-height: 720px;
  max-width: 920px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 42px clamp(24px, 5vw, 72px) 72px;
}

.markdown-preview :deep(.vditor-reset) {
  color: #263029;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Noto Sans SC', sans-serif;
  font-size: 15px;
  line-height: 1.78;
  text-align: left;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2) {
  color: #17201a;
  font-family: Georgia, 'Songti SC', 'Noto Serif SC', serif;
}

.markdown-preview :deep(h1) {
  margin: 0 0 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #d9ded5;
  font-size: 32px;
  line-height: 1.25;
}

.markdown-preview :deep(h2) {
  margin: 44px 0 18px;
  padding-bottom: 9px;
  border-bottom: 1px solid #e1e5de;
  font-size: 23px;
  line-height: 1.35;
}

.markdown-preview :deep(p) {
  max-width: 70ch;
  text-wrap: pretty;
}

.markdown-preview :deep(strong) {
  color: #253a28;
}

.markdown-preview :deep(pre) {
  margin: 12px 0 24px;
  border: 1px solid #2e3730;
  border-radius: 4px;
  background: #202823;
  color: #eef2ec;
  box-shadow: 0 2px 5px rgba(23, 32, 26, 0.16);
}

.markdown-preview :deep(pre code) {
  background: transparent;
  color: inherit;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
}

.markdown-preview :deep(pre code .hljs-keyword),
.markdown-preview :deep(pre code .hljs-built_in),
.markdown-preview :deep(pre code .hljs-selector-tag) {
  color: #f1b77a;
}

.markdown-preview :deep(pre code .hljs-string),
.markdown-preview :deep(pre code .hljs-literal) {
  color: #b8d994;
}

.markdown-preview :deep(pre code .hljs-variable),
.markdown-preview :deep(pre code .hljs-attr),
.markdown-preview :deep(pre code .hljs-title) {
  color: #92c8ee;
}

.markdown-preview :deep(pre code .hljs-comment) {
  color: #a8b2aa;
}

.markdown-preview :deep(.vditor-copy) {
  border-radius: 4px;
}

.editor-container {
  min-width: 0;
  min-height: 720px;
}

.editor-container :deep(.vditor) {
  border: 0;
  border-radius: 0;
}

.editor-container :deep(.vditor-toolbar) {
  border-bottom-color: #d9ded5;
  background: #f8faf6;
}

@media (hover: hover) {
  .primary-button:hover {
    background: #506941;
  }

  .secondary-button:hover,
  .back-button:hover,
  .mode-switch button:hover {
    border-color: #869783;
    background: #ffffff;
  }

  .quiet-button:hover {
    background: rgba(23, 32, 26, 0.06);
  }

  .outline :deep(li > span:hover) {
    color: #263d29;
    text-decoration: underline;
  }
}

@media (max-width: 960px) {
  .page-header,
  .commands-layout {
    grid-template-columns: 1fr;
  }

  .page-header {
    gap: 16px;
  }

  .sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sidebar-section {
    border-right: 1px solid rgba(23, 32, 26, 0.11);
  }

  .github-section {
    grid-column: 1 / -1;
    border-top: 1px solid rgba(23, 32, 26, 0.11);
  }

  .outline-section {
    border-right: 0;
  }
}

@media (max-width: 560px) {
  .commands-page {
    padding: 16px 12px 28px;
  }

  .header-copy h1 {
    font-size: 29px;
  }

  .sidebar {
    display: block;
  }

  .sidebar-section,
  .outline-section {
    border-right: 0;
  }

  .github-section {
    border-top: 0;
  }

  .workspace-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .mode-switch {
    width: 100%;
    box-sizing: border-box;
  }

  .markdown-preview {
    padding: 28px 16px 48px;
  }

  .markdown-preview :deep(h1) {
    font-size: 27px;
  }

  .markdown-preview :deep(h2) {
    margin-top: 36px;
    font-size: 21px;
  }

  .markdown-preview :deep(pre) {
    margin-right: 0;
    margin-left: 0;
  }

  .editor-container,
  .markdown-preview {
    min-height: 560px;
  }
}

@media (max-width: 340px) {
  .commands-page {
    padding-right: 8px;
    padding-left: 8px;
  }

  .sidebar-section {
    padding: 16px 14px;
  }

  .token-row {
    grid-template-columns: minmax(0, 1fr) 52px;
  }

  .token-button {
    min-width: 0;
    padding-right: 8px;
    padding-left: 8px;
  }

  .workspace-toolbar {
    padding-right: 12px;
    padding-left: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-button,
  .secondary-button,
  .quiet-button,
  .back-button,
  .mode-switch button {
    transition: none;
  }
}
</style>
