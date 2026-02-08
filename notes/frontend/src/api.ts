import type { Note } from './types'

const API_URL = '/notes/api'


export const fetchNotes = async (): Promise<Note[]> => {
  const res = await fetch(`${API_URL}/notes`)
  if (!res.ok) throw new Error('Failed to fetch notes')
  return res.json()
}

export const createNote = async (): Promise<Note> => {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

export const updateNote = async (id: number, updates: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note> => {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update note')
  return res.json()
}

export const deleteNote = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete note')
}
