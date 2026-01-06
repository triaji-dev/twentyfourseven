import React from 'react';
import { Pin, Trash2, RefreshCcw } from 'lucide-react';

interface PinnedNotesHeaderProps {
  itemCount: number;
}

export const PinnedNotesHeader: React.FC<PinnedNotesHeaderProps> = ({ itemCount }) => {
  return (
    <div className="flex items-center justify-between px-1 mb-4 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2 text-yellow-500">
        <Pin size={14} fill="currentColor" />
        <span className="text-xs font-medium">Pinned Notes</span>
        <span className="text-[10px] bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500 border border-yellow-500/20">
          {itemCount} items
        </span>
      </div>
    </div>
  );
};

interface RecycleBinHeaderProps {
  itemCount: number;
  onRestoreAll: () => void;
  onEmptyBin: () => void;
}

export const RecycleBinHeader: React.FC<RecycleBinHeaderProps> = ({
  itemCount,
  onRestoreAll,
  onEmptyBin
}) => {
  return (
    <div className="flex items-center justify-between px-1 mb-4 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2 text-red-400">
        <Trash2 size={14} />
        <span className="text-xs font-medium">Recycle Bin</span>
        <span className="text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded text-red-400 border border-red-500/20">
          {itemCount} items
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRestoreAll}
          disabled={itemCount === 0}
          className="text-[10px] px-2 py-1 bg-[#262626] hover:bg-[#333] text-[#a3a3a3] hover:text-[#e5e5e5] rounded border border-[#404040] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw size={10} /> Restore All
        </button>
        <button
          onClick={onEmptyBin}
          disabled={itemCount === 0}
          className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={10} /> Delete All
        </button>
      </div>
    </div>
  );
};
