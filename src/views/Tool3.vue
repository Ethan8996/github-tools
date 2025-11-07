<template>
  <div class="numbering-tool">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>字符串编号工具</h1>
    </div>
    
    <div class="input-section">
      <h3>输入内容</h3>
      <textarea 
        v-model="inputText"
        placeholder="请输入需要编号的字符串列表，每行一个值
例如：
项目A
项目B
项目C"
        class="input-area"
      ></textarea>
    </div>

    <div class="config-section">
      <h3>配置选项</h3>
      <div class="options">
        <div class="option-group">
          <label>编号格式：</label>
          <select v-model="numberFormat" class="format-select">
            <option value="raw">1 2 3</option>
            <option value="dot">1. 2. 3.</option>
            <option value="paren">1) 2) 3)</option>
            <option value="bracket">[1] [2] [3]</option>
            <option value="doubleParen">(1) (2) (3)</option>
          </select>
        </div>
        <div class="option-group">
          <label>起始数字：</label>
          <input 
            v-model.number="startNumber" 
            type="number" 
            min="0" 
            class="number-input"
          />
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="generateNumbers" class="action-btn">生成编号</button>
      <button @click="clearAll" class="clear-btn">清空</button>
    </div>

    <div v-if="hasResults" class="results">
      <div class="result-group">
        <h3>完整结果（编号 + 内容）</h3>
        <p class="description">共 {{ completeResults.length }} 项</p>
        <div class="result-box">
          <div v-for="(item, index) in completeResults" :key="index" class="result-item">
            {{ item }}
          </div>
        </div>
        <button @click="copyComplete" class="copy-btn">复制完整结果</button>
      </div>

      <div class="result-group">
        <h3>仅编号（适用于表格）</h3>
        <p class="description">共 {{ numbersOnly.length }} 项</p>
        <div class="result-box">
          <div v-for="(item, index) in numbersOnly" :key="index" class="result-item">
            {{ item }}
          </div>
        </div>
        <button @click="copyNumbers" class="copy-btn">复制仅编号</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tool3',
  data() {
    return {
      inputText: '',
      numberFormat: 'raw',
      startNumber: 1,
      completeResults: [],
      numbersOnly: [],
      hasResults: false
    }
  },
  methods: {
    parseInput() {
      return this.inputText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    },
    formatNumber(num) {
      switch (this.numberFormat) {
        case 'raw':
          return `${num}`;
        case 'dot':
          return `${num}.`;
        case 'paren':
          return `${num})`;
        case 'bracket':
          return `[${num}]`;
        case 'doubleParen':
          return `(${num})`;
        default:
          return `${num}.`;
      }
    },
    generateNumbers() {
      const items = this.parseInput();
      if (items.length === 0) {
        alert('请输入至少一行内容');
        return;
      }

      this.completeResults = [];
      this.numbersOnly = [];

      items.forEach((item, index) => {
        const number = this.startNumber + index;
        const formattedNumber = this.formatNumber(number);
        
        this.completeResults.push(`${formattedNumber} ${item}`);
        this.numbersOnly.push(formattedNumber);
      });

      this.hasResults = true;
    },
    goToHome() {
      this.$router.push('/');
    },
    clearAll() {
      this.inputText = '';
      this.numberFormat = 'raw';
      this.startNumber = 1;
      this.completeResults = [];
      this.numbersOnly = [];
      this.hasResults = false;
    },
    copyComplete() {
      const text = this.completeResults.join('\n');
      navigator.clipboard.writeText(text)
        .catch(err => {
          console.error('复制失败: ', err);
        });
    },
    copyNumbers() {
      const text = this.numbersOnly.join('\n');
      navigator.clipboard.writeText(text)
        .catch(err => {
          console.error('复制失败: ', err);
        });
    }
  }
}
</script>

<style scoped>
.numbering-tool {
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

.input-section {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.input-area {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  box-sizing: border-box;
}

.config-section {
  margin-bottom: 20px;
}

.options {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-group label {
  font-weight: bold;
  color: #2c3e50;
}

.format-select,
.number-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.number-input {
  width: 100px;
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
  margin-top: 10px;
  width: 100%;
}

.copy-btn:hover {
  background-color: #229954;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.result-group {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.description {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.result-box {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-family: monospace;
}

.result-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .options {
    flex-direction: column;
    gap: 15px;
  }
  
  .results {
    grid-template-columns: 1fr;
  }
}
</style>
