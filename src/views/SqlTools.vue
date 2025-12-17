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
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'insertAggregator' }" 
            @click="activeTab = 'insertAggregator'"
          >
            INSERT 语句聚合器
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

        <!-- INSERT 语句聚合器 -->
        <div v-if="activeTab === 'insertAggregator'" class="tab-content">
          <h2>INSERT 语句聚合器</h2>
          <div class="form-group">
            <label for="insertInput">输入多条 INSERT 语句 (每条语句一行或多行):</label>
            <textarea 
              id="insertInput" 
              v-model="insertAgg.inputText" 
              placeholder="例如:
INSERT INTO scada_i18n_message (id, message_key, lang_code, message_value, module, create_time, update_time, remark) VALUES(1989241743978532865, 'protocol.point.liquidResidualRateUsed', 'en', 'Liquid Residual Moisture Check', 'protocol', '2025-11-14 15:59:24', '2025-11-14 15:59:24', NULL);
INSERT INTO scada_i18n_message (id, message_key, lang_code, message_value, module, create_time, update_time, remark) VALUES(1989240908590616578, 'protocol.point.liquidResidualRateUsed', 'zh-cn', '液体残余率使用选配', 'protocol', '2025-11-14 15:56:05', '2025-11-14 15:56:05', NULL);"
            ></textarea>
          </div>

          <div class="options">
            <label>
              <input type="checkbox" v-model="insertAgg.addOnDuplicate"> 添加 ON DUPLICATE KEY UPDATE
            </label>
            <label>
              <input type="checkbox" v-model="insertAgg.removeIdColumn"> 去除 id 列
            </label>
          </div>

          <button @click="aggregateInsertStatements" class="action-btn">聚合 INSERT 语句</button>
          <button @click="clearInsertAggInput" class="clear-btn">清空输入</button>

          <div class="output">{{ insertAgg.outputText }}</div>
          <button @click="copyToClipboard(insertAgg.outputText)" class="copy-btn">复制结果</button>
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
      },
      insertAgg: {
        inputText: '',
        outputText: '',
        addOnDuplicate: false,
        removeIdColumn: false
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

    // INSERT 语句聚合器功能
    aggregateInsertStatements() {
      const inputText = this.insertAgg.inputText.trim();
      
      if (!inputText) {
        this.insertAgg.outputText = "请输入 INSERT 语句";
        return;
      }

      try {
        // 解析 INSERT 语句
        const insertStatements = this.parseInsertStatements(inputText);
        
        if (insertStatements.length === 0) {
          this.insertAgg.outputText = "未找到有效的 INSERT 语句";
          return;
        }

        // 验证所有语句是否针对同一张表
        const tableName = insertStatements[0].tableName;
        const columns = insertStatements[0].columns;
        
        for (let i = 1; i < insertStatements.length; i++) {
          if (insertStatements[i].tableName !== tableName) {
            this.insertAgg.outputText = "错误：INSERT 语句必须针对同一张表";
            return;
          }
          if (JSON.stringify(insertStatements[i].columns) !== JSON.stringify(columns)) {
            this.insertAgg.outputText = "错误：所有 INSERT 语句的列名必须相同";
            return;
          }
        }

        // 处理列和值（如果需要去除 id 列）
        let finalColumns = [...columns];
        let finalValues = insertStatements.map(stmt => stmt.values);
        
        if (this.insertAgg.removeIdColumn) {
          const idIndex = finalColumns.findIndex(col => col.toLowerCase() === 'id');
          if (idIndex !== -1) {
            finalColumns.splice(idIndex, 1);
            finalValues = finalValues.map(values => {
              const newValues = [...values];
              newValues.splice(idIndex, 1);
              return newValues;
            });
          }
        }

        // 构建聚合的 INSERT 语句
        let result = `INSERT INTO ${tableName} (${finalColumns.join(', ')}) VALUES\n`;
        
        // 添加所有值行
        result += finalValues.map(values => `(${values.join(', ')})`).join(',\n');

        // 添加 ON DUPLICATE KEY UPDATE 子句
        if (this.insertAgg.addOnDuplicate) {
          const updateClauses = finalColumns.map(col => `\`${col}\`=VALUES(\`${col}\`)`);
          result += `\nON DUPLICATE KEY UPDATE ${updateClauses.join(', ')}`;
        }

        result += ';';
        
        this.insertAgg.outputText = result;
      } catch (error) {
        this.insertAgg.outputText = `解析错误: ${error.message}`;
      }
    },

    parseInsertStatements(text) {
      const insertStatements = [];
      
      // 预处理：标准化换行和空格，但保留语句完整性
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
      
      // 分割多条 INSERT 语句（通过分号分割，但要注意字符串中的分号）
      const statements = this.splitStatements(normalizedText);
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        // 使用正则匹配基本结构，支持反引号标识符
        const match = statement.match(/INSERT\s+INTO\s+(`?\w+`?)\s*\(([^)]+)\)\s*VALUES\s*\(/i);
        
        if (!match) continue;
        
        const tableName = match[1].trim().replace(/^`(.*)`$/, '$1');
        const columnsStr = match[2].trim();
        
        // 解析列名（简单，因为列名不含特殊字符）
        const columns = columnsStr.split(',').map(col => col.trim().replace(/^`(.*)`$/, '$1'));
        
        // 从 VALUES( 之后开始提取值部分
        const valuesStartIndex = statement.indexOf('VALUES') + 6; // 'VALUES'.length
        const valuesContent = statement.substring(valuesStartIndex).trim();
        
        // 使用状态机提取 VALUES 括号内的内容
        const valuesStr = this.extractValuesContent(valuesContent);
        
        if (!valuesStr) continue;
        
        // 解析值
        const values = this.parseValues(valuesStr);
        
        insertStatements.push({
          tableName,
          columns,
          values
        });
      }
      
      return insertStatements;
    },

    splitStatements(text) {
      const statements = [];
      let currentStatement = '';
      let inString = false;
      let stringChar = '';
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';
        const nextChar = i < text.length - 1 ? text[i + 1] : '';
        
        // 处理字符串状态
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          // 检查 SQL 转义单引号
          if (char === "'" && inString && stringChar === "'" && nextChar === "'") {
            currentStatement += char;
            currentStatement += nextChar;
            i++; // 跳过下一个单引号
            continue;
          }
          
          // 检查 SQL 转义反引号
          if (char === '`' && inString && stringChar === '`' && nextChar === '`') {
            currentStatement += char;
            currentStatement += nextChar;
            i++; // 跳过下一个反引号
            continue;
          }
          
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }
        
        // 分号分割（只在字符串外部）
        if (char === ';' && !inString) {
          if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
          }
          currentStatement = '';
        } else {
          currentStatement += char;
        }
      }
      
      // 添加最后一条语句
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      return statements;
    },

    extractValuesContent(text) {
      // text 应该以 '(' 开头
      if (!text.startsWith('(')) return null;
      
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let content = '';
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';
        const nextChar = i < text.length - 1 ? text[i + 1] : '';
        
        // 处理字符串状态
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          // 检查 SQL 转义单引号
          if (char === "'" && inString && stringChar === "'" && nextChar === "'") {
            content += char;
            content += nextChar;
            i++; // 跳过下一个单引号
            continue;
          }
          
          // 检查 SQL 转义反引号
          if (char === '`' && inString && stringChar === '`' && nextChar === '`') {
            content += char;
            content += nextChar;
            i++; // 跳过下一个反引号
            continue;
          }
          
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }
        
        // 处理括号（只在字符串外部）
        if (!inString) {
          if (char === '(') {
            depth++;
            if (depth === 1) continue; // 跳过最外层的左括号
          } else if (char === ')') {
            depth--;
            if (depth === 0) {
              // 找到匹配的右括号，返回内容
              return content;
            }
          }
        }
        
        if (depth > 0) {
          content += char;
        }
      }
      
      return null; // 没有找到匹配的括号
    },
    


    parseValues(valuesStr) {
      const values = [];
      let currentValue = '';
      let inString = false;
      let stringChar = '';
      let depth = 0;
      
      for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        const prevChar = i > 0 ? valuesStr[i - 1] : '';
        const nextChar = i < valuesStr.length - 1 ? valuesStr[i + 1] : '';
        
        // 处理引号（需要考虑 SQL 的单引号转义 ''）
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          // 检查是否是 SQL 转义的单引号（两个连续单引号）
          if (char === "'" && inString && stringChar === "'" && nextChar === "'") {
            // 这是转义的单引号，保留两个单引号并跳过下一个
            currentValue += char;
            currentValue += nextChar;
            i++; // 跳过下一个单引号
            continue;
          }
          
          // 检查是否是 SQL 转义的反引号（两个连续反引号）
          if (char === '`' && inString && stringChar === '`' && nextChar === '`') {
            // 这是转义的反引号，保留两个反引号并跳过下一个
            currentValue += char;
            currentValue += nextChar;
            i++; // 跳过下一个反引号
            continue;
          }
          
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }
        
        // 处理括号深度（只在字符串外部）
        if (!inString) {
          if (char === '(') {
            depth++;
          } else if (char === ')') {
            depth--;
          }
        }
        
        // 处理逗号分隔（只在字符串外部且深度为0时）
        if (char === ',' && !inString && depth === 0) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }
      
      return values;
    },

    clearInsertAggInput() {
      this.insertAgg.inputText = '';
      this.insertAgg.outputText = '';
    },

    // 通用方法
    copyToClipboard(text) {
      if (text && text !== "请输入数据" && text !== "请输入表名" && text !== "请输入 INSERT 语句" && text !== "未找到有效的 INSERT 语句" && !text.startsWith("错误：") && !text.startsWith("解析错误:")) {
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