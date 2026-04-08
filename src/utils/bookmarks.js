const crypto = require('node:crypto');

function slugify(value) {
  let slug = '';

  for (const char of String(value).trim().toLowerCase()) {
    if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
      slug += char;
      continue;
    }

    if (char === '-') {
      slug += '--';
      continue;
    }

    if (char === '_') {
      slug += '__';
      continue;
    }

    if (!slug.endsWith('-')) {
      slug += '-';
    }
  }

  return slug.replace(/^-+|-+$/g, '');
}

function normalizeBookmarkTitle(title) {
  return String(title || '').trim().toLowerCase();
}

function normalizeBookmarkUrl(url) {
  const trimmedUrl = String(url || '').trim();

  try {
    return new URL(trimmedUrl).toString();
  } catch {
    return trimmedUrl;
  }
}

function createBookmarkId(title, url) {
  const normalizedTitle = normalizeBookmarkTitle(title);
  const normalizedUrl = normalizeBookmarkUrl(url);
  const prefix = [slugify(normalizedTitle), slugify(normalizedUrl)].filter(Boolean).join('-');
  const hash = crypto
    .createHash('sha256')
    .update(`${normalizedTitle}\n${normalizedUrl}`)
    .digest('hex')
    .slice(0, 10);

  return prefix ? `${prefix}-${hash}` : hash;
}

function isValidBookmarkUrl(url) {
  try {
    const parsedUrl = new URL(String(url).trim());
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function filterBookmarks(bookmarks, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return bookmarks.slice();
  }

  return bookmarks.filter((bookmark) => {
    const title = String(bookmark.title || '').toLowerCase();
    const url = String(bookmark.url || '').toLowerCase();
    return title.includes(normalizedQuery) || url.includes(normalizedQuery);
  });
}

function normalizeBookmark(bookmark) {
  const title = String(bookmark.title || '').trim();
  const url = String(bookmark.url || '').trim();

  return {
    id: createBookmarkId(title, url),
    title,
    url,
  };
}

function serializeBookmarks(bookmarks) {
  return `${JSON.stringify(bookmarks, null, 2)}\n`;
}

module.exports = {
  createBookmarkId,
  isValidBookmarkUrl,
  filterBookmarks,
  normalizeBookmark,
  serializeBookmarks,
};
