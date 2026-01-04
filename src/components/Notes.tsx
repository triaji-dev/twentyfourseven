import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { NoteItem, NoteType } from '../types';
import { processNoteContent, extractTags } from '../utils/notes';
import { DateNavigator } from './DateNavigator';
import { X, Search, Type, CheckSquare, AlertCircle, Link as LinkIcon, GripVertical, TextAlignJustify, Square, CopyPlus, CopyMinus, StickyNote, Maximize2, Minimize2, CalendarArrowDown, Copy, ArrowLeft, Check, Trash, ArrowDownUp, Pencil, Loader2, Pin, PinOff, Trash2, RefreshCcw, ChevronDown, CheckCircle2, Circle } from 'lucide-react';

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
  const [editContent, setEditContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<'all' | 'notCompleted'>('notCompleted');
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [isViewAll, setIsViewAll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedNote, setDraggedNote] = useState<{ id: string; date: Date } | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [suggestionActiveIndex, setSuggestionActiveIndex] = useState(0);
  const [suggestionSource, setSuggestionSource] = useState<'add' | 'edit' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());
  const [copyingIds, setCopyingIds] = useState<Set<string>>(new Set());
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [isSortedByType, setIsSortedByType] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false); // Recycle Bin State
  const [selectedTypes, setSelectedTypes] = useState<NoteType[]>([]); // New state for type filtering
  const [editingLink, setEditingLink] = useState<{ noteId: string; subId: number; oldText: string; url: string; title: string } | null>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagMenuOpen, confirmDeleteId]);

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
            } catch(e) {}
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

      if (/^[-•*]\s/.test(input) || /(\s[-•*]\s)/.test(input)) {
        const normalized = input.replace(/(?:^|\s)([-•*])\s/g, '|||$1 '); 
        entries = normalized
          .split('|||')
          .map(s => s.trim())
          .filter(s => s.length > 0); 
      } else {
        entries = [input];
      }

      if (entries.length > 0) {
        const newItems: NoteItem[] = entries.map(entryContent => {
          let { type, content } = processNoteContent(entryContent);

          // Auto-add #YOUTUBE tag on creation
          if (/(youtube|youtu\.be)/i.test(content) && !/#YOUTUBE/i.test(content)) {
              content = content.trimEnd() + ' #YOUTUBE';
          }

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
             } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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
    } catch(e) {
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

  const handleDeleteNote = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: Record<number, NoteItem[]> = {};
    try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
    } catch(e) {
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

  const handleRestoreNote = (date: Date, noteId: string) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: Record<number, NoteItem[]> = {};
    try {
        const saved = localStorage.getItem(key);
        monthNotes = saved ? JSON.parse(saved) : {};
    } catch(e) {
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
    } catch(e) {
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

  const handleReorderNotes = (date: Date, fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;

    let monthNotes: Record<number, NoteItem[]> = {};
    
    if (y === year && m === month) {
         monthNotes = { ...notes };
    } else {
         try {
            const saved = localStorage.getItem(key);
            monthNotes = saved ? JSON.parse(saved) : {};
         } catch(e) {
            monthNotes = {};
         }
    }

    const dayNotes = [...(monthNotes[d] || [])];
    const fromIndex = dayNotes.findIndex(n => n.id === fromId);
    const toIndex = dayNotes.findIndex(n => n.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const [movedNote] = dayNotes.splice(fromIndex, 1);
    dayNotes.splice(toIndex, 0, movedNote);
    
    const updatedNotes = {
      ...monthNotes,
      [d]: dayNotes
    };

    localStorage.setItem(key, JSON.stringify(updatedNotes));

    if (y === year && m === month) {
      setNotes(updatedNotes);
    }
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
  };

  const handleSaveLink = (note: NoteItem, date: Date, newTitle: string, newUrl: string) => {
    if (!editingLink) return;

    let newContent = note.content;
    const { oldText } = editingLink;
    const newLinkText = `[${newTitle || newUrl}](${newUrl})`; 
    
    newContent = newContent.replace(oldText, newLinkText);

    // Auto add #YOUTUBE tag
    if (/(youtube|youtu\.be)/i.test(newUrl) && !/#YOUTUBE/i.test(newContent)) {
        newContent = newContent.trimEnd() + ' #YOUTUBE';
    }

    // Save to LocalStorage
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();
    const key = `twentyfourseven-notes-${y}-${m}`;
    
    let monthNotes: any = {};
    try { monthNotes = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
    
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

  const renderNoteContent = (note: NoteItem, date: Date) => {
    const content = note.content;
    const regex = /((?:\[[^\]]+\]\((?:https?:\/\/|www\.)[^\)\s]+\))|(?:https?:\/\/|www\.)[^\s]+|#[\w\u0600-\u06FF]+)/g;
    
    const parts = content.split(regex);
    
    return parts.map((part, i) => {
      const isEditing = editingLink?.noteId === note.id && editingLink?.subId === i;
      
      if (isEditing) {
          return (
             <LinkEditForm 
                key={i}
                initialTitle={editingLink.title}
                initialUrl={editingLink.url}
                onSave={(t, u) => handleSaveLink(note, date, t, u)}
                onCancel={() => setEditingLink(null)}
             />
          );
      }

      // 1. Markdown Link: [Title](Url)
      const mdMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\)\s]+)\)$/);
      if (mdMatch) {
        const [full, title, url] = mdMatch;

        return (
          <span key={i} className="group/link relative inline-block align-middle">
             <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#a0c4ff] hover:underline" onClick={(e) => e.stopPropagation()}>
               {title}
             </a>
             <button 
               onClick={(e) => {
                   e.stopPropagation();
                   setEditingLink({
                       noteId: note.id,
                       subId: i,
                       oldText: full,
                       title: title,
                       url: url
                   });
               }}
               className="ml-1 opacity-0 group-hover/link:opacity-100 text-[#737373] hover:text-[#e5e5e5] px-1 transition-opacity align-middle"
             >
               <Pencil size={10} />
             </button>
          </span>
        );
      }

      // 2. Raw URL
      if (part.match(/^(https?:\/\/|www\.)/)) {
        const url = part.startsWith('www.') ? `http://${part}` : part;
        let displayTitle = part;
        try { displayTitle = new URL(url).hostname.replace('www.', ''); } catch(e) {}
        if (displayTitle.length > 20) displayTitle = displayTitle.slice(0,17) + '...';

        return (
          <span key={i} className="group/link relative inline-block align-middle">
            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline text-[#a0c4ff]" onClick={(e) => e.stopPropagation()}>
              {displayTitle} <span className="text-[#737373] opacity-50 text-[9px] ml-0.5">🔗</span>
            </a>
             <button 
               onClick={(e) => {
                   e.stopPropagation();
                   setEditingLink({
                       noteId: note.id,
                       subId: i,
                       oldText: part,
                       title: '', 
                       url: url
                   });
               }}
               className="ml-1 opacity-0 group-hover/link:opacity-100 text-[#737373] hover:text-[#e5e5e5] px-1 transition-opacity align-middle"
             >
               <Pencil size={10} />
             </button>
          </span>
        );
      }

      // 3. Tag
      if (part.match(/^#[\w\u0600-\u06FF]+$/)) {
        return (
           <span key={i} onClick={(e) => { e.stopPropagation(); setSelectedTag(part.toUpperCase()); }} className="inline-flex items-center px-1.5 py-0 mx-0.5 text-[9px] font-medium rounded bg-[#262626] text-[#a0c4ff] hover:bg-[#3b82f6] hover:text-white cursor-pointer transition-colors align-middle">
            {part}
          </span>
        );
      }
      return part;
    });
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

    // Sort notes by group (Active first), then type priority, then created date
    if (isSortedByType) {
      result = result.map(item => ({
        ...item,
        notes: [...item.notes].sort((a, b) => {
            const aIsDone = a.isDone && !transitioningIds.has(a.id);
            const bIsDone = b.isDone && !transitioningIds.has(b.id);
  
            // First, sort by completion status (active first)
            if (aIsDone !== bIsDone) {
              return aIsDone ? 1 : -1; // Active (false) comes first (-1)
            }
            // Then, sort by type priority
            const priorityA = TYPE_PRIORITY[a.type || 'text'];
            const priorityB = TYPE_PRIORITY[b.type || 'text'];
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
  
            // Finally, sort by created date (maintain chronological order)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
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
               `}</style>
                {/* New Refined Search & Filters */}
                <div className="flex flex-col mb-4 gap-2">
                  {/* Top Row: Search, Tags, Completed Toggle, Sort Toggle */}
                  <div className="grid grid-cols-12 gap-2 h-8">
                    {/* Searchbar */}
                    <div className="relative col-span-4">
                      <input 
                        type="text" 
                        placeholder="Search notes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full bg-[#1a1a1a] border border-[#262626] focus:border-[#404040] outline-none text-xs text-[#e5e5e5] placeholder-[#525252] pl-8 pr-3 rounded-lg transition-all"
                      />
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')} 
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#e5e5e5]"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    
                    {/* Tags Filter Dropdown */}
                    <div className="relative col-span-4 tag-filter-menu">
                      <button
                        onClick={() => setTagMenuOpen(!tagMenuOpen)}
                        className={`w-full h-full px-3 flex items-center justify-between rounded-lg border transition-all ${
                          selectedTag ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040]'
                        }`}
                      >
                        <span className="text-[11px] font-medium truncate">
                          {selectedTag || "Tags Filter"}
                        </span>
                        <ChevronDown size={12} className={`${tagMenuOpen ? 'rotate-180' : ''} transition-transform text-[#525252]`} />
                      </button>

                      {tagMenuOpen && (
                        <div className="absolute left-0 top-full mt-1 w-full bg-[#171717] border border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-[#262626] bg-[#111111]">
                            <div className="relative">
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search tags..."
                                value={tagSearchQuery}
                                onChange={(e) => setTagSearchQuery(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#262626] rounded-md px-7 py-1.5 text-xs outline-none focus:border-[#404040]"
                              />
                              <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252]" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto p-1 py-0.5 scrollbar-thin scrollbar-thumb-[#262626]">
                            <button
                              onClick={() => { setSelectedTag(null); setTagMenuOpen(false); }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] ${!selectedTag ? 'text-[#e5e5e5] bg-[#262626]/30' : 'text-[#737373]'}`}
                            >
                              All Tags
                            </button>
                            {allTags
                              .filter(([tag]) => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                              .map(([tag, count]) => (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    setSelectedTag(selectedTag === tag ? null : tag);
                                    setTagMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-colors hover:bg-[#262626] flex items-center justify-between ${
                                    selectedTag === tag ? 'text-[#e5e5e5] bg-[#262626]' : 'text-[#737373]'
                                  }`}
                                >
                                  <span>{tag}</span>
                                  <span className="text-[9px] opacity-40">{count}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Completed Toggle */}
                    <button
                      onClick={() => setCompletedFilter(completedFilter === 'all' ? 'notCompleted' : 'all')}
                      className={`h-full col-span-2 flex items-center justify-center gap-2 px-3 rounded-lg border transition-all text-[10px] font-medium ${
                        completedFilter === 'all' 
                          ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' 
                          : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040]'
                      }`}
                    >
                      {completedFilter === 'all' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      <span className="whitespace-nowrap">Done</span>
                    </button>

                    {/* Sort Toggle */}
                    <button
                      onClick={() => setIsSortedByType(!isSortedByType)}
                      className={`h-full col-span-2 flex items-center justify-center gap-2 rounded-lg border transition-all text-[10px] font-medium ${
                        isSortedByType 
                          ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]' 
                          : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040]'
                      }`}
                      title={isSortedByType ? "Standard Sort" : "Sort by Type"}
                    >
                      <ArrowDownUp size={12} />
                      <span>Sort</span>
                    </button>
                  </div>

                  {/* Bottom Row: Types, Pinned, Bin */}
                  <div className="grid grid-cols-6 gap-2">
                    {(Object.entries(NOTE_TYPES) as [NoteType, any][]).map(([type, config]) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedTypes(prev => 
                              isSelected ? prev.filter(t => t !== type) : [...prev, type]
                            );
                          }}
                          className={`h-8 flex items-center justify-center gap-2 text-[10px] font-medium rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]'
                              : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040] hover:text-[#a3a3a3]'
                          }`}
                          style={isSelected ? { borderColor: config.color, color: config.color, backgroundColor: `${config.color}0a` } : {}}
                        >
                          <config.icon size={12} />
                          <span className="hidden sm:inline">{config.label}</span>
                        </button>
                      );
                    })}
                    
                    {/* Pinned Filter */}
                    <button
                      onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                      className={`h-8 flex items-center justify-center gap-2 text-[10px] font-medium rounded-lg border transition-all ${
                        showPinnedOnly
                          ? 'bg-[#e5e5e5]/10 border-[#e5e5e5] text-[#e5e5e5]'
                          : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040] hover:text-[#a3a3a3]'
                      }`}
                    >
                      <Pin size={12} />
                      <span className="hidden sm:inline">Pinned</span>
                    </button>
                    
                    {/* Recycle Bin Filter */}
                    <button
                      onClick={() => setShowRecycleBin(!showRecycleBin)}
                      className={`h-8 flex items-center justify-center gap-2 text-[10px] font-medium rounded-lg border transition-all ${
                        showRecycleBin
                          ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444]'
                          : 'bg-[#1a1a1a] border-[#262626] text-[#737373] hover:border-[#404040] hover:text-[#a3a3a3]'
                      }`}
                    >
                      <Trash2 size={12} />
                      <span className="hidden sm:inline">Bin</span>
                    </button>
                  </div>
                </div>

               {/* Notes List */}
               <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1 pb-2 [scrollbar-gutter:stable]">                  {isViewAll && filteredNotes.length > 0 && (
                    <div className="sticky top-0 z-20 bg-[#171717] py-2 px-1 flex items-center justify-between border-b border-[#262626] mb-4">
                      <h2 className="text-lg font-playfair font-medium text-[#e5e5e5]">All Notes</h2>
                      <div className="flex items-center gap-1">

                        {isExpanded && (
                          <button 
                            onClick={() => setIsCompact(!isCompact)}
                            className="p-1 text-[#737373] hover:text-[#e5e5e5] transition-colors"
                          >
                            {isCompact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                          </button>
                        )}
                        <button 
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="p-1 text-[#737373] hover:text-[#e5e5e5] transition-colors"
                        >
                          {isExpanded ? <CopyMinus size={16} /> : <CopyPlus size={16} />}
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
                          <StickyNote size={16} />
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
                              onClick={() => setIsCompact(!isCompact)}
                              className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                            >
                              {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                            </button>
                            <button 
                              onClick={() => setIsViewAll(true)}
                              className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                            >
                              <TextAlignJustify size={14} />
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
                                 {isViewAll && !isExpanded && (
                                   <span className="text-xs text-[#737373]">({group.notes.length})</span>
                                 )}
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
                                     setIsCompact(!isCompact);
                                   }}
                                   className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                                 >
                                   {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                 </button>
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setIsViewAll(true);
                                   }}
                                   className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1"
                                 >
                                   <TextAlignJustify size={14} />
                                 </button>
                               </div>
                           )}
                         </div>
                         
                         <div className={`space-y-2 ${!isViewAll || isExpanded ? '' : 'hidden'}`}>
                           {displayedNotes.map((note) => (
                             <div 
                               key={note.id} 
                               id={`note-${note.id}`} 
                                 className={`group relative flex transition-all duration-500 ease-out ${newlyAddedIds.has(note.id) ? 'animate-[fadeIn_0.5s_ease-out] bg-gray-500/10' : ''} ${isCompact ? "items-start gap-1.5 py-0.5 px-1 border-transparent rounded" : "items-start gap-2 p-2 rounded-lg border"} ${
                                  copyingIds.has(note.id) ? '!bg-[#404040] !duration-100' : (dragOverNoteId === note.id ? 'border-t-2 border-t-[#3b82f6]' : (note.isPinned ? 'border-[#404040] bg-[#1a1a1a]' : 'border-transparent hover:border-[#262626] hover:bg-[#1a1a1a]'))
                                } ${note.isDone ? 'opacity-50' : 'opacity-100'}`}
                               draggable={isViewAll && !searchQuery && !selectedTag} // Only allow drag when viewing all and not filtering
                               onDragStart={(e) => {
                                 setDraggedNote({ id: note.id, date: group.date });
                                 e.dataTransfer.effectAllowed = 'move';
                                 // Create a transparent drag image
                                 const img = new Image();
                                 img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                 e.dataTransfer.setDragImage(img, 0, 0);
                               }}
                               onDragOver={(e) => {
                                 e.preventDefault();
                                 if (draggedNote && draggedNote.id !== note.id) {
                                   setDragOverNoteId(note.id);
                                 }
                               }}
                               onDragLeave={() => setDragOverNoteId(null)}
                               onDrop={(e) => {
                                 e.preventDefault();
                                 if (draggedNote) {
                                     handleReorderNotes(group.date, draggedNote.id, note.id);
                                     setDraggedNote(null);
                                     setDragOverNoteId(null);
                                 }
                               }}
                               onDragEnd={() => {
                                 setDraggedNote(null);
                                 setDragOverNoteId(null);
                               }}
                             >
                               {/* Drag Handle */}
                               {(isViewAll && !searchQuery && !selectedTag) && (
                                 <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 text-[#525252] hover:text-[#a3a3a3]">
                                   <GripVertical size={12} />
                                 </div>
                               )}

                                <div className="h-4 flex items-center relative" data-picker-id={note.id}>
                                   {isCompact ? (
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleToggleTodo(group.date, note.id); }}
                                       className="w-3 h-3 flex items-center justify-center hover:scale-125 transition-transform cursor-pointer"
                                     >
                                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: note.isDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />
                                     </button>
                                   ) : note.type === 'todo' ? (
                                     <button 
                                       onClick={() => handleToggleTodo(group.date, note.id)}
                                       className={`transition-colors group flex items-center justify-center ${note.isDone ? 'text-[#737373]' : 'text-[#facc15]'} hover:!text-[#737373]`}
                                     >
                                       {note.isDone ? <CheckSquare size={14} /> : (
                                           <>
                                               <Square size={14} className="group-hover:hidden" />
                                               <CheckSquare size={14} className="hidden group-hover:block" />
                                           </>
                                       )}
                                     </button>
                                   ) : (
                                      <button 
                                        onClick={() => handleToggleTodo(group.date, note.id)}
                                        className="transition-colors hover:!text-[#737373]"
                                        style={{ color: note.isDone ? '#737373' : NOTE_TYPES[note.type || 'text'].color }}
                                      >
                                        {React.createElement(NOTE_TYPES[note.type || 'text'].icon, { size: 14 })}
                                      </button>
                                   )}
                                </div>
                               
                               <div className="flex-1 min-w-0">
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
                                        onBlur={() => setTimeout(() => { handleSaveEdit(group.date, note.id); setSuggestionSource(null); }, 200)}
                                        className={isCompact 
                                           ? "w-full bg-[#262626] text-[#e5e5e5] text-xs p-1 rounded border-0 outline-none resize-none overflow-hidden"
                                           : "w-full bg-transparent text-[#e5e5e5] text-xs p-0 border-0 outline-none resize-none overflow-hidden"
                                        }
                                        onFocus={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; e.target.selectionStart = e.target.selectionEnd = e.target.value.length; }}
                                        autoFocus
                                        rows={Math.max(1, editContent.split('\n').length)}
                                        onKeyDown={(e) => {
                                           if (suggestionSource === 'edit') {
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
                                           if(e.key === 'Enter' && !e.shiftKey) {
                                               e.preventDefault();
                                               handleSaveEdit(group.date, note.id);
                                           } else if (e.key === 'Escape') {
                                               setEditingId(null);
                                           }
                                        }}
                                      />
                                      {suggestionSource === 'edit' && tagSuggestions.length > 0 && (
                                         <div 
                                           className="absolute top-full left-0 mt-1 w-full bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[150px] overflow-y-auto z-50"
                                           onMouseDown={(e) => e.preventDefault()}
                                         >
                                            {tagSuggestions.map((tag, i) => (
                                              <div 
                                                key={tag}
                                                className={`px-3 py-1.5 text-xs cursor-pointer ${i === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`}
                                                onClick={() => insertTag(tag)}
                                              >
                                                #{tag}
                                              </div>
                                            ))}
                                         </div>
                                      )}
                                     <div className="flex justify-end gap-2 hidden">
                                       <button 
                                         onClick={() => setEditingId(null)}
                                         className="text-[10px] text-[#737373] hover:text-[#e5e5e5]"
                                       >
                                         Cancel
                                       </button>
                                       <button 
                                         onClick={() => handleSaveEdit(group.date, note.id)}
                                         className="text-[10px] bg-[#3b82f6] text-white px-2 py-0.5 rounded hover:bg-[#2563eb]"
                                       >
                                         Save
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                    <span
                                     className={`${isCompact ? 'text-[11px]' : 'text-xs'} block break-words whitespace-pre-wrap leading-relaxed ${
                                       note.isDone 
                                         ? 'text-[#a3a3a3]' 
                                         : note.type === 'link' ? 'text-[#a0c4ff]' 
                                         : note.type === 'important' ? 'text-[#f87171]' 
                                         : 'text-[#d4d4d4]'
                                     }`}
                                     onDoubleClick={() => handleStartEdit(note)}
                                   >
                                     {renderNoteContent(note, group.date)}
                                   </span>
                                 )}
                                 
                                 <div className={`flex items-center justify-between mt-4 ${isCompact ? "hidden" : ""}`}>
                                    <span className="text-[11px] text-[#525252]">
                                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {note.isDone && note.completedAt && (
                                          <span className="text-[#525252] opacity-75"> • {new Date(note.completedAt).toLocaleDateString([], { day: 'numeric', month: 'numeric' })}</span>
                                      )}
                                    </span>
                                     {editingId === note.id ? (
                                       <div className="flex items-center gap-1">
                                         <button onClick={() => setEditingId(null)} className="text-[#737373] hover:text-[#e5e5e5] px-1" title="Cancel">
                                           <ArrowLeft size={14} />
                                         </button>
                                         <button onClick={() => handleSaveEdit(group.date, note.id)} className="text-[#737373] hover:text-[#60a5fa] px-1" title="Save">
                                            <Check size={14} />
                                         </button>
                                       </div>
                                     ) : (
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!showRecycleBin && (
                                          <>
                                            <button 
                                              onClick={() => {
                                                  navigator.clipboard.writeText(note.content);
                                                  setCopyingIds(prev => new Set(prev).add(note.id));
                                                  setTimeout(() => setCopyingIds(prev => {
                                                      const next = new Set(prev);
                                                      next.delete(note.id);
                                                      return next;
                                                  }), 200);
                                              }}
                                              className="text-[#525252] hover:text-[#e5e5e5] px-1"
                                              title="Copy"
                                            >
                                              <Copy size={14} />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); handleTogglePin(group.date, note.id); }}
                                              className={`text-[#525252] hover:text-[#e5e5e5] px-1 ${note.isPinned ? '!text-[#e5e5e5]' : ''}`}
                                              title={note.isPinned ? "Unpin" : "Pin"}
                                            >
                                              {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                            </button>
                                          </>
                                        )}
                                        <div className="relative">
                                          {confirmDeleteId === note.id ? (
                                            <div 
                                              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#171717] border border-[#262626] rounded-lg pl-3 pr-1 py-1 z-50 shadow-lg" 
                                              data-delete-confirm={note.id}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <span className="text-[10px] text-[#e5e5e5] whitespace-nowrap font-medium">{showRecycleBin ? "Permanently Delete?" : "Delete Note?"}</span>
                                              <div className="flex items-center gap-0.5 border-l border-[#262626] pl-1.5 ml-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                    className="p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); 
                                                if (showRecycleBin) {
                                                    handlePermanentDelete(group.date, note.id);
                                                } else {
                                                    handleDeleteNote(group.date, note.id);
                                                }
                                                setConfirmDeleteId(null); 
                                            }}
                                            className="p-1 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded transition-colors"
                                          >
                                                    <Trash size={12} />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            showRecycleBin ? (
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleRestoreNote(group.date, note.id); }}
                                                        className="text-[#525252] hover:text-[#22c55e] px-1 transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RefreshCcw size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                                                        className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors"
                                                        title="Permanently Delete"
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                                                  className="text-[#525252] hover:text-[#ef4444] px-1 transition-colors"
                                                  title={showRecycleBin ? "Permanently Delete" : "Delete"}
                                                  data-delete-trigger={note.id}
                                                >
                                                  <Trash size={14} />
                                                </button>
                                            )
                                          )}
                                        </div>
                                      </div>
                                     )}
                                 </div>
                               </div>

                               {/* Actions */}
                               {!editingId && isCompact && (
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    {showRecycleBin ? (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleRestoreNote(group.date, note.id); }}
                                        className="text-[#525252] hover:text-[#22c55e] px-1 flex items-center justify-center h-full transition-colors"
                                        title="Restore"
                                      >
                                        <RefreshCcw size={14} />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(note.content);
                                            setCopyingIds(prev => new Set(prev).add(note.id));
                                                setTimeout(() => setCopyingIds(prev => {
                                                    const next = new Set(prev);
                                                    next.delete(note.id);
                                                    return next;
                                                }), 200);
                                        }}
                                        className="text-[#525252] hover:text-[#e5e5e5] px-1 flex items-center justify-center h-full"
                                        title="Copy"
                                      >
                                        <Copy size={14} />
                                      </button>
                                    )}
                                   <div className="relative h-full flex items-center">
                                     {confirmDeleteId === note.id ? (
                                        <div 
                                          className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#171717] border border-[#262626] rounded-lg pl-3 pr-1 py-1 z-50 shadow-lg" 
                                          data-delete-confirm={note.id}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <span className="text-[10px] text-[#e5e5e5] whitespace-nowrap font-medium">{showRecycleBin ? "Permanently Delete?" : "Delete Note?"}</span>
                                          <div className="flex items-center gap-0.5 border-l border-[#262626] pl-1.5 ml-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                className="p-1 text-[#737373] hover:text-[#e5e5e5] hover:bg-[#262626] rounded transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (showRecycleBin) handlePermanentDelete(group.date, note.id);
                                                    else handleDeleteNote(group.date, note.id); 
                                                    setConfirmDeleteId(null); 
                                                }}
                                                className="p-1 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10 rounded transition-colors"
                                            >
                                                <Trash size={12} />
                                            </button>
                                          </div>
                                        </div>
                                     ) : (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                                         className="text-[#525252] hover:text-[#ef4444] px-1 flex items-center justify-center h-full transition-colors"
                                         title={showRecycleBin ? "Permanently Delete" : "Delete"}
                                         data-delete-trigger={note.id}
                                       >
                                         <Trash size={14} />
                                       </button>
                                     )}
                                   </div>
                                 </div>
                               )}
                             </div>
                           ))}
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
                    <div className="relative">
                       {suggestionSource === 'add' && tagSuggestions.length > 0 && (
                         <div 
                           className="absolute bottom-full left-0 mb-1 w-full bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden max-h-[150px] overflow-y-auto z-50"
                           onMouseDown={(e) => e.preventDefault()}
                         >
                           {tagSuggestions.map((tag, i) => (
                             <div 
                               key={tag}
                               className={`px-3 py-1.5 text-xs cursor-pointer ${i === suggestionActiveIndex ? 'bg-[#262626] text-white' : 'text-[#a3a3a3] hover:bg-[#202020]'}`}
                               onClick={() => insertTag(tag)}
                             >
                               #{tag}
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
                         onBlur={() => setTimeout(() => setSuggestionSource(null), 200)}
                         onKeyDown={(e) => {
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
                            handleAddNote(e);
                         }}
                        placeholder="Add a note... (Press Enter, use 'todo', '!', or paste links)"
                        className="w-full bg-[#171717] text-[#e5e5e5] placeholder-[#525252] text-xs p-3 pr-10 rounded-xl border border-[#262626] focus:border-[#525252] focus:bg-[#202020] outline-none resize-none overflow-hidden transition-all shadow-sm"
                        rows={1}
                        style={{ minHeight: '42px' }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#525252]">
                        <span className="text-[10px] opacity-50">↵</span>
                      </div>
                    </div>
                  </div>
             </div>
  );
};
