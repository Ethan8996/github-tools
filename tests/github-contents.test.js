const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createGithubHeaders,
  buildContentsUrl,
  fetchRepositoryFile,
  updateRepositoryFile,
} = require('../src/utils/githubContents');

test('createGithubHeaders includes token and json headers', () => {
  assert.deepEqual(createGithubHeaders('ghp_test'), {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ghp_test',
    'Content-Type': 'application/json',
  });
});

test('buildContentsUrl encodes nested path and branch query', () => {
  assert.equal(
    buildContentsUrl({
      repository: 'owner/repo',
      path: 'docs/bookmarks/page.md',
      branch: 'feature/bookmarks page',
    }),
    'https://api.github.com/repos/owner/repo/contents/docs/bookmarks/page.md?ref=feature%2Fbookmarks%20page'
  );
});

test('updateRepositoryFile sends PUT request with encoded body and returns commit sha', async () => {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, init });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        commit: { sha: 'commit-sha-123' },
        content: { sha: 'content-sha-456' },
      }),
    };
  };

  const result = await updateRepositoryFile(fetchImpl, {
    token: 'ghp_test',
    repository: 'owner/repo',
    branch: 'main',
    path: 'docs/bookmarks/page.md',
    sha: 'old-sha',
    message: 'Update bookmarks page',
    content: 'hello world',
  });

  assert.deepEqual(result, {
    commitSha: 'commit-sha-123',
    contentSha: 'content-sha-456',
  });
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.github.com/repos/owner/repo/contents/docs/bookmarks/page.md?ref=main'
  );
  assert.equal(calls[0].init.method, 'PUT');
  assert.deepEqual(calls[0].init.headers, {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ghp_test',
    'Content-Type': 'application/json',
  });
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    message: 'Update bookmarks page',
    content: Buffer.from('hello world', 'utf8').toString('base64'),
    sha: 'old-sha',
    branch: 'main',
  });
});

test('updateRepositoryFile throws readable conflict error on 409', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ message: 'sha does not match' }),
  });

  await assert.rejects(
    updateRepositoryFile(fetchImpl, {
      token: 'ghp_test',
      repository: 'owner/repo',
      branch: 'main',
      path: 'docs/bookmarks/page.md',
      sha: 'old-sha',
      message: 'Update bookmarks page',
      content: 'hello world',
    }),
    /仓库文件已变化，请刷新页面后重试/
  );
});

test('fetchRepositoryFile requests branch-specific ref and returns sha', async () => {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, init });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        sha: 'file-sha-789',
        content: 'encoded-content',
        path: 'docs/bookmarks/page.md',
      }),
    };
  };

  const result = await fetchRepositoryFile(fetchImpl, {
    token: 'ghp_test',
    repository: 'owner/repo',
    branch: 'main',
    path: 'docs/bookmarks/page.md',
  });

  assert.deepEqual(result, {
    sha: 'file-sha-789',
    content: 'encoded-content',
    path: 'docs/bookmarks/page.md',
  });
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.github.com/repos/owner/repo/contents/docs/bookmarks/page.md?ref=main'
  );
  assert.deepEqual(calls[0].init, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ghp_test',
      'Content-Type': 'application/json',
    },
  });
});
