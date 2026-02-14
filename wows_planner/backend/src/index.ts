import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'
import cookie from '@fastify/cookie'
import { v4 as uuidv4 } from 'uuid'

const fastify = Fastify({
  logger: true
})

// Plugins
await fastify.register(cors, {
  origin: '*', // Adjust for prod later
  credentials: true
})
await fastify.register(cookie)

// Database connection
await fastify.register(postgres, {
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@wows-planner-db:5432/wows_planner'
})

// Auth Middleware (combined Logic)
const getUserId = async (req: any, reply: any): Promise<number> => {
  let email = req.headers['cf-access-authenticated-user-email']
  
  // Local dev fallback for email
  if (!email && (req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1'))) {
    // email = 'alekseev.yeskela@gmail.com' // Uncomment to simulate logged-in user locally
  }

  let anonId = req.cookies['wows_anon_id']
  if (!anonId && !email) {
    anonId = uuidv4()
    reply.setCookie('wows_anon_id', anonId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 31536000 // 1 year
    })
  }

  const client = await fastify.pg.connect()
  try {
    let userId: number | null = null

    if (email) {
      // Authenticated User
      // Check if user exists by email
      const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [email])
      if (rows.length > 0) {
        userId = rows[0].id
      } else {
        // Create new user
        const insertRes = await client.query(
          'INSERT INTO users (email) VALUES ($1) RETURNING id',
          [email]
        )
        userId = insertRes.rows[0].id
      }
      
      // If user had anon_id previously (maybe convert anon content? - skipping for MVP)
    } else if (anonId) {
      // Anonymous User
      const { rows } = await client.query('SELECT id FROM users WHERE anon_id = $1', [anonId])
      if (rows.length > 0) {
        userId = rows[0].id
      } else {
        const insertRes = await client.query(
          'INSERT INTO users (anon_id) VALUES ($1) RETURNING id',
          [anonId]
        )
        userId = insertRes.rows[0].id
      }
    }

    if (!userId) throw new Error('Failed to identify user')
    return userId
  } finally {
    client.release()
  }
}

// Wrapper
const withUser = (handler: (req: any, reply: any, userId: number) => Promise<any>) => {
  return async (req: any, reply: any) => {
    try {
      const userId = await getUserId(req, reply)
      return await handler(req, reply, userId)
    } catch (err: any) {
      req.log.error(err)
      return reply.code(500).send({ error: err.message })
    }
  }
}

// Routes
fastify.get('/api/health', async () => {
  return { status: 'ok' }
})

// GET /api/me
fastify.get('/api/me', withUser(async (req, reply, userId) => {
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query('SELECT id, email, anon_id, name FROM users WHERE id = $1', [userId])
    if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
    
    const user = rows[0]
    return {
      id: user.id,
      email: user.email,
      isAnonymous: !user.email,
      name: user.name || (user.email ? user.email.split('@')[0] : 'Guest Commander')
    }
  } finally {
    client.release()
  }
}))

// PATCH /api/me
fastify.patch<{ Body: { name?: string } }>('/api/me', withUser(async (req, reply, userId) => {
  const { name } = req.body
  if (!name) return reply.code(400).send({ error: 'Name is required' })

  const client = await fastify.pg.connect()
  try {
    await client.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId])
    return { success: true, name }
  } finally {
    client.release()
  }
}))

// GET /api/planners
fastify.get('/api/planners', withUser(async (req, reply, userId) => {
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query(
      'SELECT public_id as id, user_id, title, map_url, created_at, updated_at FROM planners WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    )
    return rows
  } finally {
    client.release()
  }
}))

// POST /api/planners
fastify.post('/api/planners', withUser(async (req, reply, userId) => {
  const client = await fastify.pg.connect()
  try {
    const { title, map_url, state } = req.body as any
    const { rows } = await client.query(
      'INSERT INTO planners (user_id, title, map_url, state) VALUES ($1, $2, $3, $4) RETURNING public_id as id, user_id, title, map_url, created_at, updated_at',
      [userId, title || 'New Battle Plan', map_url, state || '{}']
    )
    return rows[0]
  } finally {
    client.release()
  }
}))

// GET /api/planners/:id
fastify.get<{ Params: { id: string } }>('/api/planners/:id', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query(
      `SELECT p.public_id as id, p.title, p.map_url, p.state, p.created_at, p.updated_at, p.user_id,
              (p.user_id = $2) as is_owner,
              COALESCE(perm.can_edit, FALSE) as has_edit_perm
       FROM planners p
       LEFT JOIN tablet_permissions perm ON perm.tablet_id = p.id AND perm.user_id = $2
       WHERE p.public_id = $1`,
      [publicId, userId]
    )
    if (rows.length === 0) return reply.code(404).send({ error: 'Not found' })
    
    return {
        ...rows[0],
        can_edit: rows[0].is_owner || rows[0].has_edit_perm
    }
  } finally {
    client.release()
  }
}))

// PATCH /api/planners/:id
fastify.patch<{ Params: { id: string }, Body: any }>('/api/planners/:id', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const { title, map_url, state } = req.body
  
  const client = await fastify.pg.connect()
  try {
    // Resolve ID
    const { rows: pRows } = await client.query('SELECT id FROM planners WHERE public_id = $1', [publicId])
    if (pRows.length === 0) return reply.code(404).send({ error: 'Not found' })
    const plannerId = pRows[0].id

    // Check permissions? (Assuming owner or can_edit permission needed)
    // For now owner check is implicit in WHERE clause of update or we check permissions table.
    // Let's allow update if user is owner OR has permission.
    
    const { rows: permRows } = await client.query(
        `SELECT 1 FROM planners p 
         LEFT JOIN tablet_permissions tp ON tp.tablet_id = p.id AND tp.user_id = $2
         WHERE p.id = $1 AND (p.user_id = $2 OR tp.can_edit = TRUE)`,
        [plannerId, userId]
    )
    if (permRows.length === 0) return reply.code(403).send({ error: 'Forbidden' })

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(title)
    }
    if (map_url !== undefined) {
      updates.push(`map_url = $${paramIndex++}`)
      values.push(map_url)
    }
    if (state !== undefined) {
      updates.push(`state = $${paramIndex++}`)
      values.push(state)
    }

    if (updates.length === 0) return reply.code(400).send({ error: 'No fields to update' })

    updates.push(`updated_at = NOW()`)
    values.push(plannerId)

    const query = `
      UPDATE planners 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex++}
      RETURNING public_id as id
    `
    const { rows } = await client.query(query, values)
    return rows[0]
  } finally {
    client.release()
  }
}))

// DELETE /api/planners/:id
fastify.delete<{ Params: { id: string } }>('/api/planners/:id', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const client = await fastify.pg.connect()
  try {
    const { rowCount } = await client.query(
      'DELETE FROM planners WHERE public_id = $1 AND user_id = $2',
      [publicId, userId]
    )
    if (rowCount === 0) return reply.code(404).send({ error: 'Not found or not authorized' })
    return { success: true }
  } finally {
    client.release()
  }
}))

// POST /api/planners/:id/heartbeat
fastify.post<{ Params: { id: string } }>('/api/planners/:id/heartbeat', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query('SELECT id FROM planners WHERE public_id = $1', [publicId])
    if (rows.length === 0) return reply.code(404).send({ error: 'Tablet not found' })
    const tabletId = rows[0].id

    await client.query(
      `INSERT INTO tablet_sessions (tablet_id, user_id, last_active) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (tablet_id, user_id) DO UPDATE SET last_active = NOW()`,
      [tabletId, userId]
    )
    return { success: true }
  } finally {
    client.release()
  }
}))

// GET /api/planners/:id/users
fastify.get<{ Params: { id: string } }>('/api/planners/:id/users', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const client = await fastify.pg.connect()
  try {
    const { rows: tabletRows } = await client.query('SELECT id, user_id FROM planners WHERE public_id = $1', [publicId])
    if (tabletRows.length === 0) return reply.code(404).send({ error: 'Tablet not found' })
    const tabletId = tabletRows[0].id
    const ownerId = tabletRows[0].user_id

    // Get active users (last 2 minutes) + permissions
    const { rows } = await client.query(
      `SELECT u.id, u.email, u.name, 
              (u.id = $2) as is_owner,
              COALESCE(p.can_edit, FALSE) as can_edit,
              (ts.last_active > NOW() - INTERVAL '2 minutes') as is_online
       FROM tablet_sessions ts
       JOIN users u ON ts.user_id = u.id
       LEFT JOIN tablet_permissions p ON p.tablet_id = ts.tablet_id AND p.user_id = u.id
       WHERE ts.tablet_id = $1 AND ts.last_active > NOW() - INTERVAL '1 hour'
       ORDER BY is_online DESC, u.name ASC`,
      [tabletId, ownerId]
    )
    
    return rows.map((r: any) => ({
      id: r.id.toString(),
      name: r.name || (r.email ? r.email.split('@')[0] : 'Guest'),
      email: r.email || '',
      avatarUrl: undefined,
      isOnline: r.is_online,
      canEdit: r.is_owner || r.can_edit,
      isOwner: r.is_owner
    }))
  } finally {
    client.release()
  }
}))

// POST /api/planners/:id/permissions
fastify.post<{ Params: { id: string }, Body: { userId: string, canEdit: boolean } }>('/api/planners/:id/permissions', withUser(async (req, reply, userId) => {
  const publicId = req.params.id
  const targetUserId = parseInt(req.body.userId)
  const { canEdit } = req.body

  const client = await fastify.pg.connect()
  try {
    const { rows } = await client.query('SELECT id, user_id FROM planners WHERE public_id = $1', [publicId])
    if (rows.length === 0) return reply.code(404).send({ error: 'Tablet not found' })
    const tabletId = rows[0].id
    const ownerId = rows[0].user_id

    if (ownerId !== userId) {
      return reply.code(403).send({ error: 'Only owner can manage permissions' })
    }

    await client.query(
      `INSERT INTO tablet_permissions (tablet_id, user_id, can_edit) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (tablet_id, user_id) DO UPDATE SET can_edit = $3`,
      [tabletId, targetUserId, canEdit]
    )
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
