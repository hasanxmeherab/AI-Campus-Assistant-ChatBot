import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { database, mongo } from './database.js'
import { tuitionPassages } from './tuition.js'

const path = process.argv[2] || fileURLToPath(new URL('../info/DIU_tuition_fees.json', import.meta.url))
const filename = basename(path)

try {
  const data = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
  const passages = tuitionPassages(data)
  const source = {
    _id: 'DIU_tuition_fees.json',
    filename,
    currency: data.currency,
    claimedSession: data.claimed_session,
    notes: data.notes,
    passages,
    importedAt: new Date(),
  }
  await database.collection('knowledgeSources').replaceOne({ _id: source._id }, source, { upsert: true })
  console.log(`Imported ${passages.length} program fee entries from ${filename}.`)
} catch (error) {
  const explanation = error.name === 'MongoServerSelectionError' ? 'MongoDB is unavailable.' : error.message
  console.error(`Tuition import failed for ${filename}: ${explanation}`)
  process.exitCode = 1
} finally {
  await mongo.close()
}
