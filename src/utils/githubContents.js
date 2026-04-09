function createGithubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token || ''}`,
    'Content-Type': 'application/json',
  };
}

function normalizeRepositoryPath(path) {
  return String(path || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildContentsUrl({ repository, path, branch }) {
  const encodedPath = normalizeRepositoryPath(path);
  const baseUrl = `https://api.github.com/repos/${repository}/contents${encodedPath ? `/${encodedPath}` : ''}`;

  if (!branch) {
    return baseUrl;
  }

  return `${baseUrl}?ref=${encodeURIComponent(branch)}`;
}

function encodeBase64(value) {
  const text = String(value ?? '');

  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(text, 'utf8').toString('base64');
  }

  if (typeof TextEncoder !== 'undefined' && typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(text);
    let binary = '';

    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary);
  }

  if (typeof btoa === 'function') {
    return btoa(text);
  }

  throw new Error('Base64 编码不可用');
}

function normalizeApiError(status, message) {
  if (status === 401 || status === 403) {
    return 'GitHub 鉴权失败，请检查 token 权限';
  }

  if (status === 404) {
    return '仓库或目标文件不存在，请检查 repository 和路径';
  }

  if (status === 409) {
    return '仓库文件已变化，请刷新页面后重试';
  }

  return message || 'GitHub 请求失败';
}

async function readErrorMessage(response) {
  if (!response || typeof response.json !== 'function') {
    return '';
  }

  try {
    const payload = await response.json();

    if (payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    return '';
  }

  return '';
}

async function ensureOkResponse(response) {
  if (response && response.ok) {
    return;
  }

  const status = response?.status;
  const apiMessage = await readErrorMessage(response);
  throw new Error(normalizeApiError(status, apiMessage));
}

async function fetchRepositoryFile(fetchImpl, { token, repository, branch, path }) {
  const response = await fetchImpl(buildContentsUrl({ repository, path, branch }), {
    method: 'GET',
    headers: createGithubHeaders(token),
  });

  await ensureOkResponse(response);

  const data = await response.json();

  return {
    sha: data?.sha || '',
    content: data?.content || '',
    path: data?.path || path,
  };
}

async function updateRepositoryFile(fetchImpl, { token, repository, branch, path, sha, message, content }) {
  const response = await fetchImpl(buildContentsUrl({ repository, path, branch }), {
    method: 'PUT',
    headers: createGithubHeaders(token),
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha,
      branch,
    }),
  });

  await ensureOkResponse(response);

  const data = await response.json();

  return {
    commitSha: data?.commit?.sha || '',
    contentSha: data?.content?.sha || '',
  };
}

module.exports = {
  createGithubHeaders,
  buildContentsUrl,
  fetchRepositoryFile,
  updateRepositoryFile,
};
