<template>
  <div class="bookmarks-page">
    <div class="page-header">
      <button class="back-button" @click="goToHome">← 返回首页</button>
      <div>
        <h1>常用网址</h1>
        <p>集中管理常用链接，并可将更新后的列表保存回 GitHub。</p>
      </div>
    </div>

    <div class="page-layout">
      <aside class="sidebar">
        <section class="panel">
          <h2>状态</h2>
          <div class="status-card" :class="{ dirty: hasLocalChanges }">
            <strong>{{ dirtyStatusText }}</strong>
            <p>{{ dirtyStatusDescription }}</p>
          </div>
          <p class="meta-text">当前共 {{ bookmarks.length }} 条网址，筛选后 {{ filteredBookmarks.length }} 条。</p>
        </section>

        <section class="panel">
          <h2>搜索</h2>
          <input
            v-model="searchQuery"
            type="text"
            class="text-input"
            placeholder="按标题或 URL 搜索"
          >
        </section>

        <section class="panel">
          <h2>新增网址</h2>
          <label class="field-label" for="bookmark-title">标题</label>
          <input
            id="bookmark-title"
            v-model="form.title"
            type="text"
            class="text-input"
            placeholder="例如：Vue 官方文档"
          >

          <label class="field-label" for="bookmark-url">URL</label>
          <input
            id="bookmark-url"
            v-model="form.url"
            type="url"
            class="text-input"
            placeholder="https://example.com"
          >

          <button class="primary-button" @click="addBookmark">新增</button>
          <p v-if="formError" class="feedback error">{{ formError }}</p>
        </section>

        <section class="panel">
          <h2>保存到 GitHub</h2>

          <label class="field-label" for="github-repository">仓库</label>
          <input
            id="github-repository"
            v-model="github.repository"
            type="text"
            class="text-input"
            placeholder="owner/repo"
          >

          <label class="field-label" for="github-branch">分支</label>
          <input
            id="github-branch"
            v-model="github.branch"
            type="text"
            class="text-input"
            placeholder="main"
          >

          <label class="field-label" for="github-token">Token</label>
          <div class="token-row">
            <input
              id="github-token"
              v-model="github.token"
              :type="showToken ? 'text' : 'password'"
              class="text-input token-input"
              placeholder="GitHub Personal Access Token"
            >
            <button class="secondary-button" type="button" @click="toggleTokenVisibility">
              {{ showToken ? '隐藏' : '显示' }}
            </button>
          </div>

          <label class="checkbox-row">
            <input v-model="rememberConfig" type="checkbox">
            <span>记住仓库、分支和 token</span>
          </label>

          <div class="action-group">
            <button
              class="primary-button"
              :disabled="isSaving"
              @click="saveToGithub"
            >
              {{ isSaving ? '保存中...' : '保存到 GitHub' }}
            </button>
            <button class="secondary-button" type="button" @click="clearStoredConfig">
              清除已保存配置
            </button>
          </div>

          <p v-if="saveMessage" class="feedback success">{{ saveMessage }}</p>
          <p v-if="saveError" class="feedback error">{{ saveError }}</p>
        </section>
      </aside>

      <section class="content">
        <div v-if="filteredBookmarks.length" class="bookmark-grid">
          <article
            v-for="bookmark in filteredBookmarks"
            :key="bookmark.id"
            class="bookmark-card"
          >
            <div class="bookmark-body">
              <h3>{{ bookmark.title }}</h3>
              <p class="bookmark-url">{{ bookmark.url }}</p>
            </div>
            <div class="card-actions">
              <button class="primary-button" type="button" @click="openBookmark(bookmark)">
                打开
              </button>
              <button class="danger-button" type="button" @click="removeBookmark(bookmark.id)">
                删除
              </button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <h2>没有匹配的网址</h2>
          <p>调整搜索条件，或者在左侧新增一条网址。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import initialBookmarks from '../data/bookmarks.json'
import { filterBookmarks, isValidBookmarkUrl, normalizeBookmark, serializeBookmarks } from '../utils/bookmarks'
import { loadGithubConfig, saveGithubConfig, clearGithubConfig } from '../utils/bookmarkStorage'
import { fetchRepositoryFile, updateRepositoryFile } from '../utils/githubContents'

function createGithubState() {
  const savedConfig = loadGithubConfig()

  return {
    repository: savedConfig.repository || '',
    branch: savedConfig.branch || '',
    token: savedConfig.token || ''
  }
}

export default {
  name: 'Bookmarks',
  data() {
    const github = createGithubState()

    return {
      bookmarks: initialBookmarks.map((bookmark) => normalizeBookmark(bookmark)),
      searchQuery: '',
      form: {
        title: '',
        url: ''
      },
      formError: '',
      github,
      rememberConfig: Boolean(github.repository || github.branch || github.token),
      showToken: false,
      hasLocalChanges: false,
      isSaving: false,
      saveMessage: '',
      saveError: ''
    }
  },
  computed: {
    filteredBookmarks() {
      return filterBookmarks(this.bookmarks, this.searchQuery)
    },
    dirtyStatusText() {
      return this.hasLocalChanges ? '有未保存的本地修改' : '本地内容已同步'
    },
    dirtyStatusDescription() {
      return this.hasLocalChanges
        ? '新增或删除的网址尚未保存到 GitHub。'
        : '当前本地列表与最近一次保存状态一致。'
    }
  },
  methods: {
    goToHome() {
      this.$router.push('/')
    },
    toggleTokenVisibility() {
      this.showToken = !this.showToken
    },
    markDirty() {
      this.hasLocalChanges = true
      this.saveMessage = ''
      this.saveError = ''
    },
    addBookmark() {
      const title = String(this.form.title || '').trim()
      const url = String(this.form.url || '').trim()

      if (!title) {
        this.formError = '标题不能为空'
        return
      }

      if (!isValidBookmarkUrl(url)) {
        this.formError = 'URL 必须是有效的 http/https 地址'
        return
      }

      const nextBookmark = normalizeBookmark({ title, url })

      if (this.bookmarks.some((bookmark) => bookmark.id === nextBookmark.id)) {
        this.formError = '该网址已存在，请勿重复添加'
        return
      }

      this.bookmarks.unshift(nextBookmark)
      this.form.title = ''
      this.form.url = ''
      this.formError = ''
      this.markDirty()
    },
    removeBookmark(bookmarkId) {
      this.bookmarks = this.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId)
      this.markDirty()
    },
    openBookmark(bookmark) {
      window.open(bookmark.url, '_blank', 'noopener')
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
    async saveToGithub() {
      const repository = String(this.github.repository || '').trim()
      const branch = String(this.github.branch || '').trim()
      const token = String(this.github.token || '').trim()

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
          path: 'src/data/bookmarks.json'
        })

        await updateRepositoryFile(fetch, {
          token,
          repository,
          branch,
          path: 'src/data/bookmarks.json',
          sha: fileInfo.sha,
          message: 'feat: update bookmarks',
          content: serializeBookmarks(this.bookmarks)
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

        this.hasLocalChanges = false
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
.bookmarks-page {
  padding: 24px;
  color: #16324f;
  background:
    radial-gradient(circle at top left, rgba(27, 153, 139, 0.16), transparent 28%),
    linear-gradient(180deg, #f4fbf8 0%, #eef5fb 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px;
  font-size: 32px;
}

.page-header p {
  margin: 0;
  color: #4f6478;
}

.page-layout {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 24px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  padding: 20px;
  border: 1px solid rgba(22, 50, 79, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 14px 40px rgba(22, 50, 79, 0.08);
}

.panel h2 {
  margin: 0 0 14px;
  font-size: 20px;
}

.status-card {
  padding: 14px;
  border-radius: 14px;
  background: #edf7f4;
  border: 1px solid rgba(27, 153, 139, 0.16);
}

.status-card.dirty {
  background: #fff4e8;
  border-color: rgba(214, 93, 14, 0.24);
}

.status-card strong {
  display: block;
  margin-bottom: 6px;
}

.status-card p,
.meta-text,
.feedback {
  margin: 0;
}

.meta-text {
  margin-top: 12px;
  color: #4f6478;
}

.field-label {
  display: block;
  margin: 14px 0 8px;
  font-weight: 600;
}

.text-input {
  width: 100%;
  border: 1px solid #c8d6e5;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  color: #16324f;
  background: #fff;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #1b998b;
  box-shadow: 0 0 0 3px rgba(27, 153, 139, 0.16);
}

.token-row {
  display: flex;
  gap: 10px;
}

.token-input {
  flex: 1;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0;
  color: #30475d;
}

.action-group,
.card-actions {
  display: flex;
  gap: 10px;
}

.action-group {
  flex-wrap: wrap;
}

.primary-button,
.secondary-button,
.danger-button,
.back-button {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.primary-button {
  background: #1b998b;
  color: #fff;
  box-shadow: 0 10px 24px rgba(27, 153, 139, 0.2);
}

.primary-button:hover,
.secondary-button:hover,
.danger-button:hover,
.back-button:hover {
  transform: translateY(-1px);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.72;
  transform: none;
}

.secondary-button,
.back-button {
  background: #dceaf4;
  color: #16324f;
}

.danger-button {
  background: #ffe3e0;
  color: #a63b32;
}

.feedback {
  margin-top: 12px;
  font-size: 14px;
}

.feedback.success {
  color: #137a5f;
}

.feedback.error {
  color: #b74033;
}

.content {
  min-width: 0;
}

.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.bookmark-card,
.empty-state {
  padding: 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(22, 50, 79, 0.1);
  box-shadow: 0 18px 40px rgba(22, 50, 79, 0.08);
}

.bookmark-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  min-height: 180px;
}

.bookmark-card h3,
.empty-state h2 {
  margin: 0 0 12px;
}

.bookmark-url {
  margin: 0;
  color: #4f6478;
  word-break: break-word;
  line-height: 1.6;
}

.empty-state {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-state p {
  margin: 0;
  color: #4f6478;
}

@media (max-width: 960px) {
  .page-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .bookmarks-page {
    padding: 16px;
  }

  .page-header,
  .token-row,
  .card-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button,
  .danger-button,
  .back-button {
    width: 100%;
  }
}
</style>
