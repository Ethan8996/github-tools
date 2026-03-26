<template>
  <div class="tool">
    <h1>进制转换工具</h1>
    
    <div class="converter-container">
      <!-- 十进制 ↔ 二进制 -->
      <div class="converter-section">
        <h3>十进制 ⇄ 二进制</h3>
        <div class="input-group">
          <label>十进制</label>
          <input v-model="decimalToBinaryInput" placeholder="输入十进制数字" />
          <button @click="convertDecimalToBinary">转换 →</button>
        </div>
        <div class="result" v-if="binaryResult">
          <strong>二进制结果:</strong> {{ binaryResult }}
          <button class="copy-btn" @click="copyToClipboard(binaryResult)">复制</button>
        </div>
        
        <div class="input-group" style="margin-top: 15px;">
          <label>二进制</label>
          <input v-model="binaryToDecimalInput" placeholder="输入二进制数字" />
          <button @click="convertBinaryToDecimal">转换 →</button>
        </div>
        <div class="result" v-if="decimalFromBinaryResult">
          <strong>十进制结果:</strong> {{ decimalFromBinaryResult }}
          <button class="copy-btn" @click="copyToClipboard(decimalFromBinaryResult)">复制</button>
        </div>
      </div>
      
      <!-- 十进制 ↔ 十六进制 -->
      <div class="converter-section">
        <h3>十进制 ⇄ 十六进制</h3>
        <div class="input-group">
          <label>十进制</label>
          <input v-model="decimalToHexInput" placeholder="输入十进制数字" />
          <button @click="convertDecimalToHex">转换 →</button>
        </div>
        <div class="result" v-if="hexResult">
          <strong>十六进制结果:</strong> {{ hexResult }}
          <button class="copy-btn" @click="copyToClipboard(hexResult)">复制</button>
        </div>
        
        <div class="input-group" style="margin-top: 15px;">
          <label>十六进制</label>
          <input v-model="hexToDecimalInput" placeholder="输入十六进制数字" />
          <button @click="convertHexToDecimal">转换 →</button>
        </div>
        <div class="result" v-if="decimalFromHexResult">
          <strong>十进制结果:</strong> {{ decimalFromHexResult }}
          <button class="copy-btn" @click="copyToClipboard(decimalFromHexResult)">复制</button>
        </div>
      </div>
      
      <!-- ASCII字符串 ↔ 十进制 -->
      <div class="converter-section">
        <h3>ASCII 字符串 ⇄ 十进制</h3>
        <div class="input-group">
          <label>ASCII 字符串</label>
          <textarea v-model="asciiToDecimalInput" placeholder="输入 ASCII 字符串" rows="3"></textarea>
          <button @click="convertAsciiToDecimal">转换 →</button>
        </div>
        <div class="result" v-if="decimalFromAsciiResult">
          <strong>十进制结果:</strong> {{ decimalFromAsciiResult }}
          <button class="copy-btn" @click="copyToClipboard(decimalFromAsciiResult)">复制</button>
        </div>
        
        <div class="input-group" style="margin-top: 15px;">
          <label>十进制 (用逗号、空格或换行分隔)</label>
          <textarea v-model="decimalToAsciiInput" placeholder="输入十进制数字序列" rows="3"></textarea>
          <button @click="convertDecimalToAscii">转换 →</button>
        </div>
        <div class="result" v-if="asciiResult">
          <strong>ASCII 字符串结果:</strong> {{ asciiResult }}
          <button class="copy-btn" @click="copyToClipboard(asciiResult)">复制</button>
        </div>
      </div>
      
      <!-- Modbus 寄存器转换 -->
      <div class="converter-section modbus-section">
        <h3>🔧 Modbus 寄存器转换 (2字节/16位)</h3>
        <div class="input-group">
          <label>输入寄存器值 (支持十进制、十六进制 0x、二进制 0b)</label>
          <input v-model="modbusInput" placeholder="例如: 1234 或 0x04D2 或 0b100" />
          <button @click="convertModbus">转换 →</button>
        </div>
        
        <div class="modbus-result" v-if="modbusResult">
          <div class="modbus-format">
            <div class="format-item">
              <span class="format-label">寄存器地址格式 (16进制):</span>
              <span class="format-value">{{ modbusResult.hex }}</span>
              <button class="copy-btn" @click="copyToClipboard(modbusResult.hex)">复制</button>
            </div>
            <div class="format-item">
              <span class="format-label">寄存器值 (10进制):</span>
              <span class="format-value">{{ modbusResult.decimal }}</span>
              <button class="copy-btn" @click="copyToClipboard(modbusResult.decimal)">复制</button>
            </div>
            <div class="format-item">
              <span class="format-label">寄存器值 (16位二进制):</span>
              <span class="format-value">{{ modbusResult.binary }}</span>
              <button class="copy-btn" @click="copyToClipboard(modbusResult.binary)">复制</button>
            </div>
            <div class="format-item bytes-split">
              <span class="format-label">字节分解:</span>
              <span class="format-value">
                <span class="byte-box high-byte" title="高字节 (MSB)">高字节: {{ modbusResult.highByte }}</span>
                <span class="byte-box low-byte" title="低字节 (LSB)">低字节: {{ modbusResult.lowByte }}</span>
              </span>
            </div>
            <div class="format-item">
              <span class="format-label">有符号值 (16位):</span>
              <span class="format-value">{{ modbusResult.signed }}</span>
              <button class="copy-btn" @click="copyToClipboard(modbusResult.signed.toString())">复制</button>
            </div>
          </div>
        </div>
        
        <div class="input-group" style="margin-top: 20px;">
          <label>批量寄存器转换 (用空格、逗号或换行分隔)</label>
          <textarea v-model="modbusBatchInput" placeholder="输入多个寄存器值，例如:
1234
0x04D2
0b10011010010" rows="3"></textarea>
          <button @click="convertModbusBatch">批量转换 →</button>
        </div>
        
        <div class="modbus-batch-result" v-if="modbusBatchResults.length > 0">
          <table class="modbus-table">
            <thead>
              <tr>
                <th>输入</th>
                <th>十六进制</th>
                <th>十进制</th>
                <th>二进制</th>
                <th>高字节</th>
                <th>低字节</th>
                <th>有符号</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in modbusBatchResults" :key="index">
                <td class="original">{{ item.original }}</td>
                <td>{{ item.hex }}</td>
                <td>{{ item.decimal }}</td>
                <td class="binary">{{ item.binary }}</td>
                <td>{{ item.highByte }}</td>
                <td>{{ item.lowByte }}</td>
                <td>{{ item.signed }}</td>
              </tr>
            </tbody>
          </table>
          <button class="copy-all-btn" @click="copyModbusBatchTable">复制表格数据</button>
        </div>
      </div>
      
      <!-- 批量转换 -->
      <div class="converter-section">
        <h3>批量转换</h3>
        <div class="input-group">
          <label>输入数字</label>
          <input v-model="batchInput" placeholder="输入数字" />
        </div>
        <div class="batch-result" v-if="batchInput">
          <div class="batch-item">
            <span class="label">二进制:</span>
            <span class="value">{{ toBinary(batchInput) }}</span>
            <button class="copy-btn" @click="copyToClipboard(toBinary(batchInput))">复制</button>
          </div>
          <div class="batch-item">
            <span class="label">八进制:</span>
            <span class="value">{{ toOctal(batchInput) }}</span>
            <button class="copy-btn" @click="copyToClipboard(toOctal(batchInput))">复制</button>
          </div>
          <div class="batch-item">
            <span class="label">十进制:</span>
            <span class="value">{{ toDecimal(batchInput) }}</span>
            <button class="copy-btn" @click="copyToClipboard(toDecimal(batchInput))">复制</button>
          </div>
          <div class="batch-item">
            <span class="label">十六进制:</span>
            <span class="value">{{ toHex(batchInput) }}</span>
            <button class="copy-btn" @click="copyToClipboard(toHex(batchInput))">复制</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="toast" v-if="toastVisible">{{ toastMessage }}</div>
  </div>
</template>

<script>
export default {
  name: 'BaseConverter',
  data() {
    return {
      // 十进制转二进制
      decimalToBinaryInput: '',
      binaryResult: '',
      // 二进制转十进制
      binaryToDecimalInput: '',
      decimalFromBinaryResult: '',
      // 十进制转十六进制
      decimalToHexInput: '',
      hexResult: '',
      // 十六进制转十进制
      hexToDecimalInput: '',
      decimalFromHexResult: '',
      // ASCII转十进制
      asciiToDecimalInput: '',
      decimalFromAsciiResult: '',
      // 十进制转ASCII
      decimalToAsciiInput: '',
      asciiResult: '',
      // Modbus寄存器转换
      modbusInput: '',
      modbusResult: null,
      modbusBatchInput: '',
      modbusBatchResults: [],
      // 批量转换
      batchInput: '',
      // Toast提示
      toastVisible: false,
      toastMessage: ''
    }
  },
  methods: {
    // 十进制转二进制
    convertDecimalToBinary() {
      const num = parseInt(this.decimalToBinaryInput, 10)
      if (isNaN(num)) {
        this.showToast('请输入有效的十进制数字')
        return
      }
      this.binaryResult = num.toString(2)
    },
    // 二进制转十进制
    convertBinaryToDecimal() {
      const num = parseInt(this.binaryToDecimalInput, 2)
      if (isNaN(num)) {
        this.showToast('请输入有效的二进制数字')
        return
      }
      this.decimalFromBinaryResult = num.toString(10)
    },
    // 十进制转十六进制
    convertDecimalToHex() {
      const num = parseInt(this.decimalToHexInput, 10)
      if (isNaN(num)) {
        this.showToast('请输入有效的十进制数字')
        return
      }
      this.hexResult = num.toString(16).toUpperCase()
    },
    // 十六进制转十进制
    convertHexToDecimal() {
      const num = parseInt(this.hexToDecimalInput, 16)
      if (isNaN(num)) {
        this.showToast('请输入有效的十六进制数字')
        return
      }
      this.decimalFromHexResult = num.toString(10)
    },
    // ASCII字符串转十进制
    convertAsciiToDecimal() {
      if (!this.asciiToDecimalInput) {
        this.showToast('请输入 ASCII 字符串')
        return
      }
      const decimals = []
      for (let i = 0; i < this.asciiToDecimalInput.length; i++) {
        decimals.push(this.asciiToDecimalInput.charCodeAt(i))
      }
      this.decimalFromAsciiResult = decimals.join(', ')
    },
    // 十进制转ASCII字符串
    convertDecimalToAscii() {
      if (!this.decimalToAsciiInput) {
        this.showToast('请输入十进制数字')
        return
      }
      // 支持逗号、空格、换行分隔
      const numbers = this.decimalToAsciiInput.split(/[,\s]+/).filter(n => n.trim() !== '')
      let result = ''
      for (const numStr of numbers) {
        const num = parseInt(numStr, 10)
        if (isNaN(num) || num < 0 || num > 255) {
          this.showToast(`无效的数字: ${numStr} (必须是 0-255)`)
          return
        }
        result += String.fromCharCode(num)
      }
      this.asciiResult = result
    },
    // Modbus寄存器转换
    convertModbus() {
      if (!this.modbusInput) {
        this.showToast('请输入寄存器值')
        return
      }
      
      const value = this.parseModbusValue(this.modbusInput)
      if (value === null) {
        this.showToast('请输入有效的寄存器值 (0-65535)')
        return
      }
      
      this.modbusResult = this.formatModbusRegister(value)
    },
    
    // 批量Modbus转换
    convertModbusBatch() {
      if (!this.modbusBatchInput) {
        this.showToast('请输入要转换的寄存器值')
        return
      }
      
      const inputs = this.modbusBatchInput.split(/[,\s]+/).filter(n => n.trim() !== '')
      this.modbusBatchResults = []
      
      for (const input of inputs) {
        const value = this.parseModbusValue(input)
        if (value !== null) {
          this.modbusBatchResults.push({
            original: input,
            ...this.formatModbusRegister(value)
          })
        }
      }
      
      if (this.modbusBatchResults.length === 0) {
        this.showToast('没有有效的寄存器值')
      }
    },
    
    // 解析Modbus输入值
    parseModbusValue(input) {
      input = input.trim().toLowerCase()
      if (!input) return null
      
      let value
      if (input.startsWith('0x')) {
        value = parseInt(input, 16)
      } else if (input.startsWith('0b')) {
        value = parseInt(input.slice(2), 2)
      } else {
        value = parseInt(input, 10)
      }
      
      // Modbus寄存器是16位无符号整数 (0-65535)
      if (isNaN(value) || value < 0 || value > 65535) {
        return null
      }
      
      return value
    },
    
    // 格式化Modbus寄存器
    formatModbusRegister(value) {
      const highByte = (value >> 8) & 0xFF
      const lowByte = value & 0xFF
      
      // 有符号16位转换
      const signed = value > 32767 ? value - 65536 : value
      
      return {
        hex: `0x${value.toString(16).toUpperCase().padStart(4, '0')}`,
        decimal: value.toString(),
        binary: value.toString(2).padStart(16, '0'),
        highByte: `0x${highByte.toString(16).toUpperCase().padStart(2, '0')}`,
        lowByte: `0x${lowByte.toString(16).toUpperCase().padStart(2, '0')}`,
        signed: signed
      }
    },
    
    // 复制Modbus批量表格
    copyModbusBatchTable() {
      if (this.modbusBatchResults.length === 0) return
      
      const headers = ['输入', '十六进制', '十进制', '二进制', '高字节', '低字节', '有符号']
      const rows = this.modbusBatchResults.map(item => [
        item.original,
        item.hex,
        item.decimal,
        item.binary,
        item.highByte,
        item.lowByte,
        item.signed
      ])
      
      const tableText = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
      this.copyToClipboard(tableText)
    },
    
    // 批量转换函数
    toBinary(input) {
      const num = this.parseInput(input)
      return num !== null ? num.toString(2) : '无效输入'
    },
    toOctal(input) {
      const num = this.parseInput(input)
      return num !== null ? num.toString(8) : '无效输入'
    },
    toDecimal(input) {
      const num = this.parseInput(input)
      return num !== null ? num.toString(10) : '无效输入'
    },
    toHex(input) {
      const num = this.parseInput(input)
      return num !== null ? num.toString(16).toUpperCase() : '无效输入'
    },
    parseInput(input) {
      input = input.trim()
      if (!input) return null
      
      // 尝试不同进制
      let num
      if (input.startsWith('0x') || input.startsWith('0X')) {
        num = parseInt(input, 16)
      } else if (input.startsWith('0b') || input.startsWith('0B')) {
        num = parseInt(input.slice(2), 2)
      } else if (input.startsWith('0') && input.length > 1) {
        num = parseInt(input, 8)
      } else {
        num = parseInt(input, 10)
      }
      
      return isNaN(num) ? null : num
    },
    // 复制到剪贴板
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.showToast('已复制到剪贴板')
      } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.showToast('已复制到剪贴板')
      }
    },
    // 显示提示
    showToast(message) {
      this.toastMessage = message
      this.toastVisible = true
      setTimeout(() => {
        this.toastVisible = false
      }, 2000)
    }
  }
}
</script>

<style scoped>
.tool {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

.converter-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.converter-section {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.converter-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #4CAF50;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.input-group label {
  font-weight: bold;
  color: #555;
  font-size: 14px;
}

.input-group input,
.input-group textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.input-group textarea {
  resize: vertical;
}

.input-group input:focus,
.input-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

button {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

button:hover {
  background: #45a049;
}

button:active {
  background: #3d8b40;
}

.result {
  background: #e8f5e9;
  padding: 12px;
  border-radius: 4px;
  margin-top: 10px;
  font-family: monospace;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.result strong {
  color: #2e7d32;
}

.copy-btn {
  padding: 4px 10px;
  font-size: 12px;
  background: #2196F3;
  margin-left: auto;
}

.copy-btn:hover {
  background: #1976D2;
}

.batch-result {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  margin-top: 10px;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.batch-item:last-child {
  border-bottom: none;
}

.batch-item .label {
  font-weight: bold;
  color: #555;
  min-width: 70px;
}

.batch-item .value {
  font-family: monospace;
  color: #333;
  flex: 1;
  word-break: break-all;
}

.batch-item .copy-btn {
  margin-left: auto;
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  z-index: 1000;
  animation: fadeInOut 2s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
}

@media (max-width: 768px) {
  .converter-container {
    grid-template-columns: 1fr;
  }
}

/* Modbus 样式 */
.modbus-section {
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
  border: 2px solid #4a90e2;
}

.modbus-section h3 {
  color: #2c5aa0;
  border-bottom: 2px solid #2c5aa0;
}

.modbus-result {
  background: #fff;
  border: 1px solid #4a90e2;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.modbus-format {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  flex-wrap: wrap;
}

.format-label {
  font-weight: bold;
  color: #2c5aa0;
  min-width: 180px;
}

.format-value {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #333;
  flex: 1;
  word-break: break-all;
}

.bytes-split .format-value {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.byte-box {
  padding: 6px 12px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
}

.byte-box.high-byte {
  background: #ffebee;
  border: 1px solid #ef5350;
  color: #c62828;
}

.byte-box.low-byte {
  background: #e3f2fd;
  border: 1px solid #42a5f5;
  color: #1565c0;
}

.modbus-batch-result {
  margin-top: 15px;
  overflow-x: auto;
}

.modbus-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.modbus-table th,
.modbus-table td {
  padding: 10px 12px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.modbus-table th {
  background: #2c5aa0;
  color: white;
  font-weight: bold;
}

.modbus-table td {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.modbus-table tr:nth-child(even) {
  background: #f5f9ff;
}

.modbus-table tr:hover {
  background: #e8f0fe;
}

.modbus-table .original {
  color: #666;
  font-style: italic;
}

.modbus-table .binary {
  font-size: 12px;
  letter-spacing: 1px;
}

.copy-all-btn {
  margin-top: 10px;
  background: #2c5aa0;
}

.copy-all-btn:hover {
  background: #1e3d6f;
}
</style>
