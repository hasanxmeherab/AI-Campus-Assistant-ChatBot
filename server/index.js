import { fileURLToPath } from 'node:url'
import express from 'express'
import { MongoClient } from 'mongodb'

const port = Number(process.env.PORT || 3001)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/'
const databaseName = process.env.MONGODB_DATABASE || 'diu_campus_assistant'
const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2000 })
const database = mongo.db(databaseName)
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

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' })
})
app.use(express.static(clientDirectory))

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Campus Assistant API listening on http://127.0.0.1:${server.address().port}`)
})

function shutdown() {
  server.close(async () => {
    await mongo.close()
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
