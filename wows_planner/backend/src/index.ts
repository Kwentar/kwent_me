import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const fastify = Fastify({
  logger: true,
  bodyLimit: 52428800 // 50MB
})

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Plugins
fastify.register(cors, { origin: '*', credentials: true })
fastify.register(cookie)
fastify.register(multipart)
fastify.register(postgres, {
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@wows-planner-db:5432/wows_planner'
})

const getUserId = async (req: any, reply: any): Promise<number> => {
  let email = req.headers['cf-access-authenticated-user-email']
  let anonId = req.cookies['wows_anon_id']
  
  if (!email && !anonId) {
    anonId = uuidv4()
    reply.setCookie('wows_anon_id', anonId, { path: '/', httpOnly: true, secure: false, maxAge: 31536000 })
  }

  const client = await fastify.pg.connect()
  try {
    let userId: number | null = null
    if (email) {
      const { rows } = await client.query('SELECT id FROM users WHERE email = $1', [email])
      if (rows.length > 0) userId = rows[0].id
      else {
        const res = await client.query('INSERT INTO users (email) VALUES ($1) RETURNING id', [email])
        userId = res.rows[0].id
      }
    } else {
      const { rows } = await client.query('SELECT id FROM users WHERE anon_id = $1', [anonId])
      if (rows.length > 0) userId = rows[0].id
      else {
        const res = await client.query('INSERT INTO users (anon_id) VALUES ($1) RETURNING id', [anonId])
        userId = res.rows[0].id
      }
    }
    return userId!
  } finally {
    client.release()
  }
}

const withUser = (handler: any) => async (req: any, reply: any) => {
  try {
    const userId = await getUserId(req, reply)
    req.log.info({ userId, url: req.url }, 'Authenticated User')
    return await handler(req, reply, userId)
  } catch (err: any) {
    req.log.error(err)
    return reply.code(500).send({ error: err.message })
  }
}

// API Routes (Prefix-less for reliability with current Nginx config)
fastify.get('/health', async () => ({ status: 'ok' }))

fastify.get('/me', withUser(async (req: any, reply: any, userId: number) => {
  const { rows } = await fastify.pg.query('SELECT id, email, name FROM users WHERE id = $1', [userId])
  if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
  const u = rows[0]
  return { id: u.id, email: u.email, isAnonymous: !u.email, name: u.name || 'Commander' }
}))

fastify.post('/upload', withUser(async (req: any, reply: any, userId: number) => {
  const data = await req.file()
  if (!data) return reply.code(400).send({ error: 'No file' })
  const buffer = await data.toBuffer()
  const filename = `${crypto.createHash('sha256').update(buffer).digest('hex')}${path.extname(data.filename)}`
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
  return { url: `/wows_planner/uploads/${filename}` }
}))

fastify.get('/planners', withUser(async (req: any, reply: any, userId: number) => {
  const { rows } = await fastify.pg.query('SELECT public_id as id, title, created_at, user_id FROM planners WHERE user_id = $1 ORDER BY updated_at DESC', [userId])
  return rows
}))

fastify.post('/planners', withUser(async (req: any, reply: any, userId: number) => {
  const { title, state } = req.body as any
  const { rows } = await fastify.pg.query(
    'INSERT INTO planners (user_id, title, state) VALUES ($1, $2, $3) RETURNING public_id as id, user_id, title, state, created_at',
    [userId, title || 'New Battle Plan', state || { layers: [] }]
  )
  return rows[0]
}))

fastify.get('/planners/:id', withUser(async (req: any, reply: any, userId: number) => {
  const { rows } = await fastify.pg.query(
    `SELECT p.public_id as id, p.title, p.state, p.user_id, 
            (p.user_id = $2) as is_owner, 
            COALESCE(perm.can_edit, FALSE) as has_edit_perm
     FROM planners p 
     LEFT JOIN tablet_permissions perm ON perm.tablet_id = p.id AND perm.user_id = $2
     WHERE p.public_id = $1`, [req.params.id, userId])
  if (rows.length === 0) return reply.code(404).send({ error: 'Not found' })
  const planner = rows[0]
  return { 
    ...planner, 
    can_edit: planner.is_owner || planner.has_edit_perm 
  }
}))

fastify.patch('/planners/:id', withUser(async (req: any, reply: any, userId: number) => {
  const { title, state, pings } = req.body as any
  const { rows: pRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
  if (pRows.length === 0) return reply.code(404).send({ error: 'Not found' })
  const pid = pRows[0].id
  const ownerId = pRows[0].user_id

  // Check permissions
  let canEdit = (ownerId === userId)
  if (!canEdit) {
    const { rows: permRows } = await fastify.pg.query('SELECT can_edit FROM tablet_permissions WHERE tablet_id = $1 AND user_id = $2', [pid, userId])
    if (permRows.length > 0 && permRows[0].can_edit) canEdit = true
  }

  // Determine if this is a restricted update (ships/title) or a public update (pings)
  const isRestrictedUpdate = title !== undefined || state !== undefined
  const isPingOnly = !isRestrictedUpdate && pings !== undefined

  if (!canEdit && !isPingOnly) {
    req.log.warn({ userId, ownerId, pid }, 'Access Denied')
    return reply.code(403).send({ error: 'Forbidden' })
  }

  if (title !== undefined) await fastify.pg.query('UPDATE planners SET title = $1, updated_at = NOW() WHERE id = $2', [title, pid])
  if (state !== undefined) await fastify.pg.query('UPDATE planners SET state = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(state), pid])
  if (pings !== undefined) {
    await fastify.pg.query("UPDATE planners SET state = state || jsonb_build_object('pings', $1::jsonb), updated_at = NOW() WHERE id = $2", [JSON.stringify(pings), pid])
  }
  
  return { success: true }
}))

fastify.delete('/planners/:id', withUser(async (req: any, reply: any, userId: number) => {
  const { rowCount } = await fastify.pg.query('DELETE FROM planners WHERE public_id = $1 AND user_id = $2', [req.params.id, userId])
  if (rowCount === 0) return reply.code(403).send({ error: 'Not authorized' })
  return { success: true }
}))

fastify.post('/planners/:id/heartbeat', withUser(async (req: any, reply: any, userId: number) => {
  const { rows } = await fastify.pg.query('SELECT id FROM planners WHERE public_id = $1', [req.params.id])
  if (rows.length > 0) {
    await fastify.pg.query(`
      INSERT INTO tablet_sessions (tablet_id, user_id, last_active) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (tablet_id, user_id) DO UPDATE SET last_active = NOW()`, 
      [rows[0].id, userId]
    )
  }
  return { success: true }
}))

fastify.get('/planners/:id/users', withUser(async (req: any, reply: any, userId: number) => {
  const { rows: tRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
  if (tRows.length === 0) return []
  const { rows } = await fastify.pg.query(`
    SELECT u.id, u.name, u.email, (u.id = $2) as is_owner, 
           COALESCE(p.can_edit, FALSE) as can_edit, 
           (ts.last_active > NOW() - INTERVAL '2 minutes') as is_online
    FROM tablet_sessions ts 
    JOIN users u ON ts.user_id = u.id 
    LEFT JOIN tablet_permissions p ON p.tablet_id = ts.tablet_id AND p.user_id = u.id
    WHERE ts.tablet_id = $1`, [tRows[0].id, tRows[0].user_id])
  return rows.map((r: any) => ({ 
    id: r.id.toString(), 
    name: r.name || (r.email ? r.email.split('@')[0] : 'Guest'), 
    isOnline: r.is_online, 
    canEdit: r.is_owner || r.can_edit, 
    isOwner: r.is_owner 
  }))
}))

fastify.post('/planners/:id/permissions', withUser(async (req: any, reply: any, userId: number) => {
  const { rows: tRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
  if (tRows.length === 0 || tRows[0].user_id !== userId) return reply.code(403).send({ error: 'Forbidden' })
  await fastify.pg.query(`
    INSERT INTO tablet_permissions (tablet_id, user_id, can_edit) 
    VALUES ($1, $2, $3) 
    ON CONFLICT (tablet_id, user_id) DO UPDATE SET can_edit = $3`, 
    [tRows[0].id, req.body.userId, req.body.canEdit]
  )
  return { success: true }
}))

fastify.listen({ port: 3000, host: '0.0.0.0' })
