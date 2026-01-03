import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store/useStore';
import { NoteItem, NoteType } from '../types';
import { processNoteContent, extractTags } from '../utils/notes';
import { X, MoreHorizontal, Search, Type, CheckSquare, AlertCircle, Link as LinkIcon, GripVertical, Pencil, ListFilter, TextAlignJustify, Square, CopyPlus, CopyMinus, StickyNote, Maximize2, Minimize2 } from 'lucide-react';

const NOTE_TYPES: Record<NoteType, { color: string; label: string; icon: any }> = {
  text: { color: '#a3a3a3', label: 'Text', icon: Type },
  link: { color: '#a0c4ff', label: 'Link', icon: LinkIcon },
  todo: { color: '#fdffb6', label: 'Todo', icon: CheckSquare },
  important: { color: '#f87171', label: 'Important', icon: AlertCircle }
};

interface NotesProps {
    year: number;
    month: number;
}

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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false); // New state logic
  const [isViewAll, setIsViewAll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedNote, setDraggedNote] = useState<{ id: string; date: Date } | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [completedFilter, setCompletedFilter] = useState<'all' | 'completed' | 'notCompleted'>('notCompleted');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [suggestionActiveIndex, setSuggestionActiveIndex] = useState(0);
  const [suggestionSource, setSuggestionSource] = useState<'add' | 'edit' | null>(null);

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
      if (menuOpenId) {
        if (!target.closest(`[data-picker-id="${menuOpenId}"]`)) {
          setMenuOpenId(null);
        }
      }
      if (filterMenuOpen) {
         if (!target.closest('.filter-menu')) {
            setFilterMenuOpen(false);
         }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId, filterMenuOpen]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (activeCell) {
      setIsViewAll(false);
    }
  }, [activeCell]);

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
    if (e.key === 'Enter' && !e.shiftKey && newNote.trim() && activeCell) {
      e.preventDefault();
      const day = activeCell.day;
      const targetYear = activeCell.year;
      const targetMonth = activeCell.month;
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
          const { type, content } = processNoteContent(entryContent);
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
        setTimeout(() => { if (listRef.current) listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, 100);
        
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

  const handleUpdateNoteType = (date: Date, noteId: string, type: NoteType) => {
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
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, type } : n);
    
    const updatedMonthNotes = { ...monthNotes, [d]: updatedDayNotes };
    localStorage.setItem(key, JSON.stringify(updatedMonthNotes));
    
    if (y === year && m === month) {
        setNotes(updatedMonthNotes);
    } 
    
    setAllTimeNotes(fetchAllNotes());
    triggerUpdate();
    setMenuOpenId(null);
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
    const updatedDayNotes = dayNotes.map((n: NoteItem) => n.id === noteId ? { ...n, isDone: !n.isDone } : n);
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

  const renderNoteContent = (content: string) => {
    const parts = content.split(/((?:https?:\/\/|www\.)[^\s]+|#[\w\u0600-\u06FF]+)/g);
    return parts.map((part, i) => {
      if (part.match(/^(https?:\/\/|www\.)/)) {
        return (
          <a key={i} href={part.startsWith('www.') ? `http://${part}` : part} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'inherit' }} onClick={(e) => e.stopPropagation()}>
            {part}
          </a>
        );
      }
      if (part.match(/^#[\w\u0600-\u06FF]+$/)) {
        return (
           <span key={i} onClick={(e) => { e.stopPropagation(); setSelectedTag(part.toUpperCase()); }} className="inline-flex items-center px-1.5 py-0 mx-0.5 text-[9px] font-medium rounded bg-[#262626] text-[#a0c4ff] hover:bg-[#3b82f6] hover:text-white cursor-pointer transition-colors">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const getFilteredNotes = () => {
    let result: Array<{ date: Date; notes: NoteItem[] }> = [];

    if (activeCell && !isViewAll) {
       if (activeCell.year === year && activeCell.month === month) {
           const dayNotes = notes[activeCell.day] || [];
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
           );
       }
    } else {
      result = allTimeNotes;
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

    if (completedFilter === 'completed') {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => n.isDone)
      })).filter(item => item.notes.length > 0);
    } else if (completedFilter === 'notCompleted') {
      result = result.map(item => ({
        ...item,
        notes: item.notes.filter(n => !n.isDone)
      })).filter(item => item.notes.length > 0);
    }

    return result;
  };

  const filteredNotes = getFilteredNotes();

  return (
    <div className="flex flex-col flex-1 min-h-0">
               {/* Search & Filters */}
               <div className="flex flex-col mb-4">
                 <div className="flex items-center justify-between gap-3 mb-2">
                   <div className="relative flex-1">
                     <input 
                       type="text" 
                       placeholder="Search notes..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-[#404040] outline-none text-xs text-[#e5e5e5] placeholder-[#525252] pl-3 pr-8 h-8 rounded-lg transition-colors"
                     />
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                       {searchQuery ? (
                         <button onClick={() => setSearchQuery('')} className="text-[#525252] hover:text-[#e5e5e5]">
                           <X size={12} />
                         </button>
                       ) : (
                         <Search size={12} className="text-[#525252]" />
                       )}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                    <div className="relative filter-menu">
                      <button
                        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                        className="h-8 min-w-[130px] px-3 flex items-center justify-between rounded-lg bg-[#0a0a0a] border border-[#262626] hover:border-[#404040] transition-all"
                      >
                        <span className={`text-[11px] font-medium ${
                          completedFilter === 'all' ? 'text-[#737373]' : 
                          completedFilter === 'notCompleted' ? 'text-[#737373]' : 
                          'text-[#737373]'
                        }`}>
                          {completedFilter === 'all' ? 'All Notes' : completedFilter === 'notCompleted' ? 'Active Only' : 'Completed'}
                        </span>
                        <ListFilter size={12} className="text-[#525252]" />
                      </button>

                      {filterMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-[130px] bg-[#171717] border border-[#262626] rounded-xl p-1 shadow-xl z-50 flex flex-col gap-0.5">
                          {[
                            { id: 'all', label: 'All Notes', color: '#737373' },
                            { id: 'notCompleted', label: 'Active Only', color: '#737373' },
                            { id: 'completed', label: 'Completed', color: '#737373' }
                          ].map(option => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setCompletedFilter(option.id as any);
                                setFilterMenuOpen(false);
                              }}
                              className={`text-left px-3 py-1.5 rounded-lg hover:bg-[#262626] transition-colors text-[11px] font-medium ${
                                completedFilter === option.id ? 'bg-[#262626]' : ''
                              }`}
                              style={{ color: option.color }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                   </div>
                 </div>

                 {allTags.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 ">
                     {allTags.map(([tag, count]) => (
                       <button
                         key={tag}
                         onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                         className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
                           selectedTag === tag
                             ? 'bg-[#262626] border-[#525252] text-[#e5e5e5]'
                             : 'bg-[#0a0a0a] border-[#262626] text-[#737373] hover:text-[#a3a3a3] hover:border-[#404040]'
                         }`}
                       >
                         {tag} <span className="opacity-50 ml-0.5">({count})</span>
                       </button>
                     ))}
                     {selectedTag && (
                       <button
                         onClick={() => setSelectedTag(null)}
                         className="px-2.5 py-1 text-[10px] rounded-lg bg-[#0a0a0a] border border-[#262626] text-[#525252] hover:text-[#ef4444] hover:border-[#ef4444]/50 transition-colors"
                       >
                         Clear
                       </button>
                     )}
                   </div>
                 )}
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
                         <div className="flex items-center gap-2">
                           <span className="text-sm font-playfair font-medium text-[#d4d4d4] pl-1">
                             {new Date(activeCell.year, activeCell.month, activeCell.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                           </span>
                         </div>
                         <div className="flex items-center gap-1 pr-2">
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
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-playfair font-medium text-[#d4d4d4] group-hover/header:text-white pl-1 transition-colors">
                               {group.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                             </span>
                             {isViewAll && !isExpanded && (
                               <span className="text-xs text-[#737373]">({group.notes.length})</span>
                             )}
                           </div>
                           {!isViewAll && activeCell && group.date.getDate() === activeCell.day && group.date.getMonth() === activeCell.month && (
                               <div className="flex items-center gap-1 pr-2">
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
                               className={`group relative flex transition-all ${isCompact ? "items-start gap-1.5 py-0.5 px-1 border-transparent rounded" : "items-start gap-2 p-2 rounded-lg border"} ${
                                 dragOverNoteId === note.id ? 'border-t-2 border-t-[#3b82f6]' : 'border-transparent hover:border-[#262626] hover:bg-[#1a1a1a]'
                               }`}
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

                               <div className="h-4 flex items-center">
                                  {isCompact ? (<div className="w-1 h-1 rounded-full" style={{ backgroundColor: note.isDone ? '#737373' : (note.type === 'todo' ? '#facc15' : NOTE_TYPES[note.type || 'text'].color) }} />) : note.type === 'todo' ? (
                                    <button 
                                      onClick={() => handleToggleTodo(group.date, note.id)}
                                      className={`transition-colors ${note.isDone ? 'text-[#737373]' : 'text-[#facc15]'}`}
                                    >
                                      {note.isDone ? <CheckSquare size={14} /> : <Square size={14} />}
                                    </button>
                                  ) : (
                                     <button 
                                       onClick={() => handleToggleTodo(group.date, note.id)}
                                       className="transition-colors"
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
                                        onBlur={() => setTimeout(() => { setEditingId(null); setSuggestionSource(null); }, 200)}
                                        className={isCompact 
                                           ? "w-full bg-[#1a1a1a] text-[#e5e5e5] text-xs p-1 rounded border-0 outline-none resize-none overflow-hidden"
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
                                     className={`${isCompact ? 'text-[11px]' : 'text-xs'} block break-words whitespace-pre-wrap leading-relaxed ${note.isDone ? 'text-[#525252]' : 'text-[#d4d4d4]'}`}
                                     onDoubleClick={() => handleStartEdit(note)}
                                   >
                                     {renderNoteContent(note.content)}
                                   </span>
                                 )}
                                 
                                 <div className={`flex items-center justify-between mt-4 ${isCompact ? "hidden" : ""}`}>
                                    <span className="text-[11px] text-[#525252]">
                                      {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                     {editingId === note.id && (
                                       <div className="flex items-center gap-2">
                                         <button onClick={() => setEditingId(null)} className="text-[10px] text-[#737373] hover:text-[#e5e5e5]">Cancel</button>
                                         <button onClick={() => handleSaveEdit(group.date, note.id)} className="text-[10px] bg-[#3b82f6] text-white px-2 py-0.5 rounded hover:bg-[#2563eb]">Save</button>
                                       </div>
                                     )}
                                 </div>
                               </div>

                               {/* Actions */}
                               {!editingId && (
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    <button 
                                      onClick={() => handleStartEdit(note)}
                                      className="text-[#525252] hover:text-[#e5e5e5] px-1 flex items-center justify-center h-full"
                                      title="Edit"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                   <div className="relative flex items-center" data-picker-id={note.id}>
                                     <button 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          if (menuOpenId === note.id) {
                                            setMenuOpenId(null);
                                          } else {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const spaceBelow = window.innerHeight - rect.bottom;
                                            setMenuPosition(spaceBelow < 200 ? 'top' : 'bottom');
                                            setMenuOpenId(note.id);
                                          }
                                       }}
                                       className="text-[#525252] hover:text-[#e5e5e5] px-1 flex items-center justify-center h-full"
                                       title="Change type"
                                     >
                                       <MoreHorizontal size={14} />
                                     </button>
                                     
                                     {menuOpenId === note.id && (
                                       <div className={`absolute right-0 w-[140px] bg-[#171717] border border-[#262626] rounded-xl p-2 shadow-xl z-50 flex flex-col gap-1 ${
                                          menuPosition === 'top' ? 'bottom-full mb-1' : 'top-6'
                                       }`}>
                                          {(Object.keys(NOTE_TYPES) as NoteType[])
                                            .filter(t => t !== 'link')
                                            .map((type) => {
                                            const config = NOTE_TYPES[type];
                                            const Icon = config.icon;
                                            return (
                                              <button
                                                key={type}
                                                onClick={() => handleUpdateNoteType(group.date, note.id, type)}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#262626] transition-colors text-xs text-left w-full"
                                                style={{ color: config.color }}
                                              >
                                                <Icon size={14} />
                                                <span>{config.label}</span>
                                              </button>
                                            );
                                          })}
                                       </div>
                                     )}
                                   </div>
                                   <button 
                                     onClick={() => handleDeleteNote(group.date, note.id)}
                                     className="text-[#525252] hover:text-[#ef4444] px-1 flex items-center justify-center h-full"
                                     title="Delete note"
                                   >
                                     <X size={14} />
                                   </button>
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

               {/* Add Note Input - Only if filtering by day (not view all) OR just to allow general adding (but general adding usually adds to today or selected day) */}
               {/* Logic in Stats.tsx was to show Input when specific day selected OR if we want to default to today? In Stats.tsx code: `!isViewAll && activeCell` shows input. */}
               {!isViewAll && activeCell && (
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
               )}
             </div>
  );
};
