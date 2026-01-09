
import React, { useRef } from 'react';
import { Notes, NotesHandle } from './Notes';
import { Download, Minimize2, Maximize2 } from 'lucide-react';
import { useStore } from '../../../shared/store/useStore';

interface NotesPanelProps {
  year: number;
  month: number;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ year, month }) => {
  const notesRef = useRef<NotesHandle>(null);
  const mode = useStore(state => state.notesPanelMode);
  const setMode = useStore(state => state.setNotesPanelMode);

  return (
    <div className="stats-panel flex flex-col h-full bg-[#171717]/80 backdrop-blur-md rounded-xl border border-[#262626] shadow-2xl relative overflow-hidden transition-all duration-300">

      {/* Minimized Content */}
      <div
        className={`lg:vertical-rl text-white text-md font-medium font-playfair tracking-widest whitespace-nowrap transform absolute inset-0 flex flex-row lg:flex-col items-center justify-center lg:py-4 cursor-pointer bg-[#171717] hover:bg-[#1a1a1a] transition-all duration-300 ${mode === 'minimized' ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMode('full')}
        title="Expand Notes"
      >
        <Maximize2 size={16} className="mr-2 lg:mr-0 lg:mb-6 transform" />
        <span className='lg:rotate-90 lg:pl-10'>Notes</span>
      </div>

      {/* Full Content */}
      <div className={`flex flex-col h-full p-4 transition-all duration-300 ${mode === 'full' ? 'opacity-100 pointer-events-auto delay-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Header / Title */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 min-h-[32px]">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md text-white">
            <span className="text-md font-playfair tracking-wide">Note</span>
          </div>

          <div className="flex items-center gap-1">
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
            <button
              onClick={() => setMode('minimized')}
              className="text-[#737373] hover:text-[#e5e5e5] transition-colors p-1 rounded-md hover:bg-[#262626]"
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        <Notes ref={notesRef} year={year} month={month} />
      </div>
    </div>
  );
};
