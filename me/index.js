const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => {
  // Cloudflare передает email в этом заголовке
  const email = request.headers['cf-access-authenticated-user-email'] || 'Anonymous'
  
  // Для отладки выведем все заголовки, начинающиеся на cf-
  const cfHeaders = Object.keys(request.headers)
    .filter(k => k.toLowerCase().startsWith('cf-'))
    .reduce((obj, k) => {
      obj[k] = request.headers[k]
      return obj
    }, {})

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kwent.me - Identity</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-white flex items-center justify-center h-screen">
      <div class="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <div class="flex flex-col items-center">
          <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-3xl mb-4">
            ${email[0].toUpperCase()}
          </div>
          <h1 class="text-2xl font-bold mb-2">Hello!</h1>
          <p class="text-blue-300 text-lg mb-6">${email}</p>
          
          <div class="w-full bg-slate-900 p-4 rounded-lg text-xs font-mono overflow-auto">
            <p class="text-gray-500 mb-2">// Debug Info (Cloudflare Headers)</p>
            <pre>${JSON.stringify(cfHeaders, null, 2)}</pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  
  reply.type('text/html').send(html)
})

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
