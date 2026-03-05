const Fastify = require('fastify');
const websocket = require('@fastify/websocket');

const app = Fastify();
app.register(websocket);
app.get('/test/:id', { websocket: true }, (connection, req) => {
  console.log("params:", req.params);
  connection.socket.send('hello ' + req.params.id);
});

app.listen({ port: 3005 }, (err) => {
  if (err) throw err;
  console.log('Listening on 3005');
});
