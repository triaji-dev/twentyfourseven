import React from 'react';
import {
  Search, X, ChevronDown, RefreshCcw,
  CheckCheck, List, Pin, Trash2
} from 'lucide-react';
import { NoteType } from '../../../shared/types';
import { NOTE_TYPES } from '../types';


interface NoteFiltersProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Tags
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  allTags: [string, number][];
  tagMenuOpen: boolean;
  onTagMenuToggle: (open: boolean) => void;
  tagSearchQuery: string;
  onTagSearchChange: (query: string) => void;
  lastUsedTag: string | null;
  onLastUsedTagClick: (tag: string) => void;

  // Types
  selectedTypes: NoteType[];
  onTypeToggle: (type: NoteType) => void;

  // View options
  completedFilter: 'all' | 'notCompleted';
  onCompletedFilterToggle: () => void;
  isSortedByType: boolean;
  onSortByTypeToggle: () => void;

  // Status filters
  showPinnedOnly: boolean;
  onPinnedToggle: () => void;
  showRecycleBin: boolean;
  onRecycleBinToggle: () => void;
}

export const NoteFilters: React.FC<NoteFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagSelect,
  allTags,
  tagMenuOpen,
  onTagMenuToggle,
  tagSearchQuery,
  onTagSearchChange,
  lastUsedTag,
  onLastUsedTagClick,
  selectedTypes,
  onTypeToggle,
  completedFilter,
  onCompletedFilterToggle,
  isSortedByType,
  onSortByTypeToggle,
  showPinnedOnly,
  onPinnedToggle,
  showRecycleBin,
  onRecycleBinToggle
}) => {
  // Ref for tag menu wrapper
  const tagMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        onTagMenuToggle(false);
      }
    };

    if (tagMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagMenuOpen, onTagMenuToggle]);

  return (
    <>
      {/* Row 1: Search & Tags (50/50 Split) */}
      <div className="grid grid-cols-12 gap-2 h-9">
        {/* Searchbar */}
        <div className="relative col-span-6 group">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#262626] focus:border-[#404040] focus:bg-[#212121] outline-none text-[11px] text-[#e5e5e5] placeholder-[#525252] pl-8 pr-7 rounded-lg transition-all duration-200 shadow-sm"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252] group-focus-within:text-[#d4d4d4] transition-colors duration-200" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#e5e5e5] p-1 rounded-md hover:bg-[#333] transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tags Filter Dropdown */}
        <div className="col-span-6 flex">
          <div ref={tagMenuRef} className="relative flex-1 tag-filter-menu h-full">
            <button
              onClick={() => onTagMenuToggle(!tagMenuOpen)}
              className={`w-full h-full px-3 flex items-center justify-between rounded-l-lg border transition-all duration-200 ${selectedTag
                ? 'bg-[#262626] border-[#525252] text-[#f5f5f5] shadow-[0_0_15px_rgba(0,0,0,0.2)]'
                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#737373] hover:bg-[#202020] hover:text-[#a3a3a3] hover:border-[#333]'
                }`}
            >
              <span className="text-[10px] font-semibold tracking-tight truncate">
                {selectedTag ? selectedTag.replace('#', '') : "TAGS"}
              </span>
              <ChevronDown size={14} className={`${tagMenuOpen ? 'rotate-180' : ''} transition-transform duration-200 text-[#525252]`} />
            </button>

            {tagMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full bg-[#171717]/95 backdrop-blur-xl border border-[#262626] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-[#262626] bg-[#111111]/50">
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Filter tags..."
                      value={tagSearchQuery}
                      onChange={(e) => onTagSearchChange(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-7 py-1.5 text-xs outline-none focus:border-[#404040] transition-colors placeholder-[#404040] text-gray-300"
                    />
                    <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1 py-0.5 custom-scrollbar">
                  <button
                    onClick={() => { onTagSelect(null); onTagMenuToggle(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] ${!selectedTag ? 'text-[#e5e5e5] bg-[#262626]/50' : 'text-[#737373]'}`}
                  >
                    All Tags
                  </button>

                  {/* Last Used Tag Section */}
                  {lastUsedTag && !tagSearchQuery && (
                    <button
                      onClick={() => {
                        onLastUsedTagClick(lastUsedTag);
                        onTagMenuToggle(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] flex items-center justify-between border-b border-[#262626]/50 mb-1 pb-2 shadow-sm ${selectedTag === lastUsedTag ? 'text-[#e5e5e5] bg-[#262626]' : 'text-[#a3a3a3]'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCcw size={8} className="opacity-50" />
                        <span>{lastUsedTag.replace('#', '')}</span>
                      </div>
                      <span className="text-[8px] opacity-30 uppercase tracking-tighter">Recent</span>
                    </button>
                  )}

                  {allTags
                    .filter(([tag]) => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                    .filter(([tag]) => tag.toLowerCase() !== (lastUsedTag || '').toLowerCase())
                    .map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => {
                          onTagSelect(selectedTag === tag ? null : tag);
                          onTagMenuToggle(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] flex items-center justify-between ${selectedTag === tag ? 'text-[#e5e5e5] bg-[#262626]' : 'text-[#737373]'
                          }`}
                      >
                        <span>{tag.replace('#', '')}</span>
                        <span className="text-[9px] opacity-40 tabular-nums">{count}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTagSelect(null)}
            title="Clear Tag Filter"
            className="w-9 h-full flex items-center justify-center rounded-r-lg border border-[#262626] bg-[#1a1a1a]/80 backdrop-blur-sm text-[#525252] hover:border-[#404040] hover:text-[#a3a3a3] hover:bg-[#202020] transition-all duration-200"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      </div>

      {/* Row 2: Filter Groups */}
      <div className="grid grid-cols-12 gap-2">

        {/* Note Types Group */}
        <div className="col-span-6 flex items-center">
          {(Object.entries(NOTE_TYPES) as [NoteType, any][]).map(([type, config], index, array) => {
            const isSelected = selectedTypes.includes(type);
            const isFirst = index === 0;
            const isLast = index === array.length - 1;

            return (
              <button
                key={type}
                onClick={() => onTypeToggle(type)}
                className={`h-9 flex-1 flex items-center justify-center border transition-all duration-200 active:scale-95
                  ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}
                  ${isSelected
                    ? 'bg-[#262626] border-[#525252] z-10 shadow-[inner_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:bg-[#202020] hover:border-[#333] hover:text-[#737373]'
                  }`}
                title={config.label}
                style={{
                  ...(isSelected ? {
                    color: config.color,
                    backgroundColor: `${config.color}0a`,
                    borderColor: `${config.color}44`,
                    boxShadow: `0 0 10px ${config.color}11`
                  } : {})
                } as React.CSSProperties}
              >
                <config.icon size={14} />
              </button>
            );
          })}
        </div>

        <div className="col-span-6 flex items-center gap-2">
          {/* View Options Group */}
          <div className="flex items-center flex-1">
            <button
              onClick={onCompletedFilterToggle}
              title="Show Completed"
              className={`h-9 flex-1 flex items-center justify-center border rounded-l-lg transition-all duration-200 active:scale-95 ${completedFilter === 'all'
                ? 'bg-gray-100/10 border-gray-100/40 text-gray-200 shadow-[0_0_10px_rgba(59,130,246,0.1)] z-10'
                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#333] hover:text-[#737373] hover:bg-[#202020]'
                }`}
            >
              <CheckCheck size={14} />
            </button>
            <button
              onClick={onSortByTypeToggle}
              title="Grouped by Type"
              className={`h-9 flex-1 flex items-center justify-center border rounded-r-lg transition-all duration-200 active:scale-95 ${isSortedByType
                ? 'bg-gray-100/10 border-gray-100/40 text-gray-200 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#333] hover:text-[#737373] hover:bg-[#202020]'
                }`}
            >
              <List size={14} />
            </button>
          </div>

          {/* Status Group */}
          <div className="flex items-center flex-1">
            <button
              onClick={onPinnedToggle}
              title="Pinned Only"
              className={`h-9 flex-1 flex items-center justify-center border rounded-l-lg transition-all duration-200 active:scale-95 ${showPinnedOnly
                ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)] z-10'
                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#333] hover:text-[#737373] hover:bg-[#202020]'
                }`}
            >
              <Pin size={14} fill={showPinnedOnly ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onRecycleBinToggle}
              title="Recycle Bin"
              className={`h-9 flex-1 flex items-center justify-center border rounded-r-lg transition-all duration-200 active:scale-95 ${showRecycleBin
                ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#333] hover:text-[#737373] hover:bg-[#202020]'
                }`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
