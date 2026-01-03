import { NoteType } from '../types';

export const processNoteContent = (content: string, currentType?: NoteType): { type: NoteType; content: string } => {
  let newType = currentType;
  let cleanContent = content;

  // 1. Check for Prefixes (Highest priority for explicit intent)
  if (/^todo\s/i.test(content)) {
    newType = 'todo';
    cleanContent = content.replace(/^todo\s/i, '');
  } else if (/^\*\s?/.test(content)) {
    newType = 'todo';
    cleanContent = content.replace(/^\*\s?/, '');
  } else if (/^!\s?/.test(content)) {
    newType = 'important';
    cleanContent = content.replace(/^!\s?/, '');
  } else if (/^[-•]\s?/.test(content)) {
    cleanContent = content.replace(/^[-•]\s?/, '');
  } else {
    // No explicit prefix found.
    // Preservative logic: If current type is todo/important, keep it.
    // Only auto-switch between text/link if current is text/link/undefined.
    if (!newType || newType === 'text' || newType === 'link') {
      const hasLink = /((?:https?:\/\/|www\.)[^\s]+)/.test(content);
      newType = hasLink ? 'link' : 'text';
    }
  }
  
  // 2. Auto-capitalize tags
  cleanContent = cleanContent.replace(/#[\w\u0600-\u06FF]+/g, match => match.toUpperCase());

  return { type: newType as NoteType, content: cleanContent };
};

export const extractTags = (text: string): string[] => {
  const matches = text.match(/#[\w\u0600-\u06FF]+/g);
  return matches ? [...new Set(matches.map(t => t.toUpperCase()))] : [];
};
