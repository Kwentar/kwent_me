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

// Auth Middleware
const getUserId = async (req: any): Promise<number> => {
  // 1. Get email from Cloudflare header
  let email = req.headers['cf-access-authenticated-user-email']
  
  // 2. Fallback for local development
  if (!email && (req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1'))) {
    email = 'dev@kwent.me'
  }

  if (!email) {
    throw new Error('Unauthorized: No email header provided')
  }
  
  const client = await fastify.pg.connect()
  try {
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

// Wrapper to handle auth errors
const withAuth = (handler: (req: any, reply: any, userId: number) => Promise<any>) => {
  return async (req: any, reply: any) => {
    try {
      const userId = await getUserId(req)
      return await handler(req, reply, userId)
    } catch (err: any) {
      req.log.error(err)
      return reply.code(401).send({ error: err.message })
    }
  }
}

// GET /api/notes
fastify.get('/api/notes', withAuth(async (req, reply, userId) => {
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
}))

// POST /api/notes
fastify.post('/api/notes', withAuth(async (req, reply, userId) => {
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
}))

// PATCH /api/notes/:id
fastify.patch<{ Params: { id: string }, Body: { title?: string, content?: string } }>('/api/notes/:id', withAuth(async (req, reply, userId) => {
  const noteId = parseInt(req.params.id)
  const { title, content } = req.body
  
  const client = await fastify.pg.connect()
  try {
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

    updates.push(`updated_at = NOW()`)
    values.push(noteId)
    values.push(userId)

    const query = `
      UPDATE notes 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
      RETURNING *
    `
    const { rows } = await client.query(query, values)
    if (rows.length === 0) return reply.code(404).send({ error: 'Note not found' })
    return rows[0]
  } finally {
    client.release()
  }
}))

// DELETE /api/notes/:id
fastify.delete<{ Params: { id: string } }>('/api/notes/:id', withAuth(async (req, reply, userId) => {
  const noteId = parseInt(req.params.id)
  const client = await fastify.pg.connect()
  try {
    const { rowCount } = await client.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, userId]
    )
    if (rowCount === 0) return reply.code(404).send({ error: 'Note not found' })
    return { success: true }
  } finally {
    client.release()
  }
}))

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
