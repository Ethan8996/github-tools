<template>
  <div class="json-comparison">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>JSON 对比工具</h1>
    </div>

    <div class="input-container">
      <div class="input-group">
        <h3>JSON A</h3>
        <textarea
            v-model="jsonA"
            placeholder="请输入第一个 JSON 对象
例如：
{
  &quot;name&quot;: &quot;测试&quot;,
  &quot;age&quot;: 25,
  &quot;skills&quot;: [&quot;Vue&quot;, &quot;JavaScript&quot;]
}"
            class="input-area"
        ></textarea>
      </div>

      <div class="input-group">
        <h3>JSON B</h3>
        <textarea
            v-model="jsonB"
            placeholder="请输入第二个 JSON 对象
例如：
{
  &quot;name&quot;: &quot;测试&quot;,
  &quot;age&quot;: 30,
  &quot;skills&quot;: [&quot;Vue&quot;, &quot;TypeScript&quot;]
}"
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
        <h3>统计信息</h3>
        <div class="result-box stats">
          <div class="stat-item">
            <span>JSON A 属性数量:</span> <span class="stat-value">{{ stats.aPropsCount }}</span>
          </div>
          <div class="stat-item">
            <span>JSON B 属性数量:</span> <span class="stat-value">{{ stats.bPropsCount }}</span>
          </div>
          <div class="stat-item">
            <span>共同属性数量:</span> <span class="stat-value">{{ stats.commonPropsCount }}</span>
          </div>
          <div class="stat-item">
            <span>仅在 A 中的属性数量:</span> <span class="stat-value">{{ stats.onlyInACount }}</span>
          </div>
          <div class="stat-item">
            <span>仅在 B 中的属性数量:</span> <span class="stat-value">{{ stats.onlyInBCount }}</span>
          </div>
          <div class="stat-item">
            <span>值不同的属性数量:</span> <span class="stat-value">{{ stats.differentValuesCount }}</span>
          </div>
        </div>
      </div>

      <div class="result-group">
        <h3>JSON 合并</h3>
        <div class="merge-controls">
          <div class="merge-option">
            <label>
              <input type="radio" v-model="mergePreference" value="a" name="merge-pref">
              当冲突时选择 JSON A 的值
            </label>
          </div>
          <div class="merge-option">
            <label>
              <input type="radio" v-model="mergePreference" value="b" name="merge-pref">
              当冲突时选择 JSON B 的值
            </label>
          </div>
          <button @click="mergeJson" class="merge-btn">生成合并 JSON</button>
        </div>
        <div v-if="mergedJson" class="merged-result">
          <div class="result-box merged-json">
            <pre>{{ formattedMergedJson }}</pre>
          </div>
          <div class="copy-actions">
            <button @click="copyMergedJson" class="copy-btn">复制合并后的 JSON</button>
            <span v-if="copySuccess" class="copy-success">已复制到剪贴板!</span>
          </div>
        </div>
      </div>

      <div class="result-group">
        <h3>共同属性 (值相同)</h3>
        <p class="description">两个 JSON 中具有相同值的属性 (共 {{ Object.keys(commonProps).length }} 个)</p>
        <div class="result-box">
          <div v-for="(item, key) in commonProps" :key="key" class="result-item">
            <span class="key">{{ key }}:</span> <span class="value">{{ formatValue(item) }}</span>
          </div>
          <div v-if="Object.keys(commonProps).length === 0" class="empty-result">无共同值属性</div>
        </div>
      </div>

      <div class="result-group">
        <h3>共同属性 (值不同)</h3>
        <p class="description">两个 JSON 中值不同的属性 (共 {{ Object.keys(differentProps).length }} 个)</p>
        <div class="result-box">
          <div v-for="(diff, key) in differentProps" :key="key" class="result-item different">
            <div class="prop-key">{{ key }}:</div>
            <div class="prop-diff">
              <div class="prop-a">A: <span>{{ formatValue(diff.a) }}</span></div>
              <div class="prop-b">B: <span>{{ formatValue(diff.b) }}</span></div>
            </div>
          </div>
          <div v-if="Object.keys(differentProps).length === 0" class="empty-result">无值不同属性</div>
        </div>
      </div>

      <div class="result-group">
        <h3>仅在 A 中存在的属性</h3>
        <p class="description">仅在 JSON A 中存在的属性 (共 {{ Object.keys(onlyInA).length }} 个)</p>
        <div class="result-box">
          <div v-for="(value, key) in onlyInA" :key="key" class="result-item">
            <span class="key">{{ key }}:</span> <span class="value">{{ formatValue(value) }}</span>
          </div>
          <div v-if="Object.keys(onlyInA).length === 0" class="empty-result">无独有属性</div>
        </div>
      </div>

      <div class="result-group">
        <h3>仅在 B 中存在的属性</h3>
        <p class="description">仅在 JSON B 中存在的属性 (共 {{ Object.keys(onlyInB).length }} 个)</p>
        <div class="result-box">
          <div v-for="(value, key) in onlyInB" :key="key" class="result-item">
            <span class="key">{{ key }}:</span> <span class="value">{{ formatValue(value) }}</span>
          </div>
          <div v-if="Object.keys(onlyInB).length === 0" class="empty-result">无独有属性</div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'JsonCompare',
  data() {
    return {
      jsonA: '',
      jsonB: '',
      commonProps: {},
      differentProps: {},
      onlyInA: {},
      onlyInB: {},
      stats: {
        aPropsCount: 0,
        bPropsCount: 0,
        commonPropsCount: 0,
        onlyInACount: 0,
        onlyInBCount: 0,
        differentValuesCount: 0
      },
      error: '',
      hasResults: false,
      mergePreference: 'a',
      mergedJson: null,
      copySuccess: false
    }
  },
  computed: {
    formattedMergedJson() {
      return this.mergedJson ? JSON.stringify(this.mergedJson, null, 2) : '';
    }
  },
  methods: {
    parseJson(text) {
      try {
        return text.trim() ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`JSON 解析错误: ${e.message}`);
      }
    },
    goToHome() {
      this.$router.push('/');
    },
    compare() {
      try {
        this.error = '';
        const objA = this.parseJson(this.jsonA);
        const objB = this.parseJson(this.jsonB);

        // 重置结果
        this.commonProps = {};
        this.differentProps = {};
        this.onlyInA = {};
        this.onlyInB = {};

        // 获取所有键
        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);

        // 统计初始化
        this.stats.aPropsCount = keysA.length;
        this.stats.bPropsCount = keysB.length;

        // 分析在 A 中的键
        for (const key of keysA) {
          if (keysB.includes(key)) {
            // 键在两个对象中都存在
            const valueA = objA[key];
            const valueB = objB[key];

            // 比较值是否相等（考虑深比较）
            if (JSON.stringify(valueA) === JSON.stringify(valueB)) {
              // 值相等
              this.commonProps[key] = valueA;
            } else {
              // 值不等
              this.differentProps[key] = {
                a: valueA,
                b: valueB
              };
            }
          } else {
            // 键只在 A 中
            this.onlyInA[key] = objA[key];
          }
        }

        // 分析只在 B 中的键
        for (const key of keysB) {
          if (!keysA.includes(key)) {
            this.onlyInB[key] = objB[key];
          }
        }

        // 更新统计信息
        this.stats.commonPropsCount = Object.keys(this.commonProps).length;
        this.stats.differentValuesCount = Object.keys(this.differentProps).length;
        this.stats.onlyInACount = Object.keys(this.onlyInA).length;
        this.stats.onlyInBCount = Object.keys(this.onlyInB).length;

        this.hasResults = true;

        // 默认生成一次合并结果
        this.mergeJson();
      } catch (e) {
        this.error = e.message;
        this.hasResults = false;
      }
    },
    mergeJson() {
      try {
        if (!this.hasResults) {
          return;
        }

        // const objA = this.parseJson(this.jsonA);
        // const objB = this.parseJson(this.jsonB);

        // 创建合并对象
        const merged = {};

        // 添加只在 A 中的属性
        for (const key in this.onlyInA) {
          merged[key] = this.onlyInA[key];
        }

        // 添加只在 B 中的属性
        for (const key in this.onlyInB) {
          merged[key] = this.onlyInB[key];
        }

        // 添加共同且值相同的属性
        for (const key in this.commonProps) {
          merged[key] = this.commonProps[key];
        }

        // 添加共同但值不同的属性（根据选择）
        for (const key in this.differentProps) {
          if (this.mergePreference === 'a') {
            merged[key] = this.differentProps[key].a;
          } else {
            merged[key] = this.differentProps[key].b;
          }
        }

        this.mergedJson = merged;
      } catch (e) {
        this.error = `合并 JSON 时出错: ${e.message}`;
      }
    },
    copyMergedJson() {
      if (!this.mergedJson) return;

      const textToCopy = JSON.stringify(this.mergedJson, null, 2);

      // 使用 textarea 方法进行复制，兼容性更好
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);

      // 选择并复制内容
      textarea.select();
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        success = false;
      }

      // 清理并显示复制结果
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
      this.jsonA = '';
      this.jsonB = '';
      this.commonProps = {};
      this.differentProps = {};
      this.onlyInA = {};
      this.onlyInB = {};
      this.stats = {
        aPropsCount: 0,
        bPropsCount: 0,
        commonPropsCount: 0,
        onlyInACount: 0,
        onlyInBCount: 0,
        differentValuesCount: 0
      };
      this.error = '';
      this.hasResults = false;
      this.mergedJson = null;
    },
    formatValue(value) {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    }
  }
}
</script>

<style scoped>
.json-comparison {
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

.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
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
  max-height: 250px;
  overflow-y: auto;
}

.result-box.stats {
  min-height: auto;
}

.result-box.merged-json {
  max-height: 300px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-value {
  font-weight: bold;
  color: #2980b9;
}

.result-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
  word-break: break-word;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.different {
  padding: 10px 5px;
}

.prop-key {
  font-weight: bold;
  margin-bottom: 5px;
}

.prop-diff {
  padding-left: 10px;
}

.prop-a {
  color: #27ae60;
  margin-bottom: 3px;
}

.prop-b {
  color: #e74c3c;
}

.key {
  font-weight: bold;
  color: #333;
}

.value {
  word-break: break-all;
}

.empty-result {
  color: #999;
  text-align: center;
  padding: 20px;
}

.merge-controls {
  margin-bottom: 15px;
}

.merge-option {
  margin-bottom: 10px;
}

.merge-option label {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.merge-option input {
  margin-right: 8px;
}

.merge-btn {
  background-color: #27ae60;
  color: white;
}

.merge-btn:hover {
  background-color: #219955;
}

.copy-actions {
  margin-top: 10px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.copy-btn {
  background-color: #7f8c8d;
  color: white;
  font-size: 12px;
  padding: 8px 12px;
}

.copy-btn:hover {
  background-color: #6c7a7d;
}

.copy-success {
  color: #27ae60;
  margin-left: 10px;
  font-size: 12px;
}

.merged-result {
  margin-top: 15px;
}

.merged-result pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #fadbd8;
  border-radius: 4px;
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
