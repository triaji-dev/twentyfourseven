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
    <div className="h-[76px] w-full flex items-center justify-between px-4 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-[#737373]">
          <span className="text-[#e5e5e5] font-bold mr-1">{selectedCount}</span>
          selected
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMerge}
          disabled={selectedCount < 2}
          className="p-2 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="Merge"
        >
          <Merge size={16} className="group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="p-2 text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
          title="Delete"
        >
          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="w-px h-4 bg-[#262626] mx-2" />
        <button
          onClick={onCancel}
          className="p-2 text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] rounded-md transition-all"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
