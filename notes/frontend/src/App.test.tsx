import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import * as api from './api'

// Mock the API
vi.mock('./api', () => ({
  fetchNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn()
}))

// Tiptap editor is complex to test in jsdom, we might need to mock or just test the raw mode
// But let's see if we can at least render the App

describe('Notes Frontend App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', async () => {
    // Return an empty promise that never resolves to stay in loading state
    ;(api.fetchNotes as any).mockReturnValue(new Promise(() => {}))
    
    render(<App />)
    expect(screen.getByText(/Loading notes/i)).toBeInTheDocument()
  })

  it('renders notes list after loading', async () => {
    const mockNotes = [
      { id: 1, title: 'Note 1', content: '<p>Content 1</p>', created_at: '', updated_at: '' },
      { id: 2, title: 'Note 2', content: '<p>Content 2</p>', created_at: '', updated_at: '' }
    ]
    ;(api.fetchNotes as any).mockResolvedValue(mockNotes)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument()
      expect(screen.getByText('Note 2')).toBeInTheDocument()
    })
  })

  it('switches to Markdown Source mode', async () => {
    const mockNotes = [
      { id: 1, title: 'Note 1', content: '<p>Content 1</p>', created_at: '', updated_at: '' }
    ]
    ;(api.fetchNotes as any).mockResolvedValue(mockNotes)

    render(<App />)

    await waitFor(() => expect(screen.getByText('Note 1')).toBeInTheDocument())

    const switchBtn = screen.getByText('Markdown Source')
    fireEvent.click(switchBtn)

    expect(screen.getByPlaceholderText(/Write your Markdown here/i)).toBeInTheDocument()
    expect(screen.getByText('Visual Editor')).toBeInTheDocument()
  })
})
