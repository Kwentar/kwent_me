import type { Note } from '../types'

interface SidebarProps {
  notes: Note[]
  selectedNoteId: number
  onSelectNote: (id: number) => void
  onCreateNote: () => void
  onDeleteNote: (id: number) => void
}

const Sidebar = ({ notes, selectedNoteId, onSelectNote, onCreateNote, onDeleteNote }: SidebarProps) => {
  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kwent Notes</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {notes.map((note) => (
            <li
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all ${
                selectedNoteId === note.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="truncate">{note.title || 'Untitled'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onCreateNote}
          className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>New Note</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar