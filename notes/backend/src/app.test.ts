import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { buildApp } from './app.js'

describe('Notes API', () => {
  let app: any
  
  const mockPg = {
    query: vi.fn()
  }

  beforeAll(async () => {
    app = buildApp({}, mockPg)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/health should return ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('GET /api/notes should return notes from mock', async () => {
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 101, title: 'Test Note' }] })

    const response = await app.inject({
      method: 'GET',
      url: '/api/notes'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()[0].title).toBe('Test Note')
  })

  it('POST /api/notes should create a note', async () => {
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 1 }] })
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 102, title: 'Untitled Note' }] })

    const response = await app.inject({
      method: 'POST',
      url: '/api/notes'
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().id).toBe(102)
  })

  it('GET /api/notes should return 401 if unauthorized', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    const response = await app.inject({
      method: 'GET',
      url: '/api/notes',
      headers: { 'host': 'kwent.me' } // Not localhost
    })

    expect(response.statusCode).toBe(401)
    process.env.NODE_ENV = originalEnv
  })

  it('PATCH /api/notes/:id should return 404 if note belongs to another user', async () => {
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Me
    mockPg.query.mockResolvedValueOnce({ rows: [] }) // Not found for me

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/notes/999',
      payload: { title: 'Hacked' }
    })

    expect(response.statusCode).toBe(404)
  })

  it('DELETE /api/notes/:id should return 404 if note not found', async () => {
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 1 }] })
    mockPg.query.mockResolvedValueOnce({ rowCount: 0 })

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/notes/999'
    })

    expect(response.statusCode).toBe(404)
  })
})