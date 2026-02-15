import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'

export function buildApp(opts = {}, testPg: any = null) {
  const app = Fastify(opts)

  // Plugins
  app.register(cors, { origin: '*' })

  // Database connection (only if no testPg provided)
  if (!testPg) {
    app.register(postgres, {
      connectionString: process.env.DATABASE_URL || 'postgres://user:password@db:5432/kwent_notes'
    })
  } else {
    // Inject mock pg
    app.decorate('pg', testPg)
  }

  // Auth Middleware Logic
  const getUserId = async (req: any): Promise<number> => {
    let email = req.headers['cf-access-authenticated-user-email']
    
    if (!email && (process.env.NODE_ENV === 'test' || req.headers.host?.includes('localhost'))) {
      email = 'test@example.com'
    }

    if (!email) throw new Error('Unauthorized')
    
    // We use the decorated 'pg' (either real or mock)
    const { rows } = await app.pg.query(
      `INSERT INTO users (email) VALUES ($1) 
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
       RETURNING id`,
      [email]
    )
    return rows[0].id
  }

  const withAuth = (handler: any) => async (req: any, reply: any) => {
    try {
      const userId = await getUserId(req)
      return await handler(req, reply, userId)
    } catch (err: any) {
      return reply.code(401).send({ error: err.message })
    }
  }

  // Routes
  app.get('/api/health', async () => ({ status: 'ok' }))

  app.get('/api/notes', withAuth(async (req: any, reply: any, userId: number) => {
    const { rows } = await app.pg.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC', [userId])
    return rows
  }))

  app.post('/api/notes', withAuth(async (req: any, reply: any, userId: number) => {
    const { rows } = await app.pg.query(
      'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'Untitled Note', '<p></p>']
    )
    return rows[0]
  }))

  app.patch('/api/notes/:id', withAuth(async (req: any, reply: any, userId: number) => {
    const { title, content } = req.body as any
    const { rows } = await app.pg.query(
      'UPDATE notes SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = NOW() WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, parseInt(req.params.id), userId]
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'Not found' })
    return rows[0]
  }))

  app.delete('/api/notes/:id', withAuth(async (req: any, reply: any, userId: number) => {
    const { rowCount } = await app.pg.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), userId])
    if (rowCount === 0) return reply.code(404).send({ error: 'Not found' })
    return { success: true }
  }))

  return app
}