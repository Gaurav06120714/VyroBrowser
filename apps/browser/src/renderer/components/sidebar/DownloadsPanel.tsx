import React from 'react';
import { useDownloads } from '../../hooks/useDownloads';
import { Download, DownloadState } from '@shared/types/download';

function formatBytes(n: number): string {
  if (n === 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatSpeed(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

function formatEta(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

const STATE_BADGE: Record<DownloadState, { label: string; className: string }> = {
  in_progress: { label: 'Downloading', className: 'bg-blue-500/20 text-blue-400' },
  paused: { label: 'Paused', className: 'bg-yellow-500/20 text-yellow-400' },
  completed: { label: 'Done', className: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-white/10 text-white/40' },
  interrupted: { label: 'Failed', className: 'bg-red-500/20 text-red-400' },
};

interface DownloadRowProps {
  download: Download;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onOpen: (id: string) => void;
  onReveal: (id: string) => void;
  onDelete: (id: string) => void;
}

const DownloadRow: React.FC<DownloadRowProps> = ({ download, onPause, onResume, onOpen, onReveal, onDelete }) => {
  const d = download;
  const progress = d.totalBytes > 0 ? (d.receivedBytes / d.totalBytes) * 100 : 0;
  const badge = STATE_BADGE[d.state];
  const isActive = d.state === 'in_progress';
  const isDone = d.state === 'completed';

  return (
    <div className="px-3 py-3 hover:bg-white/3 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-white/80 truncate">{d.filename}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <p className="text-[10px] text-white/30 truncate mb-2">{d.url}</p>

      {/* Progress bar */}
      {(isActive || d.state === 'paused') && d.totalBytes > 0 && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all ${isActive ? 'bg-vyro-400' : 'bg-white/30'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Stats */}
      {(isActive || d.state === 'paused') && (
        <p className="text-[10px] text-white/40 mb-2">
          {formatBytes(d.receivedBytes)} / {formatBytes(d.totalBytes)}
          {isActive && d.speed && d.speed > 0 && ` · ${formatSpeed(d.speed)}`}
          {isActive && d.eta !== undefined && d.eta > 0 && ` · ${formatEta(d.eta)} left`}
        </p>
      )}

      {isDone && (
        <p className="text-[10px] text-white/40 mb-2">{formatBytes(d.totalBytes)}</p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {isActive && (
          <button
            onClick={() => onPause(d.id)}
            className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/50 hover:text-white transition-all"
          >Pause</button>
        )}
        {d.state === 'paused' && (
          <button
            onClick={() => onResume(d.id)}
            className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/50 hover:text-white transition-all"
          >Resume</button>
        )}
        {isDone && d.savePath && (
          <>
            <button
              onClick={() => onOpen(d.id)}
              className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/50 hover:text-white transition-all"
            >Open</button>
            <button
              onClick={() => onReveal(d.id)}
              className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/50 hover:text-white transition-all"
            >Show in Finder</button>
          </>
        )}
        <button
          onClick={() => onDelete(d.id)}
          className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-red-400/60 hover:text-red-400 transition-all ml-auto"
        >Remove</button>
      </div>
    </div>
  );
};

export const DownloadsPanel: React.FC = () => {
  const { downloads, pause, resume, openFile, revealFile, deleteRecord, clearCompleted } = useDownloads();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-white/70">Downloads</span>
        <button
          onClick={clearCompleted}
          className="text-xs text-white/40 hover:text-white transition-all"
        >
          Clear completed
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {downloads.length === 0 ? (
          <p className="text-white/25 text-xs text-center mt-8">No downloads</p>
        ) : (
          downloads.map(d => (
            <DownloadRow
              key={d.id}
              download={d}
              onPause={pause}
              onResume={resume}
              onOpen={openFile}
              onReveal={revealFile}
              onDelete={deleteRecord}
            />
          ))
        )}
      </div>
    </div>
  );
};
