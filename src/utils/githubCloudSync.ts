import { CloudStateBundle, GitHubCloudConfig } from '../types/quant';

const GITHUB_CONFIG_STORAGE_KEY = 'nostradamus_github_pat_config_v1';

/**
 * Automatically detects GitHub owner and repository name when running on GitHub Pages
 * (e.g., https://<username>.github.io/nostradamus/) and defaults repo to 'nostradamus'.
 */
export function detectDefaultGitHubRepoInfo(): { owner: string; repo: string } {
  let detectedOwner = '';
  let detectedRepo = 'nostradamus';

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.github.io')) {
      const sub = host.replace(/\.github\.io$/i, '').trim();
      if (sub && sub !== 'www') {
        detectedOwner = sub;
      }
    }
    const pathSegments = window.location.pathname
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
    if (pathSegments.length > 0 && !pathSegments[0].endsWith('.html')) {
      detectedRepo = pathSegments[0];
    }
  }

  return {
    owner: detectedOwner,
    repo: detectedRepo || 'nostradamus'
  };
}

export const DEFAULT_GITHUB_CLOUD_CONFIG: GitHubCloudConfig = {
  owner: detectDefaultGitHubRepoInfo().owner,
  repo: detectDefaultGitHubRepoInfo().repo,
  branch: 'main',
  filePath: 'data/nostradamus_cloud_state.json',
  patToken: '',
  autoSyncOnEdit: true
};

export function loadGitHubCloudConfig(): GitHubCloudConfig {
  const defaults = detectDefaultGitHubRepoInfo();
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_GITHUB_CLOUD_CONFIG,
        owner: defaults.owner,
        repo: defaults.repo
      };
    }
    const parsed = JSON.parse(raw) as Partial<GitHubCloudConfig>;
    return {
      owner: parsed.owner?.trim() || defaults.owner || '',
      repo: parsed.repo?.trim() || defaults.repo || 'nostradamus',
      branch: parsed.branch?.trim() || 'main',
      filePath: parsed.filePath?.trim() || 'data/nostradamus_cloud_state.json',
      patToken: parsed.patToken?.trim() || '',
      autoSyncOnEdit: parsed.autoSyncOnEdit ?? true,
      lastSyncedSha: parsed.lastSyncedSha,
      lastSyncedAt: parsed.lastSyncedAt
    };
  } catch {
    return {
      ...DEFAULT_GITHUB_CLOUD_CONFIG,
      owner: defaults.owner,
      repo: defaults.repo
    };
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
 * Verifies repository access and token permissions against GitHub REST API.
 */
export async function verifyGitHubRepoConnection(
  config: GitHubCloudConfig
): Promise<{
  ok: boolean;
  fullName: string;
  defaultBranch: string;
  canPush: boolean;
  message: string;
}> {
  if (!config.owner.trim() || !config.repo.trim() || !config.patToken.trim()) {
    throw new Error('Mohon lengkapi GitHub Username, Nama Repository (nostradamus), dan Token PAT.');
  }

  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.patToken.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token PAT tidak valid atau sudah kedaluwarsa (401 Unauthorized).');
    }
    if (res.status === 404) {
      throw new Error(
        `Repository "${config.owner.trim()}/${config.repo.trim()}" tidak ditemukan atau Token PAT belum diberi akses ke repo tersebut.`
      );
    }
    const errText = await res.text();
    throw new Error(`GitHub API Error (${res.status}): ${errText.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    full_name?: string;
    default_branch?: string;
    permissions?: { push?: boolean; admin?: boolean };
  };
  const canPush = Boolean(data.permissions?.push || data.permissions?.admin);

  return {
    ok: true,
    fullName: data.full_name || `${config.owner}/${config.repo}`,
    defaultBranch: data.default_branch || config.branch || 'main',
    canPush,
    message: canPush
      ? `Terhubung ke ${data.full_name} (Izin Read & Write Aktif)`
      : `Terhubung ke ${data.full_name} (Hanya Read — aktifkan izin Contents: Read & Write pada PAT untuk Push)`
  };
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
      const notFoundErr = new Error(
        `FILE_NOT_INITIALIZED: File ${cleanPath} belum ada di repo ${config.owner}/${config.repo}.`
      );
      (notFoundErr as any).status = 404;
      throw notFoundErr;
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
      'Lengkapi GitHub Username, Nama Repository (nostradamus), dan GitHub Personal Access Token (PAT) terlebih dahulu.'
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
    message: `chore(quant): sync Nostradamus portfolio & screener cloud state [${new Date()
      .toISOString()
      .slice(0, 16)}]`,
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

/**
 * Pulls the latest `public/static-market-snapshot.json` directly via GitHub REST API (`api.github.com`)
 * with raw media type (`application/vnd.github.raw+json`) to bypass GitHub Pages CDN cache completely.
 */
export async function pullLiveMarketSnapshotFromGitHubApi(
  customConfig?: GitHubCloudConfig
): Promise<any | null> {
  const cfg = customConfig ?? loadGitHubCloudConfig();
  const owner = cfg.owner.trim() || detectDefaultGitHubRepoInfo().owner;
  const repo = cfg.repo.trim() || detectDefaultGitHubRepoInfo().repo || 'nostradamus';
  const branch = cfg.branch.trim() || 'main';

  if (!owner || !repo) return null;

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo
  )}/contents/public/static-market-snapshot.json?ref=${encodeURIComponent(branch)}&t=${Date.now()}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (cfg.patToken.trim()) {
    headers.Authorization = `Bearer ${cfg.patToken.trim()}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore and fallback
  }
  return null;
}

/**
 * Triggers the GitHub Actions workflow (`sync-idx-market.yml`) via GitHub REST API (`workflow_dispatch`)
 * so the GitHub runner fetches fresh Yahoo Finance data for all 956+ JCI stocks and commits it to the repo.
 */
export async function triggerGitHubActionsMarketSync(
  config: GitHubCloudConfig
): Promise<{ ok: boolean; message: string }> {
  if (!isGitHubCloudConfigured(config)) {
    throw new Error(
      'Konfigurasikan GitHub Username, Repo (nostradamus), dan Token PAT terlebih dahulu.'
    );
  }

  const owner = encodeURIComponent(config.owner.trim());
  const repo = encodeURIComponent(config.repo.trim());
  const branch = config.branch.trim() || 'main';

  const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/sync-idx-market.yml/dispatches`;
  const res = await fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.patToken.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ref: branch })
  });

  if (res.status === 204 || res.ok) {
    return {
      ok: true,
      message: `GitHub Actions Workflow (sync-idx-market.yml) berhasil dijalankan di ${config.owner}/${config.repo} (branch ${branch}). Server GitHub sedang memperbarui 956+ saham JCI.`
    };
  }

  if (res.status === 404) {
    throw new Error(
      `Workflow sync-idx-market.yml belum ditemukan di branch ${branch} atau Token PAT belum memiliki izin "Actions / Workflow: Read & Write".`
    );
  }

  const errText = await res.text();
  throw new Error(`Gagal memicu GitHub Actions (${res.status}): ${errText.slice(0, 140)}`);
}
