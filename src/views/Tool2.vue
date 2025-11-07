<template>
  <div class="string-comparison">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>字符串列表比较工具</h1>
    </div>
    
    <div class="input-container">
      <div class="input-group">
        <h3>列表 A</h3>
        <textarea 
          v-model="listA"
          placeholder="请输入第一组字符串列表，每行一个值
例如：
值1
值2
值3"
          class="input-area"
        ></textarea>
      </div>

      <div class="input-group">
        <h3>列表 B</h3>
        <textarea 
          v-model="listB"
          placeholder="请输入第二组字符串列表，每行一个值
例如：
值2
值3
值4"
          class="input-area"
        ></textarea>
      </div>
    </div>

    <div class="actions">
      <button @click="compare" class="action-btn">比较</button>
      <button @click="clearAll" class="clear-btn">清空</button>
    </div>

    <div v-if="hasResults" class="results">
      <div class="result-group">
        <h3>交集 (A ∩ B)</h3>
        <p class="description">两个列表中都存在的元素 (共 {{ intersection.length }} 个)</p>
        <div class="result-box">
          <div v-for="item in intersection" :key="item" class="result-item">{{ item }}</div>
          <div v-if="intersection.length === 0" class="empty-result">无交集</div>
        </div>
        <button @click="copyResult(intersection)" class="copy-btn" :disabled="intersection.length === 0">复制到剪贴板</button>
      </div>

      <div class="result-group">
        <h3>并集 (A ∪ B)</h3>
        <p class="description">两个列表中所有不重复的元素 (共 {{ union.length }} 个)</p>
        <div class="result-box">
          <div v-for="item in union" :key="item" class="result-item">{{ item }}</div>
          <div v-if="union.length === 0" class="empty-result">无并集</div>
        </div>
        <button @click="copyResult(union)" class="copy-btn" :disabled="union.length === 0">复制到剪贴板</button>
      </div>

      <div class="result-group">
        <h3>差集 (A - B)</h3>
        <p class="description">仅在列表 A 中存在的元素 (共 {{ differenceA.length }} 个)</p>
        <div class="result-box">
          <div v-for="item in differenceA" :key="item" class="result-item">{{ item }}</div>
          <div v-if="differenceA.length === 0" class="empty-result">无差集</div>
        </div>
        <button @click="copyResult(differenceA)" class="copy-btn" :disabled="differenceA.length === 0">复制到剪贴板</button>
      </div>

      <div class="result-group">
        <h3>差集 (B - A)</h3>
        <p class="description">仅在列表 B 中存在的元素 (共 {{ differenceB.length }} 个)</p>
        <div class="result-box">
          <div v-for="item in differenceB" :key="item" class="result-item">{{ item }}</div>
          <div v-if="differenceB.length === 0" class="empty-result">无差集</div>
        </div>
        <button @click="copyResult(differenceB)" class="copy-btn" :disabled="differenceB.length === 0">复制到剪贴板</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tool2',
  data() {
    return {
      listA: '',
      listB: '',
      intersection: [],
      union: [],
      differenceA: [],
      differenceB: [],
      hasResults: false
    }
  },
  methods: {
    parseList(text) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    },
    goToHome() {
      this.$router.push('/');
    },
    compare() {
      const setA = new Set(this.parseList(this.listA));
      const setB = new Set(this.parseList(this.listB));
      
      // 计算交集
      this.intersection = [...setA].filter(x => setB.has(x)).sort();
      
      // 计算并集
      this.union = [...new Set([...setA, ...setB])].sort();
      
      // 计算差集 A-B
      this.differenceA = [...setA].filter(x => !setB.has(x)).sort();
      
      // 计算差集 B-A
      this.differenceB = [...setB].filter(x => !setA.has(x)).sort();
      
      this.hasResults = true;
    },
    clearAll() {
      this.listA = '';
      this.listB = '';
      this.intersection = [];
      this.union = [];
      this.differenceA = [];
      this.differenceB = [];
      this.hasResults = false;
    },
    copyResult(resultArray) {
      const text = resultArray.join('\n');
      navigator.clipboard.writeText(text)
        .catch(err => {
          console.error('复制失败: ', err);
        });
    }
  }
}
</script>

<style scoped>
.string-comparison {
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
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
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

.copy-btn:hover:not(:disabled) {
  background-color: #229954;
}

.copy-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  opacity: 0.6;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  max-height: 200px;
  overflow-y: auto;
}

.result-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.result-item:last-child {
  border-bottom: none;
}

.empty-result {
  color: #999;
  text-align: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .input-container {
    grid-template-columns: 1fr;
  }
  
  .results {
    grid-template-columns: 1fr;
  }
}
</style>