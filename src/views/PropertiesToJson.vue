<template>
  <div class="properties-to-json">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>Properties 转 JSON 工具</h1>
    </div>

    <div class="input-container">
      <div class="input-group">
        <h3>Properties 格式输入</h3>
        <textarea
            v-model="propertiesInput"
            placeholder="请输入 Properties 格式内容&#x0A;例如：&#x0A;user.name=John&#x0A;user.age=30&#x0A;app.config.timeout=5000&#x0A;&#x0A;支持注释（# 或 !）和空行"
            class="input-area"
        ></textarea>
      </div>

      <div class="input-group">
        <h3>JSON 输出</h3>
        <div class="output-area">
          <pre v-if="jsonOutput">{{ jsonOutput }}</pre>
          <div v-else class="placeholder">JSON 结果将显示在这里</div>
        </div>
      </div>
    </div>

    <div class="controls">
      <div class="mode-control">
        <label>
          <input type="checkbox" v-model="nestedMode">
          嵌套模式（将点号转换为嵌套对象）
        </label>
      </div>
      <div class="actions">
        <button @click="convert" class="action-btn">转换</button>
        <button @click="clearAll" class="clear-btn">清空</button>
        <button v-if="jsonOutput" @click="copyToClipboard" class="copy-btn">复制结果</button>
      </div>
    </div>

    <div v-if="copySuccess" class="success-message">
      已复制到剪贴板！
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PropertiesToJson',
  data() {
    return {
      propertiesInput: '',
      jsonOutput: '',
      nestedMode: true,
      error: '',
      copySuccess: false
    }
  },
  methods: {
    goToHome() {
      this.$router.push('/');
    },
    
    parseProperties(text) {
      const lines = text.split('\n');
      const result = {};
      
      for (let line of lines) {
        // Trim whitespace
        line = line.trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Skip comments (lines starting with # or !)
        if (line.startsWith('#') || line.startsWith('!')) continue;
        
        // Find the first = sign (key=value separator)
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) continue;
        
        let key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        // Handle escaped characters in value
        value = this.unescapeValue(value);
        
        // Handle escaped characters in key
        key = this.unescapeValue(key);
        
        if (this.nestedMode && key.includes('.')) {
          // Create nested structure
          this.setNestedProperty(result, key, value);
        } else {
          // Flat structure
          result[key] = value;
        }
      }
      
      return result;
    },
    
    unescapeValue(str) {
      // Handle common escape sequences
      return str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\f/g, '\f')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\')
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
    },
    
    setNestedProperty(obj, path, value) {
      const keys = path.split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
    },
    
    convert() {
      try {
        this.error = '';
        this.copySuccess = false;
        
        if (!this.propertiesInput.trim()) {
          this.error = '请输入 Properties 格式内容';
          this.jsonOutput = '';
          return;
        }
        
        const parsed = this.parseProperties(this.propertiesInput);
        this.jsonOutput = JSON.stringify(parsed, null, 2);
      } catch (e) {
        this.error = `转换错误: ${e.message}`;
        this.jsonOutput = '';
      }
    },
    
    copyToClipboard() {
      if (!this.jsonOutput) return;
      
      // Use textarea method for better compatibility
      const textarea = document.createElement('textarea');
      textarea.value = this.jsonOutput;
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
        this.copySuccess = true;
        setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      } else {
        this.error = '复制到剪贴板失败，请手动复制。';
      }
    },
    
    clearAll() {
      this.propertiesInput = '';
      this.jsonOutput = '';
      this.error = '';
      this.copySuccess = false;
    }
  }
}
</script>

<style scoped>
.properties-to-json {
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

.input-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.input-area {
  width: 100%;
  height: 400px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  font-size: 14px;
}

.output-area {
  width: 100%;
  height: 400px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f8f9fa;
  overflow: auto;
  font-family: monospace;
  font-size: 14px;
}

.output-area pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.placeholder {
  color: #999;
  text-align: center;
  padding: 20px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.mode-control label {
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #2c3e50;
}

.mode-control input {
  margin-right: 8px;
}

.actions {
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.action-btn {
  background-color: #3498db;
  color: white;
}

.action-btn:hover {
  background-color: #2980b9;
}

.clear-btn {
  background-color: #e74c3c;
  color: white;
}

.clear-btn:hover {
  background-color: #c0392b;
}

.copy-btn {
  background-color: #27ae60;
  color: white;
}

.copy-btn:hover {
  background-color: #219955;
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
  .input-container {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .actions {
    justify-content: center;
  }
}
</style>
