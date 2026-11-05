import { CloudStateBundle, GitHubCloudConfig } from '../types/quant';

const GITHUB_CONFIG_STORAGE_KEY = 'nostradamus_github_pat_config_v1';

export const DEFAULT_GITHUB_CLOUD_CONFIG: GitHubCloudConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  filePath: 'data/nostradamus_cloud_state.json',
  patToken: '',
  autoSyncOnEdit: true
};

export function loadGitHubCloudConfig(): GitHubCloudConfig {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_GITHUB_CLOUD_CONFIG;
    const parsed = JSON.parse(raw) as Partial<GitHubCloudConfig>;
    return {
      owner: parsed.owner?.trim() || '',
      repo: parsed.repo?.trim() || '',
      branch: parsed.branch?.trim() || 'main',
      filePath: parsed.filePath?.trim() || 'data/nostradamus_cloud_state.json',
      patToken: parsed.patToken?.trim() || '',
      autoSyncOnEdit: parsed.autoSyncOnEdit ?? true,
      lastSyncedSha: parsed.lastSyncedSha,
      lastSyncedAt: parsed.lastSyncedAt
    };
  } catch {
    return DEFAULT_GITHUB_CLOUD_CONFIG;
  }
}

export function saveGitHubCloudConfig(config: GitHubCloudConfig): void {
  try {
    localStorage.setItem(GITHUB_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function isGitHubCloudConfigured(config: GitHubCloudConfig): boolean {
  return Boolean(
    config.owner.trim() &&
      config.repo.trim() &&
      config.filePath.trim() &&
      config.patToken.trim()
  );
}

function encodeUtf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64ToUtf8(base64Str: string): string {
  const clean = base64Str.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Pulls the latest CloudStateBundle JSON from the user's GitHub repository via GitHub Contents REST API.
 * Works from any device (laptop, phone, tablet) in real time with zero cache staleness.
 */
export async function pullStateFromGitHubRepo(
  config: GitHubCloudConfig
): Promise<{ bundle: CloudStateBundle; sha: string }> {
  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const branch = encodeURIComponent(config.branch.trim() || 'main');
  const cleanPath = config.filePath.trim().replace(/^\/+/, '');

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}&t=${Date.now()}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (config.patToken.trim()) {
    headers.Authorization = `Bearer ${config.patToken.trim()}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store'
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `File ${cleanPath} belum ada di repo ${config.owner}/${config.repo} (branch ${config.branch}). Klik "PUSH TO GITHUB" terlebih dahulu untuk menginisialisasi file cloud.`
      );
    }
    const errText = await res.text();
    throw new Error(`GitHub API Error (${res.status}): ${errText.slice(0, 140)}`);
  }

  const data = (await res.json()) as { content?: string; sha?: string };
  if (!data.content || !data.sha) {
    throw new Error('Respons GitHub Contents API tidak berisi content Base64 atau SHA.');
  }

  const jsonStr = decodeBase64ToUtf8(data.content);
  const bundle = JSON.parse(jsonStr) as CloudStateBundle;
  return { bundle, sha: data.sha };
}

/**
 * Pushes (commits) the current CloudStateBundle JSON directly to the user's GitHub repository.
 * Automatically resolves the latest file SHA if needed so concurrent edits across devices never fail.
 */
export async function pushStateToGitHubRepo(
  config: GitHubCloudConfig,
  bundle: CloudStateBundle
): Promise<{ sha: string; syncedAt: string }> {
  if (!isGitHubCloudConfigured(config)) {
    throw new Error(
      'Lengkapi Owner, Nama Repository, dan GitHub Personal Access Token (PAT) terlebih dahulu.'
    );
  }

  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const branch = config.branch.trim() || 'main';
  const cleanPath = config.filePath.trim().replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.patToken.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  // Fetch current SHA first to prevent 409 Conflict
  let currentSha = config.lastSyncedSha;
  try {
    const checkRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    if (checkRes.ok) {
      const existingData = (await checkRes.json()) as { sha?: string };
      if (existingData.sha) {
        currentSha = existingData.sha;
      }
    } else if (checkRes.status === 404) {
      currentSha = undefined;
    }
  } catch {
    // proceed with known sha if any
  }

  const prettyJson = JSON.stringify(bundle, null, 2);
  const contentBase64 = encodeUtf8ToBase64(prettyJson);

  const bodyPayload: Record<string, unknown> = {
    message: `chore(quant): sync DeMiguel-24 portfolio & screener state [${new Date().toISOString().slice(0, 16)}]`,
    content: contentBase64,
    branch
  };
  if (currentSha) {
    bodyPayload.sha = currentSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(bodyPayload)
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`Gagal commit ke GitHub (${putRes.status}): ${errText.slice(0, 160)}`);
  }

  const putData = (await putRes.json()) as { content?: { sha?: string } };
  const newSha = putData.content?.sha || currentSha || '';
  const syncedAt = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return { sha: newSha, syncedAt };
}
