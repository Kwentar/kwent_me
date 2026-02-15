import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { buildApp } from './app.js'

describe('Planner API', () => {
  let app: any
  
  const mockPg = {
    query: vi.fn(),
    connect: vi.fn()
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
    // Mock the connect function to return the same mockPg object
    mockPg.connect.mockResolvedValue({
        query: mockPg.query,
        release: vi.fn()
    })
  })

  it('GET /api/health should return ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('PATCH /planners/:id should allow owner to update', async () => {
    // 1. Identify User (ID 1)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }) 
    // 2. Resolve Planner (Owner is 1)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 1 }] })
    // 3. Update execution
    mockPg.query.mockResolvedValueOnce({ rows: [] })

    const response = await app.inject({
      method: 'PATCH',
      url: '/planners/uuid-1',
      payload: { title: 'New Title' }
    })

    expect(response.statusCode).toBe(200)
  })

  it('PATCH /planners/:id should block non-owner without permissions', async () => {
    // 1. Identify User (ID 2)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 2 }] }) 
    // 2. Resolve Planner (Owner is 1)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 1 }] })
    // 3. Permission check (no rows)
    mockPg.query.mockResolvedValueOnce({ rows: [] })

    const response = await app.inject({
      method: 'PATCH',
      url: '/planners/uuid-1',
      payload: { title: 'Hacked' }
    })

    expect(response.statusCode).toBe(403)
  })

  it('PATCH /planners/:id should allow anyone to update pings', async () => {
    // 1. Identify User (ID 2)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 2 }] }) 
    // 2. Resolve Planner (Owner is 1)
    mockPg.query.mockResolvedValueOnce({ rows: [{ id: 10, user_id: 1 }] })
    // 3. Update execution (pings only)
    mockPg.query.mockResolvedValueOnce({ rows: [] })

    const response = await app.inject({
      method: 'PATCH',
      url: '/planners/uuid-1',
      payload: { pings: [{ id: 'p1', x: 50, y: 50 }] }
    })

    expect(response.statusCode).toBe(200)
  })
})
