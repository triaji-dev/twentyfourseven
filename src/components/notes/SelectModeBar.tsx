import React from 'react';
import { X, Trash2, Merge } from 'lucide-react';

interface SelectModeBarProps {
  selectedCount: number;
  onMerge: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const SelectModeBar: React.FC<SelectModeBarProps> = ({
  selectedCount,
  onMerge,
  onDelete,
  onCancel
}) => {
  return (
    <div className="h-[42px] w-full flex items-center justify-between px-3 bg-[#1a1a1a]/95 backdrop-blur border border-[#333] rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-[#737373]">
          <span className="text-[#e5e5e5] font-bold mr-1">{selectedCount}</span>
          selected
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMerge}
          disabled={selectedCount < 2}
          className="p-1.5 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="Merge"
        >
          <Merge size={14} className="group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="p-1.5 text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="Delete"
        >
          <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-px h-3 bg-[#262626] mx-1.5" />
        <button
          onClick={onCancel}
          className="p-1.5 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded-md transition-all"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
