const STORAGE_KEY = 'github-bookmark-config';

function createDefaultConfig() {
  return {
    token: '',
    repository: '',
    branch: '',
  };
}

function getStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof window !== 'undefined') {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  return null;
}

function loadGithubConfig(storage) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage || typeof resolvedStorage.getItem !== 'function') {
    return createDefaultConfig();
  }

  let rawValue;

  try {
    rawValue = resolvedStorage.getItem(STORAGE_KEY);
  } catch {
    return createDefaultConfig();
  }

  if (!rawValue) {
    return createDefaultConfig();
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed || typeof parsed !== 'object') {
      return createDefaultConfig();
    }

    return {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      repository: typeof parsed.repository === 'string' ? parsed.repository : '',
      branch: typeof parsed.branch === 'string' ? parsed.branch : '',
    };
  } catch {
    return createDefaultConfig();
  }
}

function saveGithubConfig(storage, config) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage || typeof resolvedStorage.setItem !== 'function') {
    return;
  }

  try {
    resolvedStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: typeof config?.token === 'string' ? config.token : '',
        repository: typeof config?.repository === 'string' ? config.repository : '',
        branch: typeof config?.branch === 'string' ? config.branch : '',
      })
    );
  } catch {
    return;
  }
}

function clearGithubConfig(storage) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage || typeof resolvedStorage.removeItem !== 'function') {
    return;
  }

  try {
    resolvedStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

module.exports = {
  STORAGE_KEY,
  loadGithubConfig,
  saveGithubConfig,
  clearGithubConfig,
};
