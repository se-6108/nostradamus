import React, { useState } from 'react';
import { GitHubCloudConfig } from '../types/quant';
import { Cloud, CheckCircle2, DownloadCloud, UploadCloud, X } from 'lucide-react';

interface GitHubCloudSyncModalProps {
  isOpen: boolean;
  config: GitHubCloudConfig;
  isSyncing: boolean;
  onClose: () => void;
  onSaveConfig: (nextConfig: GitHubCloudConfig) => void;
  onPullNow: (customConfig?: GitHubCloudConfig) => void;
  onPushNow: (customConfig?: GitHubCloudConfig) => void;
}

export function GitHubCloudSyncModal({
  isOpen,
  config,
  isSyncing,
  onClose,
  onSaveConfig,
  onPullNow,
  onPushNow
}: GitHubCloudSyncModalProps) {
  const [owner, setOwner] = useState(config.owner);
  const [repo, setRepo] = useState(config.repo);
  const [branch, setBranch] = useState(config.branch || 'main');
  const [filePath, setFilePath] = useState(
    config.filePath || 'data/nostradamus_cloud_state.json'
  );
  const [patToken, setPatToken] = useState(config.patToken);
  const [autoSyncOnEdit, setAutoSyncOnEdit] = useState(config.autoSyncOnEdit);

  if (!isOpen) return null;

  const buildCurrentDraft = (): GitHubCloudConfig => ({
    owner: owner.trim(),
    repo: repo.trim(),
    branch: branch.trim() || 'main',
    filePath: filePath.trim() || 'data/nostradamus_cloud_state.json',
    patToken: patToken.trim(),
    autoSyncOnEdit,
    lastSyncedSha: config.lastSyncedSha,
    lastSyncedAt: config.lastSyncedAt
  });

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const draft = buildCurrentDraft();
    onSaveConfig(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#FFFFFF] border border-[#E4E2DD] rounded-xs max-w-xl w-full p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#E4E2DD] pb-3.5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] bb-amber">
              <Cloud className="w-4 h-4" />
              <span>GitHub Repository JSON + PAT Cloud Sync</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#111315] mt-0.5">
              Sinkronisasi Cloud Real-Time Tanpa Database Berbayar
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-[#111315] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs text-xs text-neutral-600 space-y-1.5 leading-relaxed">
          <div className="font-bold text-[#111315]">
            Cara Kerja Real-Time Lintas Perangkat (Laptop &amp; Smartphone):
          </div>
          <p>
            1. Buat <strong>Fine-Grained Personal Access Token (PAT)</strong> di{' '}
            <code className="font-semibold">GitHub Settings → Developer settings → Personal access tokens</code>{' '}
            dengan izin <strong>Repository Permissions → Contents: Read and write</strong> pada repo ini.
          </p>
          <p>
            2. Setiap kali Anda menambah/mengubah portofolio atau screener, terminal akan melakukan{' '}
            <code className="font-semibold">PUT /repos/&#123;owner&#125;/&#123;repo&#125;/contents/data/nostradamus_cloud_state.json</code>.
            Saat Anda membuka URL GitHub Pages dari perangkat lain, klik <strong>Pull dari GitHub</strong> (atau otomatis saat halaman dimuat) untuk mendapatkan data terbaru.
          </p>
        </div>

        <form onSubmit={handleSaveForm} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                GitHub Username / Owner
              </label>
              <input
                type="text"
                required
                placeholder="fayadh"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Repository Name
              </label>
              <input
                type="text"
                required
                placeholder="nostradamus-quant-terminal"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Branch
              </label>
              <input
                type="text"
                required
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                Path File JSON di Repository
              </label>
              <input
                type="text"
                required
                placeholder="data/nostradamus_cloud_state.json"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">
              GitHub Personal Access Token (Fine-Grained PAT: Contents Read &amp; Write)
            </label>
            <input
              type="password"
              required
              placeholder="github_pat_11A..."
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono bg-[#FAF9F6] border border-[#E4E2DD] rounded-xs focus:outline-none focus:border-[#F59E0B]"
            />
            <span className="block text-[11px] text-neutral-500 mt-1">
              Token hanya disimpan di perangkat Anda untuk otorisasi langsung ke api.github.com.
            </span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#111315] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoSyncOnEdit}
              onChange={(e) => setAutoSyncOnEdit(e.target.checked)}
              className="accent-[#D97706]"
            />
            <span>
              Auto-Push ke GitHub setiap kali saya mengubah posisi saham atau kas portofolio
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E4E2DD]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => {
                  const draft = buildCurrentDraft();
                  onSaveConfig(draft);
                  onPullNow(draft);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0284C7] bb-cyan bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#0284C7] rounded-xs cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Test Pull dari GitHub</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={() => {
                  const draft = buildCurrentDraft();
                  onSaveConfig(draft);
                  onPushNow(draft);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D5C46] bg-[#FAF9F6] border border-[#E4E2DD] hover:border-[#059669] rounded-xs cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Push State Sekarang</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-[#111315] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bb-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
