import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import debounce from 'lodash.debounce'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import type { Note } from './types'
import TurndownService from 'turndown'
import { marked } from 'marked'
import * as api from './api'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
})

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null)
  const [isRawMode, setIsRawMode] = useState(false)
  const [rawContent, setRawContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId), 
  [notes, selectedNoteId])

  // --- Data Loading ---
  useEffect(() => {
    api.fetchNotes()
      .then(fetchedNotes => {
        setNotes(fetchedNotes)
        if (fetchedNotes.length > 0) {
          setSelectedNoteId(fetchedNotes[0].id)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setIsLoading(false)
      })
  }, [])

  // --- Saving (Debounced) ---
  const debouncedSave = useRef(
    debounce(async (id: number, updates: Partial<Note>) => {
      try {
        await api.updateNote(id, updates)
      } catch (err) {
        console.error('Failed to save note:', err)
        // Here you might want to show a toast or error indicator
      }
    }, 1000)
  ).current

  // --- Handlers ---

  // Initialize Raw Content
  useEffect(() => {
    if (isRawMode && selectedNote) {
      setRawContent(turndownService.turndown(selectedNote.content))
    }
  }, [isRawMode, selectedNoteId]) // Intentionally omit selectedNote.content

  const handleUpdateContent = useCallback((newContent: string) => {
    if (!selectedNoteId) return

    // 1. Optimistic Update
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === selectedNoteId ? { ...note, content: newContent } : note
    ))

    // 2. Server Update (Debounced)
    debouncedSave(selectedNoteId, { content: newContent })
  }, [selectedNoteId, debouncedSave])

  const handleUpdateFromRaw = (md: string) => {
    setRawContent(md)
    Promise.resolve(marked.parse(md)).then(html => {
      handleUpdateContent(html)
    })
  }

  const handleUpdateTitle = (newTitle: string) => {
    if (!selectedNoteId) return

    // 1. Optimistic Update
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === selectedNoteId ? { ...note, title: newTitle } : note
    ))

    // 2. Server Update (Debounced) - maybe shorter debounce for title?
    debouncedSave(selectedNoteId, { title: newTitle })
  }

  const handleCreateNote = async () => {
    try {
      // Optimistically we can't create easily because we need the ID from DB
      // So we wait for server here (usually fast)
      const newNote = await api.createNote()
      setNotes(prev => [newNote, ...prev])
      setSelectedNoteId(newNote.id)
      if (isRawMode) setRawContent('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      // Optimistic Delete
      const newNotes = notes.filter(n => n.id !== id)
      setNotes(newNotes)
      if (selectedNoteId === id) {
        setSelectedNoteId(newNotes.length > 0 ? newNotes[0].id : null)
      }

      // Server Delete
      await api.deleteNote(id)
    } catch (err) {
      console.error(err)
      // Rollback would go here in a robust app
    }
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading notes...</div>
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans">
      <Sidebar 
        notes={notes} 
        selectedNoteId={selectedNoteId || -1} 
        onSelectNote={setSelectedNoteId} 
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-inner">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <input 
            type="text"
            className="text-2xl font-bold text-gray-900 focus:outline-none flex-1 mr-4 bg-transparent placeholder-gray-300"
            value={selectedNote?.title || ''}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            placeholder="Note Title"
            disabled={!selectedNote}
          />
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsRawMode(!isRawMode)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 border ${
                isRawMode 
                  ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
              disabled={!selectedNote}
            >
              {isRawMode ? 'Visual Editor' : 'Markdown Source'}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
          {!selectedNote ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a note to start editing
            </div>
          ) : isRawMode ? (
            <textarea
              className="absolute inset-0 w-full h-full p-10 font-mono text-sm focus:outline-none resize-none bg-gray-50/50 text-gray-800 leading-relaxed"
              value={rawContent}
              onChange={(e) => handleUpdateFromRaw(e.target.value)}
              placeholder="Write your Markdown here..."
            />
          ) : (
            <Editor 
              content={selectedNote.content} 
              onUpdate={handleUpdateContent}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
