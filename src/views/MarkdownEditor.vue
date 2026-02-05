<template>
  <div class="markdown-editor">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>Markdown 在线编辑器</h1>
    </div>

    <div class="toolbar-actions">
      <button @click="downloadMarkdown" class="action-btn">📥 下载 MD</button>
      <button @click="downloadPDF" class="action-btn">📄 下载 PDF</button>
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
import html2pdf from 'html2pdf.js';

export default {
  name: 'MarkdownEditor',
  data() {
    return {
      vditor: null,
      successMessage: '',
      error: ''
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

        // 获取渲染后的 HTML
        const html = this.vditor.getHTML();
        
        // 创建一个临时的 div 来包含 HTML 内容
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.backgroundColor = 'white';
        element.innerHTML = `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
            h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
            h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
            h3 { font-size: 1.25em; }
            p { margin-bottom: 16px; }
            code { background-color: rgba(27,31,35,.05); border-radius: 3px; padding: .2em .4em; font-family: monospace; }
            pre { background-color: #f6f8fa; border-radius: 3px; padding: 16px; overflow: auto; }
            blockquote { border-left: 4px solid #dfe2e5; padding-left: 1em; color: #6a737d; }
            table { border-collapse: collapse; width: 100%; }
            table th, table td { border: 1px solid #dfe2e5; padding: 6px 13px; }
            img { max-width: 100%; }
          </style>
          ${html}
        `;

        const opt = {
          margin: 10,
          filename: `markdown-${this.generateTimestamp()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();

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
