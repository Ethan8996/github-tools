<template>
  <div class="app" :style="{ '--diagram-background': theme.background, '--diagram-accent': theme.accent }">
    <a class="skipLink" href="#mermaid-workspace">跳转到工作区</a>
    <header class="header">
      <div class="identity">
        <div class="mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <div class="eyebrow">DIAGRAM WORKSPACE <span>01</span></div>
          <h1>Mermaid Canvas</h1>
        </div>
      </div>
      <div class="headerActions">
        <span class="status" :class="{ statusError: !!error }" role="status"><span class="statusDot"></span>{{ statusText }}</span>
        <router-link class="headerButton homeLink" to="/">返回首页</router-link>
        <button type="button" class="headerButton" @click="source = example">载入示例</button>
        <button type="button" class="headerButton" @click="copySource">复制源码</button>
        <button type="button" class="primaryButton" :disabled="!svg || !!error || rendering" @click="exportSvg">导出 SVG <span aria-hidden="true">↗</span></button>
      </div>
    </header>

    <main id="mermaid-workspace" class="workspace" :class="{ previewOnly: !showEditor }">
      <section v-if="showEditor" class="editorPanel" aria-label="Mermaid 源码编辑器">
        <div class="panelHeading">
          <div><span class="panelIndex">01 / SOURCE</span><h2>图表源码</h2></div>
          <span class="panelMeta">{{ lineCount }} 行</span>
        </div>
        <div class="editorBody">
          <label class="visuallyHidden" for="mermaid-source">Mermaid 源码</label>
          <textarea id="mermaid-source" v-model="source" spellcheck="false" :aria-describedby="error ? 'syntax-error' : 'editor-help'"></textarea>
        </div>
        <div v-if="error" id="syntax-error" class="errorBox" role="alert"><strong>无法渲染</strong><span>{{ error }}</span></div>
        <div id="editor-help" class="editorFooter"><span>修改源码后自动更新预览</span><span>本地自动保存</span></div>
      </section>

      <section class="previewPanel" aria-label="图表预览">
        <div class="panelHeading">
          <div><span class="panelIndex">02 / PREVIEW</span><h2>图形预览</h2></div>
          <div class="previewActions">
            <label class="themePicker">
              <span class="themeSwatch" :style="{ backgroundColor: theme.accent }" aria-hidden="true"></span>
              <span class="visuallyHidden">图表主题</span>
              <select v-model="themeId">
                <option v-for="preset in themes" :key="preset.id" :value="preset.id">{{ preset.label }}</option>
              </select>
            </label>
            <button type="button" class="smallButton" @click="showEditor = !showEditor">{{ showEditor ? '收起编辑器' : '显示编辑器' }}</button>
            <button type="button" class="smallButton" :disabled="!svg || !!error || rendering" @click="exportPng">导出 PNG</button>
          </div>
        </div>
        <div class="canvasFrame">
          <div ref="preview" class="canvas">
            <div v-if="svg" class="diagramStage" :style="{ width: `${size.width * zoom}px`, height: `${size.height * zoom}px` }">
              <div class="diagram" v-html="svg"></div>
            </div>
            <div v-else class="emptyState">在左侧输入 Mermaid 源码，图形会显示在这里。</div>
          </div>
          <div class="canvasControls" aria-label="预览缩放">
            <button type="button" aria-label="缩小" @click="changeZoom(1 / 1.2)">−</button>
            <span>{{ Math.round(zoom * 100) }}%</span>
            <button type="button" aria-label="放大" @click="changeZoom(1.2)">+</button>
            <span class="controlDivider"></span>
            <button type="button" class="fitButton" @click="fitWidth">适配宽度</button>
          </div>
        </div>
        <div class="previewFooter">
          <span><span class="legendLine"></span> 流程连线</span>
          <span><span class="legendDecision"></span> 判断节点</span>
          <span class="previewHint">{{ error && svg ? '当前显示上次成功的图' : '滚动查看长图' }}</span>
        </div>
      </section>
    </main>
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import mermaid from 'mermaid'
import elkLayouts from '@mermaid-js/layout-elk'
import { createMermaidConfig, getTheme, themes } from '../utils/mermaidCanvasThemes'

const sourceStorageKey = 'github-tools-mermaid-source-v1'
const themeStorageKey = 'github-tools-mermaid-theme-v1'
const example = `flowchart TB
    A("每日定时触发 close-alert") --> B("是否为当月最后一个周四？"):::decision
    B -->|否| C("静默退出")
    B -->|是| D("计算截止日<br/>运行月上月1日")
    D --> E("查询金蝶阻塞单据")
    E --> F("过滤组织、申请日期和单据状态")
    F --> G("按单据类型分页查询")
    G --> H("输出 CSV 和运行统计")
    H --> I("是否为可通知单据？"):::decision
    I -->|否| J("仅统计，不发送通知")
    I -->|是| K("按申请人聚合单据")
    K --> L("发送申请人卡片")`

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The editor remains usable when browser storage is unavailable.
  }
}

function readSvgSize(svg) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const viewBox = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number)
  if (viewBox?.length === 4 && viewBox.every(Number.isFinite)) {
    return { width: viewBox[2], height: viewBox[3] }
  }
  return {
    width: Number.parseFloat(root.getAttribute('width') || '800') || 800,
    height: Number.parseFloat(root.getAttribute('height') || '600') || 600
  }
}

function decorateSvg(svg) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  for (const node of doc.querySelectorAll('g.node rect.label-container')) {
    node.setAttribute('rx', '18')
    node.setAttribute('ry', '18')
  }
  for (const label of doc.querySelectorAll('g.edgeLabel')) {
    if (!['是', '否'].includes(label.textContent?.trim() || '')) continue
    const background = label.querySelector('rect.background')
    if (!background) continue
    background.setAttribute('x', '-17')
    background.setAttribute('width', '34')
    background.setAttribute('rx', '13')
    background.setAttribute('ry', '13')
  }
  return new XMLSerializer().serializeToString(doc.documentElement)
}

function downloadableSvg(svg, backgroundColor) {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  const dimensions = readSvgSize(svg)
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  root.setAttribute('width', String(Math.ceil(dimensions.width)))
  root.setAttribute('height', String(Math.ceil(dimensions.height)))
  const background = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
  background.setAttribute('width', '100%')
  background.setAttribute('height', '100%')
  background.setAttribute('fill', backgroundColor)
  root.insertBefore(background, root.firstChild)
  return new XMLSerializer().serializeToString(root)
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatError(error) {
  if (error instanceof Error) {
    if (/Parse error on line/i.test(error.message)) return 'Mermaid 语法有误，请检查节点、连线和标签是否完整。'
    return error.message.replace(/<[^>]*>/g, '').trim() || 'Mermaid 语法有误'
  }
  return 'Mermaid 语法有误，请检查源码。'
}

mermaid.registerLayoutLoaders(elkLayouts)
let renderQueue = Promise.resolve()

function renderWithTheme(id, text, preset) {
  const task = renderQueue.then(() => {
    mermaid.initialize(createMermaidConfig(preset))
    return mermaid.render(id, text)
  })
  renderQueue = task.then(() => undefined, () => undefined)
  return task
}

const source = ref(readStored(sourceStorageKey, example))
const storedTheme = readStored(themeStorageKey, 'reference')
const themeId = ref(themes.some((preset) => preset.id === storedTheme) ? storedTheme : 'reference')
const theme = computed(() => getTheme(themeId.value))
const svg = ref('')
const size = ref({ width: 800, height: 600 })
const zoom = ref(1)
const error = ref('')
const rendering = ref(true)
const toast = ref('')
const showEditor = ref(true)
const preview = ref(null)
const lineCount = computed(() => source.value ? source.value.split('\n').length : 0)
const statusText = computed(() => error.value ? '语法错误' : rendering.value ? '正在渲染' : svg.value ? '渲染完成' : '等待输入')
let renderId = 0
let renderTimer
let toastTimer
let initialFitDone = false

function notify(message) {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 2400)
}

watch(themeId, (value) => store(themeStorageKey, value))
watch([source, themeId], () => {
  store(sourceStorageKey, source.value)
  const currentId = ++renderId
  window.clearTimeout(renderTimer)
  rendering.value = true
  renderTimer = window.setTimeout(async () => {
    if (!source.value.trim()) {
      svg.value = ''
      error.value = ''
      rendering.value = false
      return
    }
    try {
      const result = await renderWithTheme(`diagram-${currentId}`, source.value, theme.value)
      if (currentId !== renderId) return
      const decorated = decorateSvg(result.svg)
      const dimensions = readSvgSize(decorated)
      svg.value = decorated
      size.value = dimensions
      error.value = ''
      if (!initialFitDone) {
        const viewportWidth = preview.value?.clientWidth || 840
        zoom.value = Math.min(1, Math.max(0.35, (viewportWidth - 72) / dimensions.width))
        initialFitDone = true
      }
    } catch (cause) {
      if (currentId === renderId) error.value = formatError(cause)
    } finally {
      document.getElementById(`ddiagram-${currentId}`)?.remove()
      if (currentId === renderId) rendering.value = false
    }
  }, 250)
}, { immediate: true })

onBeforeUnmount(() => {
  renderId++
  window.clearTimeout(renderTimer)
  window.clearTimeout(toastTimer)
})

function fitWidth() {
  const viewportWidth = preview.value?.clientWidth || 840
  zoom.value = Math.min(2, Math.max(0.2, (viewportWidth - 72) / size.value.width))
  preview.value?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

function changeZoom(factor) {
  zoom.value = Math.min(2.5, Math.max(0.2, Number((zoom.value * factor).toFixed(2))))
}

async function copySource() {
  try {
    await navigator.clipboard.writeText(source.value)
    notify('Mermaid 源码已复制')
  } catch {
    notify('复制失败，请手动选择源码')
  }
}

function exportSvg() {
  if (!svg.value || rendering.value || error.value) return
  const blob = new Blob([downloadableSvg(svg.value, theme.value.background)], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, 'mermaid-diagram.svg')
  notify('SVG 已导出')
}

async function exportPng() {
  if (!svg.value || rendering.value || error.value) return
  const image = new Image()
  const url = URL.createObjectURL(new Blob([downloadableSvg(svg.value, theme.value.background)], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('SVG 无法转换为 PNG'))
      image.src = url
    })
    const ratio = Math.min(2, 8192 / Math.max(size.value.width, size.value.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(size.value.width * ratio)
    canvas.height = Math.ceil(size.value.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器无法创建画布')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG 导出失败')), 'image/png')
    })
    downloadBlob(blob, 'mermaid-diagram.png')
    notify('PNG 已导出')
  } catch (cause) {
    notify(formatError(cause))
  } finally {
    URL.revokeObjectURL(url)
  }
}
</script>

<style scoped src="./MermaidCanvas.css"></style>
