const SHA256_INITIAL_STATE = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19,
];

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function add32() {
  let result = 0;

  for (let index = 0; index < arguments.length; index += 1) {
    result = (result + arguments[index]) | 0;
  }

  return result;
}

function encodeUtf8(value) {
  const input = String(value);
  const bytes = [];

  for (let index = 0; index < input.length; index += 1) {
    let codePoint = input.charCodeAt(index);

    if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < input.length) {
      const nextCodePoint = input.charCodeAt(index + 1);

      if (nextCodePoint >= 0xdc00 && nextCodePoint <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (nextCodePoint - 0xdc00);
        index += 1;
      }
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6));
      bytes.push(0x80 | (codePoint & 0x3f));
      continue;
    }

    if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
      continue;
    }

    bytes.push(0xf0 | (codePoint >> 18));
    bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
    bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
    bytes.push(0x80 | (codePoint & 0x3f));
  }

  return bytes;
}

function sha256Hex(value) {
  const bytes = encodeUtf8(value);
  const words = [];
  const schedule = new Array(64);
  const hash = SHA256_INITIAL_STATE.slice();
  const bitLength = bytes.length * 8;

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >> 2] = (words[index >> 2] || 0) | (bytes[index] << (24 - (index % 4) * 8));
  }

  words[bitLength >> 5] = (words[bitLength >> 5] || 0) | (0x80 << (24 - (bitLength % 32)));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  for (let offset = 0; offset < words.length; offset += 16) {
    for (let index = 0; index < 16; index += 1) {
      schedule[index] = words[offset + index] | 0;
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 =
        rotateRight(schedule[index - 15], 7) ^
        rotateRight(schedule[index - 15], 18) ^
        (schedule[index - 15] >>> 3);
      const s1 =
        rotateRight(schedule[index - 2], 17) ^
        rotateRight(schedule[index - 2], 19) ^
        (schedule[index - 2] >>> 10);

      schedule[index] = add32(schedule[index - 16], s0, schedule[index - 7], s1);
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = add32(h, sum1, choice, SHA256_K[index], schedule[index]);
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = add32(sum0, majority);

      h = g;
      g = f;
      f = e;
      e = add32(d, temp1);
      d = c;
      c = b;
      b = a;
      a = add32(temp1, temp2);
    }

    hash[0] = add32(hash[0], a);
    hash[1] = add32(hash[1], b);
    hash[2] = add32(hash[2], c);
    hash[3] = add32(hash[3], d);
    hash[4] = add32(hash[4], e);
    hash[5] = add32(hash[5], f);
    hash[6] = add32(hash[6], g);
    hash[7] = add32(hash[7], h);
  }

  return hash.map((part) => (part >>> 0).toString(16).padStart(8, '0')).join('');
}

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
  const hash = sha256Hex(`${normalizedTitle}\n${normalizedUrl}`).slice(0, 10);

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
  const title = String(bookmark && bookmark.title || '').trim();
  const url = String(bookmark && bookmark.url || '').trim();

  if (!title) {
    throw new Error('标题不能为空');
  }

  if (!isValidBookmarkUrl(url)) {
    throw new Error('URL 必须是有效的 http/https 地址');
  }

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
