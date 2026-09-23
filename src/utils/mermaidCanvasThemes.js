export const themes = [
  { id: 'reference', label: '截图蓝 · 深色', mermaidTheme: 'base', look: 'neo', background: '#181818', accent: '#83C3FF', decisionFill: '#181818', decisionText: '#83C3FF' },
  { id: 'neo', label: 'Neo · 浅色', mermaidTheme: 'neo', look: 'neo', background: '#F6F7F8', accent: '#52677D', decisionFill: '#F6F7F8', decisionText: '#35485B' },
  { id: 'default', label: '经典 · 浅色', mermaidTheme: 'default', look: 'classic', background: '#FAF9FE', accent: '#7162A3', decisionFill: '#FAF9FE', decisionText: '#403675' },
  { id: 'forest', label: 'Forest · 浅色', mermaidTheme: 'forest', look: 'classic', background: '#F4F8F2', accent: '#547C5B', decisionFill: '#F4F8F2', decisionText: '#365D3D' },
  { id: 'neutral', label: 'Neutral · 浅色', mermaidTheme: 'neutral', look: 'classic', background: '#FAFAFA', accent: '#5A6168', decisionFill: '#FAFAFA', decisionText: '#30363B' },
  { id: 'dark', label: 'Dark · 深色', mermaidTheme: 'dark', look: 'classic', background: '#25272B', accent: '#CBD4DC', decisionFill: '#25272B', decisionText: '#E5EBF0' }
]

export function getTheme(id) {
  return themes.find((theme) => theme.id === id) || themes[0]
}

export function createMermaidConfig(preset) {
  const reference = preset.id === 'reference'
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    htmlLabels: false,
    theme: preset.mermaidTheme,
    look: preset.look,
    layout: 'elk',
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
    ...(reference ? {
      themeVariables: {
        background: preset.background,
        primaryColor: '#0D273F',
        primaryTextColor: preset.accent,
        primaryBorderColor: '#334352',
        lineColor: preset.accent,
        textColor: preset.accent,
        edgeLabelBackground: preset.background,
        fontSize: '15px'
      }
    } : {}),
    flowchart: {
      nodeSpacing: 56,
      rankSpacing: 76,
      curve: 'rounded',
      padding: 19,
      wrappingWidth: 340,
      useMaxWidth: false
    },
    themeCSS: `
      .edgeLabel rect, .edgeLabel .labelBkg {
        fill: ${preset.background} !important;
        stroke: ${preset.accent} !important;
        stroke-width: 1.3px !important;
        rx: 14px;
        ry: 14px;
      }
      .edgeLabel text { fill: ${preset.decisionText} !important; font-weight: 700 !important; }
      .node rect.label-container { filter: none !important; }
      .node text { font-weight: ${reference ? '700' : '600'} !important; }
      .node.decision rect.label-container {
        fill: ${preset.decisionFill} !important;
        stroke: ${preset.accent} !important;
        stroke-width: 1.5px !important;
        stroke-dasharray: 3 4 !important;
      }
      .node.decision text { fill: ${preset.decisionText} !important; }
      ${reference ? `
        .node:not(.decision) rect.label-container {
          fill: #0D273F !important;
          stroke: #334352 !important;
          stroke-width: 1.3px !important;
        }
        .node:not(.decision) text { fill: ${preset.accent} !important; }
      ` : ''}
      .flowchart-link { stroke: ${preset.accent} !important; stroke-width: 1.4px !important; }
      marker path { fill: ${preset.accent} !important; stroke: ${preset.accent} !important; }
    `
  }
}
