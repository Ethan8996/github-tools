const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modulePath = path.join(__dirname, '../src/utils/markdownPdfExport.js');

function loadPdfExportModule(overrides = {}) {
  const source = fs.readFileSync(modulePath, 'utf8')
    .replace(/export\s+(async\s+)?function\s+(\w+)/g, '$1function $2')
    .concat('\nmodule.exports = { waitForMermaidDiagrams, captureRenderedMermaidDiagrams, findSafePageBreak, createCanvasRenderOptions, exportMarkdownPdf };');
  const module = { exports: {} };

  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    document: overrides.document,
    setTimeout,
    Promise,
    Date,
  }, { filename: modulePath });

  return module.exports;
}

test('PDF export moves a page break to nearby blank canvas rows', () => {
  const { findSafePageBreak } = loadPdfExportModule();
  const width = 20;
  const searchHeight = 48;
  const pixels = new Uint8ClampedArray(width * searchHeight * 4).fill(255);

  for (let row = 40; row < searchHeight; row += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (row * width + x) * 4;
      pixels[index] = 20;
      pixels[index + 1] = 20;
      pixels[index + 2] = 20;
    }
  }

  const canvas = {
    width,
    getContext() {
      return {
        getImageData() {
          return { data: pixels };
        },
      };
    },
  };

  const pageBreak = findSafePageBreak(canvas, 0, 100);
  assert.ok(pageBreak >= 80 && pageBreak <= 88);
});

test('PDF export prefers a nearby block boundary over line-level canvas whitespace', () => {
  const { findSafePageBreak } = loadPdfExportModule();
  const canvas = {
    width: 1000,
    getContext() {
      throw new Error('pixel fallback should not run');
    },
  };

  assert.equal(findSafePageBreak(canvas, 0, 1000, [400, 850, 1010]), 850);
});

test('PDF export waits until every Mermaid diagram is rendered', async () => {
  const { waitForMermaidDiagrams } = loadPdfExportModule();
  const diagram = {
    processed: false,
    getAttribute(name) {
      return name === 'data-processed' && this.processed ? 'true' : null;
    },
  };
  const container = {
    querySelectorAll(selector) {
      assert.equal(selector, '.language-mermaid');
      return [diagram];
    },
  };
  let renderCalls = 0;
  const VditorApi = {
    mermaidRender(renderContainer) {
      renderCalls += 1;
      assert.equal(renderContainer, container);
      setTimeout(() => {
        diagram.processed = true;
      }, 5);
    },
  };

  await waitForMermaidDiagrams(container, VditorApi, {
    timeoutMs: 100,
    pollIntervalMs: 1,
  });

  assert.equal(renderCalls, 1);
  assert.equal(diagram.processed, true);
});

test('PDF export reuses the Mermaid SVG already rendered in the editor', () => {
  const { captureRenderedMermaidDiagrams } = loadPdfExportModule();
  const renderedSvg = {
    cloneNode() {
      return {
        attributes: { viewBox: '0 0 100 100' },
        style: {},
        get outerHTML() {
          return `<svg viewBox="${this.attributes.viewBox}"></svg>`;
        },
        getAttribute(name) {
          return this.attributes[name] || null;
        },
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        querySelectorAll(selector) {
          assert.equal(selector, 'foreignObject');
          return [];
        },
      };
    },
  };
  const renderedDiagram = {
    querySelector(selector) {
      assert.equal(selector, 'svg');
      return renderedSvg;
    },
  };
  const sourceRoot = {
    querySelectorAll(selector) {
      assert.equal(selector, '.language-mermaid[data-processed="true"]');
      return [renderedDiagram];
    },
  };
  const renderedSvgs = captureRenderedMermaidDiagrams(sourceRoot);
  assert.deepEqual(Array.from(renderedSvgs), ['<svg viewBox="-50 -5 200 110"></svg>']);
});

test('PDF export removes its temporary DOM even when rendering fails', async () => {
  let removed = false;
  const container = {
    className: '',
    style: {},
    querySelectorAll() {
      return [];
    },
  };
  const host = {
    style: {},
    setAttribute() {},
    appendChild(element) {
      assert.equal(element, container);
    },
    remove() {
      removed = true;
    },
  };
  const createdElements = [host, container];
  const documentMock = {
    createElement() {
      return createdElements.shift();
    },
    body: {
      appendChild(element) {
        assert.equal(element, host);
        assert.equal(element.style.left, '0');
        assert.equal(element.style.zIndex, '-1');
      },
    },
  };
  class JsPdfMock {
    constructor() {
      this.internal = {
        pageSize: {
          getWidth() {
            return 210;
          },
        },
      };
    }

  }
  const { exportMarkdownPdf } = loadPdfExportModule({ document: documentMock });

  await assert.rejects(
    exportMarkdownPdf({
      renderedHtml: '<p>content</p>',
      styleSheet: 'p {}',
      filename: 'test.pdf',
      VditorApi: {},
      sourceRoot: null,
      Html2Canvas(element) {
        assert.equal(element, container);
        assert.equal(element.style.left, undefined);
        assert.equal(element.style.position, undefined);
        throw new Error('render failed');
      },
      JsPdf: JsPdfMock,
    }),
    /render failed/
  );

  assert.equal(removed, true);
});
