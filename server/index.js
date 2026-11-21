import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { port } from './config.js'
import { database, mongo } from './database.js'
import { searchPassages } from './search.js'

const clientDirectory = fileURLToPath(new URL('../client/dist/', import.meta.url))
const app = express()

app.disable('x-powered-by')

app.get('/api/health', async (_request, response) => {
  response.set('Cache-Control', 'no-store')

  try {
    await database.command({ ping: 1 }, { timeoutMS: 2000 })
    response.json({ api: 'online', database: 'connected' })
  } catch {
    response.status(503).json({ api: 'online', database: 'unavailable' })
  }
})

app.get('/api/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : ''
  if (!query || query.length > 300) {
    return response.status(400).json({ error: 'Enter an English question of up to 300 characters.' })
  }

  try {
    response.json({ results: await searchPassages(database, query) })
  } catch {
    response.status(503).json({ error: 'Document search is temporarily unavailable.' })
  }
})

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' })
})
app.use(express.static(clientDirectory))

const host = '127.0.0.1'
const server = createServer(app)

server.once('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use on ${host}. Reuse the running API or set PORT to a free port.`)
  } else {
    console.error(`Campus Assistant API could not start: ${error.message}`)
  }
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log(`Campus Assistant API listening on http://${host}:${server.address().port}`)
})

function shutdown() {
  server.close(async () => {
    await mongo.close()
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
