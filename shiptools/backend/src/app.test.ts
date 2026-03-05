import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { buildApp } from './app.js'

describe('Shiptools API', () => {
  let app: any
  
  const mockClient = {
    query: vi.fn(),
    release: vi.fn()
  }

  const mockPg = {
    connect: vi.fn().mockResolvedValue(mockClient),
    query: vi.fn() // fastify-postgres also decorates with query
  }

  beforeAll(async () => {
    app = buildApp({ logger: false }, mockPg)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /ships should return an array', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [{ data: { name: 'Yamato' } }] })
    
    const response = await app.inject({
      method: 'GET',
      url: '/ships'
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual([{ name: 'Yamato' }])
  })

  it('GET /stats should return database statistics', async () => {
    // 4 queries for ships, modules, arenas, consumables
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ count: '10', last_update: '2024-01-01' }] }) // ships
      .mockResolvedValueOnce({ rows: [{ count: '20' }] }) // modules
      .mockResolvedValueOnce({ rows: [{ count: '5' }] })  // arenas
      .mockResolvedValueOnce({ rows: [{ count: '30' }] }) // consumables

    const response = await app.inject({
      method: 'GET',
      url: '/stats'
    })

    expect(response.statusCode).toBe(200)
    const stats = JSON.parse(response.body)
    expect(stats.total_ships).toBe(10)
    expect(stats.total_modules).toBe(20)
    expect(stats.total_arenas).toBe(5)
    expect(stats.total_consumables).toBe(30)
  })
})
