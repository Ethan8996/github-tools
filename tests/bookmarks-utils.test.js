const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBookmarkId,
  isValidBookmarkUrl,
  filterBookmarks,
  normalizeBookmark,
  serializeBookmarks,
} = require('../src/utils/bookmarks');
const {
  STORAGE_KEY,
  loadGithubConfig,
  saveGithubConfig,
  clearGithubConfig,
} = require('../src/utils/bookmarkStorage');

function createMemoryStorage(initialValue) {
  const store = new Map();

  if (typeof initialValue === 'string') {
    store.set(STORAGE_KEY, initialValue);
  }

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

test('createBookmarkId creates a stable id from title and url', () => {
  const first = createBookmarkId('Apifox', 'https://app.apifox.com/main/teams/489258?tab=project');
  const second = createBookmarkId('Apifox', 'https://app.apifox.com/main/teams/489258?tab=project');

  assert.equal(first, second);
  assert.match(first, /^apifox-https-app-apifox-com-main-teams-489258-tab-project-[a-f0-9]{10}$/);
});

test('createBookmarkId distinguishes punctuation-heavy urls', () => {
  const queryId = createBookmarkId('API Docs', 'https://example.com/api/v1/users?id=42');
  const fragmentId = createBookmarkId('API Docs', 'https://example.com/api/v1/users#id=42');

  assert.notEqual(queryId, fragmentId);
  assert.match(queryId, /^api-docs-https-example-com-api-v1-users-id-42-[a-f0-9]{10}$/);
  assert.match(fragmentId, /^api-docs-https-example-com-api-v1-users-id-42-[a-f0-9]{10}$/);
});

test('isValidBookmarkUrl accepts only http and https urls', () => {
  assert.equal(isValidBookmarkUrl('http://example.com'), true);
  assert.equal(isValidBookmarkUrl('https://example.com/path'), true);
  assert.equal(isValidBookmarkUrl('ftp://example.com'), false);
  assert.equal(isValidBookmarkUrl('mailto:hello@example.com'), false);
  assert.equal(isValidBookmarkUrl('example.com'), false);
});

test('filterBookmarks matches title and url case-insensitively', () => {
  const bookmarks = [
    { id: 'a', title: 'Apifox', url: 'https://app.apifox.com' },
    { id: 'b', title: 'Mermaid Live Editor', url: 'https://mermaid.live/edit' },
    { id: 'c', title: 'Other', url: 'https://example.com/docs' },
  ];

  assert.deepEqual(filterBookmarks(bookmarks, 'MERMAID'), [bookmarks[1]]);
  assert.deepEqual(filterBookmarks(bookmarks, 'APP.APIFOX'), [bookmarks[0]]);
  assert.deepEqual(filterBookmarks(bookmarks, 'docs'), [bookmarks[2]]);
});

test('normalizeBookmark trims title and url and generates id', () => {
  const bookmark = normalizeBookmark({
    title: '  Mermaid Live Editor  ',
    url: '  https://mermaid.live/edit  ',
  });

  assert.equal(bookmark.title, 'Mermaid Live Editor');
  assert.equal(bookmark.url, 'https://mermaid.live/edit');
  assert.match(bookmark.id, /^mermaid-live-editor-https-mermaid-live-edit-[a-f0-9]{10}$/);
});

test('serializeBookmarks returns pretty json with trailing newline', () => {
  assert.equal(
    serializeBookmarks([
      {
        id: 'apifox',
        title: 'Apifox',
        url: 'https://app.apifox.com',
      },
    ]),
    '[\n  {\n    "id": "apifox",\n    "title": "Apifox",\n    "url": "https://app.apifox.com"\n  }\n]\n'
  );
});

test('loadGithubConfig returns defaults when storage is empty', () => {
  const storage = createMemoryStorage();

  assert.deepEqual(loadGithubConfig(storage), {
    token: '',
    repository: '',
    branch: '',
  });
});

test('loadGithubConfig returns defaults when stored json is invalid', () => {
  const storage = createMemoryStorage('{not valid json');

  assert.deepEqual(loadGithubConfig(storage), {
    token: '',
    repository: '',
    branch: '',
  });
});

test('saveGithubConfig persists token repository and branch under one storage key', () => {
  const storage = createMemoryStorage();

  saveGithubConfig(storage, {
    token: 'ghp_test',
    repository: 'owner/repo',
    branch: 'main',
    ignored: 'value',
  });

  assert.deepEqual(storage.dump(), {
    [STORAGE_KEY]: JSON.stringify({
      token: 'ghp_test',
      repository: 'owner/repo',
      branch: 'main',
    }),
  });
});

test('clearGithubConfig removes persisted config', () => {
  const storage = createMemoryStorage(
    JSON.stringify({
      token: 'ghp_test',
      repository: 'owner/repo',
      branch: 'main',
    })
  );

  clearGithubConfig(storage);

  assert.deepEqual(storage.dump(), {});
});

test('loadGithubConfig falls back when window.localStorage getter throws', () => {
  const originalWindow = global.window;
  const throwingWindow = {};

  Object.defineProperty(throwingWindow, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked');
    },
  });

  global.window = throwingWindow;

  try {
    assert.deepEqual(loadGithubConfig(), {
      token: '',
      repository: '',
      branch: '',
    });
    assert.doesNotThrow(() => saveGithubConfig());
    assert.doesNotThrow(() => clearGithubConfig());
  } finally {
    if (typeof originalWindow === 'undefined') {
      delete global.window;
    } else {
      global.window = originalWindow;
    }
  }
});
