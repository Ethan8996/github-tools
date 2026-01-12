<template>
  <div class="docx-to-markdown">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>DOCX 转 Markdown 工具</h1>
    </div>

    <div class="upload-section">
      <div
        class="upload-area"
        :class="{ 'drag-over': isDragOver }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @click="triggerFileInput"
      >
        <div class="upload-content">
          <div class="upload-icon">📄</div>
          <p v-if="!selectedFile" class="upload-text">
            点击选择或拖拽 .docx 文件到此处
          </p>
          <p v-else class="selected-file">
            已选择: {{ selectedFile.name }}
          </p>
          <p class="upload-hint">支持 Microsoft Word (.docx) 文件</p>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".docx"
          @change="handleFileSelect"
          style="display: none"
        />
      </div>
    </div>

    <div class="actions">
      <button
        @click="convertFile"
        :disabled="!selectedFile || isConverting"
        class="action-btn"
      >
        {{ isConverting ? '转换中...' : '转换为 Markdown' }}
      </button>
      <button @click="clearAll" class="clear-btn">清空</button>
    </div>

    <div v-if="markdownOutput" class="output-section">
      <h3>Markdown 输出</h3>
      <div class="output-area">
        <pre>{{ markdownOutput }}</pre>
      </div>
      <div class="output-actions">
        <button @click="copyToClipboard" class="copy-btn">复制到剪贴板</button>
        <button @click="downloadMarkdown" class="download-btn">下载 .md 文件</button>
      </div>
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import mammoth from 'mammoth';
import TurndownService from 'turndown';

export default {
  name: 'DocxToMarkdown',
  data() {
    return {
      selectedFile: null,
      markdownOutput: '',
      error: '',
      successMessage: '',
      isDragOver: false,
      isConverting: false
    };
  },
  methods: {
    goToHome() {
      this.$router.push('/');
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },

    handleDrop(event) {
      this.isDragOver = false;
      const file = event.dataTransfer.files[0];
      if (file) {
        this.validateAndSetFile(file);
      }
    },

    validateAndSetFile(file) {
      this.error = '';
      this.successMessage = '';

      // Check file extension
      if (!file.name.toLowerCase().endsWith('.docx')) {
        this.error = '请选择 .docx 格式的文件';
        return;
      }

      this.selectedFile = file;
      this.markdownOutput = '';
    },

    async convertFile() {
      if (!this.selectedFile) {
        this.error = '请先选择一个文件';
        return;
      }

      this.isConverting = true;
      this.error = '';
      this.successMessage = '';

      try {
        // Read the file as ArrayBuffer
        const arrayBuffer = await this.readFileAsArrayBuffer(this.selectedFile);

        // Mammoth configuration - style mapping
        const options = {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh",
            "b => strong",
            "i => em",
            "strike => del",
            "comment-reference => sup"
          ]
        };

        // Convert DOCX to HTML using Mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        const html = result.value;

        // Configure Turndown
        const turndownService = new TurndownService({
          headingStyle: 'atx', // Use # style for headings
          codeBlockStyle: 'fenced' // Use ``` style for code blocks
        });

        // Convert HTML to Markdown using Turndown
        this.markdownOutput = turndownService.turndown(html);

        this.successMessage = '转换成功！';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } catch (err) {
        this.error = `转换失败: ${err.message}`;
      } finally {
        this.isConverting = false;
      }
    },

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      });
    },

    copyToClipboard() {
      if (!this.markdownOutput) return;

      // Use textarea method for better compatibility
      const textarea = document.createElement('textarea');
      textarea.value = this.markdownOutput;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      // Select and copy
      textarea.select();
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        success = false;
      }

      // Clean up
      document.body.removeChild(textarea);

      if (success) {
        this.successMessage = '已复制到剪贴板！';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      } else {
        this.error = '复制到剪贴板失败，请手动复制。';
      }
    },

    downloadMarkdown() {
      if (!this.markdownOutput) return;

      const blob = new Blob([this.markdownOutput], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename based on original file name
      const originalName = this.selectedFile.name.replace(/\.docx$/i, '');
      link.download = `${originalName}.md`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.successMessage = '文件下载成功！';
      setTimeout(() => {
        this.successMessage = '';
      }, 2000);
    },

    clearAll() {
      this.selectedFile = null;
      this.markdownOutput = '';
      this.error = '';
      this.successMessage = '';
      this.$refs.fileInput.value = '';
    }
  }
};
</script>

<style scoped>
.docx-to-markdown {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  position: relative;
  margin-bottom: 30px;
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

.upload-section {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.upload-area:hover {
  border-color: #3498db;
  background-color: #f0f8ff;
}

.upload-area.drag-over {
  border-color: #3498db;
  background-color: #e3f2fd;
}

.upload-content {
  pointer-events: none;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 5px;
}

.selected-file {
  font-size: 16px;
  color: #27ae60;
  font-weight: bold;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  background-color: #3498db;
  color: white;
}

.action-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.clear-btn {
  background-color: #e74c3c;
  color: white;
}

.clear-btn:hover {
  background-color: #c0392b;
}

.output-section {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.output-area {
  width: 100%;
  min-height: 400px;
  max-height: 600px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  overflow: auto;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 15px;
}

.output-area pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.output-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.copy-btn {
  background-color: #27ae60;
  color: white;
}

.copy-btn:hover {
  background-color: #219955;
}

.download-btn {
  background-color: #9b59b6;
  color: white;
}

.download-btn:hover {
  background-color: #8e44ad;
}

.success-message {
  color: #27ae60;
  text-align: center;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 4px;
  margin-bottom: 10px;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .output-actions {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
