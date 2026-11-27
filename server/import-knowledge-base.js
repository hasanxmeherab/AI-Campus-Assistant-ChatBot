import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { database, mongo } from './database.js'
import { knowledgePassages } from './knowledge-base.js'

const sourceId = 'diu_knowledge_base.json'
const path = process.argv[2] || fileURLToPath(new URL('../info/diu_knowledge_base.json', import.meta.url))
const filename = basename(path)

try {
  const data = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
  const { passages, references } = knowledgePassages(data)
  await database.collection('knowledgeSources').replaceOne(
    { _id: sourceId },
    { _id: sourceId, filename, metadata: data.metadata, references, passages, importedAt: new Date() },
    { upsert: true },
  )
  console.log(`Imported ${passages.length} knowledge passages from ${filename}.`)
} catch (error) {
  const explanation = error.name === 'MongoServerSelectionError' ? 'MongoDB is unavailable.' : error.message
  console.error(`Knowledge base import failed for ${filename}: ${explanation}`)
  process.exitCode = 1
} finally {
  await mongo.close()
}
