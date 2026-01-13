import React from 'react';
import { createPortal } from 'react-dom';
import { NoteItem, NoteType } from '../../../shared/types';
import { NOTE_TYPES } from '../types';
import { NoteContent } from './NoteContent';
import {
  X, Check, Copy, Pin, PinOff, Layers, Trash, Tag,
  Square, CheckSquare, ListChecks, MoreVertical, RefreshCcw, Scissors
} from 'lucide-react';

interface NoteItemProps {
  note: NoteItem;
  date: Date;

  // Display modes
  isCompact: boolean;
  isMicro: boolean;
  isViewAll: boolean;

  // Selection
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (noteId: string) => void;

  // Edit state
  editingId: string | null;
  editContent: string;
  onEditContentChange: (content: string) => void;
  onStartEdit: (note: NoteItem) => void;
  onSaveEdit: (date: Date, noteId: string) => void;
  onCancelEdit: () => void;

  // Tag suggestions
  tagSuggestions: string[];
  suggestionActiveIndex: number;
  suggestionSource: 'add' | 'edit' | null;
  onTagSuggestionSelect: (tag: string) => void;
  onSuggestionIndexChange: (index: number) => void;
  onCheckTagSuggestions: (text: string, cursor: number, source: 'add' | 'edit') => void;
  onSuggestionSourceChange: (source: 'add' | 'edit' | null) => void;

  // Note actions
  onToggleTodo: (date: Date, noteId: string) => void;
  onTogglePin: (date: Date, noteId: string) => void;
  onSetType: (date: Date, noteId: string, type: NoteType) => void;
  onDeleteNote: (date: Date, noteId: string) => void;
  onRestoreNote: (date: Date, noteId: string) => void;
  onPermanentDelete: (date: Date, noteId: string) => void;

  // Copy
  onCopy: (noteId: string, content: string) => void;
  isCopying: boolean;

  // Context menu
  activeContextMenu: string | null;
  onContextMenuToggle: (noteId: string | null) => void;
  activeTypeMenu: string | null;
  onTypeMenuToggle: (noteId: string | null) => void;

  // Confirm delete
  confirmDeleteId: string | null;
  onConfirmDeleteChange: (noteId: string | null) => void;

  // Split
  onSplit: (date: Date, noteId: string) => void;


  // Visual state
  isTransitioning: boolean;
  isNewlyAdded: boolean;

  // Recycle bin
  showRecycleBin: boolean;

  // Content rendering
  editingLink: { noteId: string; subId: string | number; oldText: string; url: string; title: string } | null;
  onEditLink: (data: { noteId: string; subId: string | number; oldText: string; url: string; title: string }) => void;
  onCancelEditLink: () => void;
  onSaveLink: (note: NoteItem, date: Date, title: string, url: string) => void;
  onTagClick: (tag: string) => void;
  onToggleInlineCheckbox: (note: NoteItem, date: Date, lineIndex: number) => void;
  highlightSearchText: (text: string) => React.ReactNode;
  onNoteClick?: (date: Date) => void;
}

export const NoteItemComponent: React.FC<NoteItemProps> = ({
  note,
  date,
  isCompact,
  isMicro,
  isViewAll,
  isSelectMode,
  isSelected,
  onToggleSelect,
  editingId,
  editContent,
  onEditContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  tagSuggestions,
  suggestionActiveIndex,
  suggestionSource,
  onTagSuggestionSelect,
  onSuggestionIndexChange,
  onCheckTagSuggestions,
  onSuggestionSourceChange,
  onToggleTodo,
  onTogglePin,
  onSetType,
  onDeleteNote,
  onRestoreNote,
  onPermanentDelete,
  onCopy,
  isCopying,
  activeContextMenu,
  onContextMenuToggle,
  activeTypeMenu,
  onTypeMenuToggle,
  confirmDeleteId,
  onConfirmDeleteChange,
  onSplit,
  isTransitioning,
  isNewlyAdded,
  showRecycleBin,
  editingLink,
  onEditLink,
  onCancelEditLink,
  onSaveLink,
  onTagClick,
  onToggleInlineCheckbox,
  highlightSearchText,
  onNoteClick
}) => {
  const isNoteDone = note.isDone && !isTransitioning;
  const contextMenuRef = React.useRef<HTMLDivElement>(null);
  const typeMenuRef = React.useRef<HTMLButtonElement>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const moreActionsButtonRef = React.useRef<HTMLButtonElement>(null);

  // Simple heuristic for long content
  const isLongContent = React.useMemo(() => {
    return note.content.length > 200 || note.content.split('\n').length > 3;
  }, [note.content]);

  React.useEffect(() => {
    if (activeContextMenu !== note.id) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        onContextMenuToggle(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeContextMenu, note.id, onContextMenuToggle]);

  React.useEffect(() => {
    if (!isCompact || isMicro) {
      setIsExpanded(false);
    }
  }, [isCompact, isMicro]);

  return (
    <div
      key={note.id}
      id={`note-${note.id}`}
      onClick={() => {
        if (isSelectMode) {
          onToggleSelect(note.id);
        } else if (isViewAll && onNoteClick) {
          onNoteClick(date);
        }
      }}
      className={`group relative flex transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-out] ${activeContextMenu === note.id ? 'z-50' : 'z-0'} ${isNewlyAdded ? 'bg-gray-500/10' : ''} ${isMicro ? "h-[18px] items-center gap-1 py-0 px-0.5 border-transparent rounded hover:bg-[#1a1a1a]" :
        isCompact ? "items-start gap-1 py-0 px-1 border-transparent rounded" : "items-start gap-2 p-2 rounded-lg border"
        } ${isCopying ? '!bg-[#404040] !duration-100' : (note.isPinned ? 'border-[#eab308]/50 bg-[#eab308]/10' : 'border-[#222] hover:border-[#333] hover:bg-[#1a1a1a]')
        } ${isNoteDone && activeContextMenu !== note.id ? 'opacity-50' : 'opacity-100'} ${isSelectMode || isViewAll ? 'cursor-pointer' : ''} ${isSelected ? '!bg-green-500/10 !border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : ''}`}
    >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <div className="h-4 flex items-center pr-1 scale-90">
          <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-gray-500 border-gray-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-[#404040] bg-[#1a1a1a]'}`}>
            {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
          </div>
        </div>
      )}

      {/* Type Indicator */}
      <div className={`flex items-center relative ${isMicro ? 'h-3' : 'h-4'}`} data-picker-id={note.id}>
        {isSelectMode ? null : isMicro ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTodo(date, note.id); }}
            className="w-2 h-2 flex items-center justify-center hover:scale-150 transition-transform cursor-pointer"
          >
            <div className="w-1 h-1 rounded-full opacity-40 flex-shrink-0" style={{ backgroundColor: isNoteDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />
          </button>
        ) : isCompact ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleTodo(date, note.id); }} className="w-3 h-3 flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isNoteDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />
          </button>
        ) : note.type === 'todo' ? (
          <button onClick={() => onToggleTodo(date, note.id)} className={`transition-colors group flex items-center justify-center ${isNoteDone ? 'text-[#737373]' : 'text-[#facc15]'} hover:!text-[#737373]`}>
            {isNoteDone ? <CheckSquare size={14} /> : (<> <Square size={14} className="group-hover:hidden" /> <CheckSquare size={14} className="hidden group-hover:block" /> </>)}
          </button>
        ) : (
          <button onClick={() => onToggleTodo(date, note.id)} className="transition-colors hover:!text-[#737373]" style={{ color: isNoteDone ? '#737373' : NOTE_TYPES[note.type || 'text'].color }}>
            {React.createElement(NOTE_TYPES[note.type || 'text'].icon, { size: 14 })}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {editingId === note.id ? (
          <div className="flex flex-col gap-2 relative">
            <textarea
              value={editContent}
              onChange={(e) => {
                onEditContentChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
                onCheckTagSuggestions(e.target.value, e.target.selectionStart, 'edit');
              }}
              onBlur={() => setTimeout(() => { onSaveEdit(date, note.id); onSuggestionSourceChange(null); }, 200)}
              className={isCompact || isMicro ? "w-full bg-[#262626] text-[#e5e5e5] text-xs p-1 rounded border-0 outline-none resize-none overflow-hidden" : "w-full bg-transparent text-[#e5e5e5] text-xs p-0 border-0 outline-none resize-none overflow-hidden"}
              onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; e.target.selectionStart = e.target.selectionEnd = e.target.value.length; }}
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation();
                if (suggestionSource === 'edit') {
                  if (e.key === 'ArrowDown') { e.preventDefault(); onSuggestionIndexChange((suggestionActiveIndex + 1) % tagSuggestions.length); return; }
                  if (e.key === 'ArrowUp') { e.preventDefault(); onSuggestionIndexChange((suggestionActiveIndex - 1 + tagSuggestions.length) % tagSuggestions.length); return; }
                  if (e.key === 'Enter') { e.preventDefault(); onTagSuggestionSelect(tagSuggestions[suggestionActiveIndex]); return; }
                  if (e.key === 'Escape') { onSuggestionSourceChange(null); return; }
                }
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit(date, note.id); }
                else if (e.key === 'Escape') { onCancelEdit(); }
              }}
            />
            {suggestionSource === 'edit' && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[110px] overflow-y-auto z-50 custom-scrollbar" onMouseDown={(e) => e.preventDefault()}>
                {tagSuggestions.map((tag, idx) => (
                  <div key={tag} className={`px-3 py-1.5 text-[10px] cursor-pointer ${idx === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`} onClick={() => onTagSuggestionSelect(tag)}>#{tag}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <div
              className={`${isMicro ? 'text-[9px] truncate leading-none py-0' : isCompact ? (isExpanded ? 'text-[11px]' : 'text-[11px] line-clamp-3') : 'text-xs'} block break-words ${isMicro ? 'leading-none' : 'leading-relaxed'} ${isNoteDone ? 'text-[#a3a3a3]' : (note.type === 'link' ? 'text-[#a0c4ff]' : (note.type === 'important' ? 'text-[#f87171]' : 'text-[#d4d4d4]'))}`}
              onDoubleClick={() => !isSelectMode && !isViewAll && !isNoteDone && onStartEdit(note)}
            >
              <NoteContent
                note={note}
                date={date}
                isMicro={isMicro}
                isCompact={isCompact && !isExpanded}
                isSelectMode={isSelectMode}
                editingLink={editingLink}
                onEditLink={onEditLink}
                onCancelEditLink={onCancelEditLink}
                onSaveLink={onSaveLink}
                onTagClick={onTagClick}
                onToggleInlineCheckbox={onToggleInlineCheckbox}
                highlightSearchText={highlightSearchText}
              />
            </div>
            {isCompact && isLongContent && !isSelectMode && (
              <div className="flex justify-end w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-[9px] text-[#525252] hover:text-[#a3a3a3] transition-colors mt-0.5"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Full mode action bar */}
        <div className={`flex items-center justify-between mt-4 ${isCompact || isMicro ? "hidden" : ""}`}>
          <span className="text-[11px] text-[#525252] flex items-center gap-1">
            {(() => {
              const d = new Date(note.createdAt);
              const isValid = !isNaN(d.getTime());
              if (!isValid) return '';
              const midnight = new Date(d);
              midnight.setHours(0, 0, 0, 0);
              const isMidnight = d.getTime() === midnight.getTime();
              // If exactly midnight (often migrated data) or user wants "Created Date", show Date
              // If it has specific time, show time.
              // Requirement: "Fix 00.00 Created Date" -> Avoid showing just 00:00 if it's not meaningful.
              return isMidnight
                ? d.toLocaleDateString([], { day: 'numeric', month: 'short' })
                : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            })()}
            {note.updatedAt && (
              <span className="text-[#525252] opacity-75" title={`Last modified: ${new Date(note.updatedAt).toLocaleString()}`}>
                • Edited {new Date(note.updatedAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {!note.updatedAt && isNoteDone && note.completedAt && (<span className="text-[#525252] opacity-75"> • {new Date(note.completedAt).toLocaleDateString([], { day: 'numeric', month: 'numeric' })}</span>)}
          </span>
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${(isSelectMode || isViewAll) ? 'hidden' : ''}`}>
            {editingId === note.id ? (
              <>
                <button onClick={() => onCancelEdit()} className="text-[#737373] hover:text-[#e5e5e5] px-1" title="Cancel"><X size={14} /></button>
                <button onClick={() => onSaveEdit(date, note.id)} className="text-[#737373] hover:text-[#60a5fa] px-1" title="Save"><Check size={14} /></button>
              </>
            ) : !showRecycleBin ? (
              <>
                <button onClick={() => onCopy(note.id, note.content)} className="text-[#525252] hover:text-[#e5e5e5] px-1" title="Copy"><Copy size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); onSplit(date, note.id); }} className="text-[#525252] hover:text-[#e5e5e5] px-1" title="Split"><Scissors size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); onToggleSelect(note.id); }} className="text-[#525252] hover:text-[#cecece] px-1" title="Select"><ListChecks size={14} /></button>
                {!isNoteDone && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onTogglePin(date, note.id); }} className={`text-[#525252] hover:text-[#e5e5e5] px-1 ${note.isPinned ? '!text-[#e5e5e5]' : ''}`} title={note.isPinned ? "Unpin" : "Pin"}>{note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newContent = note.content + (note.content.endsWith(' ') ? '#' : ' #');
                        onStartEdit(note);
                        onEditContentChange(newContent);
                        onCheckTagSuggestions(newContent, newContent.length, 'edit');
                      }}
                      className="text-[#525252] hover:text-[#e5e5e5] px-1"
                      title="Add Tag"
                    >
                      <Tag size={14} />
                    </button>
                    <div className="relative">
                      <button
                        ref={typeMenuRef}
                        onClick={(e) => { e.stopPropagation(); onTypeMenuToggle(activeTypeMenu === note.id ? null : note.id); }}
                        className={`text-[#525252] hover:text-[#e5e5e5] px-1 transition-colors ${activeTypeMenu === note.id ? 'text-[#e5e5e5]' : ''}`}
                        title="Type"
                      >
                        <Layers size={14} />
                      </button>
                      {activeTypeMenu === note.id && createPortal(
                        <div
                          className="fixed z-[9999] py-1 min-w-[100px] bg-[#171717] border border-[#262626] rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200"
                          style={{
                            bottom: (window.innerHeight - (typeMenuRef.current?.getBoundingClientRect().top ?? 0) + 8) + 'px',
                            right: (window.innerWidth - (typeMenuRef.current?.getBoundingClientRect().right ?? 0)) + 'px'
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          {(['text', 'todo', 'important'] as NoteType[]).map(type => (
                            <button
                              key={type}
                              onClick={() => onSetType(date, note.id, type)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                            >
                              {React.createElement(NOTE_TYPES[type].icon, { size: 12, style: { color: NOTE_TYPES[type].color } })}
                              {NOTE_TYPES[type].label}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>
                  </>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDeleteNote(date, note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors" title="Delete" data-delete-trigger={note.id}><Trash size={14} /></button>
              </>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); onRestoreNote(date, note.id); }} className="text-[#525252] hover:text-[#22c55e] px-1 transition-colors" title="Restore"><RefreshCcw size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); onConfirmDeleteChange(note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors" title="Permanently Delete"><Trash size={14} /></button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compact/Micro mode context menu */}
      {!editingId && (isCompact || isMicro) && !isSelectMode && !isViewAll && (
        <div className={`flex items-center gap-0 transition-opacity relative ${isMicro ? 'mt-0' : 'mt-0.5'} ${isSelectMode ? 'hidden' : ''} ${activeContextMenu === note.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {!showRecycleBin ? (
            <>
              <button
                ref={moreActionsButtonRef}
                onClick={(e) => { e.stopPropagation(); onContextMenuToggle(activeContextMenu === note.id ? null : note.id); }}
                className={`${isMicro ? 'p-0.5' : 'p-1'} transition-colors rounded hover:bg-[#262626] ${activeContextMenu === note.id ? 'text-[#e5e5e5] bg-[#262626]' : 'text-[#737373] hover:text-[#e5e5e5]'}`}
                title="More actions"
              >
                <MoreVertical size={isMicro ? 12 : 14} />
              </button>

              {activeContextMenu === note.id && (
                <div
                  ref={contextMenuRef}
                  className="absolute bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-[60] py-1 min-w-[100px] note-context-menu animate-in fade-in zoom-in-95 duration-100"
                  onClick={e => e.stopPropagation()}
                  style={(() => {
                    if (!moreActionsButtonRef.current) return {};
                    const rect = moreActionsButtonRef.current.getBoundingClientRect();
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const menuHeight = 280; // Approximate max height

                    if (spaceBelow < menuHeight) {
                      return {
                        bottom: '100%',
                        right: 0,
                        marginBottom: '4px',
                        transformOrigin: 'bottom right'
                      };
                    }
                    return {
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      transformOrigin: 'top right'
                    };
                  })()}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(note.id); onContextMenuToggle(null); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                  >
                    <ListChecks size={12} /> Select
                  </button>
                  {!isNoteDone && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(date, note.id); onContextMenuToggle(null); }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                    >
                      {note.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      {note.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(note.id, note.content); onContextMenuToggle(null); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSplit(date, note.id); onContextMenuToggle(null); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                  >
                    <Scissors size={12} /> Split
                  </button>
                  {!isNoteDone && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContextMenuToggle(null);
                          const newContent = note.content + (note.content.endsWith(' ') ? '#' : ' #');
                          onStartEdit(note);
                          onEditContentChange(newContent);
                          onCheckTagSuggestions(newContent, newContent.length, 'edit');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                      >
                        <Tag size={12} /> Add Tag
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); onTypeMenuToggle(activeTypeMenu === note.id ? null : note.id); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                        >
                          <Layers size={12} /> Type
                        </button>
                        {activeTypeMenu === note.id && (
                          <div className="absolute right-full top-0 mr-1 bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-[70] py-1 min-w-[100px] animate-in fade-in slide-in-from-right-1 duration-200" onClick={e => e.stopPropagation()}>
                            {(['text', 'todo', 'important'] as NoteType[]).map(type => (
                              <button
                                key={type}
                                onClick={() => { onSetType(date, note.id, type); onContextMenuToggle(null); }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                              >
                                {React.createElement(NOTE_TYPES[type].icon, { size: 12, style: { color: NOTE_TYPES[type].color } })}
                                {NOTE_TYPES[type].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  <div className="h-px bg-[#262626] my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(date, note.id); onContextMenuToggle(null); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                  >
                    <Trash size={12} /> Delete
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onRestoreNote(date, note.id); }} className="text-[#525252] hover:text-[#22c55e] px-1 flex items-center justify-center h-full transition-colors" title="Restore"><RefreshCcw size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); onConfirmDeleteChange(note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 flex items-center justify-center h-full transition-colors" title="Permanently Delete"><Trash size={14} /></button>
            </>
          )}
        </div>
      )}

      {/* Permanent delete confirmation */}
      {
        showRecycleBin && confirmDeleteId === note.id && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#171717] border border-[#262626] rounded-lg pl-3 pr-1 py-1 z-50 shadow-lg" data-delete-confirm={note.id} onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-[#e5e5e5] whitespace-nowrap font-medium">Permanently Delete?</span>
            <div className="flex items-center gap-0.5 border-l border-[#262626] pl-1.5 ml-1">
              <button onClick={(e) => { e.stopPropagation(); onConfirmDeleteChange(null); }} className="p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"><X size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); onPermanentDelete(date, note.id); onConfirmDeleteChange(null); }} className="p-1 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded transition-colors"><Trash size={12} /></button>
            </div>
          </div>
        )
      }
    </div >
  );
};
