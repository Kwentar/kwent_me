import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'

// Interfaces
interface Note {
  id: number
  user_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface User {
  id: number
  email: string
}

const fastify = Fastify({
  logger: true
})

// Plugins
await fastify.register(cors, {
  origin: '*'
})

// Database connection
await fastify.register(postgres, {
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@db:5432/kwent_notes'
})

// Mock Auth Middleware (Temporary)
// In production, this will read Cloudflare headers
const getUserId = async (req: any): Promise<number> => {
  // TODO: Read 'Cf-Access-Authenticated-User-Email' header in prod
  const email = 'dev@kwent.me' 
  
  const client = await fastify.pg.connect()
  try {
    // Upsert user (Find or Create)
    const { rows } = await client.query(
      `INSERT INTO users (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
       RETURNING id`,
      [email]
    )
    return rows[0].id
  } finally {
    client.release()
  }
}

// Routes
fastify.get('/api/health', async () => {
  return { status: 'ok' }
})

// GET /api/notes - List all notes for current user
fastify.get('/api/notes', async (req, reply) => {
  const userId = await getUserId(req)
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    )
    return rows
  } finally {
    client.release()
  }
})

// POST /api/notes - Create a new note
fastify.post('/api/notes', async (req, reply) => {
  const userId = await getUserId(req)
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'Untitled Note', '<p></p>']
    )
    return rows[0]
  } finally {
    client.release()
  }
})

// PATCH /api/notes/:id - Update a note
fastify.patch<{ Params: { id: string }, Body: { title?: string, content?: string } }>('/api/notes/:id', async (req, reply) => {
  const userId = await getUserId(req)
  const noteId = parseInt(req.params.id)
  const { title, content } = req.body
  
  const client = await fastify.pg.connect()
  try {
    // Dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`)
      values.push(content)
    }

    if (updates.length === 0) return reply.code(400).send({ error: 'No fields to update' })

    // Add updated_at
    updates.push(`updated_at = NOW()`)

    // Add identifiers to WHERE clause
    values.push(noteId)
    values.push(userId)

    const query = `
      UPDATE notes 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
      RETURNING *
    `
    
    const { rows } = await client.query(query, values)
    
    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Note not found or access denied' })
    }
    
    return rows[0]
  } finally {
    client.release()
  }
})

// DELETE /api/notes/:id - Delete a note
fastify.delete<{ Params: { id: string } }>('/api/notes/:id', async (req, reply) => {
  const userId = await getUserId(req)
  const noteId = parseInt(req.params.id)
  
  const client = await fastify.pg.connect()
  try {
    const { rowCount } = await client.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    )
    
    if (rowCount === 0) {
      return reply.code(404).send({ error: 'Note not found or access denied' })
    }
    
    return { success: true }
  } finally {
    client.release()
  }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server listening on http://0.0.0.0:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()