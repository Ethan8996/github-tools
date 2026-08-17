const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parse } = require('@vue/compiler-sfc');

const componentPath = path.join(__dirname, '../src/views/ToolCommands.vue');

function createVditorMock() {
  class VditorMock {
    constructor(id, options) {
      this.id = id;
      this.options = options;
      this.value = options.value || '';
      this.destroyed = false;
      VditorMock.instances.push(this);
    }

    getValue() {
      return this.value;
    }

    setValue(value) {
      this.value = value;
    }

    destroy() {
      this.destroyed = true;
    }
  }

  VditorMock.instances = [];
  VditorMock.previewCalls = [];
  VditorMock.codeRenderCalls = [];
  VditorMock.outlineCalls = [];
  VditorMock.preview = (element, content, options) => {
    VditorMock.previewCalls.push({ element, content, options });

    if (options && typeof options.after === 'function') {
      options.after();
    }
  };
  VditorMock.codeRender = (element) => {
    VditorMock.codeRenderCalls.push(element);
  };
  VditorMock.outlineRender = (contentElement, targetElement) => {
    VditorMock.outlineCalls.push({ contentElement, targetElement });
  };

  return VditorMock;
}

function loadVueComponent(overrides = {}) {
  const source = fs.readFileSync(componentPath, 'utf8');
  const { descriptor } = parse(source);
  const script = descriptor.script.content
    .replace(
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"](.+?)['"];?/g,
      'const { $1 } = require("$2");'
    )
    .replace(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"](.+?)['"];?/g, 'const $1 = require("$2");')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/export default/, 'module.exports =');
  const module = { exports: {} };
  const dirname = path.dirname(componentPath);

  const context = {
    module,
    exports: module.exports,
    require(request) {
      if (Object.prototype.hasOwnProperty.call(overrides, request)) {
        return overrides[request];
      }

      if (request.startsWith('.')) {
        return require(path.resolve(dirname, request));
      }

      return require(request);
    },
    fetch: overrides.fetch,
    window: overrides.window,
    document: overrides.document,
    process: {
      env: {
        BASE_URL: '/github-tools/',
      },
    },
    console,
  };

  vm.runInNewContext(script, context, { filename: componentPath });

  return module.exports;
}

function mountOptionsComponent(component, extraState = {}) {
  const state = {
    ...(component.data ? component.data() : {}),
    ...extraState,
  };

  for (const [name, method] of Object.entries(component.methods || {})) {
    state[name] = method.bind(state);
  }

  for (const [name, getter] of Object.entries(component.computed || {})) {
    Object.defineProperty(state, name, {
      enumerable: true,
      get() {
        return getter.call(state);
      },
    });
  }

  return state;
}

function createBaseOverrides(overrides = {}) {
  const VditorMock = overrides.VditorMock || createVditorMock();
  const windowMock = overrides.window || {
    addEventListener() {},
    removeEventListener() {},
    confirm() {
      return true;
    },
    open() {},
  };

  return {
    VditorMock,
    overrides: {
      vditor: VditorMock,
      '../utils/githubConfigStorage': {
        loadGithubConfig() {
          return {
            token: '',
            repository: '',
            branch: '',
          };
        },
        saveGithubConfig() {},
        clearGithubConfig() {},
        ...overrides.storage,
      },
      '../utils/githubContents': {
        async fetchRepositoryFile() {
          return { sha: 'sha-default' };
        },
        async updateRepositoryFile() {
          return { commitSha: 'commit-default' };
        },
        ...overrides.githubContents,
      },
      '../utils/githubRepository': require('../src/utils/githubRepository'),
      fetch: overrides.fetch,
      window: windowMock,
      document: overrides.document || {
        getElementById() {
          return {};
        },
      },
    },
  };
}

function createMountedState(component, extraState = {}) {
  return mountOptionsComponent(component, {
    $refs: {
      markdownPreview: { id: 'preview' },
      outline: { id: 'outline' },
    },
    $nextTick(callback) {
      if (typeof callback === 'function') {
        callback();
      }

      return Promise.resolve();
    },
    ...extraState,
  });
}

test('ToolCommands loads markdown and renders preview, code copy, and outline', async () => {
  const fetchCalls = [];
  const base = createBaseOverrides({
    fetch: async (url, options) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        async text() {
          return '# Commands\n\n## Homebrew\n';
        },
      };
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component);

  await state.loadMarkdown();

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, '/github-tools/data/tool-commands.md');
  assert.equal(fetchCalls[0].options.cache, 'no-store');
  assert.equal(state.loading, false);
  assert.equal(state.loadError, '');
  assert.equal(state.markdownContent, '# Commands\n\n## Homebrew\n');
  assert.equal(state.originalContent, state.markdownContent);
  assert.equal(state.hasUnsavedChanges, false);
  assert.equal(base.VditorMock.previewCalls.length, 1);
  assert.equal(base.VditorMock.codeRenderCalls.length, 1);
  assert.equal(base.VditorMock.outlineCalls.length, 1);
});

test('ToolCommands reports load failures and can retry successfully', async () => {
  let attempt = 0;
  const base = createBaseOverrides({
    fetch: async () => {
      attempt += 1;

      if (attempt === 1) {
        return { ok: false, status: 503 };
      }

      return {
        ok: true,
        async text() {
          return '# Retried\n';
        },
      };
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component);

  await state.loadMarkdown();
  assert.match(state.loadError, /HTTP 503/);
  assert.equal(state.loading, false);

  await state.loadMarkdown();
  assert.equal(state.loadError, '');
  assert.equal(state.markdownContent, '# Retried\n');
});

test('ToolCommands editor tracks dirty content and can discard local changes', async () => {
  const base = createBaseOverrides();
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    markdownContent: '# Original\n',
    originalContent: '# Original\n',
    loading: false,
    loadError: '',
  });

  await state.switchMode('edit');
  assert.equal(state.mode, 'edit');
  assert.equal(base.VditorMock.instances.length, 1);
  assert.equal(base.VditorMock.instances[0].options.cache.enable, false);

  base.VditorMock.instances[0].options.input('# Changed\n');
  assert.equal(state.hasUnsavedChanges, true);

  state.discardChanges();
  assert.equal(state.markdownContent, '# Original\n');
  assert.equal(state.hasUnsavedChanges, false);
  assert.equal(base.VditorMock.instances[0].value, '# Original\n');

  await state.switchMode('preview');
  assert.equal(base.VditorMock.instances[0].destroyed, true);
  assert.equal(base.VditorMock.previewCalls.length, 1);
});

test('ToolCommands rejects empty markdown before calling GitHub', async () => {
  let helperCalls = 0;
  const base = createBaseOverrides({
    githubContents: {
      async fetchRepositoryFile() {
        helperCalls += 1;
      },
      async updateRepositoryFile() {
        helperCalls += 1;
      },
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    markdownContent: '   ',
    originalContent: '# Original\n',
    loading: false,
  });
  state.github.repository = 'owner/repo';
  state.github.token = 'ghp_token';

  await state.saveToGithub();

  assert.match(state.saveError, /不能为空/);
  assert.equal(helperCalls, 0);
});

test('ToolCommands saves the fixed Markdown path and updates its clean baseline', async () => {
  const calls = [];
  const savedConfigs = [];
  const fetchStub = async function fetchStub() {};
  const base = createBaseOverrides({
    fetch: fetchStub,
    storage: {
      saveGithubConfig(_storage, config) {
        savedConfigs.push(config);
      },
    },
    githubContents: {
      async fetchRepositoryFile(fetchImpl, options) {
        calls.push(['fetch', fetchImpl, options]);
        return { sha: 'sha-123' };
      },
      async updateRepositoryFile(fetchImpl, options) {
        calls.push(['update', fetchImpl, options]);
        return { commitSha: 'commit-456' };
      },
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    markdownContent: '# Changed\n',
    originalContent: '# Original\n',
    loading: false,
  });
  state.github.repository = ' https://github.com/Ethan8996/github-tools ';
  state.github.branch = ' main ';
  state.github.token = ' ghp_token ';
  state.rememberConfig = true;

  await state.saveToGithub();

  assert.equal(state.saveError, '');
  assert.match(state.saveMessage, /GitHub/);
  assert.equal(state.originalContent, '# Changed\n');
  assert.equal(state.hasUnsavedChanges, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1], fetchStub);
  assert.deepEqual({ ...calls[0][2] }, {
    token: 'ghp_token',
    repository: 'Ethan8996/github-tools',
    branch: 'main',
    path: 'public/data/tool-commands.md',
  });
  assert.equal(calls[1][2].sha, 'sha-123');
  assert.equal(calls[1][2].message, 'docs: update tool commands');
  assert.equal(calls[1][2].content, '# Changed\n');
  assert.deepEqual(savedConfigs.map((config) => ({ ...config })), [{
    token: 'ghp_token',
    repository: 'Ethan8996/github-tools',
    branch: 'main',
  }]);
});

test('ToolCommands keeps dirty content and reports GitHub save failures', async () => {
  const base = createBaseOverrides({
    fetch: async function fetchStub() {},
    githubContents: {
      async fetchRepositoryFile() {
        return { sha: 'sha-123' };
      },
      async updateRepositoryFile() {
        throw new Error('GitHub update failed');
      },
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    markdownContent: '# Changed\n',
    originalContent: '# Original\n',
    loading: false,
  });
  state.github.repository = 'owner/repo';
  state.github.branch = 'main';
  state.github.token = 'ghp_token';

  await state.saveToGithub();

  assert.equal(state.saveError, 'GitHub update failed');
  assert.equal(state.originalContent, '# Original\n');
  assert.equal(state.hasUnsavedChanges, true);
});

test('ToolCommands opens the configured GitHub commands file', () => {
  const opens = [];
  const base = createBaseOverrides({
    window: {
      addEventListener() {},
      removeEventListener() {},
      confirm() {
        return true;
      },
      open(...args) {
        opens.push(args);
      },
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    loading: false,
  });
  state.github.repository = ' owner/repo ';
  state.github.branch = ' feature/commands ';

  state.openGithubTarget();

  assert.equal(state.saveError, '');
  assert.deepEqual(opens, [[
    'https://github.com/owner/repo/blob/feature/commands/public/data/tool-commands.md',
    '_blank',
    'noopener',
  ]]);
});

test('ToolCommands guards route and window exits when changes are unsaved', () => {
  const confirmCalls = [];
  const base = createBaseOverrides({
    window: {
      addEventListener() {},
      removeEventListener() {},
      confirm(message) {
        confirmCalls.push(message);
        return false;
      },
      open() {},
    },
  });
  const component = loadVueComponent(base.overrides);
  const state = createMountedState(component, {
    markdownContent: '# Changed\n',
    originalContent: '# Original\n',
    loading: false,
  });
  const routeResults = [];
  const event = {
    prevented: false,
    returnValue: undefined,
    preventDefault() {
      this.prevented = true;
    },
  };

  component.beforeRouteLeave.call(state, {}, {}, (result) => routeResults.push(result));
  state.handleBeforeUnload(event);

  assert.equal(confirmCalls.length, 1);
  assert.deepEqual(routeResults, [false]);
  assert.equal(event.prevented, true);
  assert.equal(event.returnValue, '');
});

test('ToolCommands template keeps the token masked and exposes preview/edit controls', () => {
  const source = fs.readFileSync(componentPath, 'utf8');

  assert.match(source, /:type="showToken \? 'text' : 'password'"/);
  assert.match(source, />\s*预览\s*</);
  assert.match(source, />\s*编辑\s*</);
  assert.match(source, /beforeRouteLeave/);
  assert.match(source, /beforeunload/);
});
