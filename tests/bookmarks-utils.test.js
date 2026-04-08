const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createBookmarkId,
  isValidBookmarkUrl,
  filterBookmarks,
  normalizeBookmark,
  serializeBookmarks,
} = require('../src/utils/bookmarks');

test('createBookmarkId creates a stable id from title and url', () => {
  assert.equal(
    createBookmarkId('Apifox', 'https://app.apifox.com/main/teams/489258?tab=project'),
    'apifox-https-app-apifox-com-main-teams-489258-tab-project'
  );
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
  assert.deepEqual(
    normalizeBookmark({
      title: '  Mermaid Live Editor  ',
      url: '  https://mermaid.live/edit  ',
    }),
    {
      id: 'mermaid-live-editor-https-mermaid-live-edit',
      title: 'Mermaid Live Editor',
      url: 'https://mermaid.live/edit',
    }
  );
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
