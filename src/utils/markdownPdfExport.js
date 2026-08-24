const PDF_MARGIN_MM = 15;
const PDF_CONTENT_WIDTH_PX = 720;
const MERMAID_RENDER_TIMEOUT_MS = 10000;
const MIN_BLANK_BREAK_ROWS = 20;
const BLOCK_BREAK_SEARCH_RATIO = 0.2;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function waitForMermaidDiagrams(container, VditorApi, options = {}) {
  const diagrams = Array.from(container.querySelectorAll('.language-mermaid'));
  if (diagrams.length === 0) {
    return;
  }

  const timeoutMs = options.timeoutMs || MERMAID_RENDER_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs || 50;
  const deadline = Date.now() + timeoutMs;

  VditorApi.mermaidRender(container);

  while (diagrams.some((diagram) => diagram.getAttribute('data-processed') !== 'true')) {
    if (Date.now() >= deadline) {
      throw new Error('Mermaid 流程图渲染超时，请检查网络连接或图表语法');
    }

    await delay(pollIntervalMs);
  }
}

function convertForeignObjectToText(foreignObject) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const x = Number.parseFloat(foreignObject.getAttribute('x') || '0');
  const y = Number.parseFloat(foreignObject.getAttribute('y') || '0');
  const width = Number.parseFloat(foreignObject.getAttribute('width') || '0');
  const height = Number.parseFloat(foreignObject.getAttribute('height') || '0');

  text.setAttribute('x', String(x + (width / 2)));
  text.setAttribute('y', String(y + (height / 2)));
  text.setAttribute('dominant-baseline', 'middle');
  text.setAttribute('fill', '#333333');
  text.setAttribute('font-family', 'sans-serif');
  text.setAttribute('font-size', '16px');
  text.setAttribute('text-anchor', 'middle');
  text.textContent = foreignObject.textContent.replace(/\s+/g, ' ').trim();
  foreignObject.replaceWith(text);
}

function addMermaidViewBoxPadding(svg) {
  const viewBox = (svg.getAttribute('viewBox') || '')
    .trim()
    .split(/\s+/)
    .map(Number);

  if (viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) {
    return;
  }

  const [x, y, width, height] = viewBox;
  const horizontalPadding = width * 0.5;
  const verticalPadding = height * 0.05;
  svg.setAttribute(
    'viewBox',
    `${x - horizontalPadding} ${y - verticalPadding} ${width + (horizontalPadding * 2)} ${height + (verticalPadding * 2)}`
  );
  svg.style.maxWidth = '100%';
}

export function captureRenderedMermaidDiagrams(sourceRoot) {
  if (!sourceRoot) {
    return [];
  }

  const diagrams = Array.from(
    sourceRoot.querySelectorAll('.language-mermaid[data-processed="true"]')
  );

  return diagrams.flatMap((diagram) => {
    const renderedSvg = diagram.querySelector('svg');
    if (!renderedSvg) {
      return [];
    }

    const svg = renderedSvg.cloneNode(true);
    addMermaidViewBoxPadding(svg);
    svg.querySelectorAll('foreignObject').forEach((foreignObject) => {
      convertForeignObjectToText(foreignObject);
    });
    return [svg.outerHTML];
  });
}

function applyMermaidSnapshots(container, renderedSvgs) {
  const diagrams = Array.from(container.querySelectorAll('.language-mermaid'));

  renderedSvgs.forEach((renderedSvg, index) => {
    const diagram = diagrams[index];
    if (!diagram) {
      return;
    }

    diagram.innerHTML = renderedSvg;
    diagram.setAttribute('data-processed', 'true');
  });
}

function isBlankCanvasRow(imageData, rowOffset, width) {
  let darkPixels = 0;

  for (let x = 0; x < width; x += 2) {
    const index = (rowOffset * width + x) * 4;
    const alpha = imageData[index + 3];
    const isInk = alpha > 12 && (
      imageData[index] < 245 ||
      imageData[index + 1] < 245 ||
      imageData[index + 2] < 245
    );

    if (isInk) {
      darkPixels += 1;
      if (darkPixels > 2) {
        return false;
      }
    }
  }

  return true;
}

export function findSafePageBreak(canvas, startRow, desiredEndRow, blockBoundaries = []) {
  const searchHeight = Math.min(
    desiredEndRow - startRow,
    Math.max(48, Math.round(canvas.width * 0.08))
  );
  const searchStart = desiredEndRow - searchHeight;
  const blockSearchStart = Math.max(
    startRow,
    desiredEndRow - Math.round(canvas.width * BLOCK_BREAK_SEARCH_RATIO)
  );
  const blockBoundary = blockBoundaries
    .filter((row) => row >= blockSearchStart && row < desiredEndRow)
    .sort((left, right) => right - left)[0];

  if (blockBoundary) {
    return blockBoundary;
  }

  try {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(
      0,
      searchStart,
      canvas.width,
      searchHeight
    ).data;
    let blankRun = 0;

    for (let row = searchHeight - 1; row >= 0; row -= 1) {
      if (isBlankCanvasRow(imageData, row, canvas.width)) {
        blankRun += 1;
        if (blankRun >= MIN_BLANK_BREAK_ROWS) {
          return searchStart + row + Math.floor(blankRun / 2);
        }
      } else {
        blankRun = 0;
      }
    }
  } catch (error) {
    // Cross-origin images can make canvas pixels unreadable; use the normal page edge then.
  }

  return desiredEndRow;
}

function addCanvasPages(pdf, canvas, blockBoundaries) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (PDF_MARGIN_MM * 2);
  const contentHeight = pageHeight - (PDF_MARGIN_MM * 2);
  const pixelsPerMillimeter = canvas.width / contentWidth;
  const maxPageHeightPixels = Math.floor(contentHeight * pixelsPerMillimeter);
  let startRow = 0;
  let pageIndex = 0;

  while (startRow < canvas.height) {
    const desiredEndRow = Math.min(startRow + maxPageHeightPixels, canvas.height);
    const endRow = desiredEndRow < canvas.height
      ? findSafePageBreak(canvas, startRow, desiredEndRow, blockBoundaries)
      : desiredEndRow;
    const segmentHeight = Math.max(1, endRow - startRow);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = segmentHeight;

    const pageContext = pageCanvas.getContext('2d');
    pageContext.fillStyle = '#ffffff';
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      canvas,
      0,
      startRow,
      canvas.width,
      segmentHeight,
      0,
      0,
      canvas.width,
      segmentHeight
    );

    if (pageIndex > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      pageCanvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      PDF_MARGIN_MM,
      PDF_MARGIN_MM,
      contentWidth,
      segmentHeight / pixelsPerMillimeter,
      undefined,
      'FAST'
    );

    startRow = endRow;
    pageIndex += 1;
  }
}

function getBlockBoundaries(container, canvas) {
  const containerRect = container.getBoundingClientRect();
  const scale = canvas.width / containerRect.width;
  const selector = [
    'p',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'pre',
    'blockquote',
    'table',
    '.language-mermaid'
  ].join(',');

  return Array.from(container.querySelectorAll(selector))
    .map((element) => Math.round(
      (element.getBoundingClientRect().bottom - containerRect.top) * scale
    ))
    .filter((row) => row > 0 && row < canvas.height);
}

export function createCanvasRenderOptions(overrides = {}) {
  return {
    backgroundColor: '#ffffff',
    letterRendering: true,
    logging: false,
    scale: 2,
    useCORS: true,
    ...overrides
  };
}

function createExportContainer(renderedHtml, styleSheet) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';

  const container = document.createElement('div');
  container.className = 'markdown-pdf-export';
  container.style.width = `${PDF_CONTENT_WIDTH_PX}px`;
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = `<style>${styleSheet}</style>${renderedHtml}`;
  host.appendChild(container);
  document.body.appendChild(host);
  return { container, host };
}

export async function exportMarkdownPdf({
  renderedHtml,
  styleSheet,
  filename,
  VditorApi,
  Html2Canvas,
  sourceRoot,
  JsPdf
}) {
  const renderedMermaidSvgs = captureRenderedMermaidDiagrams(sourceRoot);
  const { container, host } = createExportContainer(renderedHtml, styleSheet);

  try {
    applyMermaidSnapshots(container, renderedMermaidSvgs);
    await waitForMermaidDiagrams(container, VditorApi);
    const canvas = await Html2Canvas(container, createCanvasRenderOptions());
    const blockBoundaries = getBlockBoundaries(container, canvas);

    const pdf = new JsPdf({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    });

    addCanvasPages(pdf, canvas, blockBoundaries);
    pdf.save(filename);
  } finally {
    host.remove();
  }
}
