import { forwardRef, useImperativeHandle } from 'react';
import { DateNavigator } from '../../../shared/components/DateNavigator';
import { extractTags } from '../../../shared/utils/notes';
import {
  X, Grid2x2, Square, Rows4, Rows3, Rows2, FoldVertical, UnfoldVertical,
  Calendar, Tag, Type, CheckCircle, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import { NoteType } from '../../../shared/types';
import { TYPE_PRIORITY } from '../types';
import { useNotes } from '../hooks/useNotes';
import { NoteFilters } from './NoteFilters';
import { SelectModeBar } from './SelectModeBar';
import { PinnedNotesHeader, RecycleBinHeader } from './NoteHeaders';
import { NoteItemComponent } from './NoteItem';

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
    isAddInputFocused,
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
    handleUnpinAll,
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

    if (activeCell && !isViewAll && !showRecycleBin && !showPinnedOnly) {
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
    const nextState = firstState === 'collapsed' ? 'full' : 'collapsed';

    setDateViewStates(prev => {
      const next = { ...prev };
      dateKeys.forEach(key => { next[key] = nextState; });
      return next;
    });
  };

  const getGlobalToggleIcon = () => {
    const dateKeys = filteredNotes.map(g => g.date.toDateString());
    if (dateKeys.length === 0) return UnfoldVertical;
    const state = dateViewStates[dateKeys[0]] || 'collapsed';
    return state === 'collapsed' ? UnfoldVertical : FoldVertical;
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
      <div className="flex flex-col mb-2 gap-2">
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
          onUnpinAll={handleUnpinAll}
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
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-3 shrink-0">
          {/* Fixed Header */}

          <DateNavigator
            date={activeCell ? new Date(activeCell.year, activeCell.month, activeCell.day) : new Date()}
            onDateChange={handleDateChange}
            datesWithNotes={datesWithNotes}
            isViewAll={isViewAll || showRecycleBin || showPinnedOnly}
            disabled={isSelectMode}
          >
            {isViewAll && (
              <button
                onClick={handleGlobalToggle}
                className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all backdrop-blur-sm border-[#262626] text-[#535353] hover:text-[#737373] hover:bg-[#202020]"
                title="Toggle View Mode"
              >
                <GlobalIcon size={14} />
              </button>
            )}
            {/* Display mode toggle */}
            <button
              onClick={() => {
                // Cycle: Full → Compact → Micro → Full
                if (!isCompact && !isMicro) {
                  // Currently Full, go to Compact
                  setIsCompact(true);
                  setIsMicro(false);
                } else if (isCompact && !isMicro) {
                  // Currently Compact, go to Micro
                  setIsMicro(true);
                } else {
                  // Currently Micro, go to Full
                  setIsCompact(false);
                  setIsMicro(false);
                }
              }}
              disabled={filteredNotes.length === 0}
              className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all backdrop-blur-sm border-[#262626] ${filteredNotes.length === 0
                ? 'opacity-50 cursor-not-allowed text-[#404040]'
                : 'text-[#535353] hover:text-[#737373] hover:bg-[#202020]'
                }`}
              title={!isCompact && !isMicro ? 'Full view' : isCompact && !isMicro ? 'Compact view' : 'Micro view'}
            >
              {!isCompact && !isMicro ? <Rows2 size={14} /> : isCompact && !isMicro ? <Rows3 size={14} /> : <Rows4 size={14} />}
            </button>
            {!showRecycleBin && !showPinnedOnly && (
              <button
                onClick={() => {
                  if (isViewAll) {
                    // Switching to View Day mode - focus the input and go to today
                    handleDateChange(new Date());
                    setTimeout(() => {
                      addNoteInputRef.current?.focus();
                    }, 50);
                  }
                  setIsViewAll(!isViewAll);
                }}
                disabled={isSelectMode}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${isSelectMode ? 'opacity-50 cursor-not-allowed' : ''} backdrop-blur-sm border-[#262626] text-[#535353] hover:text-[#737373] hover:bg-[#202020]`}
                title={isViewAll ? 'Add note' : 'View all'}
              >
                {isViewAll ? <Square size={14} /> : <Grid2x2 size={14} />}
              </button>
            )}
          </DateNavigator>
        </div>

        {/* Scrollable List */}
        <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-[#525252] text-xs">No notes found</div>
              <div className="text-[#303030] text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Add a note below'}
              </div>
            </div>
          ) : (
            <>
              {/* Notes by date */}
              {filteredNotes.map(({ date, notes: dayNotes }) => {
                const dateKey = date.toDateString();
                const viewState = dateViewStates[dateKey] || 'collapsed';
                const count = dayNotes.length;

                // Display Logic
                let displayNotes = dayNotes;
                if (isViewAll && viewState === 'collapsed') {
                  displayNotes = dayNotes.slice(0, 3);
                }

                // Toggle Logic
                const handleDateToggle = () => {
                  if (count <= 3) return;

                  setDateViewStates(prev => ({
                    ...prev,
                    [dateKey]: viewState === 'collapsed' ? 'full' : 'collapsed'
                  }));
                };

                // Icon Logic
                const ViewIcon = (count <= 3 || viewState === 'collapsed') ? UnfoldVertical : FoldVertical;

                return (
                  <div key={dateKey} className="mb-4">
                    {/* Date header */}
                    {isViewAll && (
                      <div
                        onClick={() => {
                          handleDateChange(date);
                          setIsViewAll(false);
                          setTimeout(() => {
                            addNoteInputRef.current?.focus();
                          }, 50);
                        }}
                        className="group flex items-center justify-between mb-2 px-3 py-2 bg-[#1e1e1e] rounded-lg transition-all hover:border-[#404040] cursor-pointer"
                      >
                        <span
                          className="flex items-center gap-2 text-xs font-playfair font-semibold text-[#a3a3a3] group-hover:text-[#e5e5e5] tracking-wide transition-colors"
                        >
                          {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-[#525252] bg-[#262626] px-1.5 py-0.5 rounded transition-colors group-hover:text-[#737373]">{dayNotes.length}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateToggle();
                            }}
                            disabled={count < 3}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-all ${count < 3
                              ? 'text-[#3a3a3a] cursor-not-allowed'
                              : 'text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626]'
                              }`}
                          >
                            <ViewIcon size={14} />
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
                          onNoteClick={(clickedDate) => {
                            setIsViewAll(false);
                            handleDateChange(clickedDate);
                          }}
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
      </div>

      {/* Add Note Input */}
      <div className={`mt-3 pr-[10px] ${isViewAll || showPinnedOnly || showRecycleBin ? 'hidden' : ''}`}>
        {/* Metadata Preview */}
        {isAddInputFocused && (
          <div className="flex items-center gap-3 px-1 mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {/* Target Date */}
            <div className="flex items-center gap-1.5 text-[10px] text-[#525252] bg-[#1a1a1a] px-2 py-1 rounded border border-[#262626]">
              <Calendar size={10} />
              <span className="font-medium">
                {(activeCell ? new Date(activeCell.year, activeCell.month, activeCell.day) : new Date())
                  .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Detected Type */}
            <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors ${newNote.startsWith('! ') || newNote.startsWith('!') ? 'text-red-400 bg-red-400/10 border-red-400/20' :
              newNote.startsWith('* ') || newNote.startsWith('todo ') ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
                newNote.includes('http') ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  'text-[#525252] bg-[#1a1a1a] border-[#262626]'
              }`}>
              {(() => {
                const content = newNote.toLowerCase();
                if (content.startsWith('! ') || content.startsWith('!')) return <AlertCircle size={10} />;
                if (content.startsWith('* ') || content.startsWith('todo ')) return <CheckCircle size={10} />;
                if (content.includes('http')) return <LinkIcon size={10} />;
                return <Type size={10} />;
              })()}
              <span className="font-medium capitalize">
                {(() => {
                  const content = newNote.toLowerCase();
                  if (content.startsWith('! ') || content.startsWith('!')) return 'Important';
                  if (content.startsWith('* ') || content.startsWith('todo ')) return 'Todo';
                  if (content.includes('http')) return 'Link';
                  return 'Text';
                })()}
              </span>
            </div>

            {/* Active Tags */}
            {(selectedTag || extractTags(newNote).length > 0) && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#525252] bg-[#1a1a1a] px-2 py-1 rounded border border-[#262626]">
                <Tag size={10} />
                <div className="flex gap-1">
                  {selectedTag && (
                    <span className="text-[#c0c0c0] font-medium">#{selectedTag.replace(/^#/, '')}</span>
                  )}
                  {extractTags(newNote)
                    .filter(t => t !== selectedTag)
                    .map(t => (
                      <span key={t} className="text-[#737373]">#{t.replace(/^#/, '')}</span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          {/* Tag suggestions dropdown */}
          {suggestionSource === 'add' && tagSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 w-full mb-1 bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[110px] overflow-y-auto z-50 custom-scrollbar">
              {tagSuggestions.map((tag, idx) => (
                <div
                  key={tag}
                  className={`px-3 py-1.5 text-[10px] cursor-pointer ${idx === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`}
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
            className="w-full bg-[#171717] text-[#e5e5e5] placeholder-[#525252] text-xs p-3 pr-16 rounded-xl border border-[#262626] focus:border-[#525252] focus:bg-[#202020] outline-none resize-none overflow-hidden transition-all shadow-sm min-h-[42px]"
            rows={1}
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
    </div >
  );
});
