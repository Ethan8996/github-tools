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

function createBookmarkId(title, url) {
  return `${slugify(title)}-${slugify(url)}`;
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
