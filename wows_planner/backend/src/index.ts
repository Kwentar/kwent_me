import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
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

const rooms = new Map<string, Set<any>>();

async function init() {
  await fastify.register(cors, { origin: '*', credentials: true })
  await fastify.register(cookie)
  await fastify.register(multipart)
  await fastify.register(websocket)
  await fastify.register(postgres, {
    connectionString: process.env.DATABASE_URL || 'postgres://user:password@wows-planner-db:5432/wows_planner'
  })

  // Auth Helpers
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
      return await handler(req, reply, userId)
    } catch (err: any) {
      req.log.error(err)
      return reply.code(500).send({ error: err.message })
    }
  }

  // --- WebSocket Route (Explicit Route Definition) ---
  fastify.route({
    method: 'GET',
    url: '/socket/:id',
    handler: (req, reply) => {
      reply.code(426).send({ error: 'Upgrade Required' })
    },
    wsHandler: (connection, req) => {
      const tabletId = (req.params as any).id;
      if (!tabletId) { connection.socket.close(); return; }

      if (!rooms.has(tabletId)) rooms.set(tabletId, new Set());
      const room = rooms.get(tabletId)!;
      room.add(connection);

      connection.socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          for (const client of room) {
            if (client !== connection && client.socket.readyState === 1) {
              client.socket.send(JSON.stringify(data));
            }
          }
        } catch (e) {
          fastify.log.error(e, 'WS Msg Error');
        }
      });

      connection.socket.on('close', () => {
        room.delete(connection);
        if (room.size === 0) rooms.delete(tabletId);
      });
    }
  });

  // --- HTTP Routes ---
  fastify.get('/health', async () => ({ status: 'ok' }))

  fastify.get('/me', withUser(async (req: any, reply: any, userId: number) => {
    const { rows } = await fastify.pg.query('SELECT id, email, name FROM users WHERE id = $1', [userId])
    const u = rows[0]
    return { id: u.id, email: u.email, isAnonymous: !u.email, name: u.name || 'Commander' }
  }))

  fastify.patch('/me', withUser(async (req: any, reply: any, userId: number) => {
    const { name } = req.body as any
    if (!name) return reply.code(400).send({ error: 'Name required' })
    await fastify.pg.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId])
    return { success: true }
  }))

  fastify.get('/planners', withUser(async (req: any, reply: any, userId: number) => {
    const { rows } = await fastify.pg.query('SELECT public_id as id, title, created_at, user_id FROM planners WHERE user_id = $1 ORDER BY updated_at DESC', [userId])
    return rows
  }))

  fastify.post('/planners', withUser(async (req: any, reply: any, userId: number) => {
    const { title, state } = req.body as any
    const { rows } = await fastify.pg.query(
      'INSERT INTO planners (user_id, title, state) VALUES ($1, $2, $3) RETURNING public_id as id, user_id, title, state, created_at',
      [userId, title || 'New Plan', state || { layers: [] }]
    )
    return rows[0]
  }))

  fastify.get('/planners/:id', withUser(async (req: any, reply: any, userId: number) => {
    const { rows } = await fastify.pg.query('SELECT public_id as id, title, state, user_id FROM planners WHERE public_id = $1', [req.params.id])
    if (rows.length === 0) return reply.code(404).send({ error: 'Not found' })
    return { ...rows[0], can_edit: rows[0].user_id === userId }
  }))

  fastify.patch('/planners/:id', withUser(async (req: any, reply: any, userId: number) => {
    const { title, state, pings } = req.body as any
    const { rows: pRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
    if (pRows.length === 0) return reply.code(404).send({ error: 'Not found' })
    const pid = pRows[0].id
    const ownerId = pRows[0].user_id
    let canEdit = (ownerId === userId)
    if (!canEdit) {
      const { rows } = await fastify.pg.query('SELECT can_edit FROM tablet_permissions WHERE tablet_id = $1 AND user_id = $2', [pid, userId])
      if (rows.length > 0 && rows[0].can_edit) canEdit = true
    }
    const isPingOnly = title === undefined && state === undefined && pings !== undefined
    if (!canEdit && !isPingOnly) return reply.code(403).send({ error: 'Forbidden' })
    if (title !== undefined) await fastify.pg.query('UPDATE planners SET title = $1, updated_at = NOW() WHERE id = $2', [title, pid])
    if (state !== undefined) await fastify.pg.query('UPDATE planners SET state = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(state), pid])
    if (pings !== undefined) await fastify.pg.query("UPDATE planners SET state = state || jsonb_build_object('pings', $1::jsonb), updated_at = NOW() WHERE id = $2", [JSON.stringify(pings), pid])
    return { success: true }
  }))

  fastify.post('/planners/:id/heartbeat', withUser(async (req: any, reply: any, userId: number) => {
    const { rows } = await fastify.pg.query('SELECT id FROM planners WHERE public_id = $1', [req.params.id])
    if (rows.length > 0) await fastify.pg.query('INSERT INTO tablet_sessions (tablet_id, user_id, last_active) VALUES ($1, $2, NOW()) ON CONFLICT (tablet_id, user_id) DO UPDATE SET last_active = NOW()', [rows[0].id, userId])
    return { success: true }
  }))

  fastify.get('/planners/:id/users', withUser(async (req: any, reply: any, userId: number) => {
    const { rows: tRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
    if (tRows.length === 0) return []
    const { rows } = await fastify.pg.query(`
      SELECT u.id, u.name, u.email, (u.id = $2) as is_owner, COALESCE(p.can_edit, FALSE) as can_edit, (ts.last_active > NOW() - INTERVAL '2 minutes') as is_online
      FROM tablet_sessions ts JOIN users u ON ts.user_id = u.id LEFT JOIN tablet_permissions p ON p.tablet_id = ts.tablet_id AND p.user_id = u.id
      WHERE ts.tablet_id = $1`, [tRows[0].id, tRows[0].user_id])
    return rows.map((r: any) => ({ id: r.id.toString(), name: r.name || (r.email ? r.email.split('@')[0] : 'Guest'), isOnline: r.is_online, canEdit: r.is_owner || r.can_edit, isOwner: r.is_owner }))
  }))

  fastify.post('/planners/:id/permissions', withUser(async (req: any, reply: any, userId: number) => {
    const { rows: tRows } = await fastify.pg.query('SELECT id, user_id FROM planners WHERE public_id = $1', [req.params.id])
    if (tRows.length === 0) return reply.code(404).send({ error: 'Not found' })
    if (tRows[0].user_id !== userId) return reply.code(403).send({ error: 'Forbidden' })
    
    const targetUserId = parseInt(req.body.userId)
    const { canEdit } = req.body
    
    await fastify.pg.query(`
      INSERT INTO tablet_permissions (tablet_id, user_id, can_edit) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (tablet_id, user_id) DO UPDATE SET can_edit = $3`, 
      [tRows[0].id, targetUserId, canEdit]
    )
    return { success: true }
  }))

  fastify.post('/upload', withUser(async (req: any, reply: any, userId: number) => {
    const data = await req.file()
    if (!data) return reply.code(400).send({ error: 'No file' })
    const buffer = await data.toBuffer()
    const filename = `${crypto.createHash('sha256').update(buffer).digest('hex')}${path.extname(data.filename)}`
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
    return { url: `/wows_planner/uploads/${filename}` }
  }))

  await fastify.ready()
  await fastify.listen({ port: 3000, host: '0.0.0.0' })
}

init().catch(err => {
  fastify.log.error(err);
  process.exit(1);
});
