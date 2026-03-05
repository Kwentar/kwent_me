import Fastify from 'fastify'
import cors from '@fastify/cors'
import postgres from '@fastify/postgres'

export function buildApp(opts = {}, testPg: any = null) {
  const app = Fastify(opts)

  app.register(cors, { origin: '*' })

  if (!testPg) {
    app.register(postgres, {
      connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/wows_planner'
    })
  } else {
    app.decorate('pg', testPg)
  }

  // Ensure tables exist
  app.addHook('onReady', async () => {
    const client = await app.pg.connect()
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS shiptools_ships (
          ship_id BIGINT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS shiptools_modules (
          module_id BIGINT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS shiptools_battlearenas (
          arena_id BIGINT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS shiptools_consumables (
          consumable_id BIGINT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `)
    } finally {
      client.release()
    }
  })

  const APP_ID = 'd1ab1f21925c51335e00e57af7802506'
  const API_BASE_URL = 'https://api.korabli.su/mk/encyclopedia'

  async function fetchAndSave(endpoint: string, tableName: string, idField: string, client: any) {
    let totalSaved = 0;
    
    const fetchPage = async (page: number) => {
      const url = `${API_BASE_URL}/${endpoint}/?application_id=${APP_ID}&limit=100&page_no=${page}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`API HTTP error: ${res.status}`)
      const data = await res.json()
      if (data.status !== 'ok') throw new Error(`API returned error: ${data.error?.message}`)
      return data
    }

    const firstPage = await fetchPage(1)
    const pageTotal = firstPage.meta.page_total || 1
    
    const saveData = async (pageData: any) => {
      for (const [idStr, itemData] of Object.entries(pageData.data)) {
        const id = parseInt(idStr)
        if (isNaN(id)) continue;
        
        await client.query(
          `INSERT INTO ${tableName} (${idField}, data, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (${idField}) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
          [id, JSON.stringify(itemData)]
        )
        totalSaved++
      }
    }

    await saveData(firstPage);

    for (let p = 2; p <= pageTotal; p++) {
      // 100ms delay to keep within 10 RPS limit
      await new Promise(r => setTimeout(r, 100))
      const pageData = await fetchPage(p)
      await saveData(pageData)
    }

    return {
      pagesFetched: pageTotal,
      itemsSaved: totalSaved
    };
  }

  // Route to trigger a sync from Lesta API
  app.post('/sync', async (req, reply) => {
    try {
      const client = await app.pg.connect()
      await client.query('BEGIN')
      
      try {
        const shipsStats = await fetchAndSave('ships', 'shiptools_ships', 'ship_id', client);
        const modulesStats = await fetchAndSave('modules', 'shiptools_modules', 'module_id', client);
        const arenasStats = await fetchAndSave('battlearenas', 'shiptools_battlearenas', 'arena_id', client);
        const consumablesStats = await fetchAndSave('consumables', 'shiptools_consumables', 'consumable_id', client);
        
        await client.query('COMMIT')
        
        return { 
            success: true, 
            message: 'Sync complete', 
            stats: {
                ships: shipsStats,
                modules: modulesStats,
                arenas: arenasStats,
                consumables: consumablesStats
            }
        }

      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }

    } catch (err: any) {
      app.log.error(err)
      return reply.code(500).send({ error: 'Sync failed', details: err.message })
    }
  })

  // Get all ships
  app.get('/ships', async (req, reply) => {
    const client = await app.pg.connect()
    try {
      const { rows } = await client.query('SELECT data FROM shiptools_ships')
      return rows.map(r => r.data)
    } finally {
      client.release()
    }
  })

  // Get stats
  app.get('/stats', async (req, reply) => {
    const client = await app.pg.connect()
    try {
      const { rows: shipsRows } = await client.query('SELECT COUNT(*) as count, MAX(updated_at) as last_update FROM shiptools_ships')
      const { rows: modulesRows } = await client.query('SELECT COUNT(*) as count FROM shiptools_modules')
      const { rows: arenasRows } = await client.query('SELECT COUNT(*) as count FROM shiptools_battlearenas')
      const { rows: consumablesRows } = await client.query('SELECT COUNT(*) as count FROM shiptools_consumables')
      
      return {
        total_ships: parseInt(shipsRows[0].count || 0),
        total_modules: parseInt(modulesRows[0].count || 0),
        total_arenas: parseInt(arenasRows[0].count || 0),
        total_consumables: parseInt(consumablesRows[0].count || 0),
        last_sync: shipsRows[0].last_update
      }
    } finally {
      client.release()
    }
  })

  return app
}