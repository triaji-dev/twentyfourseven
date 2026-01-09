import React, { useRef } from 'react';
import { Notes, NotesHandle } from './Notes';
import { Download } from 'lucide-react';

interface NotesPanelProps {
  year: number;
  month: number;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ year, month }) => {
  const notesRef = useRef<NotesHandle>(null);

  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl p-4 border border-[#262626] shadow-2xl relative overflow-hidden">
      {/* Header / Title */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0 min-h-[32px]">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md text-white bg-[#262626]">
          <span className="text-md font-playfair tracking-wide">Note</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            notesRef.current?.downloadNotes();
          }}
          className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1 rounded-md hover:bg-[#262626]"
          title="Download Notes"
        >
          <Download size={16} />
        </button>
      </div>

      <Notes ref={notesRef} year={year} month={month} />
    </div>
  );
};
