<template>
  <div class="sql-tools">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>SQL 工具集</h1>
    </div>

    <div class="tool-container">
      <div class="tab-container">
        <div class="tab-buttons">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'sqlIn' }" 
            @click="activeTab = 'sqlIn'"
          >
            SQL IN 参数转换
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'sqlGenerator' }" 
            @click="activeTab = 'sqlGenerator'"
          >
            SQL 查询生成器
          </button>
        </div>

        <!-- SQL IN 参数转换 -->
        <div v-if="activeTab === 'sqlIn'" class="tab-content">
          <h2>SQL IN 参数转换</h2>
          <div class="form-group">
            <label for="inputText">输入多行文本 (每行一个值):</label>
            <textarea 
              id="inputText" 
              v-model="inParams.inputText" 
              placeholder="例如:
值1
值2
值3"
            ></textarea>
          </div>

          <div class="options">
            <label>
              <input type="checkbox" v-model="inParams.addQuotes"> 添加引号
            </label>
            <label>
              <input type="checkbox" v-model="inParams.singleQuotes"> 单引号 (不选则使用双引号)
            </label>
            <label>
              <input type="checkbox" v-model="inParams.trimValues"> 去除空白
            </label>
            <label>
              <input type="checkbox" v-model="inParams.skipEmpty"> 忽略空行
            </label>
          </div>

          <button @click="convertToSqlIn" class="action-btn">转换为 SQL IN 格式</button>
          <button @click="removeLineBreaks" class="action-btn">去除换行符</button>
          <button @click="clearInParamsInput" class="clear-btn">清空输入</button>

          <div class="output">{{ inParams.outputText }}</div>
          <button @click="copyToClipboard(inParams.outputText)" class="copy-btn">复制结果</button>
        </div>

        <!-- SQL 查询生成器 -->
        <div v-if="activeTab === 'sqlGenerator'" class="tab-content">
          <h2>SQL 查询生成器</h2>
          <div class="form-group">
            <label for="tableName">表名:</label>
            <input 
              type="text" 
              id="tableName" 
              v-model="sqlGen.tableName" 
              placeholder="例如: users"
            >
          </div>

          <div class="form-group">
            <label for="columns">列名 (逗号分隔):</label>
            <input 
              type="text" 
              id="columns" 
              v-model="sqlGen.columns" 
              placeholder="例如: id, name, email"
            >
          </div>

          <div class="form-group">
            <label for="whereConditions">WHERE 条件 (可选):</label>
            <input 
              type="text" 
              id="whereConditions" 
              v-model="sqlGen.whereConditions" 
              placeholder="例如: status = 'active'"
            >
          </div>

          <div class="form-group">
            <label for="orderBy">ORDER BY (可选):</label>
            <input 
              type="text" 
              id="orderBy" 
              v-model="sqlGen.orderBy" 
              placeholder="例如: created_at DESC"
            >
          </div>

          <div class="form-group">
            <label for="limit">LIMIT (可选):</label>
            <input 
              type="text" 
              id="limit" 
              v-model="sqlGen.limit" 
              placeholder="例如: 100"
            >
          </div>

          <div class="options">
            <label>
              <input type="checkbox" v-model="sqlGen.selectQuery"> SELECT
            </label>
            <label>
              <input type="checkbox" v-model="sqlGen.countQuery"> COUNT
            </label>
            <label>
              <input type="checkbox" v-model="sqlGen.distinctQuery"> DISTINCT
            </label>
          </div>

          <button @click="generateSqlQuery" class="action-btn">生成 SQL 查询</button>
          <button @click="clearSqlGenFields" class="clear-btn">清空字段</button>

          <div class="output">{{ sqlGen.queryOutput }}</div>
          <button @click="copyToClipboard(sqlGen.queryOutput)" class="copy-btn">复制 SQL</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SqlTools',
  data() {
    return {
      activeTab: 'sqlIn',
      inParams: {
        inputText: '',
        outputText: '',
        addQuotes: true,
        singleQuotes: true,
        trimValues: true,
        skipEmpty: true
      },
      sqlGen: {
        tableName: '',
        columns: '',
        whereConditions: '',
        orderBy: '',
        limit: '',
        selectQuery: true,
        countQuery: false,
        distinctQuery: false,
        queryOutput: ''
      }
    }
  },
  methods: {
    // SQL IN 参数转换功能
    goToHome() {
      this.$router.push('/');
    },
    convertToSqlIn() {
      const inputText = this.inParams.inputText;
      
      if (!inputText.trim()) {
        this.inParams.outputText = "请输入数据";
        return;
      }
      
      let lines = inputText.split('\n');
      
      if (this.inParams.trimValues) {
        lines = lines.map(line => line.trim());
      }
      
      if (this.inParams.skipEmpty) {
        lines = lines.filter(line => line.length > 0);
      }
      
      if (this.inParams.addQuotes) {
        const quoteChar = this.inParams.singleQuotes ? "'" : '"';
        lines = lines.map(line => `${quoteChar}${line}${quoteChar}`);
      }
      
      this.inParams.outputText = `(${lines.join(', ')})`;
    },

    removeLineBreaks() {
      if (this.inParams.outputText && this.inParams.outputText !== "请输入数据") {
        this.inParams.outputText = this.inParams.outputText.replace(/\n/g, ' ');
      }
    },

    clearInParamsInput() {
      this.inParams.inputText = '';
      this.inParams.outputText = '';
    },

    // SQL 查询生成器功能
    generateSqlQuery() {
      const { 
        tableName, columns, whereConditions, orderBy, limit,
        countQuery, distinctQuery 
      } = this.sqlGen;
      
      if (!tableName.trim()) {
        this.sqlGen.queryOutput = "请输入表名";
        return;
      }
      
      let query = "";
      
      // 构建查询类型
      if (countQuery) {
        if (distinctQuery && columns.trim()) {
          query = `SELECT COUNT(DISTINCT ${columns}) FROM ${tableName}`;
        } else {
          query = `SELECT COUNT(*) FROM ${tableName}`;
        }
      } else {
        let columnPart = columns.trim() || "*";
        if (distinctQuery && columns.trim()) {
          query = `SELECT DISTINCT ${columnPart} FROM ${tableName}`;
        } else {
          query = `SELECT ${columnPart} FROM ${tableName}`;
        }
      }
      
      // 添加WHERE条件
      if (whereConditions.trim()) {
        query += `\nWHERE ${whereConditions}`;
      }
      
      // 添加ORDER BY
      if (orderBy.trim() && !countQuery) {
        query += `\nORDER BY ${orderBy}`;
      }
      
      // 添加LIMIT
      if (limit.trim()) {
        query += `\nLIMIT ${limit}`;
      }
      
      // 添加分号
      query += ";";
      
      this.sqlGen.queryOutput = query;
    },

    clearSqlGenFields() {
      this.sqlGen.tableName = '';
      this.sqlGen.columns = '';
      this.sqlGen.whereConditions = '';
      this.sqlGen.orderBy = '';
      this.sqlGen.limit = '';
      this.sqlGen.queryOutput = '';
    },

    // 通用方法
    copyToClipboard(text) {
      if (text && text !== "请输入数据" && text !== "请输入表名") {
        navigator.clipboard.writeText(text)
          .catch(err => {
            console.error('复制失败: ', err);
          });
      }
    }
  }
}
</script>

<style scoped>
.sql-tools {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  position: relative;
  margin-bottom: 30px;
}

.home-btn {
  position: absolute;
  left: 20px;
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

.tool-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 0;
}

h2 {
  color: #3498db;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
  margin-top: 0;
}

textarea, input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2980b9;
}

.action-btn {
  background-color: #3498db;
}

.clear-btn {
  background-color: #e74c3c;
}

.clear-btn:hover {
  background-color: #c0392b;
}

.copy-btn {
  background-color: #27ae60;
  margin-top: 10px;
}

.copy-btn:hover {
  background-color: #229954;
}

.output {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin: 15px 0;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 50px;
}

.options {
  margin: 15px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.options label {
  margin-right: 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.options input[type="checkbox"] {
  width: auto;
  margin-right: 5px;
  margin-bottom: 0;
}

.tab-container {
  margin-bottom: 20px;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  background-color: #f1f1f1;
  border: none;
  border-radius: 4px 4px 0 0;
  margin-right: 5px;
  cursor: pointer;
}

.tab-btn.active {
  background-color: #3498db;
  color: white;
}

.tab-content {
  padding: 10px 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .tool-container {
    padding: 15px;
  }
  
  button {
    width: 100%;
  }
  
  .options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .options label {
    margin-bottom: 10px;
  }
}
</style>