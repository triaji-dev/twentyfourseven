import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { NoteItem, NoteType } from '../types';
import { processNoteContent, extractTags } from '../utils/notes';
import { DateNavigator } from './DateNavigator';
import { X, Search, Type, CheckSquare, AlertCircle, Link as LinkIcon, Square, CalendarArrowDown, Copy, Check, Trash, Pencil, Loader2, Pin, PinOff, Trash2, RefreshCcw, ChevronDown, CheckCircle2, MoreVertical, Calendar, Hash, Layers, ListChecks, Rows4, Rows3, Rows2, Grid, List, CheckCheck } from 'lucide-react';

const NOTE_TYPES: Record<NoteType, { color: string; label: string; icon: any }> = {
  text: { color: '#a3a3a3', label: 'Text', icon: Type },
  link: { color: '#a0c4ff', label: 'Link', icon: LinkIcon },
  todo: { color: '#fdffb6', label: 'Todo', icon: CheckSquare },
  important: { color: '#f87171', label: 'Important', icon: AlertCircle }
};

// Priority for sorting: lower number = higher priority
const TYPE_PRIORITY: Record<NoteType, number> = {
  important: 0,
  todo: 1,
  link: 2,
  text: 3
};



interface NotesProps {
  year: number;
  month: number;
}

const LinkEditForm = ({ initialTitle, initialUrl, onSave, onCancel }: { initialTitle: string; initialUrl: string; onSave: (t: string, u: string) => void; onCancel: () => void }) => {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-fetch if title is empty and we have a valid-looking URL
    if (url && !initialTitle && !title && url.match(/^https?:\/\//)) {
      fetchTitle(url);
    }
  }, []);

  const fetchTitle = async (targetUrl: string) => {
    setLoading(true);
    try {
      // Priority 1: Noembed (Great for YouTube, Vimeo, etc. and CORS friendly)
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`);
      const noembedData = await noembedRes.json();
      if (noembedData.title) {
        setTitle(noembedData.title);
        return;
      }
    } catch (e) {
      // Try generic fallback
    }

    try {
      // Priority 2: Microlink
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data.status === 'success' && data.data.title) {
        setTitle(data.data.title);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 bg-[#171717] border border-[#262626] rounded px-1.5 py-0.5 align-middle" onClick={e => e.stopPropagation()}>
      <div className="relative">
        <input
          autoFocus
          className={`bg-[#262626] text-[10px] text-[#e5e5e5] placeholder-[#525252] outline-none w-20 rounded-sm px-1 border-none ${loading ? 'pr-4' : ''}`}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter') onSave(title, url);
            if (e.key === 'Escape') onCancel();
          }}
        />
        {loading && <Loader2 size={8} className="absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-[#737373]" />}
      </div>
      <input
        className="bg-transparent text-[10px] text-[#737373] placeholder-[#525252] outline-none w-24 border-b border-[#262626] focus:border-[#404040]"
        placeholder="URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onBlur={() => {
          if (url && !title && url !== initialUrl) fetchTitle(url);
        }}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter') onSave(title, url);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button onClick={onCancel} className="text-[#737373] hover:text-[#e5e5e5]"><X size={10} /></button>
      <button
        onClick={() => onSave(title, url)}
        className="text-green-500 hover:text-green-400"
      ><Check size={10} /></button>
    </span>
  );
};

export const Notes: React.FC<NotesProps> = ({ year, month }) => {
  const activeCell = useStore((state) => state.activeCell);
  const setActiveCell = useStore((state) => state.setActiveCell);
  const triggerUpdate = useStore((state) => state.triggerUpdate);

  // State
  const [notes, setNotes] = useState<Record<number, NoteItem[]>>({});
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTimeNotes, setAllTimeNotes] = useState<Array<{ date: Date; notes: NoteItem[] }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(true);
  const [isMicro, setIsMicro] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<'all' | 'notCompleted'>('notCompleted');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [isViewAll, setIsViewAll] = useState(true);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [suggestionActiveIndex, setSuggestionActiveIndex] = useState(0);
  const [suggestionSource, setSuggestionSource] = useState<'add' | 'edit' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [isSortedByType, setIsSortedByType] = useState(true);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false); // Recycle Bin State
  const [selectedTypes, setSelectedTypes] = useState<NoteType[]>([]); // New state for type filtering
  const [editingLink, setEditingLink] = useState<{ noteId: string; subId: string | number; oldText: string; url: string; title: string } | null>(null);
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  const [lastUsedTag, setLastUsedTag] = useState<string | null>(null);
  const [isAddInputFocused, setIsAddInputFocused] = useState(false);
  const [activeTypeMenu, setActiveTypeMenu] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  const initialRender = useRef(true);
  const addNoteInputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);



  // Helper to fetch all notes
  const fetchAllNotes = () => {
    const all: Array<{ date: Date; notes: NoteItem[] }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('twentyfourseven-notes-')) {
        const parts = key.split('-'); // prefix-notes-year-month
        const y = parseInt(parts[2]);
        const m = parseInt(parts[3]);
        try {
          const monthNotes = JSON.parse(localStorage.getItem(key) || '{}');
          Object.entries(monthNotes).forEach(([d, dayNotes]) => {
            const items = (dayNotes as NoteItem[]).map(note => {
              const { type, content } = processNoteContent(note.content, note.type);
              return { ...note, type, content };
            });
            if (items.length > 0) {
              all.push({
                date: new Date(y, m, parseInt(d)),
                notes: items
              });
            }
          });
        } catch (e) {
          // ignore error
        }
      }
    }
    // Sort descending by date
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  useEffect(() => {
    const key = `twentyfourseven-notes-${year}-${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotes({});
        } else {
          // Apply auto-detection for links
          const processed = { ...parsed };
          Object.keys(processed).forEach(key => {
            const day = parseInt(key);
            if (Array.isArray(processed[day])) {
              processed[day] = processed[day].map((note: NoteItem) => {
                const { type, content } = processNoteContent(note.content, note.type);
                return { ...note, type, content };
              });
            }
          });
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
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (tagMenuOpen) {
        if (!target.closest('.tag-filter-menu')) {
          setTagMenuOpen(false);
        }
      }
      if (confirmDeleteId) {
        if (!target.closest(`[data-delete-confirm="${confirmDeleteId}"]`) && !target.closest(`[data-delete-trigger="${confirmDeleteId}"]`)) {
          setConfirmDeleteId(null);
        }
      }
      if (activeContextMenu) {
        if (!target.closest('.note-context-menu')) {
          setActiveContextMenu(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagMenuOpen, confirmDeleteId, activeContextMenu]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (activeCell) {
      setIsViewAll(false);
    }
  }, [activeCell]);

  // Auto-cleanup Recycle Bin (older than 7 days)
  useEffect(() => {
    const cleanup = () => {
      const cleanupKeys = Object.keys(localStorage).filter(k => k.startsWith('twentyfourseven-notes-'));
      const now = new Date();
      let changed = false;

      cleanupKeys.forEach(key => {
        try {
          const saved = JSON.parse(localStorage.getItem(key) || '{}');
          let monthChanged = false;
          Object.keys(saved).forEach(day => {
            const dayNotes = saved[day];
            const validNotes = dayNotes.filter((n: NoteItem) => {
              if (n.deletedAt) {
                const diff = now.getTime() - new Date(n.deletedAt).getTime();
                const days = diff / (1000 * 3600 * 24);
                return days < 7;
              }
              return true;
            });
            if (validNotes.length !== dayNotes.length) {
              saved[day] = validNotes;
              if (validNotes.length === 0) delete saved[day];
              monthChanged = true;
            }
          });
          if (monthChanged) {
            localStorage.setItem(key, JSON.stringify(saved));
            changed = true;
          }
        } catch (e) { }
      });
      if (changed) {
        setAllTimeNotes(fetchAllNotes());
        triggerUpdate();
      }
    };
    cleanup();
  }, []);



  const handleDateChange = (date: Date) => {
    if (activeCell) {
      setActiveCell({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: activeCell.hour
      });
    }
  };

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    allTimeNotes.forEach(group => {
      group.notes.forEach(note => {
        extractTags(note.content).forEach(tag => {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      });
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allTimeNotes]);


  const newNoteMetadata = useMemo(() => {
    // 1. Target Date
    let dateStr = "Today";
    if (activeCell) {
      dateStr = new Date(activeCell.year, activeCell.month, activeCell.day).toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // 2. Detected Type
    const firstLine = newNote.trim().split('\n')[0] || "";
    const { type: detectedType } = processNoteContent(firstLine);

    // 3. Tags (Filter tag + tags in content)
    const contentTags = extractTags(newNote);
    const resultTags = [...new Set(selectedTag ? [selectedTag.toUpperCase(), ...contentTags] : contentTags)];

    return { dateStr, type: detectedType, tags: resultTags };
  }, [activeCell, newNote, selectedTag]);

  const datesWithNotes = useMemo(() => {
    const dates = new Set<string>();
    allTimeNotes.forEach(item => {
      if (item.notes.length > 0) {
        dates.add(`${item.date.getFullYear()}-${item.date.getMonth()}-${item.date.getDate()}`);
      }
    });
    return dates;
  }, [allTimeNotes]);

  useEffect(() => {
    if (suggestionSource === 'edit' && tagSuggestions.length > 0 && listRef.current) {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && listRef.current?.contains(activeEl)) {
          const rect = activeEl.getBoundingClientRect();
          const containerRect = listRef.current.getBoundingClientRect();
          const dropdownHeight = 160;
          const spaceBelow = containerRect.bottom - rect.bottom;
          if (spaceBelow < dropdownHeight) {
            listRef.current.scrollBy({ top: dropdownHeight - spaceBelow + 20, behavior: 'smooth' });
          }
        }
      }, 50);
    }
  }, [suggestionSource, tagSuggestions.length]);

  const checkTagSuggestions = (text: string, cursor: number, source: 'add' | 'edit') => {
    const textBefore = text.slice(0, cursor);
    const match = textBefore.match(/(?:^|\s)#([\w]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const available = allTags.map(t => t[0].startsWith('#') ? t[0].slice(1) : t[0]);
      const filtered = available.filter(t => t.toLowerCase().startsWith(query));
      if (filtered.length > 0) {
        setTagSuggestions(filtered);
        setSuggestionActiveIndex(0);
        setSuggestionSource(source);
        return;
      }
    }
    setSuggestionSource(null);
  };

  const insertTag = (tag: string) => {
    const isAdd = suggestionSource === 'add';
    const text = isAdd ? newNote : editContent;
    const textarea = isAdd ? addNoteInputRef.current : document.activeElement as HTMLTextAreaElement;

    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBefore = text.slice(0, cursor);
    const matchIndex = textBefore.lastIndexOf('#');

    if (matchIndex >= 0) {
      const newText = text.slice(0, matchIndex) + '#' + tag.toUpperCase() + ' ' + text.slice(cursor);
      if (isAdd) setNewNote(newText); else setEditContent(newText);
      setSuggestionSource(null);
      setTimeout(() => {
        textarea.focus();
        const newCursor = matchIndex + 1 + tag.length + 1;
        textarea.setSelectionRange(newCursor, newCursor);
      }, 0);
    }
  };

  const handleAddNote = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      let entries: string[] = [];

      entries = [input];

      if (entries.length > 0) {
        const newItems: NoteItem[] = entries.map(entryContent => {
          let { type, content } = processNoteContent(entryContent);


          // Auto-add active filter tag
          if (selectedTag && !content.toUpperCase().includes(selectedTag.toUpperCase())) {
            content = `${selectedTag} ${content}`;
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            content,
            createdAt: new Date().toISOString(),
            type
          };
        });

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
          [day]: [...(currentMonthNotes[day] || []), ...newItems]
        };

        localStorage.setItem(key, JSON.stringify(updatedNotes));

        if (targetYear === year && targetMonth === month) {
          setNotes(updatedNotes);
        }

        setNewNote('');
        setAllTimeNotes(fetchAllNotes());
        triggerUpdate();
        triggerUpdate();
        setTimeout(() => {
          const targetId = `note-${newItems[0].id}`;
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          setNewlyAddedIds(prev => {
            const next = new Set(prev);
            newItems.forEach(n => next.add(n.id));
            return next;
          });
          setTimeout(() => {
            setNewlyAddedIds(prev => {
              const next = new Set(prev);
              newItems.forEach(n => next.delete(n.id));
              return next;
            });
          }, 1000);

        }, 100);

        if (e.target instanceof HTMLTextAreaElement) {
          e.target.style.height = 'auto';
        }
      }
    }
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (date: Date, noteId: string) => {
    if (!editContent.trim()) {
      setEditingId(null);
      return;
    }

    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => {
      if (n.id === noteId) {
        const { type, content } = processNoteContent(editContent, n.type);
        return { ...n, content, type };
      }
      return n;
    });

    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    setEditingId(null);
  };



  const handleToggleTodo = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    const note = dayNotes.find(n => n.id === noteId);

    if (note && !note.isDone) {
      setTransitioningIds(prev => {
        const next = new Set(prev);
        next.add(noteId);
        return next;
      });
      setTimeout(() => {
        setTransitioningIds(prev => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      }, 500);
    } else if (note && note.isDone) {
      // Optionally handle un-completing transition if needed, 
      // but usually instant is fine for un-checking.
    }

    const updatedDayNotes = dayNotes.map((n: NoteItem) => {
      if (n.id === noteId) {
        const newIsDone = !n.isDone;
        return {
          ...n,
          isDone: newIsDone,
          completedAt: newIsDone ? new Date().toISOString() : undefined
        };
      }
      return n;
    });
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };



  const handleTogglePin = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n);
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleSetType = (date: Date, noteId: string, type: NoteType) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) { }

    const dayNotes = monthNotes[d] || [];

    const updatedDayNotes = dayNotes.map((n: NoteItem) => {
      if (n.id === noteId) {
        return { ...n, type };
      }
      return n;
    });

    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) setNotes(updatedMonthNotes);
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    setActiveTypeMenu(null);
  };

  const handleDeleteNote = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    // Soft Delete: Mark as deletedAt
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, deletedAt: new Date().toISOString() } : n);

    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };

    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleBatchDelete = () => {
    if (selectedNoteIds.size === 0) return;

    // Group selected notes by month key
    const allNotesMap = fetchAllNotes(); // Returns Array<{date: Date, notes: NoteItem[]}>
    const toDelete = new Map<string, { date: Date, ids: Set<string> }>();

    allNotesMap.forEach(dayGroup => {
      dayGroup.notes.forEach(note => {
        if (selectedNoteIds.has(note.id)) {
          const key = `twentyfourseven-notes-${dayGroup.date.getFullYear()}-${dayGroup.date.getMonth()}`;
          if (!toDelete.has(key)) {
            toDelete.set(key, { date: dayGroup.date, ids: new Set() });
          }
          toDelete.get(key)!.ids.add(note.id);
        }
      });
    });

    toDelete.forEach((info, key) => {
      let monthNotes: Record<number, NoteItem[]> = {};
      try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
      } catch (e) { }

      Object.keys(monthNotes).forEach(dStr => {
        const d = parseInt(dStr);
        monthNotes[d] = monthNotes[d].map(n =>
          info.ids.has(n.id) ? { ...n, deletedAt: new Date().toISOString() } : n
        );
      });

      localStorage.setItem(key, JSON.stringify(monthNotes));
      if (info.date.getFullYear() === year && info.date.getMonth() === month) {
        setNotes(monthNotes);
      }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    setSelectedNoteIds(new Set());
    setIsSelectMode(false);
  };

  const handleRestoreNote = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, deletedAt: undefined } : n);
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handlePermanentDelete = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try {
      const saved = localStorage.getItem(key);
      monthNotes = saved ? JSON.parse(saved) : {};
    } catch (e) {
      monthNotes = {};
    }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.filter((n: NoteItem) => n.id !== noteId);
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    if (updatedDayNotes.length === 0) {
      delete updatedMonthNotes[d];
    }
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) {
      setNotes(updatedMonthNotes);
    }
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleEmptyBin = () => {
    if (!window.confirm("Are you sure you want to permanently delete all currently visible items in the Recycle Bin? This cannot be undone.")) return;

    const notesByMonthKey: Record<string, string[]> = {};

    filteredNotes.forEach(group => {
      const y = group.date.getFullYear();
      const m = group.date.getMonth();
      const key = `twentyfourseven-notes-${y}-${m}`;
      if (!notesByMonthKey[key]) notesByMonthKey[key] = [];
      group.notes.forEach(n => notesByMonthKey[key].push(n.id));
    });

    Object.keys(notesByMonthKey).forEach(key => {
      try {
        const saved = localStorage.getItem(key);
        let monthNotes = saved ? JSON.parse(saved) : {};
        const idsToRemove = new Set(notesByMonthKey[key]);

        Object.keys(monthNotes).forEach(day => {
          monthNotes[day] = monthNotes[day].filter((n: NoteItem) => !idsToRemove.has(n.id));
          if (monthNotes[day].length === 0) delete monthNotes[day];
        });

        localStorage.setItem(key, JSON.stringify(monthNotes));
      } catch (e) { console.error(e); }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleRestoreAll = () => {
    if (!window.confirm("Restore all currently visible items from Recycle Bin?")) return;

    const notesByMonthKey: Record<string, string[]> = {};

    filteredNotes.forEach(group => {
      const y = group.date.getFullYear();
      const m = group.date.getMonth();
      const key = `twentyfourseven-notes-${y}-${m}`;
      if (!notesByMonthKey[key]) notesByMonthKey[key] = [];
      group.notes.forEach(n => notesByMonthKey[key].push(n.id));
    });

    Object.keys(notesByMonthKey).forEach(key => {
      try {
        const saved = localStorage.getItem(key);
        let monthNotes = saved ? JSON.parse(saved) : {};
        const idsToRestore = new Set(notesByMonthKey[key]);

        Object.keys(monthNotes).forEach(day => {
          monthNotes[day] = monthNotes[day].map((n: NoteItem) => idsToRestore.has(n.id) ? { ...n, deletedAt: undefined } : n);
        });

        localStorage.setItem(key, JSON.stringify(monthNotes));
      } catch (e) { console.error(e); }
    });

    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleToggleSelect = (noteId: string) => {
    setSelectedNoteIds(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };


  const handleSaveLink = (note: NoteItem, date: Date, newTitle: string, newUrl: string) => {
    if (!editingLink) return;

    let newContent = note.content;
    const { oldText } = editingLink;
    const newLinkText = `[${newTitle || newUrl}](${newUrl})`;

    newContent = newContent.replace(oldText, newLinkText);


    // Save to LocalStorage
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: any = {};
    try { monthNotes = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map((n: NoteItem) => {
      if (n.id === note.id) {
        const { type, content } = processNoteContent(newContent, n.type);
        return { ...n, content, type };
      }
      return n;
    });

    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));
    if (y === year && m === month) setNotes(updatedMonthNotes);
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();

    setEditingLink(null);
  };

  // Helper function to highlight search matches
  const highlightSearchText = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const startIndex = lowerText.indexOf(query);

    if (startIndex === -1) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentIndex = startIndex;

    while (currentIndex !== -1) {
      // Add text before the match
      if (currentIndex > lastIndex) {
        parts.push(text.slice(lastIndex, currentIndex));
      }
      // Add the highlighted match
      parts.push(
        <mark key={currentIndex} className="bg-yellow-500/30 text-inherit rounded px-0.5">
          {text.slice(currentIndex, currentIndex + query.length)}
        </mark>
      );
      lastIndex = currentIndex + query.length;
      currentIndex = lowerText.indexOf(query, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };
  const handleUpdateNoteContent = (date: Date, noteId: string, newContent: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    try { monthNotes = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { }

    const dayNotes = monthNotes[d] || [];
    const updatedDayNotes = dayNotes.map(n => n.id === noteId ? { ...n, content: newContent } : n);

    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));

    if (y === year && m === month) setNotes(updatedMonthNotes);
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleToggleInlineCheckbox = (note: NoteItem, date: Date, lineIndex: number) => {
    const lines = note.content.split('\n');
    const line = lines[lineIndex];
    const match = line.match(/^(\s*)\[(\s|x|X)?\]/);
    if (match) {
      const val = (match[2] || '').toLowerCase();
      const isChecked = val === 'x';
      const prefix = match[1];
      const newStatus = isChecked ? '[ ]' : '[x]';
      lines[lineIndex] = line.replace(/^(\s*)\[(\s|x|X)?\]/, `${prefix}${newStatus}`);
      handleUpdateNoteContent(date, note.id, lines.join('\n'));
    }
  };



  const renderNoteContent = (note: NoteItem, date: Date) => {
    if (isMicro) {
      const cleanContent = note.content
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          // Strip checkbox, bullet, number
          return line
            .replace(/^\[(\s|x|X)?\]\s*/, '')
            .replace(/^- \s*/, '')
            .replace(/^\d+\.\s*/, '');
        })
        .join(' • ');
      return <span className="opacity-60">{highlightSearchText(cleanContent)}</span>;
    }

    const lines = note.content.split('\n');
    const isTruncated = isCompact && !isMicro && lines.length > 3;
    const displayLines = isTruncated ? lines.slice(0, 3) : lines;

    const renderInlineText = (text: string, lineIndex: number) => {
      const regex = /((?:\[[^\]]+\]\((?:https?:\/\/|www\.)[^\)\s]+\))|(?:https?:\/\/|www\.)[^\s]+|#[\w\u0600-\u06FF]+)/g;
      // Append ellipsis if this is the last line of a truncated note
      const textWithEllipsis = (isTruncated && lineIndex === 2) ? text + "..." : text;
      const parts = textWithEllipsis.split(regex);

      return parts.map((part, i) => {
        if (!part) return null;
        const subId = `${lineIndex}-${i}`;
        const isEditing = editingLink?.noteId === note.id && editingLink?.subId === subId;

        if (isEditing) {
          return (
            <LinkEditForm
              key={i}
              initialTitle={editingLink.title}
              initialUrl={editingLink.url}
              onSave={(title, url) => handleSaveLink(note, date, title, url)}
              onCancel={() => setEditingLink(null)}
            />
          );
        }

        // Markdown Link [Title](Url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const title = linkMatch[1];
          const url = linkMatch[2];
          return (
            <span key={i} className="group/link inline-flex items-center gap-1 mx-0.5 align-middle bg-[#262626] px-1.5 py-0.5 rounded text-[10px] text-[#a0c4ff]">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[#a0c4ff] hover:underline ${isSelectMode ? 'pointer-events-none' : ''}`}
                onClick={(e) => !isSelectMode && e.stopPropagation()}
              >
                {highlightSearchText(title)}
              </a>
              {!isSelectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLink({
                      noteId: note.id,
                      subId: subId,
                      oldText: part,
                      url,
                      title
                    });
                  }}
                  className="opacity-0 group-hover/link:opacity-100 hover:text-white transition-opacity"
                >
                  <Pencil size={8} />
                </button>
              )}
            </span>
          );
        }

        // Raw URL
        if ((part.startsWith('http') || part.startsWith('www.')) && !part.startsWith('[')) {
          const url = part.startsWith('www.') ? `https://${part}` : part;
          let displayTitle = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
          if (displayTitle.length > 20) displayTitle = displayTitle.substring(0, 17) + '...';

          return (
            <span key={i} className="group/link inline-flex items-center gap-1 mx-0.5 align-middle bg-[#262626] px-1.5 py-0.5 rounded text-[10px] text-[#a0c4ff]">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline text-[#a0c4ff] ${isSelectMode ? 'pointer-events-none' : ''}`}
                onClick={(e) => !isSelectMode && e.stopPropagation()}
              >
                {highlightSearchText(displayTitle)} <span className="text-[#737373] opacity-50 text-[9px] ml-0.5">🔗</span>
              </a>
              {!isSelectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingLink({
                      noteId: note.id,
                      subId: subId,
                      oldText: part,
                      url: url,
                      title: displayTitle
                    });
                  }}
                  className="opacity-0 group-hover/link:opacity-100 hover:text-white transition-opacity"
                >
                  <Pencil size={8} />
                </button>
              )}
            </span>
          );
        }

        // Hashtag
        if (part.startsWith('#')) {
          return (
            <span
              key={i}
              onClick={(e) => {
                if (isSelectMode) return;
                e.stopPropagation();
                setSelectedTag(part.toUpperCase());
                setLastUsedTag(part.toUpperCase());
              }}
              className={`inline-flex items-center px-1.5 py-0 mx-0.5 text-[9px] font-medium rounded bg-[#262626] text-[#a0c4ff] transition-colors align-middle ${isSelectMode ? '' : 'hover:bg-[#3b82f6] hover:text-white cursor-pointer'} cursor-pointer`}
            >
              {highlightSearchText(part)}
            </span>
          );
        }

        // Plain text - apply search highlighting
        return <span key={i}>{highlightSearchText(part)}</span>;
      });
    };

    return (
      <div className="flex flex-col gap-0.5 w-full">
        {displayLines.map((line, index) => {
          // Checkbox
          const checkboxMatch = line.match(/^(\s*)\[(\s|x|X)?\]\s*(.*)/);
          if (checkboxMatch) {
            const val = (checkboxMatch[2] || '').toLowerCase();
            const isChecked = val === 'x';
            const content = checkboxMatch[3];
            return (
              <div key={index} className="flex items-start gap-2 group/checkbox min-h-[1.5em] pl-1">
                <div className="w-5 flex justify-center flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleInlineCheckbox(note, date, index); }}
                    className={`mt-[3px] transition-colors ${isChecked ? 'text-[#737373]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
                  >
                    {isChecked ? <CheckSquare size={13} /> : <Square size={13} />}
                  </button>
                </div>
                <span className={`flex-1 break-words leading-relaxed ${isChecked ? 'line-through text-[#737373]' : ''}`}>
                  {renderInlineText(content, index)}
                </span>
              </div>
            );
          }

          // Bullet
          const bulletMatch = line.match(/^(\s*)-\s+(.*)/);
          if (bulletMatch) {
            const content = bulletMatch[2];
            return (
              <div key={index} className="flex items-start gap-2 min-h-[1.5em] pl-1">
                <div className="w-5 flex justify-center flex-shrink-0">
                  <div className="mt-[8px] w-1 h-1 rounded-full bg-[#737373]" />
                </div>
                <span className="flex-1 break-words leading-relaxed">
                  {renderInlineText(content, index)}
                </span>
              </div>
            );
          }

          // Number
          const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
          if (numberMatch) {
            const number = numberMatch[2];
            const content = numberMatch[3];
            return (
              <div key={index} className="flex items-start gap-2 min-h-[1.5em] pl-1">
                <div className="w-5 flex justify-end flex-shrink-0 pr-0.5">
                  <span className="text-[#737373] text-[10px] font-mono mt-[3px] select-none">{number}.</span>
                </div>
                <span className="flex-1 break-words leading-relaxed">
                  {renderInlineText(content, index)}
                </span>
              </div>
            );
          }

          // Normal Line
          if (!line.trim() && lines.length > 1) {
            return <div key={index} className="h-2" />; // Spacing for empty lines
          }

          return (
            <div key={index} className="break-words leading-relaxed min-h-[1.2rem]">
              {renderInlineText(line, index)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNoteItem = (note: NoteItem, date: Date) => {
    const isNoteDone = note.isDone && !transitioningIds.has(note.id);
    const isSelected = selectedNoteIds.has(note.id);
    return (
      <div
        key={note.id}
        id={`note-${note.id}`}
        onClick={() => isSelectMode && handleToggleSelect(note.id)}
        className={`group relative flex transition-all duration-300 ease-out ${newlyAddedIds.has(note.id) ? 'animate-[fadeIn_0.5s_ease-out] bg-gray-500/10' : ''} ${isMicro ? "items-center gap-1.5 py-0 px-0.5 border-transparent rounded hover:bg-[#1a1a1a]" :
          isCompact ? "items-start gap-1.5 py-0.5 px-1 border-transparent rounded" : "items-start gap-2 p-2 rounded-lg border"
          } ${copyingIds.has(note.id) ? '!bg-[#404040] !duration-100' : ((note.isPinned ? 'border-[#404040] bg-[#1a1a1a]' : 'border-transparent hover:border-[#262626] hover:bg-[#1a1a1a]'))
          } ${isNoteDone ? 'opacity-50' : 'opacity-100'} ${isSelectMode ? 'cursor-pointer' : ''} ${isSelected ? '!bg-green-500/10 !border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : ''}`}
      >
        {/* Selection Checkbox */}
        {isSelectMode && (
          <div className="h-4 flex items-center pr-1 scale-90">
            <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-[#404040] bg-[#1a1a1a]'}`}>
              {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
            </div>
          </div>
        )}
        <div className={`flex items-center relative ${isMicro ? 'h-3' : 'h-4'}`} data-picker-id={note.id}>
          {isSelectMode ? null : isMicro ? (
            <div className="w-1 h-1 rounded-full opacity-40 flex-shrink-0" style={{ backgroundColor: isNoteDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />
          ) : isCompact ? (
            <button onClick={(e) => { e.stopPropagation(); handleToggleTodo(date, note.id); }} className="w-3 h-3 flex items-center justify-center hover:scale-125 transition-transform cursor-pointer">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isNoteDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />
            </button>
          ) : note.type === 'todo' ? (
            <button onClick={() => handleToggleTodo(date, note.id)} className={`transition-colors group flex items-center justify-center ${isNoteDone ? 'text-[#737373]' : 'text-[#facc15]'} hover:!text-[#737373]`}>
              {isNoteDone ? <CheckSquare size={14} /> : (<> <Square size={14} className="group-hover:hidden" /> <CheckSquare size={14} className="hidden group-hover:block" /> </>)}
            </button>
          ) : (
            <button onClick={() => handleToggleTodo(date, note.id)} className="transition-colors hover:!text-[#737373]" style={{ color: isNoteDone ? '#737373' : NOTE_TYPES[note.type || 'text'].color }}>
              {React.createElement(NOTE_TYPES[note.type || 'text'].icon, { size: 14 })}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0" onClick={(e) => isSelectMode && e.stopPropagation()}>
          {editingId === note.id ? (
            <div className="flex flex-col gap-2 relative">
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                  checkTagSuggestions(e.target.value, e.target.selectionStart, 'edit');
                }}
                onBlur={() => setTimeout(() => { handleSaveEdit(date, note.id); setSuggestionSource(null); }, 200)}
                className={isCompact ? "w-full bg-[#262626] text-[#e5e5e5] text-xs p-1 rounded border-0 outline-none resize-none overflow-hidden" : "w-full bg-transparent text-[#e5e5e5] text-xs p-0 border-0 outline-none resize-none overflow-hidden"}
                onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; e.target.selectionStart = e.target.selectionEnd = e.target.value.length; }}
                autoFocus
                onKeyDown={(e) => {
                  // Stop propagation to prevent table navigation conflicts (e.g., Shift+Arrow for text selection)
                  e.stopPropagation();
                  if (suggestionSource === 'edit') {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionActiveIndex(i => (i + 1) % tagSuggestions.length); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionActiveIndex(i => (i - 1 + tagSuggestions.length) % tagSuggestions.length); return; }
                    if (e.key === 'Enter') { e.preventDefault(); insertTag(tagSuggestions[suggestionActiveIndex]); return; }
                    if (e.key === 'Escape') { setSuggestionSource(null); return; }
                  }
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(date, note.id); }
                  else if (e.key === 'Escape') { setEditingId(null); }
                }}
              />
              {suggestionSource === 'edit' && tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[150px] overflow-y-auto z-50" onMouseDown={(e) => e.preventDefault()}>
                  {tagSuggestions.map((tag, idx) => (
                    <div key={tag} className={`px-3 py-1.5 text-xs cursor-pointer ${idx === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`} onClick={() => insertTag(tag)}>#{tag}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`${isMicro ? 'text-[9px] truncate leading-none py-0.5' : isCompact ? 'text-[11px] line-clamp-3' : 'text-xs'} block break-words ${isMicro ? 'leading-none' : 'leading-relaxed'} ${isNoteDone ? 'text-[#a3a3a3]' : (note.type === 'link' ? 'text-[#a0c4ff]' : (note.type === 'important' ? 'text-[#f87171]' : 'text-[#d4d4d4]'))}`} onDoubleClick={() => !isSelectMode && handleStartEdit(note)}>
              {renderNoteContent(note, date)}
            </div>
          )}

          <div className={`flex items-center justify-between mt-4 ${isCompact ? "hidden" : ""}`}>
            <span className="text-[11px] text-[#525252]">
              {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {isNoteDone && note.completedAt && (<span className="text-[#525252] opacity-75"> • {new Date(note.completedAt).toLocaleDateString([], { day: 'numeric', month: 'numeric' })}</span>)}
            </span>
            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${(isSelectMode || isViewAll) ? '!hidden' : ''}`}>
              {editingId === note.id ? (
                <>
                  <button onClick={() => setEditingId(null)} className="text-[#737373] hover:text-[#e5e5e5] px-1" title="Cancel"><X size={14} /></button>
                  <button onClick={() => handleSaveEdit(date, note.id)} className="text-[#737373] hover:text-[#60a5fa] px-1" title="Save"><Check size={14} /></button>
                </>
              ) : !showRecycleBin ? (
                <>
                  <button onClick={() => { navigator.clipboard.writeText(note.content); setCopyingIds(prev => new Set(prev).add(note.id)); setTimeout(() => setCopyingIds(prev => { const n = new Set(prev); n.delete(note.id); return n; }), 200); }} className="text-[#525252] hover:text-[#e5e5e5] px-1" title="Copy"><Copy size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setIsSelectMode(true); setSelectedNoteIds(new Set([note.id])); }} className="text-[#525252] hover:text-[#22c55e] px-1" title="Select"><ListChecks size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleTogglePin(date, note.id); }} className={`text-[#525252] hover:text-[#e5e5e5] px-1 ${note.isPinned ? '!text-[#e5e5e5]' : ''}`} title={note.isPinned ? "Unpin" : "Pin"}>{note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}</button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTypeMenu(activeTypeMenu === note.id ? null : note.id);
                      }}
                      className={`text-[#525252] hover:text-[#e5e5e5] px-1 transition-colors ${activeTypeMenu === note.id ? 'text-[#e5e5e5]' : ''}`}
                      title="Type"
                    >
                      <Layers size={14} />
                    </button>
                    {activeTypeMenu === note.id && (
                      <div className="absolute right-0 bottom-full mb-2 bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-50 py-1 min-w-[100px] animate-in fade-in slide-in-from-bottom-1 duration-200" onClick={e => e.stopPropagation()}>
                        {(['text', 'todo', 'important'] as NoteType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => handleSetType(date, note.id, type)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                          >
                            {React.createElement(NOTE_TYPES[type].icon, { size: 12, style: { color: NOTE_TYPES[type].color } })}
                            {NOTE_TYPES[type].label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(date, note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors" title="Delete" data-delete-trigger={note.id}><Trash size={14} /></button>
                </>
              ) : (
                <>
                  <button onClick={(e) => { e.stopPropagation(); handleRestoreNote(date, note.id); }} className="text-[#525252] hover:text-[#22c55e] px-1 transition-colors" title="Restore"><RefreshCcw size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors" title="Permanently Delete"><Trash size={14} /></button>
                </>
              )}
            </div>
          </div>
        </div>

        {!editingId && isCompact && !isSelectMode && !isViewAll && (
          <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 relative">
            {!showRecycleBin ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveContextMenu(activeContextMenu === note.id ? null : note.id);
                  }}
                  className={`p-1 transition-colors rounded hover:bg-[#262626] ${activeContextMenu === note.id ? 'text-[#e5e5e5] bg-[#262626]' : 'text-[#737373] hover:text-[#e5e5e5]'}`}
                  title="More actions"
                >
                  <MoreVertical size={14} />
                </button>

                {activeContextMenu === note.id && (
                  <div className="absolute right-0 top-full mt-1 bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-[60] py-1 min-w-[100px] note-context-menu" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSelectMode(true);
                        setSelectedNoteIds(new Set([note.id]));
                        setActiveContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#22c55e] hover:bg-[#22c55e]/10 hover:text-green-400 transition-colors"
                    >
                      <ListChecks size={12} />
                      Select
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(date, note.id);
                        setActiveContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                    >
                      {note.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      {note.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(note.content);
                        setCopyingIds(prev => new Set(prev).add(note.id));
                        setTimeout(() => setCopyingIds(prev => { const n = new Set(prev); n.delete(note.id); return n; }), 200);
                        setActiveContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTypeMenu(activeTypeMenu === note.id ? null : note.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                      >
                        <Layers size={12} />
                        Type
                      </button>
                      {activeTypeMenu === note.id && (
                        <div className="absolute right-full top-0 mr-1 bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-[70] py-1 min-w-[100px] animate-in fade-in slide-in-from-right-1 duration-200" onClick={e => e.stopPropagation()}>
                          {(['text', 'todo', 'important'] as NoteType[]).map(type => (
                            <button
                              key={type}
                              onClick={() => { handleSetType(date, note.id, type); setActiveContextMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d4d4d4] hover:bg-[#262626] hover:text-white transition-colors"
                            >
                              {React.createElement(NOTE_TYPES[type].icon, { size: 12, style: { color: NOTE_TYPES[type].color } })}
                              {NOTE_TYPES[type].label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="h-px bg-[#262626] my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(date, note.id);
                        setActiveContextMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                    >
                      <Trash size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleRestoreNote(date, note.id); }} className="text-[#525252] hover:text-[#22c55e] px-1 flex items-center justify-center h-full transition-colors" title="Restore"><RefreshCcw size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }} className="text-[#525252] hover:text-[#ef4444] px-1 flex items-center justify-center h-full transition-colors" title="Permanently Delete"><Trash size={14} /></button>
              </>
            )}
          </div>
        )}

        {showRecycleBin && confirmDeleteId === note.id && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#171717] border border-[#262626] rounded-lg pl-3 pr-1 py-1 z-50 shadow-lg" data-delete-confirm={note.id} onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-[#e5e5e5] whitespace-nowrap font-medium">Permanently Delete?</span>
            <div className="flex items-center gap-0.5 border-l border-[#262626] pl-1.5 ml-1">
              <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"><X size={12} /></button>
              <button onClick={(e) => { e.stopPropagation(); handlePermanentDelete(date, note.id); setConfirmDeleteId(null); }} className="p-1 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded transition-colors"><Trash size={12} /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getFilteredNotes = () => {
    let result: Array<{ date: Date; notes: NoteItem[] }> = [];
    const filterBin = (n: NoteItem) => showRecycleBin ? !!n.deletedAt : !n.deletedAt;

    if (activeCell && !isViewAll) {
      if (activeCell.year === year && activeCell.month === month) {
        const dayNotes = (notes[activeCell.day] || []).filter(filterBin);
        if (dayNotes.length > 0) {
          result = [{
            date: new Date(year, month, activeCell.day),
            notes: dayNotes
          }];
        }
      } else {
        result = allTimeNotes.filter(item =>
          item.date.getFullYear() === activeCell.year &&
          item.date.getMonth() === activeCell.month &&
          item.date.getDate() === activeCell.day
        ).map(item => ({
          ...item,
          notes: item.notes.filter(filterBin)
        })).filter(item => item.notes.length > 0);
      }
    } else {
      result = allTimeNotes.map(item => ({
        ...item,
        notes: item.notes.filter(filterBin)
      })).filter(item => item.notes.length > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.content.toLowerCase().includes(q))
      })).filter(item => item.notes.length > 0);
    }

    if (selectedTag) {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => extractTags(n.content).includes(selectedTag))
      })).filter(item => item.notes.length > 0);
    }

    if (selectedTypes.length > 0) {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.type && selectedTypes.includes(n.type))
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

    // Sort notes: Pinned first, then Active first, then by type priority, then by NEWEST created date
    if (isSortedByType) {
      result = result.map(item => ({
        ...item,
        notes: [...item.notes].sort((a, b) => {
          // 1. Pinned status (Pinned first)
          if (!!a.isPinned !== !!b.isPinned) {
            return a.isPinned ? -1 : 1;
          }

          // 2. Completion status (Active first)
          const aIsDone = a.isDone && !transitioningIds.has(a.id);
          const bIsDone = b.isDone && !transitioningIds.has(b.id);
          if (aIsDone !== bIsDone) {
            return aIsDone ? 1 : -1;
          }

          // 3. Type priority
          const priorityA = TYPE_PRIORITY[a.type || 'text'];
          const priorityB = TYPE_PRIORITY[b.type || 'text'];
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // 4. Creation date (Newest first)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
      }));
    }

    return result;
  };

  const filteredNotes = getFilteredNotes();

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
      {/* New Refined Search & Filters */}
      <div className="flex flex-col mb-2 gap-2 pr-[10px]">
        {isSelectMode ? (
          <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 h-[77px]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-400">
                <ListChecks size={16} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-green-400 uppercase tracking-wider">{selectedNoteIds.size} Selected</div>
                <div className="text-[10px] text-[#737373]">Choose actions for selected items</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedNoteIds(new Set())}
                className="px-3 py-1.5 text-[10px] font-medium text-[#737373] hover:text-[#e5e5e5] transition-colors"
              >
                Clear selection
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedNoteIds.size === 0}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] rounded-lg border border-[#ef4444]/30 transition-all text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <Trash2 size={12} className="group-hover:animate-bounce" />
                TEMPORARY DELETE
              </button>
              <div className="w-px h-6 bg-[#262626] mx-1" />
              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedNoteIds(new Set());
                }}
                className="p-1.5 text-[#737373] hover:text-white hover:bg-[#262626] rounded-lg transition-all"
                title="Exit selection mode"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: Search & Tags (50/50 Split) */}
            <div className="grid grid-cols-12 gap-2 h-9">
              {/* Searchbar */}
              <div className="relative col-span-6 group">
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-[#1a1a1a] border border-[#262626] focus:border-[#404040]/60 focus:bg-[#212121] outline-none text-[11px] text-[#e5e5e5] placeholder-[#525252] pl-8 pr-3 rounded-lg transition-all shadow-inner"
                />
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252] group-focus-within:text-[#a3a3a3] transition-colors" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#e5e5e5]"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Tags Filter Dropdown */}
              <div className="col-span-6 flex">
                <div className="relative flex-1 tag-filter-menu">
                  <button
                    onClick={() => setTagMenuOpen(!tagMenuOpen)}
                    className={`w-full h-full px-3 flex items-center justify-between rounded-l-lg border transition-all ${selectedTag ? 'bg-[#262626] border-[#525252] text-[#f5f5f5]' : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040]'
                      }`}
                  >
                    <span className="text-[10px] font-semibold tracking-tight truncate">
                      {selectedTag ? selectedTag.replace('#', '') : "TAGS"}
                    </span>
                    <ChevronDown size={10} className={`${tagMenuOpen ? 'rotate-180' : ''} transition-transform text-[#525252]`} />
                  </button>

                  {tagMenuOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-[#171717] border border-[#262626] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 border-b border-[#262626] bg-[#111111]/50">
                        <div className="relative">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Filter tags..."
                            value={tagSearchQuery}
                            onChange={(e) => setTagSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-7 py-1.5 text-xs outline-none focus:border-[#404040]"
                          />
                          <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 py-0.5 custom-scrollbar">
                        <button
                          onClick={() => { setSelectedTag(null); setTagMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] ${!selectedTag ? 'text-[#e5e5e5] bg-[#262626]/30' : 'text-[#737373]'}`}
                        >
                          All Tags
                        </button>

                        {/* Last Used Tag Section */}
                        {lastUsedTag && !tagSearchQuery && (
                          <button
                            onClick={() => {
                              setSelectedTag(selectedTag === lastUsedTag ? null : lastUsedTag);
                              setTagMenuOpen(false);
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
                          .filter(([tag]) => tag !== lastUsedTag)
                          .map(([tag, count]) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSelectedTag(selectedTag === tag ? null : tag);
                                setLastUsedTag(tag);
                                setTagMenuOpen(false);
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
                  onClick={() => setSelectedTag(null)}
                  title="Show All Tags"
                  className="w-9 h-full flex items-center justify-center rounded-r-lg border border-[#262626] bg-[#1a1a1a] text-[#525252] hover:border-[#404040] hover:text-[#a3a3a3] transition-all"
                >
                  <RefreshCcw size={12} />
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
                      onClick={() => {
                        setSelectedTypes(prev =>
                          isSelected ? prev.filter(t => t !== type) : [...prev, type]
                        );
                      }}
                      className={`h-8 flex-1 flex items-center justify-center border transition-all type-toggle-btn
                        ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}
                        ${isSelected
                          ? 'bg-[#262626] border-[#525252] z-10'
                          : 'bg-[#1a1a1a] border-[#262626] text-[#525252] hover:bg-[#151515]'
                        }`}
                      title={config.label}
                      style={{
                        '--active-color': config.color,
                        '--active-border': `${config.color}44`,
                        '--active-bg': `${config.color}0a`,
                        ...(isSelected ? { color: config.color, backgroundColor: `${config.color}0a`, borderColor: `${config.color}44` } : {})
                      } as React.CSSProperties}
                    >
                      <config.icon size={12} />
                    </button>
                  );
                })}
              </div>

              <div className="col-span-6 flex items-center gap-2">
                {/* View Options Group */}
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => setCompletedFilter(completedFilter === 'all' ? 'notCompleted' : 'all')}
                    title="Show Completed"
                    className={`h-8 flex-1 flex items-center justify-center border rounded-l-lg transition-all ${completedFilter === 'all'
                      ? 'bg-[#e5e5e5]/10 border-blue-500/40 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)] z-10'
                      : 'bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-blue-500/40 hover:text-blue-400 hover:bg-[#e5e5e5]/5'
                      }`}
                  >
                    <CheckCheck size={12} />
                  </button>
                  <button
                    onClick={() => setIsSortedByType(!isSortedByType)}
                    title="Grouped by Type"
                    className={`h-8 flex-1 flex items-center justify-center border rounded-r-lg transition-all ${isSortedByType
                      ? 'bg-[#e5e5e5]/10 border-purple-500/40 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                      : 'bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-purple-500/40 hover:text-purple-400 hover:bg-[#e5e5e5]/5'
                      }`}
                  >
                    <List size={12} />
                  </button>
                </div>

                {/* Status Group */}
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (!showPinnedOnly) setShowRecycleBin(false);
                      setShowPinnedOnly(!showPinnedOnly);
                    }}
                    title="Pinned Only"
                    className={`h-8 flex-1 flex items-center justify-center border rounded-l-lg transition-all ${showPinnedOnly
                      ? 'bg-[#e5e5e5]/10 border-yellow-500/40 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.1)] z-10'
                      : 'bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-yellow-500/40 hover:text-yellow-500 hover:bg-[#e5e5e5]/5'
                      }`}
                  >
                    <Pin size={12} fill={showPinnedOnly ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => {
                      if (!showRecycleBin) setShowPinnedOnly(false);
                      setShowRecycleBin(!showRecycleBin);
                    }}
                    title="Recycle Bin"
                    className={`h-8 flex-1 flex items-center justify-center border rounded-r-lg transition-all ${showRecycleBin
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showRecycleBin && (
        <div className="flex items-center justify-between px-1 mb-4 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 size={14} />
            <span className="text-xs font-medium">Recycle Bin</span>
            <span className="text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded text-red-400 border border-red-500/20">
              {filteredNotes.reduce((acc, curr) => acc + curr.notes.length, 0)} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreAll}
              disabled={filteredNotes.reduce((acc, curr) => acc + curr.notes.length, 0) === 0}
              className="text-[10px] px-2 py-1 bg-[#262626] hover:bg-[#333] text-[#a3a3a3] hover:text-[#e5e5e5] rounded border border-[#404040] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={10} /> Restore All
            </button>
            <button
              onClick={handleEmptyBin}
              disabled={filteredNotes.reduce((acc, curr) => acc + curr.notes.length, 0) === 0}
              className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={10} /> Delete All
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 pb-2 [scrollbar-gutter:stable]">                  {isViewAll && filteredNotes.length > 0 && (
        <div className="sticky top-0 z-20 bg-[#171717] py-2 px-4 flex items-center justify-between border-b border-[#262626] mb-4">
          <h2 className="text-lg font-playfair font-medium text-[#e5e5e5]">All Notes</h2>
          <div className="flex items-center gap-1">

            <button
              onClick={() => {
                if (!isCompact && !isMicro) {
                  setIsCompact(true);
                  setIsMicro(false);
                } else if (isCompact && !isMicro) {
                  setIsCompact(true);
                  setIsMicro(true);
                } else {
                  setIsCompact(false);
                  setIsMicro(false);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 border bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#e5e5e5]"
              title={
                !isCompact && !isMicro ? "Current: Full View (Next: Compact)" :
                  isMicro ? "Current: Micro View (Next: Full)" : "Current: Compact View (Next: Micro)"
              }
            >
              {!isCompact && !isMicro ? <Rows2 size={16} /> :
                isMicro ? <Rows4 size={16} /> : <Rows3 size={16} />}
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setActiveCell({
                  year: today.getFullYear(),
                  month: today.getMonth(),
                  day: today.getDate(),
                  hour: 0
                });
                setIsViewAll(false);
                setTimeout(() => {
                  addNoteInputRef.current?.focus();
                }, 100);
              }}
              className="p-1 text-[#737373] hover:text-[#e5e5e5] transition-colors"
            >
              <Square size={16} />
            </button>
          </div>
        </div>
      )}
        {filteredNotes.length === 0 ? (
          <div>
            {!isViewAll && activeCell && (
              <div className="sticky top-0 z-10 bg-[#252525] py-2 mb-2 border-b border-[#262626] flex items-center justify-between group/header transition-all rounded-lg px-2">
                <DateNavigator
                  date={new Date(activeCell.year, activeCell.month, activeCell.day)}
                  onDateChange={handleDateChange}
                  datesWithNotes={datesWithNotes}
                  className="border-none p-0 bg-transparent hover:border-transparent flex-1"
                />
                <div className="flex items-center gap-1 pr-2">
                  {(() => {
                    const today = new Date();
                    const isToday = activeCell.year === today.getFullYear() && activeCell.month === today.getMonth() && activeCell.day === today.getDate();
                    return !isToday && (
                      <button
                        onClick={() => {
                          const now = new Date();
                          setActiveCell({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hour: 0 });
                        }}
                        className="text-[#525252] hover:text-[#e5e5e5] transition-colors p-1"
                        title="Go to Today"
                      >
                        <CalendarArrowDown size={14} />
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => {
                      if (!isCompact && !isMicro) {
                        setIsCompact(true);
                        setIsMicro(false);
                      } else if (isCompact && !isMicro) {
                        setIsCompact(true);
                        setIsMicro(true);
                      } else {
                        setIsCompact(false);
                        setIsMicro(false);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 border bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#e5e5e5]"
                    title={
                      !isCompact && !isMicro ? "Current: Full View (Next: Compact)" :
                        isMicro ? "Current: Micro View (Next: Full)" : "Current: Compact View (Next: Micro)"
                    }
                  >
                    {!isCompact && !isMicro ? <Rows2 size={16} /> :
                      isMicro ? <Rows4 size={16} /> : <Rows3 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsViewAll(true)}
                    className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                  >
                    <Grid size={14} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center justify-center py-8 text-[#525252]">
              <span className="text-xs">No notes found</span>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredNotes.map((group) => {
              const showTruncated = isViewAll && !searchQuery && !selectedTag && group.notes.length > 3;
              const displayedNotes = showTruncated ? group.notes.slice(0, 3) : group.notes;

              return (
                <li key={group.date.toISOString()}>
                  <div
                    onClick={() => {
                      if (false) {
                      } else {
                        setIsViewAll(false);
                        setActiveCell({
                          year: group.date.getFullYear(),
                          month: group.date.getMonth(),
                          day: group.date.getDate(),
                          hour: 0
                        });
                      }
                    }}
                    className={`${isViewAll ? '' : 'sticky top-0 z-10'} ${isViewAll ? 'bg-[#212121]' : 'bg-[#252525]'} py-2 mb-2 border-b border-[#262626] flex items-center justify-between group/header transition-all hover:bg-[#262626] rounded-lg px-2 ${isViewAll ? 'cursor-pointer' : ''}`}
                  >
                    {!isViewAll && activeCell ? (
                      <DateNavigator
                        date={group.date}
                        onDateChange={handleDateChange}
                        datesWithNotes={datesWithNotes}
                        className="border-none p-0 bg-transparent hover:border-transparent flex-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-playfair font-medium text-[#d4d4d4] group-hover/header:text-white pl-1 transition-colors">
                          {group.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>

                      </div>
                    )}
                    {!isViewAll && activeCell && group.date.getDate() === activeCell.day && group.date.getMonth() === activeCell.month && (
                      <div className="flex items-center gap-1 pr-2">
                        {(() => {
                          const today = new Date();
                          const isToday = group.date.getFullYear() === today.getFullYear() && group.date.getMonth() === today.getMonth() && group.date.getDate() === today.getDate();
                          return !isToday && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const now = new Date();
                                setActiveCell({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate(), hour: 0 });
                              }}
                              className="text-[#525252] hover:text-[#e5e5e5] transition-colors p-1"
                              title="Go to Today"
                            >
                              <CalendarArrowDown size={14} />
                            </button>
                          );
                        })()}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCompact && !isMicro) {
                              setIsCompact(true);
                              setIsMicro(false);
                            } else if (isCompact && !isMicro) {
                              setIsCompact(true);
                              setIsMicro(true);
                            } else {
                              setIsCompact(false);
                              setIsMicro(false);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 border bg-[#1a1a1a] border-[#262626] text-[#525252] hover:border-[#404040] hover:text-[#e5e5e5]"
                          title={
                            !isCompact && !isMicro ? "Current: Full View (Next: Compact)" :
                              isMicro ? "Current: Micro View (Next: Full)" : "Current: Compact View (Next: Micro)"
                          }
                        >
                          {!isCompact && !isMicro ? <Rows2 size={16} /> :
                            isMicro ? <Rows4 size={16} /> : <Rows3 size={16} />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsViewAll(true);
                          }}
                          className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                        >
                          <Grid size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      if (!isSortedByType) {
                        return <div className="space-y-2">{displayedNotes.map(n => renderNoteItem(n, group.date))}</div>;
                      }

                      const pinned = displayedNotes.filter(n => n.isPinned);
                      const unpinned = displayedNotes.filter(n => !n.isPinned);
                      const active = unpinned.filter(n => !n.isDone);
                      const completed = unpinned.filter(n => n.isDone);

                      const typeGroups: Record<NoteType, NoteItem[]> = {
                        important: active.filter(n => n.type === 'important'),
                        todo: active.filter(n => n.type === 'todo'),
                        link: active.filter(n => n.type === 'link'),
                        text: active.filter(n => n.type === 'text' || !n.type)
                      };

                      return (
                        <div className="space-y-6">
                          {pinned.length > 0 && !isViewAll && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 px-1 mb-1">
                                <Pin size={10} className="text-yellow-500/60" />
                                <span className="text-[9px] font-bold tracking-widest text-yellow-500/50 uppercase">Pinned</span>
                              </div>
                              {pinned.map(n => renderNoteItem(n, group.date))}
                            </div>
                          )}

                          {(Object.entries(NOTE_TYPES) as [NoteType, any][])
                            .sort(([typeA], [typeB]) => TYPE_PRIORITY[typeA] - TYPE_PRIORITY[typeB])
                            .map(([type, config]) => {
                              const notesInType = typeGroups[type];
                              if (notesInType.length === 0) return null;
                              return (
                                <div key={type} className="space-y-2">
                                  {!isViewAll && (<div className="flex items-center gap-2 px-1 mb-1">
                                    <config.icon size={10} style={{ color: `${config.color}99` }} />
                                    <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: `${config.color}88` }}>{config.label}s</span>
                                  </div>)}
                                  {notesInType.map(n => renderNoteItem(n, group.date))}
                                </div>
                              );
                            })}

                          {completed.length > 0 && !isViewAll && (active.length > 0 || pinned.length > 0) && (
                            <div className="space-y-2 opacity-60">
                              <div className="flex items-center gap-2 px-1 mb-1">
                                <CheckCircle2 size={10} className="text-[#525252]" />
                                <span className="text-[9px] font-bold tracking-widest text-[#525252] uppercase">Completed Tasks</span>
                              </div>
                              {completed.map(n => renderNoteItem(n, group.date))}
                            </div>
                          )}
                          {completed.length > 0 && active.length === 0 && pinned.length === 0 && (
                            <div className="space-y-2">
                              {completed.map(n => renderNoteItem(n, group.date))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {showTruncated && (
                      <button
                        onClick={() => {
                          setIsViewAll(false);
                          setActiveCell({
                            year: group.date.getFullYear(),
                            month: group.date.getMonth(),
                            day: group.date.getDate(),
                            hour: 0
                          });
                        }}
                        className="w-full text-center py-1.5 text-[10px] text-[#525252] hover:text-[#a3a3a3] hover:bg-[#262626] rounded transition-colors italic border border-dashed border-[#262626] hover:border-[#404040]"
                      >
                        + {group.notes.length - 3} more notes
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add Note Input - Always visible, defaults to today if no date selected */}
      <div className="pt-3 border-t border-[#262626] mt-2">
        {/* Preview Metadata */}
        {isAddInputFocused && (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2 px-1.5 animate-in fade-in slide-in-from-bottom-1 duration-300 opacity-40 pointer-events-none select-none grayscale-[0.3]">
            <div className="flex items-center gap-1">
              <Calendar size={9} className="text-[#a3a3a3]" />
              <span className="text-[8px] font-medium text-[#a3a3a3] uppercase tracking-tight">{newNoteMetadata.dateStr}</span>
            </div>

            <div className="flex items-center gap-1">
              {(() => {
                const config = NOTE_TYPES[newNoteMetadata.type || 'text'] || NOTE_TYPES.text;
                return (
                  <>
                    <config.icon size={9} className="opacity-70" style={{ color: config.color }} />
                    <span className="text-[8px] font-medium uppercase tracking-tight" style={{ color: config.color }}>{config.label}</span>
                  </>
                );
              })()}
            </div>

            {newNoteMetadata.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Hash size={9} className="text-[#a3a3a3]" />
                <div className="flex items-center gap-1">
                  {newNoteMetadata.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[8px] font-medium text-[#7dd3fc] uppercase tracking-tight">{tag.replace('#', '')}</span>
                  ))}
                  {newNoteMetadata.tags.length > 3 && (
                    <span className="text-[8px] text-[#a3a3a3] font-medium">+{newNoteMetadata.tags.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="relative">
          {suggestionSource === 'add' && tagSuggestions.length > 0 && (
            <div
              className="absolute bottom-full left-0 mb-1 w-full bg-[#141414]/95 backdrop-blur-md border border-[#262626] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden max-h-[140px] overflow-y-auto z-50 custom-scrollbar"
              onMouseDown={(e) => e.preventDefault()}
            >
              {tagSuggestions.map((tag, i) => (
                <div
                  key={tag}
                  className={`px-2.5 py-1.5 text-[10px] cursor-pointer transition-colors ${i === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#737373] hover:bg-[#1a1a1a] hover:text-[#a3a3a3]'}`}
                  onClick={() => insertTag(tag)}
                >
                  <span className="opacity-50 mr-0.5">#</span>{tag}
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={addNoteInputRef} value={newNote}
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
              // Stop propagation to prevent table navigation conflicts (e.g., Shift+Arrow for text selection)
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
            placeholder="Add a note... (Press Enter, use 'todo', '!', or paste links)"
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
                className="text-[#525252] hover:text-[#e5e5e5] transition-colors p-1"
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
};
