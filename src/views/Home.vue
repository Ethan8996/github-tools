<template>
  <main class="home">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Ethan 的工具台</p>
        <h1>我的日常工作工具集</h1>
        <p class="hero-description">
          把高频格式转换、内容比较、文档处理和个人网址管理集中在一个清爽入口里。
        </p>
      </div>

      <nav class="profile-links" aria-label="个人链接">
        <a
          class="profile-link"
          href="https://github.com/Ethan8996/github-tools"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 Ethan8996 的 github-tools 仓库"
          title="GitHub 仓库"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.38 6.84 9.74.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.51.47-3.16-.63-3.36-1.2-.11-.29-.6-1.2-1.03-1.44-.35-.19-.85-.66-.01-.67.79-.01 1.35.74 1.54 1.05.9 1.55 2.34 1.11 2.91.85.09-.67.35-1.11.64-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.69 0 0 .84-.28 2.75 1.04A9.28 9.28 0 0 1 12 7.06c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.04 2.75-1.04.55 1.39.2 2.43.1 2.69.64.71 1.03 1.62 1.03 2.73 0 3.92-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.11 10.11 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
            />
          </svg>
          <span>GitHub</span>
        </a>

        <a
          class="profile-link"
          href="https://ethan8996.github.io/blog/resume/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 Ethan 的简历页面"
          title="简历页面"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 3h7.12c.4 0 .78.16 1.06.44l3.38 3.38c.28.28.44.66.44 1.06V21H7c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2Zm7 1.9V8h3.1L14 4.9ZM7 5v14h10V10h-4c-.55 0-1-.45-1-1V5H7Zm2 8h6v1.6H9V13Zm0 3h5v1.6H9V16Zm0-6h4v1.6H9V10Z"
            />
          </svg>
          <span>简历</span>
        </a>
      </nav>
    </section>

    <section class="tools-section" aria-labelledby="tools-title">
      <div class="section-heading">
        <h2 id="tools-title">选择一个工具</h2>
        <p>常用能力保持在第一屏，点开即可开始处理。</p>
      </div>

      <div class="tools-grid">
        <router-link
          v-for="tool in tools"
          :key="tool.path"
          :to="tool.path"
          class="tool-card"
        >
          <span class="tool-index">{{ tool.index }}</span>
          <div>
            <h3>{{ tool.title }}</h3>
            <p>{{ tool.description }}</p>
          </div>
          <span class="tool-action" aria-hidden="true">进入 →</span>
        </router-link>
      </div>
    </section>
  </main>
</template>

<script>
const tools = [
  {
    index: '01',
    path: '/SqlTools',
    title: 'SQL 工具',
    description: 'SQL 格式化、压缩、大小写转换等功能'
  },
  {
    index: '02',
    path: '/tool2',
    title: '字符串列表比较',
    description: '比较两组字符串列表的交集、并集和差集'
  },
  {
    index: '03',
    path: '/tool3',
    title: '字符串编号工具',
    description: '为字符串列表添加多种格式的编号'
  },
  {
    index: '04',
    path: '/json-compare',
    title: 'JSON 比较工具',
    description: '比较两个 JSON 数据之间的差异'
  },
  {
    index: '05',
    path: '/properties-to-json',
    title: 'Properties 转 JSON',
    description: '将 Properties 格式转换为 JSON 格式'
  },
  {
    index: '06',
    path: '/docx-to-markdown',
    title: 'DOCX 转 Markdown',
    description: '将 Word 文档转换为 Markdown 格式'
  },
  {
    index: '07',
    path: '/markdown-editor',
    title: 'Markdown 在线编辑器',
    description: '强大的 Markdown 编辑器，支持实时预览和导出 PDF'
  },
  {
    index: '08',
    path: '/base-converter',
    title: '进制转换工具',
    description: '十进制、二进制、十六进制互转，ASCII 与数字互转'
  },
  {
    index: '09',
    path: '/bookmarks',
    title: '常用网址',
    description: '搜索、维护并同步个人常用网址列表'
  }
]

export default {
  name: 'Home',
  data() {
    return {
      tools
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 32px;
  background:
    linear-gradient(180deg, #f7f8f5 0%, #eef1ea 100%);
  color: #17201a;
  text-align: left;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 34px 0 30px;
  border-bottom: 1px solid rgba(23, 32, 26, 0.12);
}

.hero-copy {
  max-width: 690px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #4b604f;
  font-size: 14px;
  font-weight: 700;
}

.hero h1 {
  margin: 0;
  color: #0f1712;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 44px;
  font-weight: 700;
  line-height: 1.12;
}

.hero-description {
  max-width: 620px;
  margin: 16px 0 0;
  color: #516056;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.75;
}

.profile-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(23, 32, 26, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: #17201a;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(23, 32, 26, 0.08);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.profile-link svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.profile-link:hover,
.profile-link:focus-visible {
  border-color: rgba(23, 32, 26, 0.34);
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(23, 32, 26, 0.12);
  transform: translateY(-2px);
}

.profile-link:active,
.tool-card:active {
  transform: scale(0.98);
}

.tools-section {
  max-width: 1120px;
  margin: 0 auto;
  padding: 30px 0 48px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #17201a;
  font-size: 22px;
  font-weight: 800;
}

.section-heading p {
  margin: 0;
  color: #647066;
  font-size: 14px;
  font-weight: 500;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.tool-card {
  position: relative;
  display: flex;
  min-height: 190px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid rgba(23, 32, 26, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  padding: 18px;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(23, 32, 26, 0.08);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.tool-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #6d7d48;
  content: '';
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.18s ease;
}

.tool-card:hover,
.tool-card:focus-visible {
  border-color: rgba(109, 125, 72, 0.42);
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(23, 32, 26, 0.12);
  transform: translateY(-4px);
}

.tool-card:hover::before,
.tool-card:focus-visible::before {
  transform: scaleX(1);
}

.tool-index {
  color: #738068;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  font-weight: 700;
}

.tool-card h3 {
  margin: 28px 0 10px;
  color: #17201a;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
}

.tool-card p {
  margin: 0;
  color: #5d695f;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.7;
}

.tool-action {
  align-self: flex-start;
  margin-top: 20px;
  color: #314331;
  font-size: 14px;
  font-weight: 800;
}

@media (max-width: 720px) {
  .home {
    padding: 20px;
  }

  .hero {
    display: block;
    padding: 20px 0 24px;
  }

  .hero h1 {
    font-size: 34px;
  }

  .hero-description {
    font-size: 15px;
  }

  .profile-links {
    justify-content: flex-start;
    margin-top: 20px;
  }

  .profile-link {
    flex: 1 1 132px;
  }

  .section-heading {
    display: block;
  }

  .section-heading p {
    margin-top: 8px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tool-card {
    min-height: 164px;
  }
}
</style>
