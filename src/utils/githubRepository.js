function normalizeGithubRepository(repository) {
  const repositoryText = String(repository || '').trim();

  if (!repositoryText) {
    return '';
  }

  const githubUrlMatch = repositoryText.match(
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s?#]+)(?:[/?#].*)?$/i
  );

  if (githubUrlMatch) {
    return `${githubUrlMatch[1]}/${githubUrlMatch[2].replace(/\.git$/, '')}`;
  }

  return repositoryText.replace(/\.git$/, '');
}

function buildGithubFileUrl({ repository, branch, path }) {
  const normalizedRepository = normalizeGithubRepository(repository);

  if (!normalizedRepository) {
    return '';
  }

  const normalizedBranch = String(branch || '').trim();

  if (!normalizedBranch) {
    return `https://github.com/${normalizedRepository}`;
  }

  const encodedBranch = normalizedBranch
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const encodedPath = String(path || '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `https://github.com/${normalizedRepository}/blob/${encodedBranch}/${encodedPath}`;
}

module.exports = {
  normalizeGithubRepository,
  buildGithubFileUrl,
};
