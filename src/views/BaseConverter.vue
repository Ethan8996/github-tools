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
</style>
