import Fastify from 'fastify'
import websocket from '@fastify/websocket'

async function run() {
  const app = Fastify({ logger: true })
  await app.register(websocket)

  app.get('/socket/:id', { websocket: true }, function (a, b) {
    console.log("Arg 0 type:", typeof a)
    if (a) {
      console.log("Arg 0 keys:", Object.keys(a))
      console.log("Is Arg 0 the request?", !!a.params)
      console.log("Arg 0 ws exists?", !!a.ws)
      console.log("Arg 0 socket exists?", !!a.socket)
    }

    console.log("Arg 1 type:", typeof b)
    if (b) {
      console.log("Arg 1 keys:", Object.keys(b))
    }

    if (a && typeof a.close === 'function') a.close()
    else if (a && a.socket && typeof a.socket.close === 'function') a.socket.close()
    else if (b && typeof b.close === 'function') b.close()
    else if (b && b.socket && typeof b.socket.close === 'function') b.socket.close()
    else console.log("COULD NOT FIND CLOSE")
  })

  await app.listen({ port: 3007 })
}
run()
