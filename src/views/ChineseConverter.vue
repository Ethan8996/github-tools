<template>
  <div class="chinese-converter">
    <div class="header">
      <button @click="goToHome" class="home-btn">← 返回首页</button>
      <h1>简繁转换</h1>
    </div>

    <div class="toolbar">
      <div class="direction-tabs" aria-label="转换方向">
        <button
          type="button"
          :class="['direction-tab', { active: direction === 's2t' }]"
          @click="setDirection('s2t')"
        >
          简体 → 台湾繁体
        </button>
        <button
          type="button"
          :class="['direction-tab', { active: direction === 't2s' }]"
          @click="setDirection('t2s')"
        >
          台湾繁体 → 简体
        </button>
      </div>

      <button type="button" class="swap-btn" @click="swapDirection">交换方向</button>
    </div>

    <div class="input-container">
      <div class="input-group">
        <h3>原文</h3>
        <textarea
          v-model="sourceText"
          class="input-area"
          placeholder="请输入要转换的文本"
        ></textarea>
      </div>

      <div class="input-group">
        <h3>转换结果</h3>
        <textarea
          v-model="convertedText"
          class="input-area output-area"
          readonly
          placeholder="转换结果将显示在这里"
        ></textarea>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="action-btn" @click="convertText">转换</button>
      <button type="button" class="copy-btn" :disabled="!convertedText" @click="copyResult">复制结果</button>
      <button type="button" class="clear-btn" @click="clearAll">清空</button>
    </div>

    <div v-if="message" class="message">
      {{ message }}
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
const {
  simplifiedToTraditional,
  traditionalToSimplified
} = require('../utils/chineseConverter')

export default {
  name: 'ChineseConverter',
  data() {
    return {
      direction: 's2t',
      sourceText: '',
      convertedText: '',
      error: '',
      message: ''
    }
  },
  methods: {
    goToHome() {
      this.$router.push('/')
    },
    setDirection(direction) {
      this.direction = direction
      this.error = ''
      this.message = ''
    },
    swapDirection() {
      this.direction = this.direction === 's2t' ? 't2s' : 's2t'

      if (this.convertedText) {
        const previousSource = this.sourceText
        this.sourceText = this.convertedText
        this.convertedText = previousSource
      }

      this.error = ''
      this.message = ''
    },
    convertText() {
      try {
        this.error = ''
        this.message = ''

        if (!this.sourceText.trim()) {
          this.convertedText = ''
          this.error = '请输入要转换的文本'
          return
        }

        this.convertedText = this.direction === 's2t'
          ? simplifiedToTraditional(this.sourceText)
          : traditionalToSimplified(this.sourceText)
      } catch (error) {
        this.convertedText = ''
        this.error = `这里好像有点小问题，我们来修复一下吧：${error.message}`
      }
    },
    async copyResult() {
      if (!this.convertedText) return

      try {
        await navigator.clipboard.writeText(this.convertedText)
        this.showMessage('已复制到剪贴板')
      } catch (error) {
        this.copyWithTextarea(this.convertedText)
      }
    },
    copyWithTextarea(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()

      let success = false
      try {
        success = document.execCommand('copy')
      } catch (error) {
        success = false
      }

      document.body.removeChild(textarea)

      if (success) {
        this.showMessage('已复制到剪贴板')
      } else {
        this.error = '复制到剪贴板没有成功，请手动复制结果。'
      }
    },
    clearAll() {
      this.sourceText = ''
      this.convertedText = ''
      this.error = ''
      this.message = ''
    },
    showMessage(message) {
      this.message = message
      window.setTimeout(() => {
        this.message = ''
      }, 2000)
    }
  }
}
</script>

<style scoped>
.chinese-converter {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #26322a;
}

.header {
  position: relative;
  margin-bottom: 28px;
}

.home-btn {
  position: absolute;
  left: 0;
  top: 0;
  background-color: #7b8580;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.home-btn:hover {
  background-color: #636d68;
}

h1 {
  margin: 0;
  color: #17201a;
  text-align: center;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.direction-tabs {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #cfd8d2;
  border-radius: 8px;
  background: #f8faf8;
}

.direction-tab {
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-right: 1px solid #cfd8d2;
  background: transparent;
  color: #4e5c54;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.direction-tab:last-child {
  border-right: 0;
}

.direction-tab.active {
  background: #34523d;
  color: white;
}

.swap-btn {
  flex-shrink: 0;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #cfd8d2;
  border-radius: 8px;
  background: white;
  color: #34523d;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
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
  margin: 0 0 10px;
  color: #26322a;
}

.input-area {
  width: 100%;
  min-height: 360px;
  padding: 14px;
  border: 1px solid #d7ded9;
  border-radius: 8px;
  resize: vertical;
  background: white;
  color: #1d2821;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 15px;
  line-height: 1.65;
  box-sizing: border-box;
}

.input-area:focus {
  border-color: #6d7d48;
  outline: none;
  box-shadow: 0 0 0 3px rgba(109, 125, 72, 0.14);
}

.output-area {
  background: #f7faf8;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.actions button {
  min-height: 42px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.action-btn {
  background: #34523d;
  color: white;
}

.action-btn:hover {
  background: #263f2e;
}

.copy-btn {
  background: #2f6f7b;
  color: white;
}

.copy-btn:hover:not(:disabled) {
  background: #245a64;
}

.copy-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.clear-btn {
  background: #b85042;
  color: white;
}

.clear-btn:hover {
  background: #984033;
}

.message,
.error-message {
  margin: 0 auto;
  max-width: 720px;
  padding: 10px 14px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.message {
  background: #e4f4e8;
  color: #256236;
}

.error-message {
  background: #fae3df;
  color: #9b3327;
}

@media (max-width: 768px) {
  .header {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .home-btn {
    position: static;
    align-self: flex-start;
  }

  h1 {
    text-align: left;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .direction-tabs {
    display: grid;
    grid-template-columns: 1fr;
  }

  .direction-tab {
    border-right: 0;
    border-bottom: 1px solid #cfd8d2;
  }

  .direction-tab:last-child {
    border-bottom: 0;
  }

  .input-container {
    grid-template-columns: 1fr;
  }

  .input-area {
    min-height: 260px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
