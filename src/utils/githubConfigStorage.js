const STORAGE_KEY = 'github-tools-github-config';
const LEGACY_STORAGE_KEY = 'github-bookmark-config';

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

function parseConfig(rawValue) {
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

function loadGithubConfig(storage) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage || typeof resolvedStorage.getItem !== 'function') {
    return createDefaultConfig();
  }

  try {
    const currentValue = resolvedStorage.getItem(STORAGE_KEY);

    if (currentValue) {
      return parseConfig(currentValue);
    }

    return parseConfig(resolvedStorage.getItem(LEGACY_STORAGE_KEY));
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

  if (typeof resolvedStorage.removeItem === 'function') {
    try {
      resolvedStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      return;
    }
  }
}

function clearGithubConfig(storage) {
  const resolvedStorage = getStorage(storage);

  if (!resolvedStorage || typeof resolvedStorage.removeItem !== 'function') {
    return;
  }

  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      resolvedStorage.removeItem(key);
    } catch {
      continue;
    }
  }
}

module.exports = {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  loadGithubConfig,
  saveGithubConfig,
  clearGithubConfig,
};
