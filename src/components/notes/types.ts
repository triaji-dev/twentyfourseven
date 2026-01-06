import { Type, CheckSquare, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { NoteItem, NoteType } from '../../types';

export const NOTE_TYPES: Record<NoteType, { color: string; label: string; icon: any }> = {
  text: { color: '#d0d0d0ff', label: 'Text', icon: Type },
  link: { color: '#639fffff', label: 'Link', icon: LinkIcon },
  todo: { color: '#dee27aff', label: 'Todo', icon: CheckSquare },
  important: { color: '#ff5858ff', label: 'Important', icon: AlertCircle }
};

export const TYPE_PRIORITY: Record<NoteType, number> = {
  important: 0,
  todo: 1,
  link: 2,
  text: 3
};

export interface NotesProps {
  year: number;
  month: number;
}

export interface NotesHandle {
  downloadNotes: () => void;
}

export type DateViewState = 'collapsed' | 'semi' | 'full';
export type CompletedFilter = 'all' | 'notCompleted';
export type SuggestionSource = 'add' | 'edit' | null;

export interface NoteGroup {
  date: Date;
  notes: NoteItem[];
}

export interface TagInfo {
  tag: string;
  count: number;
}
