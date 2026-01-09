import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../../../shared/store/useStore';
import { NoteItem, NoteType } from '../../../shared/types';
import { processNoteContent, extractTags } from '../../../shared/utils/notes';
import { NoteGroup, DateViewState, CompletedFilter, SuggestionSource } from '../types';

interface UseNotesProps {
  year: number;
  month: number;
}

export const useNotes = ({ year, month }: UseNotesProps) => {
  const activeCell = useStore((state) => state.activeCell);
  const setActiveCell = useStore((state) => state.setActiveCell);
  const triggerUpdate = useStore((state) => state.triggerUpdate);

  // Core note state
  const [notes, setNotes] = useState<Record<number, NoteItem[]>>({});
  const [allTimeNotes, setAllTimeNotes] = useState<NoteGroup[]>([]);

  // Input state
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>('notCompleted');
  const [selectedTypes, setSelectedTypes] = useState<NoteType[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [isSortedByType, setIsSortedByType] = useState(false);

  // UI state
  const [isCompact, setIsCompact] = useState(true);
  const [isMicro, setIsMicro] = useState(false);
  const [isViewAll, setIsViewAll] = useState(true);
  const [dateViewStates, setDateViewStates] = useState<Record<string, DateViewState>>({});

  // Tag state
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [suggestionActiveIndex, setSuggestionActiveIndex] = useState(0);
  const [suggestionSource, setSuggestionSource] = useState<SuggestionSource>(null);

  // Persistence states
  const [lastUsedTag, setLastUsedTagState] = useState<string | null>(() => {
    return localStorage.getItem('twentyfourseven-last-tag');
  });
  const [lastUsedType, setLastUsedTypeState] = useState<NoteType>(() => {
    return (localStorage.getItem('twentyfourseven-last-type') as NoteType) || 'text';
  });

  const setLastUsedTag = useCallback((tag: string | null) => {
    setLastUsedTagState(tag);
    if (tag) {
      localStorage.setItem('twentyfourseven-last-tag', tag);
    } else {
      localStorage.removeItem('twentyfourseven-last-tag');
    }
  }, []);

  const setLastUsedType = useCallback((type: NoteType) => {
    setLastUsedTypeState(type);
    localStorage.setItem('twentyfourseven-last-type', type);
  }, []);

  // Active Type Calculation
  const activeType = useMemo(() => {
    const { type } = processNoteContent(newNote);
    if (type !== 'text') return type;
    return lastUsedType;
  }, [newNote, lastUsedType]);

  // Selection state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Menu state
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  const [activeTypeMenu, setActiveTypeMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<{ noteId: string; subId: string | number; oldText: string; url: string; title: string } | null>(null);

  // Visual state
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [isAddInputFocused, setIsAddInputFocused] = useState(false);

  // Refs
  const initialRender = useRef(true);
  const addNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch all notes from localStorage
  const fetchAllNotes = useCallback((): NoteGroup[] => {
    const allNotes: NoteGroup[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('twentyfourseven-notes-')) {
        const parts = key.replace('twentyfourseven-notes-', '').split('-');
        const noteYear = parseInt(parts[0]);
        const noteMonth = parseInt(parts[1]);
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const entries = Object.entries(parsed as Record<number, NoteItem[]>);
            entries.forEach(([day, items]) => {
              const processedItems = items.map((item: NoteItem) => {
                const processed = processNoteContent(item.content);
                const shouldPreserve = item.type === 'todo' || item.type === 'important';
                return {
                  ...item,
                  type: shouldPreserve ? item.type : processed.type
                };
              });
              allNotes.push({
                date: new Date(noteYear, noteMonth, parseInt(day)),
                notes: processedItems
              });
            });
          }
        } catch (e) {
          console.error('Failed to parse notes:', e);
        }
      }
    }
    return allNotes.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []);

  // Initialize notes from localStorage
  useEffect(() => {
    const key = `twentyfourseven-notes-${year}-${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotes({});
        } else {
          const processed = Object.fromEntries(
            Object.entries(parsed as Record<number, NoteItem[]>).map(([day, items]) => [
              day,
              items.map((item: NoteItem) => {
                const result = processNoteContent(item.content);
                const shouldPreserve = item.type === 'todo' || item.type === 'important';
                return {
                  ...item,
                  type: shouldPreserve ? item.type : result.type
                };
              })
            ])
          );
          setNotes(processed);
        }
      } catch (e) {
        setNotes({});
      }
    } else {
      setNotes({});
    }
  }, [year, month]);

  useEffect(() => {
    setAllTimeNotes(fetchAllNotes());
  }, [fetchAllNotes]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (activeCell) {
      setIsViewAll(false);
    }
  }, [activeCell]);

  // Calculate all tags
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    allTimeNotes.forEach(group => {
      group.notes.forEach(note => {
        extractTags(note.content).forEach(tag => {
          const upperTag = tag.toUpperCase();
          counts.set(upperTag, (counts.get(upperTag) || 0) + 1);
        });
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allTimeNotes]);

  // Calculate dates with notes
  const datesWithNotes = useMemo(() => {
    const dates = new Set<string>();
    allTimeNotes.forEach(item => {
      if (item.notes.length > 0) {
        dates.add(`${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`);
      }
    });
    return dates;
  }, [allTimeNotes]);

  // Handle date change
  const handleDateChange = useCallback((date: Date) => {
    setActiveCell({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: 0
    });
  }, [setActiveCell]);

  // Check for tag suggestions
  const checkTagSuggestions = useCallback((text: string, cursor: number, source: 'add' | 'edit') => {
    const beforeCursor = text.slice(0, cursor);
    const hashIndex = beforeCursor.lastIndexOf('#');
    if (hashIndex === -1 || beforeCursor.slice(hashIndex).includes(' ')) {
      setSuggestionSource(null);
      setTagSuggestions([]);
      return;
    }
    const partial = beforeCursor.slice(hashIndex + 1).toLowerCase();
    const matches = allTags
      .map(([t]) => t.replace('#', ''))
      .filter(t => t.toLowerCase().startsWith(partial) && t.toLowerCase() !== partial)
      .slice(0, 5);
    if (matches.length > 0) {
      setTagSuggestions(matches);
      setSuggestionActiveIndex(0);
      setSuggestionSource(source);
    } else {
      setSuggestionSource(null);
      setTagSuggestions([]);
    }
  }, [allTags]);

  // Insert tag from suggestions
  const insertTag = useCallback((tag: string) => {
    const isAdd = suggestionSource === 'add';
    const text = isAdd ? newNote : editContent;
    const textarea = isAdd ? addNoteInputRef.current : document.activeElement;
    if (textarea && textarea instanceof HTMLTextAreaElement) {
      const cursor = textarea.selectionStart;
      const beforeCursor = text.slice(0, cursor);
      const matchIndex = beforeCursor.lastIndexOf('#');
      if (matchIndex !== -1) {
        const newText = text.slice(0, matchIndex) + '#' + tag + ' ' + text.slice(cursor);
        if (isAdd) setNewNote(newText); else setEditContent(newText);
        setSuggestionSource(null);
        setTimeout(() => {
          textarea.focus();
          const newCursor = matchIndex + 1 + tag.length + 1;
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
      }
    }
  }, [suggestionSource, newNote, editContent]);

  // Handle adding a new note
  const handleAddNote = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && newNote.trim()) {
      e.preventDefault();

      let day: number, targetYear: number, targetMonth: number;

      if (activeCell) {
        day = activeCell.day;
        targetYear = activeCell.year;
        targetMonth = activeCell.month;
      } else {
        const now = new Date();
        day = now.getDate();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
      }

      const input = newNote.trim();
      let { content } = processNoteContent(input); // Detect content cleaning only

      // Use activeType for the type
      const type = activeType;

      // Auto-add active filter tag OR last used tag if enabled/logic'd
      const tagToAdd = selectedTag || lastUsedTag;
      if (tagToAdd && !content.toUpperCase().includes(tagToAdd.toUpperCase())) {
        // Only add if we're not using selectedTag (which handles filtering) 
        // or if we decide lastUsedTag should strictly be added. 
        // The prompt says "make the shown tag is last used tags".
        // Let's defer to selectedTag if present, else lastUsedTag.
        content = `${tagToAdd} ${content}`;
      }

      // Update lastUsedTag if the new content has tags
      const currentTags = extractTags(content);
      if (currentTags.length > 0) {
        setLastUsedTag(currentTags[0]);
      }

      const newItem: NoteItem = {
        id: Math.random().toString(36).substr(2, 9),
        content,
        createdAt: new Date().toISOString(),
        type
      };

      const key = `twentyfourseven-notes-${targetYear}-${targetMonth}`;
      let currentMonthNotes: Record<number, NoteItem[]> = {};

      if (targetYear === year && targetMonth === month) {
        currentMonthNotes = { ...notes };
      } else {
        try {
          const saved = localStorage.getItem(key);
          currentMonthNotes = saved ? JSON.parse(saved) : {};
        } catch (e) {
          currentMonthNotes = {};
        }
      }

      const updatedNotes = {
        ...currentMonthNotes,
        [day]: [...(currentMonthNotes[day] || []), newItem]
      };

      localStorage.setItem(key, JSON.stringify(updatedNotes));

      if (targetYear === year && targetMonth === month) {
        setNotes(updatedNotes);
      }

      setNewNote('');
      setAllTimeNotes(fetchAllNotes());
      triggerUpdate();

      setTimeout(() => {
        const targetId = `note-${newItem.id}`;
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setNewlyAddedIds(prev => new Set(prev).add(newItem.id));
        setTimeout(() => {
          setNewlyAddedIds(prev => {
            const next = new Set(prev);
            next.delete(newItem.id);
            return next;
          });
        }, 1000);
      }, 100);

      if (e.target instanceof HTMLTextAreaElement) {
        e.target.style.height = 'auto';
      }
    }
  }, [newNote, activeCell, selectedTag, lastUsedTag, activeType, year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle starting edit
  const handleStartEdit = useCallback((note: NoteItem) => {
    setEditingId(note.id);
    setEditContent(note.content);
  }, []);

  // Handle saving edit
  const handleSaveEdit = useCallback((date: Date, noteId: string) => {
    if (!editContent.trim()) {
      setEditingId(null);
      return;
    }

    const { type, content } = processNoteContent(editContent.trim());
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n => {
      if (n.id === noteId) {
        const shouldPreserve = n.type === 'todo' || n.type === 'important';
        return { ...n, content, type: shouldPreserve ? n.type : type, updatedAt: new Date().toISOString() };
      }
      return n;
    });

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setEditingId(null);
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [editContent, year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle toggling todo status
  const handleToggleTodo = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n => {
      if (n.id === noteId) {
        const newIsDone = !n.isDone;
        return {
          ...n,
          isDone: newIsDone,
          completedAt: newIsDone ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return n;
    });

    setTransitioningIds(prev => new Set(prev).add(noteId));

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();

    setTimeout(() => {
      setTransitioningIds(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }, 300);
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle toggling pin status
  const handleTogglePin = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
    );

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle setting note type
  const handleSetType = useCallback((date: Date, noteId: string, type: NoteType) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n =>
      n.id === noteId ? { ...n, type, updatedAt: new Date().toISOString() } : n
    );

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setActiveTypeMenu(null);
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle deleting note (soft delete)
  const handleDeleteNote = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n =>
      n.id === noteId ? { ...n, deletedAt: new Date().toISOString() } : n
    );

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle batch delete
  const handleBatchDelete = useCallback(() => {
    if (selectedNoteIds.size === 0) return;

    allTimeNotes.forEach(group => {
      const notesToDelete = group.notes.filter(n => selectedNoteIds.has(n.id));
      if (notesToDelete.length === 0) return;

      const key = `twentyfourseven-notes-${group.date.getFullYear()}-${group.date.getMonth()}`;
      const day = group.date.getDate();

      let currentNotes: Record<number, NoteItem[]>;
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }

      const dayNotes = currentNotes[day] || [];
      const updatedDayNotes = dayNotes.map(n =>
        selectedNoteIds.has(n.id) ? { ...n, deletedAt: new Date().toISOString() } : n
      );

      const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
      localStorage.setItem(key, JSON.stringify(updatedNotes));

      if (group.date.getFullYear() === year && group.date.getMonth() === month) {
        setNotes(updatedNotes);
      }
    });

    setIsSelectMode(false);
    setSelectedNoteIds(new Set());
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [selectedNoteIds, allTimeNotes, year, month, fetchAllNotes, triggerUpdate]);

  // Handle batch merge
  const handleBatchMerge = useCallback(() => {
    if (selectedNoteIds.size < 2) return;

    const selectedNotes: { note: NoteItem; date: Date }[] = [];
    allTimeNotes.forEach(group => {
      group.notes.forEach(note => {
        if (selectedNoteIds.has(note.id)) {
          selectedNotes.push({ note, date: group.date });
        }
      });
    });

    if (selectedNotes.length < 2) return;

    // Sort by creation date
    selectedNotes.sort((a, b) =>
      new Date(a.note.createdAt).getTime() - new Date(b.note.createdAt).getTime()
    );

    const mergedContent = selectedNotes.map(sn => sn.note.content).join('\n');
    const firstNoteData = selectedNotes[0];
    const secondaryNotes = selectedNotes.slice(1);

    // Group actions by localStorage key (Month)
    const updatesByKey: Record<string, {
      updateContent?: { id: string, content: string },
      deletions: Set<string>
    }> = {};

    // Helper to get key
    const getKey = (date: Date) => `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;

    // Plan update for first note
    const firstKey = getKey(firstNoteData.date);
    if (!updatesByKey[firstKey]) updatesByKey[firstKey] = { deletions: new Set() };
    updatesByKey[firstKey].updateContent = { id: firstNoteData.note.id, content: mergedContent };

    // Plan deletions for others
    secondaryNotes.forEach(({ note, date }) => {
      const key = getKey(date);
      if (!updatesByKey[key]) updatesByKey[key] = { deletions: new Set() };
      updatesByKey[key].deletions.add(note.id);
    });

    // Execute updates
    Object.entries(updatesByKey).forEach(([key, actions]) => {
      let currentNotes: Record<number, NoteItem[]>;
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }

      let hasChanges = false;
      const days = Object.keys(currentNotes).map(Number);

      days.forEach(day => {
        const dayNotes = currentNotes[day];
        const updatedDayNotes = dayNotes.map(n => {
          // Check for content update
          if (actions.updateContent && n.id === actions.updateContent.id) {
            hasChanges = true;
            return { ...n, content: actions.updateContent.content, updatedAt: new Date().toISOString() };
          }
          // Check for deletion
          if (actions.deletions.has(n.id)) {
            hasChanges = true;
            return { ...n, deletedAt: new Date().toISOString() };
          }
          return n;
        });
        currentNotes[day] = updatedDayNotes;
      });

      if (hasChanges) {
        localStorage.setItem(key, JSON.stringify(currentNotes));

        // Update state if this is the current view
        // Note: key was constructed as `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`
        // So split by '-' gives ["twentyfourseven", "notes", "YYYY", "MM"]
        const parts = key.split('-');
        const y = parseInt(parts[2]);
        const m = parseInt(parts[3]);

        if (y === year && m === month) {
          setNotes(currentNotes);
        }
      }
    });

    setIsSelectMode(false);
    setSelectedNoteIds(new Set());
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [selectedNoteIds, allTimeNotes, year, month, fetchAllNotes, triggerUpdate]);

  // Handle restoring note
  const handleRestoreNote = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n =>
      n.id === noteId ? { ...n, deletedAt: undefined, updatedAt: new Date().toISOString() } : n
    );

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle permanent delete
  const handlePermanentDelete = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.filter(n => n.id !== noteId);

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle empty bin
  const handleEmptyBin = useCallback(() => {
    allTimeNotes.forEach(group => {
      const deletedNotes = group.notes.filter(n => n.deletedAt);
      if (deletedNotes.length === 0) return;

      const key = `twentyfourseven-notes-${group.date.getFullYear()}-${group.date.getMonth()}`;
      const day = group.date.getDate();

      let currentNotes: Record<number, NoteItem[]>;
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }

      const dayNotes = currentNotes[day] || [];
      const updatedDayNotes = dayNotes.filter(n => !n.deletedAt);

      const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
      localStorage.setItem(key, JSON.stringify(updatedNotes));

      if (group.date.getFullYear() === year && group.date.getMonth() === month) {
        setNotes(updatedNotes);
      }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [allTimeNotes, year, month, fetchAllNotes, triggerUpdate]);

  // Handle restore all
  const handleRestoreAll = useCallback(() => {
    allTimeNotes.forEach(group => {
      const deletedNotes = group.notes.filter(n => n.deletedAt);
      if (deletedNotes.length === 0) return;

      const key = `twentyfourseven-notes-${group.date.getFullYear()}-${group.date.getMonth()}`;
      const day = group.date.getDate();

      let currentNotes: Record<number, NoteItem[]>;
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }

      const dayNotes = currentNotes[day] || [];
      const updatedDayNotes = dayNotes.map(n => ({ ...n, deletedAt: undefined, updatedAt: new Date().toISOString() }));

      const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
      localStorage.setItem(key, JSON.stringify(updatedNotes));

      if (group.date.getFullYear() === year && group.date.getMonth() === month) {
        setNotes(updatedNotes);
      }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [allTimeNotes, year, month, fetchAllNotes, triggerUpdate]);

  // Handle unpin all
  const handleUnpinAll = useCallback(() => {
    allTimeNotes.forEach(group => {
      const pinnedNotes = group.notes.filter(n => n.isPinned && !n.deletedAt);
      if (pinnedNotes.length === 0) return;

      const key = `twentyfourseven-notes-${group.date.getFullYear()}-${group.date.getMonth()}`;
      const day = group.date.getDate();

      let currentNotes: Record<number, NoteItem[]>;
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }

      const dayNotes = currentNotes[day] || [];
      const updatedDayNotes = dayNotes.map(n => ({ ...n, isPinned: false, updatedAt: new Date().toISOString() }));

      const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
      localStorage.setItem(key, JSON.stringify(updatedNotes));

      if (group.date.getFullYear() === year && group.date.getMonth() === month) {
        setNotes(updatedNotes);
      }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [allTimeNotes, year, month, fetchAllNotes, triggerUpdate]);

  // Handle splitting a note
  const handleSplitNote = useCallback((date: Date, noteId: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    try {
      currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      currentNotes = {};
    }

    const dayNotes = currentNotes[day] || [];
    const noteToSplit = dayNotes.find(n => n.id === noteId);

    if (!noteToSplit) return;

    // Split content by newlines and filter out empty lines
    const contentParts = noteToSplit.content.split('\n')
      .map(part => part.trim())
      .filter(part => part.length > 0);

    if (contentParts.length <= 1) return; // Nothing to split

    const newNotes: NoteItem[] = [];
    const timestamp = new Date().toISOString();

    // Create new notes for secondary parts
    contentParts.slice(1).forEach(part => {
      const { type, content } = processNoteContent(part);
      newNotes.push({
        id: Math.random().toString(36).substr(2, 9),
        content,
        type: type, // Or inherit from parent? processing it seems safer
        createdAt: timestamp,
        updatedAt: timestamp,
        isDone: noteToSplit.isDone, // Inherit state? Optional. Let's inherit completion but maybe not pinned
        isPinned: noteToSplit.isPinned
      });
    });

    // Update the original note with the first part
    const updatedDayNotes = dayNotes.flatMap(n => {
      if (n.id === noteId) {
        const { type, content } = processNoteContent(contentParts[0]);
        const firstPartNote = {
          ...n,
          content,
          type: n.type === 'todo' || n.type === 'important' ? n.type : type, // Preserve manual types
          updatedAt: timestamp
        };
        // Return original (updated) + new notes
        return [firstPartNote, ...newNotes];
      }
      return [n];
    });

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();

    // Flash animation for all new IDs including original
    const allIds = [noteId, ...newNotes.map(n => n.id)];
    allIds.forEach(id => {
      setNewlyAddedIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        setNewlyAddedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1000);
    });

  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle toggle select
  const handleToggleSelect = useCallback((noteId: string) => {
    setSelectedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

  // Handle update note content
  const handleUpdateNoteContent = useCallback((date: Date, noteId: string, newContent: string) => {
    const key = `twentyfourseven-notes-${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    let currentNotes: Record<number, NoteItem[]>;
    if (date.getFullYear() === year && date.getMonth() === month) {
      currentNotes = { ...notes };
    } else {
      try {
        currentNotes = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        currentNotes = {};
      }
    }

    const dayNotes = currentNotes[day] || [];
    const updatedDayNotes = dayNotes.map(n =>
      n.id === noteId ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n
    );

    const updatedNotes = { ...currentNotes, [day]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (date.getFullYear() === year && date.getMonth() === month) {
      setNotes(updatedNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  }, [year, month, notes, fetchAllNotes, triggerUpdate]);

  // Handle toggle inline checkbox
  const handleToggleInlineCheckbox = useCallback((note: NoteItem, date: Date, lineIndex: number) => {
    const lines = note.content.split('\n');
    const line = lines[lineIndex];
    const match = line.match(/^(\s*)\[(\s|x|X)?\](.*)/);
    if (match) {
      const val = (match[2] || '').toLowerCase();
      const newVal = val === 'x' ? ' ' : 'x';
      lines[lineIndex] = `${match[1]}[${newVal}]${match[3]}`;
      handleUpdateNoteContent(date, note.id, lines.join('\n'));
    }
  }, [handleUpdateNoteContent]);

  // Handle save link
  const handleSaveLink = useCallback((note: NoteItem, date: Date, newTitle: string, newUrl: string) => {
    if (!editingLink) return;

    const newMarkdown = `[${newTitle}](${newUrl})`;
    const updatedContent = note.content.replace(editingLink.oldText, newMarkdown);

    handleUpdateNoteContent(date, note.id, updatedContent);
    setEditingLink(null);
  }, [editingLink, handleUpdateNoteContent]);

  // Highlight search text
  const highlightSearchText = useCallback((text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-inherit rounded px-0.5">{part}</mark>
      ) : part
    );
  }, [searchQuery]);

  // Export all return values
  return {
    // Core state
    notes,
    allTimeNotes,
    activeCell,

    // Input state
    newNote,
    setNewNote,
    editingId,
    setEditingId,
    editContent,
    setEditContent,

    // Search/filter state
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

    // UI state
    isCompact,
    setIsCompact,
    isMicro,
    setIsMicro,
    isViewAll,
    setIsViewAll,
    dateViewStates,
    setDateViewStates,

    // Tag state
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

    // Selection state
    isSelectMode,
    setIsSelectMode,
    selectedNoteIds,
    setSelectedNoteIds,

    // Menu state
    activeContextMenu,
    setActiveContextMenu,
    activeTypeMenu,
    setActiveTypeMenu,
    confirmDeleteId,
    setConfirmDeleteId,
    editingLink,
    setEditingLink,

    // Visual state
    transitioningIds,
    copyingIds,
    setCopyingIds,
    newlyAddedIds,
    isAddInputFocused,
    setIsAddInputFocused,

    // Computed
    datesWithNotes,

    // Refs
    addNoteInputRef,
    listRef,

    // Handlers
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
    handleUpdateNoteContent,
    handleToggleInlineCheckbox,
    handleSaveLink,
    highlightSearchText,
    handleSplitNote,
    fetchAllNotes,
    setActiveCell,
    triggerUpdate,
    activeType,
    lastUsedType,
    setLastUsedType,
  };
};
