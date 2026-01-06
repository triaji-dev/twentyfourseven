import React, { useState } from 'react';
import { Pin, Trash2, RefreshCcw } from 'lucide-react';

import { PinOff } from 'lucide-react';

interface PinnedNotesHeaderProps {
  itemCount: number;
  onUnpinAll: () => void;
}

export const PinnedNotesHeader: React.FC<PinnedNotesHeaderProps> = ({ itemCount, onUnpinAll }) => {
  const [confirmUnpin, setConfirmUnpin] = useState(false);

  return (
    <div className="flex items-center justify-between px-1 mb-4 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-2 text-yellow-500">
        <Pin size={14} fill="currentColor" />
        <span className="text-xs font-medium">Pinned Notes</span>
        <span className="text-[10px] bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500 border border-yellow-500/20">
          {itemCount} items
        </span>
      </div>
      <div className="flex items-center gap-2">
        {confirmUnpin ? (
          <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded px-1 py-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
            <span className="text-[10px] text-yellow-500 px-1">Unpin all?</span>
            <button
              onClick={() => { onUnpinAll(); setConfirmUnpin(false); }}
              className="text-[10px] px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmUnpin(false)}
              className="text-[10px] px-2 py-0.5 hover:bg-yellow-500/20 text-yellow-500 rounded transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmUnpin(true)}
            disabled={itemCount === 0}
            className="text-[10px] px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 hover:border-yellow-500/40 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PinOff size={10} /> Unpin All
          </button>
        )}
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
  const [confirmAction, setConfirmAction] = useState<'restore' | 'empty' | null>(null);

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
        {confirmAction === 'restore' ? (
          <div className="flex items-center gap-1 bg-[#262626] border border-[#404040] rounded px-1 py-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
            <span className="text-[10px] text-[#a3a3a3] px-1">Restore all?</span>
            <button
              onClick={() => { onRestoreAll(); setConfirmAction(null); }}
              className="text-[10px] px-2 py-0.5 bg-[#404040] hover:bg-[#525252] text-white rounded transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="text-[10px] px-2 py-0.5 hover:bg-[#404040] text-[#a3a3a3] hover:text-[#e5e5e5] rounded transition-colors"
            >
              No
            </button>
          </div>
        ) : confirmAction === 'empty' ? (
          <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded px-1 py-0.5 animate-in fade-in slide-in-from-right-2 duration-200">
            <span className="text-[10px] text-red-400 px-1">Delete all?</span>
            <button
              onClick={() => { onEmptyBin(); setConfirmAction(null); }}
              className="text-[10px] px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="text-[10px] px-2 py-0.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setConfirmAction('restore')}
              disabled={itemCount === 0}
              className="text-[10px] px-2 py-1 bg-[#262626] hover:bg-[#333] text-[#a3a3a3] hover:text-[#e5e5e5] rounded border border-[#404040] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={10} /> Restore All
            </button>
            <button
              onClick={() => setConfirmAction('empty')}
              disabled={itemCount === 0}
              className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={10} /> Delete All
            </button>
          </>
        )}
      </div>
    </div>
  );
};
