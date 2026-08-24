<template>
  <div class="markdown-editor">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>Markdown 在线编辑器</h1>
    </div>

    <div class="toolbar-actions">
      <button @click="downloadMarkdown" class="action-btn">📥 下载 MD</button>
      <div class="pdf-export-group">
        <button @click="downloadPDF" class="action-btn">📄 下载 PDF</button>
        <select v-model="pdfStyleTheme" class="theme-selector">
          <option value="github">GitHub 风格</option>
          <option value="minimal">简约风格</option>
        </select>
      </div>
      <button @click="clearContent" class="clear-btn">🗑️ 清空</button>
    </div>

    <div id="vditor" class="vditor-container"></div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { exportMarkdownPdf } from '../utils/markdownPdfExport';

export default {
  name: 'MarkdownEditor',
  data() {
    return {
      vditor: null,
      successMessage: '',
      error: '',
      pdfStyleTheme: 'github'
    };
  },
  mounted() {
    this.initVditor();
  },
  beforeUnmount() {
    if (this.vditor) {
      this.vditor.destroy();
    }
  },
  methods: {
    generateTimestamp() {
      return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    },

    getPdfStyleSheet() {
      const commonRules = `
        * { 
          box-sizing: border-box; 
        }
        
        /* Prevent content from breaking badly across pages */
        h1, h2, h3, h4, h5, h6 { 
          page-break-after: avoid; 
          break-after: avoid;
        }
        
        pre, blockquote, table { 
          page-break-inside: avoid; 
          break-inside: avoid;
        }
        
        img { 
          page-break-inside: avoid;
          break-inside: avoid; 
          max-width: 100%;
          height: auto;
        }
        
        p, li {
          orphans: 3;
          widows: 3;
        }

        .language-mermaid {
          display: block;
          page-break-inside: avoid;
          break-inside: avoid;
          padding: 0;
          background: transparent;
          white-space: normal;
          text-align: center;
        }

        pre:has(> .language-mermaid) {
          padding: 0;
          overflow: visible;
          background: transparent;
        }

        .language-mermaid svg {
          display: block;
          width: 100%;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
        }
      `;

      const githubTheme = `
        .markdown-pdf-export {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #24292f;
          word-wrap: break-word;
        }
        
        h1 { 
          font-size: 2em; 
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #d0d7de;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        h2 { 
          font-size: 1.5em; 
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #d0d7de;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        h3 { 
          font-size: 1.25em; 
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        h4 { 
          font-size: 1em; 
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        h5, h6 { 
          font-size: 0.875em; 
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        
        p { 
          margin-top: 0;
          margin-bottom: 16px; 
        }
        
        code { 
          background-color: rgba(175,184,193,0.2);
          border-radius: 6px;
          padding: 0.2em 0.4em;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
          font-size: 85%;
        }
        
        pre { 
          background-color: #f6f8fa;
          border-radius: 6px;
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
        }
        
        pre code {
          background-color: transparent;
          padding: 0;
        }
        
        blockquote { 
          border-left: 0.25em solid #d0d7de;
          padding: 0 1em;
          color: #57606a;
          margin: 0 0 16px 0;
        }
        
        ul, ol {
          margin-top: 0;
          margin-bottom: 16px;
          padding-left: 2em;
        }
        
        li + li {
          margin-top: 0.25em;
        }
        
        table { 
          border-collapse: collapse;
          border-spacing: 0;
          width: 100%;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        table th { 
          font-weight: 600;
          background-color: #f6f8fa;
        }
        
        table th, table td { 
          border: 1px solid #d0d7de;
          padding: 6px 13px;
        }
        
        table tr {
          background-color: #ffffff;
          border-top: 1px solid #d0d7de;
        }
        
        table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        
        a {
          color: #0969da;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #d0d7de;
          border: 0;
        }
      `;

      const minimalTheme = `
        .markdown-pdf-export {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.8;
          color: #333;
        }
        
        h1, h2, h3, h4, h5, h6 { 
          font-weight: bold;
          margin-top: 20px;
          margin-bottom: 12px;
          color: #000;
        }
        
        h1 { font-size: 1.8em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.3em; }
        h4, h5, h6 { font-size: 1.1em; }
        
        p { margin-bottom: 14px; }
        
        code { 
          background-color: #f4f4f4;
          padding: 2px 6px;
          font-family: 'Courier New', monospace;
          font-size: 90%;
        }
        
        pre { 
          background-color: #f8f8f8;
          padding: 12px;
          border-left: 3px solid #ccc;
          overflow-x: auto;
        }
        
        blockquote { 
          border-left: 3px solid #999;
          padding-left: 12px;
          color: #666;
          font-style: italic;
          margin: 0 0 14px 0;
        }
        
        table { 
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 14px;
        }
        
        table th, table td { 
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        
        table th {
          background-color: #f0f0f0;
        }
      `;

      return commonRules + (this.pdfStyleTheme === 'github' ? githubTheme : minimalTheme);
    },

    initVditor() {
      this.vditor = new Vditor('vditor', {
        height: 600,
        mode: 'ir', // Instant rendering mode (similar to Typora)
        placeholder: '请输入 Markdown 内容...',
        theme: 'classic',
        icon: 'ant',
        lang: 'en_US', // Use English to avoid CDN language file loading issues
        toolbar: [
          'emoji',
          'headings',
          'bold',
          'italic',
          'strike',
          'link',
          '|',
          'list',
          'ordered-list',
          'check',
          'outdent',
          'indent',
          '|',
          'quote',
          'line',
          'code',
          'inline-code',
          'insert-before',
          'insert-after',
          '|',
          'table',
          '|',
          'undo',
          'redo',
          '|',
          'edit-mode',
          'fullscreen',
          'outline',
          'preview',
          'help'
        ],
        counter: {
          enable: true,
          type: 'markdown'
        },
        cache: {
          enable: true,
          id: 'vditor-cache'
        },
        preview: {
          hljs: {
            enable: true,
            lineNumber: true,
            style: 'github'
          },
          markdown: {
            toc: true,
            mark: true,
            footnotes: true,
            autoSpace: true
          },
          math: {
            engine: 'KaTeX'
          }
        },
        upload: {
          max: 10 * 1024 * 1024, // 10MB
          accept: 'image/*'
        }
      });
    },

    goToHome() {
      this.$router.push('/');
    },

    downloadMarkdown() {
      try {
        if (!this.vditor) {
          this.error = '编辑器未初始化';
          return;
        }

        const content = this.vditor.getValue();
        if (!content || content.trim() === '') {
          this.error = '内容为空，无法下载';
          setTimeout(() => {
            this.error = '';
          }, 3000);
          return;
        }

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        link.download = `markdown-${this.generateTimestamp()}.md`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.successMessage = 'Markdown 文件下载成功！';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      } catch (err) {
        this.error = `下载失败: ${err.message}`;
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    },

    async downloadPDF() {
      try {
        if (!this.vditor) {
          this.error = '编辑器未初始化';
          return;
        }

        const content = this.vditor.getValue();
        if (!content || content.trim() === '') {
          this.error = '内容为空，无法下载';
          setTimeout(() => {
            this.error = '';
          }, 3000);
          return;
        }

        await exportMarkdownPdf({
          renderedHtml: this.vditor.getHTML(),
          styleSheet: this.getPdfStyleSheet(),
          filename: `markdown-${this.generateTimestamp()}.pdf`,
          VditorApi: Vditor,
          Html2Canvas: html2canvas,
          sourceRoot: document.getElementById('vditor'),
          JsPdf: jsPDF
        });

        this.successMessage = 'PDF 文件下载成功！';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      } catch (err) {
        this.error = `PDF 下载失败: ${err.message}`;
        setTimeout(() => {
          this.error = '';
        }, 3000);
      }
    },

    clearContent() {
      if (this.vditor && confirm('确定要清空所有内容吗？')) {
        this.vditor.setValue('');
        localStorage.removeItem('vditor-cache');
        this.successMessage = '内容已清空';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      }
    }
  }
};
</script>

<style scoped>
.markdown-editor {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  position: relative;
  margin-bottom: 20px;
}

.home-btn {
  position: absolute;
  left: 0;
  top: 0;
  background-color: #95a5a6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.home-btn:hover {
  background-color: #7f8c8d;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 0;
}

.toolbar-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.pdf-export-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-selector {
  padding: 10px 12px;
  border: 1px solid #3498db;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: white;
  color: #2c3e50;
  transition: border-color 0.3s;
}

.theme-selector:hover {
  border-color: #2980b9;
}

.theme-selector:focus {
  outline: none;
  border-color: #2980b9;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.action-btn,
.clear-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  color: white;
}

.action-btn {
  background-color: #3498db;
}

.action-btn:hover {
  background-color: #2980b9;
}

.clear-btn {
  background-color: #e74c3c;
}

.clear-btn:hover {
  background-color: #c0392b;
}

.vditor-container {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.success-message {
  color: #27ae60;
  text-align: center;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 4px;
  margin-bottom: 10px;
  animation: fadeIn 0.3s;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 4px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .markdown-editor {
    padding: 10px;
  }

  .toolbar-actions {
    flex-direction: column;
  }

  .action-btn,
  .clear-btn {
    width: 100%;
  }
}
</style>
