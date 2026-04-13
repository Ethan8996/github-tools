const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parse } = require('@vue/compiler-sfc');

const componentPath = path.join(__dirname, '../src/views/Bookmarks.vue');
const routerPath = path.join(__dirname, '../src/router/index.js');
const homePath = path.join(__dirname, '../src/views/Home.vue');
const bookmarksData = require('../src/data/bookmarks.json');
const bookmarksUtils = require('../src/utils/bookmarks');

function loadVueComponent(filePath, overrides = {}) {
  const source = fs.readFileSync(filePath, 'utf8');
  const { descriptor } = parse(source);

  if (!descriptor.script || !descriptor.script.content) {
    throw new Error(`Missing script block in ${filePath}`);
  }

  const script = descriptor.script.content
    .replace(
      /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"](.+?)['"];?/g,
      'const { $1 } = require("$2");'
    )
    .replace(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"](.+?)['"];?/g, 'const $1 = require("$2");')
    .replace(/export default/, 'module.exports =');

  const module = { exports: {} };
  const dirname = path.dirname(filePath);

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
    console,
  };

  vm.runInNewContext(script, context, { filename: filePath });

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

test('Bookmarks view defaults the GitHub save target to this repository and main branch', () => {
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
  });
  const vmState = mountOptionsComponent(component);

  assert.equal(vmState.github.repository, 'https://github.com/Ethan8996/github-tools');
  assert.equal(vmState.github.branch, 'main');
  assert.equal(vmState.rememberConfig, false);
});

test('Bookmarks view loads initial bookmarks, filters in real time, and tracks dirty adds/deletes', () => {
  const storageModule = {
    loadGithubConfig() {
      return {
        token: '',
        repository: '',
        branch: '',
      };
    },
    saveGithubConfig() {},
    clearGithubConfig() {},
  };

  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': storageModule,
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
  });
  const vmState = mountOptionsComponent(component);

  assert.equal(vmState.bookmarks.length, bookmarksData.length);
  assert.equal(vmState.filteredBookmarks.length, bookmarksData.length);

  vmState.searchQuery = 'apifox';
  assert.equal(vmState.filteredBookmarks.length, 1);
  assert.equal(vmState.filteredBookmarks[0].title, 'Apifox');

  vmState.form.title = ' Example ';
  vmState.form.url = ' https://example.com/docs ';
  vmState.addBookmark();

  assert.equal(vmState.formError, '');
  assert.equal(vmState.hasLocalChanges, true);
  assert.equal(vmState.bookmarks[0].title, 'Example');
  assert.equal(vmState.bookmarks[0].url, 'https://example.com/docs');

  const addedId = vmState.bookmarks[0].id;
  vmState.removeBookmark(addedId);
  assert.equal(vmState.bookmarks.some((bookmark) => bookmark.id === addedId), false);
});

test('Bookmarks view validates add form and opens bookmarks in a new tab', () => {
  const opens = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
    window: {
      open(...args) {
        opens.push(args);
      },
    },
  });
  const vmState = mountOptionsComponent(component);

  vmState.form.title = '';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();
  assert.match(vmState.formError, /标题/);

  vmState.form.title = 'Example';
  vmState.form.url = 'ftp://example.com';
  vmState.addBookmark();
  assert.match(vmState.formError, /URL/);

  vmState.openBookmark({
    url: 'https://example.com',
  });
  assert.deepEqual(opens, [['https://example.com', '_blank', 'noopener']]);
});

test('Bookmarks view can quickly jump to the configured GitHub bookmarks file', () => {
  const opens = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
    window: {
      open(...args) {
        opens.push(args);
      },
    },
  });
  const vmState = mountOptionsComponent(component);

  vmState.github.repository = ' owner/repo ';
  vmState.github.branch = ' feature/bookmarks ';
  vmState.openGithubTarget();

  assert.equal(vmState.saveError, '');
  assert.deepEqual(opens, [[
    'https://github.com/owner/repo/blob/feature/bookmarks/src/data/bookmarks.json',
    '_blank',
    'noopener',
  ]]);
});

test('Bookmarks view blocks GitHub quick jump when the repository is blank', () => {
  const opens = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
    window: {
      open(...args) {
        opens.push(args);
      },
    },
  });
  const vmState = mountOptionsComponent(component);

  vmState.github.repository = '';
  vmState.openGithubTarget();

  assert.match(vmState.saveError, /repository/);
  assert.deepEqual(opens, []);
});

test('Bookmarks view rejects adding the same normalized bookmark twice', () => {
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/bookmarks': bookmarksUtils,
    '../utils/githubContents': {
      async fetchRepositoryFile() {},
      async updateRepositoryFile() {},
    },
  });
  const vmState = mountOptionsComponent(component);
  const initialCount = vmState.bookmarks.length;

  vmState.form.title = ' Example ';
  vmState.form.url = 'https://example.com/docs';
  vmState.addBookmark();

  assert.equal(vmState.bookmarks.length, initialCount + 1);
  assert.equal(vmState.formError, '');

  vmState.form.title = 'example';
  vmState.form.url = ' https://example.com/docs ';
  vmState.addBookmark();

  assert.equal(vmState.bookmarks.length, initialCount + 1);
  assert.match(vmState.formError, /重复|已存在/);
});

test('Bookmarks view saves to GitHub, persists remembered config, and clears dirty state on success', async () => {
  const calls = [];
  const savedConfigs = [];
  const clearedConfigs = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarks': bookmarksUtils,
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: 'ghp_saved',
          repository: 'owner/repo',
          branch: 'main',
        };
      },
      saveGithubConfig(_storage, config) {
        savedConfigs.push(config);
      },
      clearGithubConfig() {
        clearedConfigs.push('cleared');
      },
    },
    '../utils/githubContents': {
      async fetchRepositoryFile(fetchImpl, options) {
        calls.push(['fetch', fetchImpl, options]);
        return { sha: 'sha-123' };
      },
      async updateRepositoryFile(fetchImpl, options) {
        calls.push(['update', fetchImpl, options]);
        return { commitSha: 'commit-456' };
      },
    },
    fetch: async function fetchStub() {},
  });
  const vmState = mountOptionsComponent(component);

  vmState.form.title = 'Example';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();
  vmState.rememberConfig = true;

  await vmState.saveToGithub();

  assert.equal(vmState.saveError, '');
  assert.match(vmState.saveMessage, /GitHub/);
  assert.equal(vmState.hasLocalChanges, false);
  assert.equal(calls.length, 2);
  assert.deepEqual({ ...calls[0][2] }, {
    token: 'ghp_saved',
    repository: 'owner/repo',
    branch: 'main',
    path: 'src/data/bookmarks.json',
  });
  assert.equal(calls[1][2].message, 'feat: update bookmarks');
  assert.equal(calls[1][2].sha, 'sha-123');
  assert.equal(calls[1][2].repository, 'owner/repo');
  assert.equal(calls[1][2].branch, 'main');
  assert.equal(
    calls[1][2].content,
    bookmarksUtils.serializeBookmarks(vmState.bookmarks)
  );
  assert.deepEqual(savedConfigs.map((config) => ({ ...config })), [
    {
      token: 'ghp_saved',
      repository: 'owner/repo',
      branch: 'main',
    },
  ]);
  assert.deepEqual(clearedConfigs, []);
});

test('Bookmarks view still reports success when local config persistence fails after GitHub save', async () => {
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('storage blocked');
      },
      removeItem() {
        throw new Error('storage blocked');
      },
    },
  };

  try {
    const component = loadVueComponent(componentPath, {
      '../utils/bookmarks': bookmarksUtils,
      '../utils/githubContents': {
        async fetchRepositoryFile() {
          return { sha: 'sha-123' };
        },
        async updateRepositoryFile() {
          return { commitSha: 'commit-456' };
        },
      },
      fetch: async function fetchStub() {},
    });
    const vmState = mountOptionsComponent(component);

    vmState.form.title = 'Example';
    vmState.form.url = 'https://example.com';
    vmState.addBookmark();
    vmState.github.repository = 'owner/repo';
    vmState.github.token = 'ghp_token';
    vmState.github.branch = 'main';
    vmState.rememberConfig = true;

    await vmState.saveToGithub();

    assert.match(vmState.saveMessage, /GitHub/);
    assert.equal(vmState.hasLocalChanges, false);
    assert.equal(vmState.saveError, '');
  } finally {
    if (typeof originalWindow === 'undefined') {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
  }
});

test('Bookmarks view surfaces GitHub save helper failures and keeps dirty state', async () => {
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarks': bookmarksUtils,
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/githubContents': {
      async fetchRepositoryFile() {
        return { sha: 'sha-123' };
      },
      async updateRepositoryFile() {
        throw new Error('GitHub helper save failed');
      },
    },
    fetch: async function fetchStub() {},
  });
  const vmState = mountOptionsComponent(component);

  vmState.form.title = 'Example';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();
  vmState.github.repository = 'owner/repo';
  vmState.github.token = 'ghp_token';
  vmState.saveMessage = 'should clear';

  await vmState.saveToGithub();

  assert.equal(vmState.saveError, 'GitHub helper save failed');
  assert.equal(vmState.hasLocalChanges, true);
  assert.equal(vmState.saveMessage, '');
});

test('Bookmarks view validates GitHub config, allows blank branch, and clears stored config when not remembered', async () => {
  const clearedConfigs = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarks': bookmarksUtils,
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {
        throw new Error('saveGithubConfig should not be called');
      },
      clearGithubConfig() {
        clearedConfigs.push('cleared');
      },
    },
    '../utils/githubContents': {
      async fetchRepositoryFile(fetchImpl, options) {
        return {
          sha: 'sha-blank-branch',
          fetchImpl,
          options,
        };
      },
      async updateRepositoryFile(_fetchImpl, options) {
        return options;
      },
    },
    fetch: async function fetchStub() {},
  });
  const vmState = mountOptionsComponent(component);

  vmState.github.repository = 'owner/repo';
  await vmState.saveToGithub();
  assert.match(vmState.saveError, /token/);

  vmState.github.repository = ' owner/repo ';
  vmState.github.token = ' ghp_token ';
  vmState.github.branch = ' ';
  vmState.rememberConfig = false;
  vmState.form.title = 'Example';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();

  await vmState.saveToGithub();

  assert.equal(vmState.saveError, '');
  assert.equal(vmState.github.branch, ' ');
  assert.deepEqual(clearedConfigs, ['cleared']);

  vmState.clearStoredConfig();
  assert.equal(vmState.github.repository, '');
  assert.equal(vmState.github.branch, '');
  assert.equal(vmState.github.token, '');
  assert.equal(vmState.rememberConfig, false);
});

test('Bookmarks view normalizes a full GitHub repository URL before saving', async () => {
  const calls = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarks': bookmarksUtils,
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/githubContents': {
      async fetchRepositoryFile(_fetchImpl, options) {
        calls.push(['fetch', options]);
        return { sha: 'sha-url-repo' };
      },
      async updateRepositoryFile(_fetchImpl, options) {
        calls.push(['update', options]);
        return { commitSha: 'commit-url-repo' };
      },
    },
    fetch: async function fetchStub() {},
  });
  const vmState = mountOptionsComponent(component);

  vmState.form.title = 'Example';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();
  vmState.github.repository = ' https://github.com/Ethan8996/github-tools ';
  vmState.github.token = ' ghp_token ';
  vmState.github.branch = ' main ';

  await vmState.saveToGithub();

  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].repository, 'Ethan8996/github-tools');
  assert.equal(calls[1][1].repository, 'Ethan8996/github-tools');
  assert.equal(calls[0][1].branch, 'main');
});

test('Bookmarks view forwards a blank branch string to GitHub helpers when the branch input is whitespace', async () => {
  const calls = [];
  const component = loadVueComponent(componentPath, {
    '../utils/bookmarks': bookmarksUtils,
    '../utils/bookmarkStorage': {
      loadGithubConfig() {
        return {
          token: '',
          repository: '',
          branch: '',
        };
      },
      saveGithubConfig() {},
      clearGithubConfig() {},
    },
    '../utils/githubContents': {
      async fetchRepositoryFile(_fetchImpl, options) {
        calls.push(['fetch', options]);
        return { sha: 'sha-blank-branch' };
      },
      async updateRepositoryFile(_fetchImpl, options) {
        calls.push(['update', options]);
        return { commitSha: 'commit-blank-branch' };
      },
    },
    fetch: async function fetchStub() {},
  });
  const vmState = mountOptionsComponent(component);

  vmState.form.title = 'Example';
  vmState.form.url = 'https://example.com';
  vmState.addBookmark();
  vmState.github.repository = ' owner/repo ';
  vmState.github.token = ' ghp_token ';
  vmState.github.branch = '   ';

  await vmState.saveToGithub();

  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].branch, '');
  assert.equal(calls[1][1].branch, '');
});

test('router includes the bookmarks page and home view links to it', () => {
  const routerSource = fs.readFileSync(routerPath, 'utf8');
  const homeSource = fs.readFileSync(homePath, 'utf8');

  assert.match(routerSource, /path:\s*'\/bookmarks'/);
  assert.match(routerSource, /name:\s*'Bookmarks'/);
  assert.match(routerSource, /Bookmarks\.vue/);

  assert.match(homeSource, /to="\/bookmarks"/);
  assert.match(homeSource, /常用网址/);
});
