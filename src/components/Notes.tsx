import { forwardRef, useImperativeHandle } from 'react';
import { DateNavigator } from './DateNavigator';
import { extractTags } from '../utils/notes';
import {
  X, Square, Rows4, Rows3, Rows2, Ellipsis, GripHorizontal, Grip
} from 'lucide-react';
import { NoteType } from '../types';

// Import refactored components
import {
  useNotes,
  TYPE_PRIORITY,
  NoteFilters,
  SelectModeBar,
  PinnedNotesHeader,
  RecycleBinHeader,
  NoteItemComponent
} from './notes/index';

export interface NotesHandle {
  downloadNotes: () => void;
}

interface NotesProps {
  year: number;
  month: number;
}

export const Notes = forwardRef<NotesHandle, NotesProps>(({ year, month }, ref) => {
  // Use the refactored hook for all state and handlers
  const {
    notes,
    allTimeNotes,
    activeCell,
    newNote,
    setNewNote,
    editingId,
    setEditingId,
    editContent,
    setEditContent,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    completedFilter,
    setCompletedFilter,
    selectedTypes,
    setSelectedTypes,
    showPinnedOnly,
    setShowPinnedOnly,
    showRecycleBin,
    setShowRecycleBin,
    isSortedByType,
    setIsSortedByType,
    isCompact,
    setIsCompact,
    isMicro,
    setIsMicro,
    isViewAll,
    setIsViewAll,
    dateViewStates,
    setDateViewStates,
    tagSearchQuery,
    setTagSearchQuery,
    tagMenuOpen,
    setTagMenuOpen,
    tagSuggestions,
    suggestionActiveIndex,
    setSuggestionActiveIndex,
    suggestionSource,
    setSuggestionSource,
    lastUsedTag,
    setLastUsedTag,
    allTags,
    isSelectMode,
    setIsSelectMode,
    selectedNoteIds,
    setSelectedNoteIds,
    activeContextMenu,
    setActiveContextMenu,
    activeTypeMenu,
    setActiveTypeMenu,
    confirmDeleteId,
    setConfirmDeleteId,
    editingLink,
    setEditingLink,
    transitioningIds,
    copyingIds,
    setCopyingIds,
    newlyAddedIds,
    setIsAddInputFocused,
    datesWithNotes,
    addNoteInputRef,
    listRef,
    handleDateChange,
    checkTagSuggestions,
    insertTag,
    handleAddNote,
    handleStartEdit,
    handleSaveEdit,
    handleToggleTodo,
    handleTogglePin,
    handleSetType,
    handleDeleteNote,
    handleBatchDelete,
    handleBatchMerge,
    handleRestoreNote,
    handlePermanentDelete,
    handleEmptyBin,
    handleRestoreAll,
    handleToggleSelect,
    handleToggleInlineCheckbox,
    handleSaveLink,
    highlightSearchText,
  } = useNotes({ year, month });

  // Handle type toggle
  const handleTypeToggle = (type: NoteType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Handle pinned toggle with mutual exclusivity
  const handlePinnedToggle = () => {
    if (!showPinnedOnly) {
      setShowRecycleBin(false);
    }
    setShowPinnedOnly(!showPinnedOnly);
  };

  // Handle recycle bin toggle with mutual exclusivity
  const handleRecycleBinToggle = () => {
    if (!showRecycleBin) {
      setShowPinnedOnly(false);
    }
    setShowRecycleBin(!showRecycleBin);
  };

  // Handle copy
  const handleCopy = (noteId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopyingIds(prev => new Set(prev).add(noteId));
    setTimeout(() => setCopyingIds(prev => {
      const n = new Set(prev);
      n.delete(noteId);
      return n;
    }), 200);
  };

  // Filter logic
  const getFilteredNotes = () => {
    let result: Array<{ date: Date; notes: typeof allTimeNotes[0]['notes'] }> = [];
    const filterBin = (n: typeof allTimeNotes[0]['notes'][0]) => showRecycleBin ? !!n.deletedAt : !n.deletedAt;

    if (activeCell && !isViewAll) {
      if (activeCell.year === year && activeCell.month === month) {
        const dayNotes = notes[activeCell.day];
        if (dayNotes) {
          result = [{
            date: new Date(year, month, activeCell.day),
            notes: dayNotes.filter(filterBin)
          }];
        }
      } else {
        const key = `twentyfourseven-notes-${activeCell.year}-${activeCell.month}`;
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            const dayNotes = parsed[activeCell.day];
            if (dayNotes) {
              result = [{
                date: new Date(activeCell.year, activeCell.month, activeCell.day),
                notes: dayNotes.filter(filterBin)
              }];
            }
          }
        } catch (e) {
          result = [];
        }
      }
    } else {
      result = allTimeNotes.map(item => ({
        date: item.date,
        notes: item.notes.filter(filterBin)
      })).filter(item => item.notes.length > 0);
    }

    // Apply filters
    if (selectedTag) {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.content.toUpperCase().includes(selectedTag.toUpperCase()))
      })).filter(item => item.notes.length > 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.content.toLowerCase().includes(query))
      })).filter(item => item.notes.length > 0);
    }

    if (selectedTypes.length > 0) {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => selectedTypes.includes(n.type || 'text'))
      })).filter(item => item.notes.length > 0);
    }

    if (showPinnedOnly) {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.isPinned)
      })).filter(item => item.notes.length > 0);
    }

    if (completedFilter === 'notCompleted') {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => !n.isDone)
      })).filter(item => item.notes.length > 0);
    }

    // Sort
    if (isSortedByType) {
      result = result.map(item => ({
        ...item,
        notes: [...item.notes].sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
          const priorityA = TYPE_PRIORITY[a.type || 'text'];
          const priorityB = TYPE_PRIORITY[b.type || 'text'];
          if (priorityA !== priorityB) return priorityA - priorityB;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
      }));
    }

    return result;
  };

  const filteredNotes = getFilteredNotes();

  const handleDownloadNotes = () => {
    const data = filteredNotes.flatMap(group =>
      group.notes.map(note => ({
        ...note,
        date: group.date.toISOString(),
        tags: extractTags(note.content),
        type: note.type || 'text'
      }))
    );

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({
    downloadNotes: handleDownloadNotes
  }));

  // Global toggle for date view states
  const handleGlobalToggle = () => {
    const dateKeys = filteredNotes.map(g => g.date.toDateString());
    if (dateKeys.length === 0) return;

    const firstState = dateViewStates[dateKeys[0]] || 'collapsed';
    const nextState = firstState === 'collapsed' ? 'semi' : firstState === 'semi' ? 'full' : 'collapsed';

    setDateViewStates(prev => {
      const next = { ...prev };
      dateKeys.forEach(key => { next[key] = nextState; });
      return next;
    });
  };

  const getGlobalToggleIcon = () => {
    const dateKeys = filteredNotes.map(g => g.date.toDateString());
    if (dateKeys.length === 0) return Ellipsis;
    const state = dateViewStates[dateKeys[0]] || 'collapsed';
    if (state === 'collapsed') return Ellipsis;
    if (state === 'semi') return GripHorizontal;
    return Grip;
  };

  const GlobalIcon = getGlobalToggleIcon();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .type-toggle-btn:hover {
          color: var(--active-color) !important;
          border-color: var(--active-border) !important;
          background-color: var(--active-bg) !important;
        }
      `}</style>

      {/* Filters / Select Mode Bar */}
      <div className="flex flex-col mb-2 gap-2 pr-[10px]">
        {isSelectMode ? (
          <SelectModeBar
            selectedCount={selectedNoteIds.size}
            onMerge={handleBatchMerge}
            onDelete={handleBatchDelete}
            onCancel={() => {
              setIsSelectMode(false);
              setSelectedNoteIds(new Set());
            }}
          />
        ) : (
          <NoteFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onTagSelect={(tag) => {
              setSelectedTag(tag);
              if (tag) setLastUsedTag(tag);
            }}
            allTags={allTags}
            tagMenuOpen={tagMenuOpen}
            onTagMenuToggle={setTagMenuOpen}
            tagSearchQuery={tagSearchQuery}
            onTagSearchChange={setTagSearchQuery}
            lastUsedTag={lastUsedTag}
            onLastUsedTagClick={(tag) => setSelectedTag(tag)}
            selectedTypes={selectedTypes}
            onTypeToggle={handleTypeToggle}
            completedFilter={completedFilter}
            onCompletedFilterToggle={() => setCompletedFilter(prev => prev === 'all' ? 'notCompleted' : 'all')}
            isSortedByType={isSortedByType}
            onSortByTypeToggle={() => setIsSortedByType(prev => !prev)}
            showPinnedOnly={showPinnedOnly}
            onPinnedToggle={handlePinnedToggle}
            showRecycleBin={showRecycleBin}
            onRecycleBinToggle={handleRecycleBinToggle}
          />
        )}
      </div>

      {/* Pinned Notes Header */}
      {showPinnedOnly && (
        <PinnedNotesHeader
          itemCount={filteredNotes.reduce((acc, curr) => acc + curr.notes.length, 0)}
        />
      )}

      {/* Recycle Bin Header */}
      {showRecycleBin && (
        <RecycleBinHeader
          itemCount={filteredNotes.reduce((acc, curr) => acc + curr.notes.length, 0)}
          onRestoreAll={handleRestoreAll}
          onEmptyBin={handleEmptyBin}
        />
      )}

      {/* Notes List */}
      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar pr-[10px]">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Header with navigation and toggle */}
            <div className="w-full flex items-center justify-between mb-6 px-4">
              <div className={isSelectMode ? 'opacity-50 pointer-events-none' : ''}>
                <DateNavigator
                  date={activeCell ? new Date(activeCell.year, activeCell.month, activeCell.day) : new Date()}
                  onDateChange={handleDateChange}
                  datesWithNotes={datesWithNotes}
                />
              </div>
              <div className="flex items-center gap-2">
                {isViewAll && (
                  <button
                    onClick={handleGlobalToggle}
                    disabled={isSelectMode}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''} bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]`}
                    title="Toggle view mode"
                  >
                    <GlobalIcon size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsViewAll(!isViewAll)}
                  disabled={isSelectMode}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''} ${isViewAll ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]'}`}
                  title={isViewAll ? 'View by day' : 'View all'}
                >
                  <Square size={14} />
                </button>
              </div>
            </div>
            <div className="text-[#404040] text-sm">No notes found</div>
            <div className="text-[#333] text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Click + to add your first note'}
            </div>
          </div>
        ) : (
          <>
            {/* View mode toggle row */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className={isSelectMode ? 'opacity-50 pointer-events-none' : ''}>
                <DateNavigator
                  date={activeCell ? new Date(activeCell.year, activeCell.month, activeCell.day) : new Date()}
                  onDateChange={handleDateChange}
                  datesWithNotes={datesWithNotes}
                />
              </div>
              <div className="flex items-center gap-2">
                {isViewAll && (
                  <button
                    onClick={handleGlobalToggle}
                    disabled={isSelectMode}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''} bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]`}
                    title="Toggle view mode"
                  >
                    <GlobalIcon size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsViewAll(!isViewAll)}
                  disabled={isSelectMode}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''} ${isViewAll ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]'}`}
                  title={isViewAll ? 'View by day' : 'View all'}
                >
                  <Square size={14} />
                </button>
                {/* Display mode toggles */}
                <div className="flex items-center">
                  <button
                    onClick={() => { setIsCompact(false); setIsMicro(false); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-l-lg border transition-all ${!isCompact && !isMicro ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]'}`}
                    title="Full view"
                  >
                    <Rows2 size={14} />
                  </button>
                  <button
                    onClick={() => { setIsCompact(true); setIsMicro(false); }}
                    className={`w-8 h-8 flex items-center justify-center border-y transition-all ${isCompact && !isMicro ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]'}`}
                    title="Compact view"
                  >
                    <Rows3 size={14} />
                  </button>
                  <button
                    onClick={() => { setIsCompact(true); setIsMicro(true); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-r-lg border transition-all ${isMicro ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a]/80 backdrop-blur-sm border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] hover:bg-[#202020]'}`}
                    title="Micro view"
                  >
                    <Rows4 size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes by date */}
            {filteredNotes.map(({ date, notes: dayNotes }) => {
              const dateKey = date.toDateString();
              const viewState = dateViewStates[dateKey] || 'collapsed';
              const isSmallGroup = dayNotes.length <= 3;
              const displayNotes = isSmallGroup || viewState === 'full'
                ? dayNotes
                : viewState === 'semi'
                  ? dayNotes.slice(0, Math.min(5, dayNotes.length))
                  : dayNotes.slice(0, 3);

              const getViewIcon = () => {
                if (isSmallGroup) return viewState === 'collapsed' ? Ellipsis : Grip;
                if (viewState === 'collapsed') return Ellipsis;
                if (viewState === 'semi') return GripHorizontal;
                return Grip;
              };
              const ViewIcon = getViewIcon();

              const handleDateToggle = () => {
                if (isSmallGroup) {
                  setDateViewStates(prev => ({
                    ...prev,
                    [dateKey]: viewState === 'collapsed' ? 'full' : 'collapsed'
                  }));
                } else {
                  const nextState = viewState === 'collapsed' ? 'semi' : viewState === 'semi' ? 'full' : 'collapsed';
                  setDateViewStates(prev => ({ ...prev, [dateKey]: nextState }));
                }
              };

              return (
                <div key={dateKey} className="mb-4">
                  {/* Date header */}
                  {isViewAll && (
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-medium text-[#525252] uppercase tracking-wider">
                        {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#404040]">{dayNotes.length}</span>
                        <button
                          onClick={handleDateToggle}
                          className="w-6 h-6 flex items-center justify-center rounded bg-[#1a1a1a]/80 border border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#737373] transition-all"
                        >
                          <ViewIcon size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notes list */}
                  <div key={viewState} className="flex flex-col gap-1">
                    {displayNotes.map(note => (
                      <NoteItemComponent
                        key={note.id}
                        note={note}
                        date={date}
                        isCompact={isCompact}
                        isMicro={isMicro}
                        isViewAll={isViewAll}
                        isSelectMode={isSelectMode}
                        isSelected={selectedNoteIds.has(note.id)}
                        onToggleSelect={() => {
                          if (!isSelectMode) {
                            setIsSelectMode(true);
                            setSelectedNoteIds(new Set([note.id]));
                          } else {
                            handleToggleSelect(note.id);
                          }
                        }}
                        editingId={editingId}
                        editContent={editContent}
                        onEditContentChange={setEditContent}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingId(null)}
                        tagSuggestions={tagSuggestions}
                        suggestionActiveIndex={suggestionActiveIndex}
                        suggestionSource={suggestionSource}
                        onTagSuggestionSelect={insertTag}
                        onSuggestionIndexChange={setSuggestionActiveIndex}
                        onCheckTagSuggestions={checkTagSuggestions}
                        onSuggestionSourceChange={setSuggestionSource}
                        onToggleTodo={handleToggleTodo}
                        onTogglePin={handleTogglePin}
                        onSetType={handleSetType}
                        onDeleteNote={handleDeleteNote}
                        onRestoreNote={handleRestoreNote}
                        onPermanentDelete={handlePermanentDelete}
                        onCopy={handleCopy}
                        isCopying={copyingIds.has(note.id)}
                        activeContextMenu={activeContextMenu}
                        onContextMenuToggle={setActiveContextMenu}
                        activeTypeMenu={activeTypeMenu}
                        onTypeMenuToggle={setActiveTypeMenu}
                        confirmDeleteId={confirmDeleteId}
                        onConfirmDeleteChange={setConfirmDeleteId}
                        isTransitioning={transitioningIds.has(note.id)}
                        isNewlyAdded={newlyAddedIds.has(note.id)}
                        showRecycleBin={showRecycleBin}
                        editingLink={editingLink}
                        onEditLink={setEditingLink}
                        onCancelEditLink={() => setEditingLink(null)}
                        onSaveLink={handleSaveLink}
                        onTagClick={(tag: string) => {
                          setSelectedTag(tag);
                          setLastUsedTag(tag);
                        }}
                        onToggleInlineCheckbox={handleToggleInlineCheckbox}
                        highlightSearchText={highlightSearchText}
                      />
                    ))}
                  </div>

                  {/* Show more button */}
                  {isViewAll && displayNotes.length < dayNotes.length && (
                    <button
                      onClick={() => setDateViewStates(prev => ({ ...prev, [dateKey]: 'full' }))}
                      className="w-full mt-1 py-1 text-[10px] text-[#525252] hover:text-[#a3a3a3] hover:bg-[#1a1a1a] rounded transition-colors"
                    >
                      +{dayNotes.length - displayNotes.length} more
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Note Input */}
      <div className="mt-3 pr-[10px]">
        <div className="relative">
          {/* Tag suggestions dropdown */}
          {suggestionSource === 'add' && tagSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 w-full mb-1 bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[150px] overflow-y-auto z-50">
              {tagSuggestions.map((tag, idx) => (
                <div
                  key={tag}
                  className={`px-3 py-1.5 text-xs cursor-pointer ${idx === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`}
                  onClick={() => insertTag(tag)}
                >
                  #{tag}
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={addNoteInputRef}
            value={newNote}
            onChange={(e) => {
              setNewNote(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              checkTagSuggestions(e.target.value, e.target.selectionStart, 'add');
            }}
            onFocus={() => setIsAddInputFocused(true)}
            onBlur={() => {
              setTimeout(() => setSuggestionSource(null), 200);
              setIsAddInputFocused(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (suggestionSource === 'add') {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSuggestionActiveIndex(i => (i + 1) % tagSuggestions.length);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSuggestionActiveIndex(i => (i - 1 + tagSuggestions.length) % tagSuggestions.length);
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertTag(tagSuggestions[suggestionActiveIndex]);
                  return;
                }
                if (e.key === 'Escape') {
                  setSuggestionSource(null);
                  return;
                }
              }
              if (e.key === 'Escape') {
                setNewNote('');
                if (e.target instanceof HTMLTextAreaElement) {
                  e.target.style.height = 'auto';
                }
                return;
              }
              handleAddNote(e);
            }}
            placeholder="Add a note..."
            className="w-full bg-[#171717] text-[#e5e5e5] placeholder-[#525252] text-xs p-3 pr-16 rounded-xl border border-[#262626] focus:border-[#525252] focus:bg-[#202020] outline-none resize-none overflow-hidden transition-all shadow-sm"
            rows={1}
            style={{ minHeight: '42px' }}
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {newNote && (
              <button
                onClick={() => {
                  setNewNote('');
                  if (addNoteInputRef.current) {
                    addNoteInputRef.current.style.height = '42px';
                  }
                }}
                className="text-[#525252] hover:text-[#e5e5e5] transition-colors"
                title="Clear input"
              >
                <X size={14} />
              </button>
            )}
            <span className="text-[10px] opacity-50 text-[#525252] pointer-events-none">↵</span>
          </div>
        </div>
      </div>
    </div>
  );
});
