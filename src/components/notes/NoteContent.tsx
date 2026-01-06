import React from 'react';
import { NoteItem } from '../../types';
import { Square, CheckSquare, Pencil } from 'lucide-react';
import { LinkEditForm } from './LinkEditForm';

interface NoteContentProps {
  note: NoteItem;
  date: Date;
  isMicro: boolean;
  isCompact: boolean;
  isSelectMode: boolean;
  editingLink: { noteId: string; subId: string | number; oldText: string; url: string; title: string } | null;
  onEditLink: (data: { noteId: string; subId: string | number; oldText: string; url: string; title: string }) => void;
  onCancelEditLink: () => void;
  onSaveLink: (note: NoteItem, date: Date, title: string, url: string) => void;
  onTagClick: (tag: string) => void;
  onToggleInlineCheckbox: (note: NoteItem, date: Date, lineIndex: number) => void;
  highlightSearchText: (text: string) => React.ReactNode;
}

export const NoteContent: React.FC<NoteContentProps> = ({
  note,
  date,
  isMicro,
  isCompact,
  isSelectMode,
  editingLink,
  onEditLink,
  onCancelEditLink,
  onSaveLink,
  onTagClick,
  onToggleInlineCheckbox,
  highlightSearchText
}) => {
  // Micro view - single line with bullets
  if (isMicro) {
    const cleanContent = note.content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        return line
          .replace(/^\[(\s|x|X)?\]\s*/, '')
          .replace(/^- \s*/, '')
          .replace(/^\d+\.\s*/, '');
      })
      .join(' • ');
    // Micro view - parse tags within the single line
    const parts = cleanContent.split(/(#[\w\u0600-\u06FF]+)/g);
    return (
      <span className="opacity-60 flex items-center leading-none">
        {parts.map((part, i) => {
          if (part.startsWith('#')) {
            return (
              <span
                key={i}
                onClick={(e) => {
                  if (isSelectMode) return;
                  e.stopPropagation();
                  onTagClick(part.toUpperCase());
                }}
                className={`inline-flex items-center px-1 py-0 mx-0.5 text-[8px] font-medium rounded bg-[#262626] text-[#a0c4ff] hover:bg-[#3b82f6] hover:text-white cursor-pointer align-baseline`}
                style={{ height: '12px', lineHeight: '12px' }}
              >
                {highlightSearchText(part)}
              </span>
            );
          }
          return <span key={i}>{highlightSearchText(part)}</span>;
        })}
      </span>
    );
  }

  const lines = note.content.split('\n');
  const isTruncated = isCompact && !isMicro && lines.length > 3;
  const displayLines = isTruncated ? lines.slice(0, 3) : lines;

  const renderInlineText = (text: string, lineIndex: number) => {
    const regex = /((?:\[[^\]]+\]\((?:https?:\/\/|www\.)[^\)\s]+\))|(?:https?:\/\/|www\.)[^\s]+|#[\w\u0600-\u06FF]+)/g;
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
            onSave={(title, url) => onSaveLink(note, date, title, url)}
            onCancel={onCancelEditLink}
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
                  onEditLink({
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
                  onEditLink({
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
              onTagClick(part.toUpperCase());
            }}
            className={`inline-flex items-center px-1.5 py-0 mx-0.5 text-[9px] font-medium rounded bg-[#262626] text-[#a0c4ff] transition-colors align-middle ${isSelectMode ? '' : 'hover:bg-[#3b82f6] hover:text-white cursor-pointer'} cursor-pointer`}
          >
            {highlightSearchText(part)}
          </span>
        );
      }

      // Plain text
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
                  onClick={(e) => { e.stopPropagation(); onToggleInlineCheckbox(note, date, index); }}
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
          return <div key={index} className="h-2" />;
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
